"""
Full unit-test suite for contracts/arbiq.py using the gltest direct runner.

Uses the official gltest `direct_vm` / `direct_deploy` fixtures — no hand-rolled
mock needed. The real GenVM SDK is loaded for each test via the fixture.

Run with:  gltest test/test_arbiq.py   (or pytest via .venv/bin/gltest)
"""
from __future__ import annotations

import json
import hashlib
import pytest
from pathlib import Path

CONTRACT = str(Path(__file__).parent.parent / "contracts" / "arbiq.py")

# ── addresses ─────────────────────────────────────────────────────────────────

# Raw bytes — same algorithm as gltest.direct.loader.create_address.
# Converted to Address objects lazily inside fixtures/helpers so the SDK
# is already loaded when we do the conversion.
_CLIENT_BYTES     = hashlib.sha256(b"client").digest()[:20]
_FREELANCER_BYTES = hashlib.sha256(b"freelancer").digest()[:20]
_OTHER_BYTES      = hashlib.sha256(b"other").digest()[:20]


def _addr(raw: bytes):
    """Return a genlayer Address from raw bytes (SDK must be loaded first)."""
    from genlayer.py.types import Address  # type: ignore[import]
    return Address(raw)


def _addr_hex(raw: bytes) -> str:
    """Return the EIP-55 hex string for an address."""
    return _addr(raw).as_hex


# Convenience module-level references (populated after first SDK load)
def _client_hex()     -> str: return _addr_hex(_CLIENT_BYTES)
def _freelancer_hex() -> str: return _addr_hex(_FREELANCER_BYTES)
def _other_hex()      -> str: return _addr_hex(_OTHER_BYTES)

# ── default AI response ───────────────────────────────────────────────────────

_APPROVE_RESPONSE = json.dumps({
    "approved": True,
    "reasoning": "Work looks good.",
    "scores": {
        "relevance": 8, "completeness": 8,
        "quality": 8, "meets_spec": 8, "professional": 8,
    },
    "confidence": "high",
})

_REJECT_RESPONSE = json.dumps({
    "approved": False,
    "reasoning": "Evidence is unrelated.",
    "scores": {
        "relevance": 2, "completeness": 2,
        "quality": 2, "meets_spec": 2, "professional": 2,
    },
    "confidence": "high",
})

# ── helpers ───────────────────────────────────────────────────────────────────

def _mock_llm(vm, response: str = _APPROVE_RESPONSE) -> None:
    vm.mock_llm(".*", response)


def _mock_web(vm, url: str = ".*", body: str = "page content") -> None:
    vm.mock_web(url, {"method": "GET", "status": 200, "body": body})


def _post_job(contract, vm, *,
              title="Build a website",
              description="Build a full-stack website with auth and CRUD",
              deadline="2026-12-31",
              budget=1000) -> int:
    job_id = contract.get_job_count()
    vm.sender = _addr(_CLIENT_BYTES)
    vm.value = budget
    contract.post_job(title, description, deadline)
    return job_id


def _post_job_milestones(contract, vm, *,
                         title="Build a website",
                         description="Build a full-stack website with auth and CRUD",
                         deadline="2026-12-31",
                         budget=1000,
                         milestones=None) -> int:
    if milestones is None:
        milestones = ["Design", "Development", "Testing"]
    job_id = contract.get_job_count()
    vm.sender = _addr(_CLIENT_BYTES)
    vm.value = budget
    contract.post_job_milestones(title, description, deadline, milestones)
    return job_id


def _take_job(contract, vm, job_id: int) -> None:
    vm.sender = _addr(_FREELANCER_BYTES)
    vm.value = 0
    contract.take_job(job_id)


def _submit_delivery(contract, vm, job_id: int,
                     url="https://github.com/foo/bar", note="Done!") -> None:
    vm.sender = _addr(_FREELANCER_BYTES)
    vm.value = 0
    contract.submit_delivery(job_id, url, note)


def _submit_milestone(contract, vm, job_id: int, idx: int,
                      url="https://github.com/foo/m", note="Milestone done") -> None:
    vm.sender = _addr(_FREELANCER_BYTES)
    vm.value = 0
    contract.submit_milestone_delivery(job_id, idx, url, note)


def _approve_milestone(contract, vm, job_id: int, idx: int) -> None:
    vm.sender = _addr(_CLIENT_BYTES)
    vm.value = 0
    contract.approve_milestone(job_id, idx)


def _job(contract, job_id: int) -> dict:
    raw = contract.get_job(job_id)
    return json.loads(raw)


# ── post_job ──────────────────────────────────────────────────────────────────

class TestPostJob:
    def test_creates_job_with_correct_fields(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        job = _job(c, jid)
        assert job["id"] == 0
        assert job["title"] == "Build a website"
        assert job["client"].lower() == _client_hex().lower()
        assert job["budget"] == 1000
        assert job["status"] == "open"
        assert job["freelancer"] == ""
        assert job["has_milestones"] is False

    def test_increments_job_count(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        assert c.get_job_count() == 0
        _post_job(c, direct_vm)
        assert c.get_job_count() == 1
        _post_job(c, direct_vm)
        assert c.get_job_count() == 2

    def test_sequential_job_ids(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        id1 = _post_job(c, direct_vm)
        id2 = _post_job(c, direct_vm)
        assert id2 == id1 + 1

    def test_rejects_short_title(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        direct_vm.value = 100
        with pytest.raises(Exception, match="Title"):
            c.post_job("ab", "A sufficiently long description for this job", "2026-12-31")

    def test_rejects_empty_title(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        direct_vm.value = 100
        with pytest.raises(Exception, match="Title"):
            c.post_job("", "A sufficiently long description for this job", "2026-12-31")

    def test_rejects_short_description(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        direct_vm.value = 100
        with pytest.raises(Exception, match="Description"):
            c.post_job("Good title", "Too short", "2026-12-31")

    def test_rejects_zero_budget(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        direct_vm.value = 0
        with pytest.raises(Exception, match="budget"):
            c.post_job("Good title", "A sufficiently long description for this job", "2026-12-31")

    def test_rejects_missing_deadline(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        direct_vm.value = 100
        with pytest.raises(Exception, match="Deadline"):
            c.post_job("Good title", "A sufficiently long description for this job", "")

    def test_strips_whitespace_from_title_and_description(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        direct_vm.value = 100
        jid = c.get_job_count()
        c.post_job("  My Job  ", "  " + "x" * 30 + "  ", "2026-12-31")
        job = _job(c, jid)
        assert job["title"] == "My Job"
        assert not job["description"].startswith(" ")
        assert not job["description"].endswith(" ")

    def test_stores_default_empty_fields(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        job = _job(c, jid)
        assert job["evidence_url"] == ""
        assert job["evidence_note"] == ""
        assert job["ai_reasoning"] == ""
        assert job["resubmit_count"] == 0

    def test_title_exactly_three_chars_accepted(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        direct_vm.value = 50
        jid = c.get_job_count()
        c.post_job("abc", "A sufficiently long description for this job", "2026-12-31")
        assert _job(c, jid)["title"] == "abc"


# ── post_job_milestones ───────────────────────────────────────────────────────

class TestPostJobMilestones:
    def test_creates_milestone_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job_milestones(c, direct_vm, budget=300, milestones=["A", "B", "C"])
        job = _job(c, jid)
        assert job["has_milestones"] is True
        assert job["status"] == "open"
        assert len(job["milestones"]) == 3

    def test_milestones_split_budget_evenly(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job_milestones(c, direct_vm, budget=300, milestones=["A", "B", "C"])
        amounts = [m["amount"] for m in _job(c, jid)["milestones"]]
        assert amounts == [100, 100, 100]

    def test_remainder_goes_to_last_milestone(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job_milestones(c, direct_vm, budget=100, milestones=["A", "B", "C"])
        amounts = [m["amount"] for m in _job(c, jid)["milestones"]]
        assert sum(amounts) == 100
        assert amounts[-1] >= amounts[0]

    def test_milestone_initial_status_is_pending(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job_milestones(c, direct_vm, milestones=["M1", "M2"])
        for m in _job(c, jid)["milestones"]:
            assert m["status"] == "pending"
            assert m["approved"] is False

    def test_rejects_fewer_than_two_milestones(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        direct_vm.value = 500
        with pytest.raises(Exception, match="2 milestones"):
            c.post_job_milestones("Good title", "A sufficiently long description", "2026-12-31", ["Only one"])

    def test_rejects_more_than_five_milestones(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        direct_vm.value = 600
        with pytest.raises(Exception, match="5 milestones"):
            c.post_job_milestones("Good title", "A sufficiently long description", "2026-12-31",
                                  ["A", "B", "C", "D", "E", "F"])

    def test_rejects_zero_budget(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        direct_vm.value = 0
        with pytest.raises(Exception, match="budget"):
            c.post_job_milestones("Good title", "A sufficiently long description", "2026-12-31", ["A", "B"])

    def test_milestone_titles_stripped(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job_milestones(c, direct_vm, milestones=["  Phase 1  ", "  Phase 2  "])
        for m in _job(c, jid)["milestones"]:
            assert not m["title"].startswith(" ")

    def test_max_five_milestones_accepted(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job_milestones(c, direct_vm, milestones=["A", "B", "C", "D", "E"])
        assert len(_job(c, jid)["milestones"]) == 5


# ── take_job ──────────────────────────────────────────────────────────────────

class TestTakeJob:
    def test_freelancer_can_take_open_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        job = _job(c, jid)
        assert job["status"] == "active"
        assert job["freelancer"].lower() == _freelancer_hex().lower()

    def test_client_cannot_take_own_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        with pytest.raises(Exception, match="Client cannot"):
            c.take_job(jid)

    def test_cannot_take_active_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        direct_vm.sender = _addr(_OTHER_BYTES)
        with pytest.raises(Exception, match="not open"):
            c.take_job(jid)

    def test_cannot_take_nonexistent_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        with pytest.raises(Exception, match="does not exist"):
            c.take_job(99)

    def test_job_remains_open_before_take(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        assert _job(c, jid)["status"] == "open"

    def test_second_freelancer_cannot_take_active_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        direct_vm.sender = _addr(_OTHER_BYTES)
        with pytest.raises(Exception, match="not open"):
            c.take_job(jid)


# ── submit_delivery ───────────────────────────────────────────────────────────

class TestSubmitDelivery:
    def test_freelancer_submits_delivery(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        _submit_delivery(c, direct_vm, jid)
        job = _job(c, jid)
        assert job["status"] == "delivered"
        assert job["evidence_url"] == "https://github.com/foo/bar"
        assert job["evidence_note"] == "Done!"

    def test_only_assigned_freelancer_can_submit(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        direct_vm.sender = _addr(_OTHER_BYTES)
        with pytest.raises(Exception, match="Only the assigned freelancer"):
            c.submit_delivery(jid, "https://example.com", "done")

    def test_cannot_submit_on_open_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="not active"):
            c.submit_delivery(jid, "https://example.com", "done")

    def test_requires_evidence_url(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="Evidence URL"):
            c.submit_delivery(jid, "", "done")

    def test_whitespace_only_url_rejected(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="Evidence URL"):
            c.submit_delivery(jid, "   ", "done")

    def test_accepts_empty_note(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        _submit_delivery(c, direct_vm, jid, note="")
        job = _job(c, jid)
        assert job["evidence_note"] == ""
        assert job["status"] == "delivered"

    def test_client_cannot_submit_delivery(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        with pytest.raises(Exception, match="Only the assigned freelancer"):
            c.submit_delivery(jid, "https://example.com", "done")


# ── submit_milestone_delivery ─────────────────────────────────────────────────

class TestSubmitMilestoneDelivery:
    def _setup(self, c, vm, milestones=None):
        jid = _post_job_milestones(c, vm, milestones=milestones or ["M1", "M2", "M3"])
        _take_job(c, vm, jid)
        return jid

    def test_freelancer_submits_milestone(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        _submit_milestone(c, direct_vm, jid, 0)
        job = _job(c, jid)
        assert job["milestones"][0]["status"] == "delivered"
        assert job["milestones"][0]["evidence_url"] == "https://github.com/foo/m"

    def test_only_assigned_freelancer_can_submit_milestone(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        direct_vm.sender = _addr(_OTHER_BYTES)
        with pytest.raises(Exception, match="Only the assigned freelancer"):
            c.submit_milestone_delivery(jid, 0, "https://x.com", "done")

    def test_invalid_milestone_index_raises(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="Invalid milestone index"):
            c.submit_milestone_delivery(jid, 99, "https://x.com", "done")

    def test_negative_milestone_index_raises(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="Invalid milestone index"):
            c.submit_milestone_delivery(jid, -1, "https://x.com", "done")

    def test_cannot_resubmit_already_delivered_milestone(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        _submit_milestone(c, direct_vm, jid, 0)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="not in pending state"):
            c.submit_milestone_delivery(jid, 0, "https://x.com", "again")

    def test_requires_evidence_url(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="Evidence URL"):
            c.submit_milestone_delivery(jid, 0, "", "done")

    def test_non_milestone_job_raises(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="does not use milestones"):
            c.submit_milestone_delivery(jid, 0, "https://x.com", "done")

    def test_job_not_active_raises(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job_milestones(c, direct_vm, milestones=["A", "B"])
        # job not yet taken
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="not active"):
            c.submit_milestone_delivery(jid, 0, "https://x.com", "done")

    def test_other_milestones_unchanged(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        _submit_milestone(c, direct_vm, jid, 1)
        job = _job(c, jid)
        assert job["milestones"][0]["status"] == "pending"
        assert job["milestones"][2]["status"] == "pending"


# ── approve_milestone ─────────────────────────────────────────────────────────

class TestApproveMilestone:
    def _setup(self, c, vm, budget=300, milestones=None):
        jid = _post_job_milestones(c, vm, budget=budget, milestones=milestones or ["M1", "M2", "M3"])
        _take_job(c, vm, jid)
        return jid

    def test_client_approves_single_milestone_pays_amount(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm, budget=300)
        _submit_milestone(c, direct_vm, jid, 0)
        _approve_milestone(c, direct_vm, jid, 0)
        job = _job(c, jid)
        assert job["milestones"][0]["approved"] is True
        assert job["milestones"][0]["status"] == "approved"

    def test_approving_all_milestones_completes_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm, budget=300)
        for i in range(3):
            _submit_milestone(c, direct_vm, jid, i)
            _approve_milestone(c, direct_vm, jid, i)
        assert _job(c, jid)["status"] == "completed"

    def test_job_stays_active_until_all_approved(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm, budget=300)
        _submit_milestone(c, direct_vm, jid, 0)
        _approve_milestone(c, direct_vm, jid, 0)
        assert _job(c, jid)["status"] == "active"

    def test_only_client_can_approve_milestone(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        _submit_milestone(c, direct_vm, jid, 0)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="Only the client"):
            c.approve_milestone(jid, 0)

    def test_cannot_approve_undelivered_milestone(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        with pytest.raises(Exception, match="not been delivered"):
            c.approve_milestone(jid, 0)

    def test_cannot_approve_twice(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        _submit_milestone(c, direct_vm, jid, 0)
        _approve_milestone(c, direct_vm, jid, 0)
        # After approval status becomes "approved" (not "delivered"), so the
        # contract's "not been delivered" guard fires on the second attempt.
        direct_vm.sender = _addr(_CLIENT_BYTES)
        with pytest.raises(Exception, match="not been delivered"):
            c.approve_milestone(jid, 0)

    def test_non_milestone_job_raises(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        with pytest.raises(Exception, match="does not use milestones"):
            c.approve_milestone(jid, 0)

    def test_invalid_milestone_index_raises(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        with pytest.raises(Exception, match="Invalid milestone index"):
            c.approve_milestone(jid, 10)

    def test_profile_updated_on_completion(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup(c, direct_vm, budget=300)
        for i in range(3):
            _submit_milestone(c, direct_vm, jid, i)
            _approve_milestone(c, direct_vm, jid, i)
        profile = json.loads(c.get_profile(_freelancer_hex()))
        assert profile["jobs_completed"] == 1
        assert profile["total_earned"] == 300


# ── auto_evaluate ─────────────────────────────────────────────────────────────

class TestAutoEvaluate:
    def _setup_delivered(self, c, vm, budget=500, url="https://github.com/foo/bar"):
        jid = _post_job(c, vm, budget=budget)
        _take_job(c, vm, jid)
        _submit_delivery(c, vm, jid, url=url)
        return jid

    def test_approved_marks_job_completed(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _APPROVE_RESPONSE)
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm, budget=500)
        c.auto_evaluate(jid)
        assert _job(c, jid)["status"] == "completed"

    def test_rejected_marks_job_disputed(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _REJECT_RESPONSE)
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm)
        c.auto_evaluate(jid)
        assert _job(c, jid)["status"] == "disputed"

    def test_ai_reasoning_saved_to_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, json.dumps({
            "approved": True, "reasoning": "All criteria met.",
            "scores": {"relevance": 9, "completeness": 9, "quality": 9, "meets_spec": 9, "professional": 9},
            "confidence": "high",
        }))
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm)
        c.auto_evaluate(jid)
        assert _job(c, jid)["ai_reasoning"] == "All criteria met."

    def test_ai_confidence_saved(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _APPROVE_RESPONSE)
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm)
        c.auto_evaluate(jid)
        assert _job(c, jid)["ai_confidence"] == "high"

    def test_ai_scores_saved_as_json(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _APPROVE_RESPONSE)
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm)
        c.auto_evaluate(jid)
        scores = json.loads(_job(c, jid)["ai_scores"])
        assert set(scores.keys()) == {"relevance", "completeness", "quality", "meets_spec", "professional"}

    def test_scores_avg_below_6_rejected(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, json.dumps({
            "approved": True,  # contract overrides based on avg score
            "reasoning": "Mixed.",
            "scores": {"relevance": 4, "completeness": 5, "quality": 5, "meets_spec": 4, "professional": 5},
            "confidence": "medium",
        }))
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm)
        c.auto_evaluate(jid)
        assert _job(c, jid)["status"] == "disputed"

    def test_scores_avg_exactly_6_approved(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, json.dumps({
            "approved": False,
            "reasoning": "Borderline.",
            "scores": {"relevance": 6, "completeness": 6, "quality": 6, "meets_spec": 6, "professional": 6},
            "confidence": "low",
        }))
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm, budget=200)
        c.auto_evaluate(jid)
        assert _job(c, jid)["status"] == "completed"

    def test_cannot_evaluate_non_delivered_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        with pytest.raises(Exception, match="not been delivered"):
            c.auto_evaluate(jid)

    def test_cannot_evaluate_open_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        with pytest.raises(Exception, match="not been delivered"):
            c.auto_evaluate(jid)

    def test_fetches_evidence_url_content(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_web(direct_vm, url=".*github.*", body="# Project\nAll done.")
        _mock_llm(direct_vm, _APPROVE_RESPONSE)
        jid = self._setup_delivered(c, direct_vm, url="https://github.com/foo/bar")
        c.auto_evaluate(jid)
        assert _job(c, jid)["status"] == "completed"

    def test_handles_missing_scores_field(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, json.dumps({
            "approved": True,
            "reasoning": "Looks fine.",
            "confidence": "low",
        }))
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm, budget=100)
        c.auto_evaluate(jid)
        job = _job(c, jid)
        assert job["status"] == "completed"
        assert job["ai_scores"] == "{}"

    def test_raises_on_missing_required_ai_fields(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, json.dumps({"approved": True}))
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm)
        with pytest.raises(Exception, match="missing"):
            c.auto_evaluate(jid)

    def test_profile_updated_on_approve(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _APPROVE_RESPONSE)
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm, budget=400)
        c.auto_evaluate(jid)
        profile = json.loads(c.get_profile(_freelancer_hex()))
        assert profile["jobs_completed"] == 1
        assert profile["total_earned"] == 400
        assert profile["reputation_score"] == 100

    def test_profile_updated_on_dispute(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _REJECT_RESPONSE)
        _mock_web(direct_vm)
        jid = self._setup_delivered(c, direct_vm)
        c.auto_evaluate(jid)
        profile = json.loads(c.get_profile(_freelancer_hex()))
        assert profile["jobs_disputed"] == 1
        assert profile["reputation_score"] == 0


# ── release_manually ──────────────────────────────────────────────────────────

class TestReleaseManually:
    def _setup_delivered(self, c, vm, budget=750):
        jid = _post_job(c, vm, budget=budget)
        _take_job(c, vm, jid)
        _submit_delivery(c, vm, jid)
        return jid

    def test_client_can_release_payment(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_delivered(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.release_manually(jid)
        assert _job(c, jid)["status"] == "completed"

    def test_only_client_can_release(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_delivered(c, direct_vm)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="Only the client"):
            c.release_manually(jid)

    def test_cannot_release_non_delivered_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        with pytest.raises(Exception, match="not been delivered"):
            c.release_manually(jid)

    def test_cannot_release_open_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        with pytest.raises(Exception, match="not been delivered"):
            c.release_manually(jid)

    def test_sets_manual_reasoning(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_delivered(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.release_manually(jid)
        assert "Manually approved" in _job(c, jid)["ai_reasoning"]

    def test_profile_updated_on_manual_release(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_delivered(c, direct_vm, budget=200)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.release_manually(jid)
        profile = json.loads(c.get_profile(_freelancer_hex()))
        assert profile["jobs_completed"] == 1
        assert profile["total_earned"] == 200


# ── resubmit_delivery ─────────────────────────────────────────────────────────

class TestResubmitDelivery:
    def _setup_disputed(self, c, vm):
        jid = _post_job(c, vm, budget=300)
        _take_job(c, vm, jid)
        _submit_delivery(c, vm, jid)
        vm.mock_llm(".*", _REJECT_RESPONSE)
        vm.mock_web(".*", {"method": "GET", "status": 200, "body": "page"})
        c.auto_evaluate(jid)
        vm.clear_mocks()
        return jid

    def test_freelancer_can_resubmit(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_disputed(c, direct_vm)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        c.resubmit_delivery(jid, "https://new-url.com/v2", "Fixed everything")
        job = _job(c, jid)
        assert job["status"] == "delivered"
        assert job["evidence_url"] == "https://new-url.com/v2"
        assert job["resubmit_count"] == 1

    def test_resubmit_clears_ai_fields(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_disputed(c, direct_vm)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        c.resubmit_delivery(jid, "https://new-url.com", "Fixed")
        job = _job(c, jid)
        assert job["ai_reasoning"] == ""
        assert job["ai_scores"] == "{}"
        assert job["ai_confidence"] == ""

    def test_only_freelancer_can_resubmit(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_disputed(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        with pytest.raises(Exception, match="Only the assigned freelancer"):
            c.resubmit_delivery(jid, "https://new-url.com", "Fixed")

    def test_cannot_resubmit_non_disputed_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        _submit_delivery(c, direct_vm, jid)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="not in disputed state"):
            c.resubmit_delivery(jid, "https://x.com", "Again")

    def test_requires_evidence_url(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_disputed(c, direct_vm)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="Evidence URL"):
            c.resubmit_delivery(jid, "", "Fixed")

    def test_max_two_resubmits_enforced(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_disputed(c, direct_vm)

        def redispute():
            direct_vm.mock_llm(".*", _REJECT_RESPONSE)
            direct_vm.mock_web(".*", {"method": "GET", "status": 200, "body": "page"})
            c.auto_evaluate(jid)
            direct_vm.clear_mocks()

        # First resubmit
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        c.resubmit_delivery(jid, "https://v2.com", "v2")
        redispute()
        # Second resubmit
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        c.resubmit_delivery(jid, "https://v3.com", "v3")
        assert _job(c, jid)["resubmit_count"] == 2
        redispute()
        # Third resubmit should fail
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        with pytest.raises(Exception, match="Maximum resubmits"):
            c.resubmit_delivery(jid, "https://v4.com", "v4")


# ── send_message / get_messages ───────────────────────────────────────────────

class TestMessaging:
    def _setup_active(self, c, vm):
        jid = _post_job(c, vm)
        _take_job(c, vm, jid)
        return jid

    def test_client_can_send_message(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_active(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.send_message(jid, "Hello freelancer")
        msgs = json.loads(c.get_messages(jid))
        assert len(msgs) == 1
        assert msgs[0]["content"] == "Hello freelancer"
        assert msgs[0]["role"] == "client"

    def test_freelancer_can_send_message(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_active(c, direct_vm)
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        c.send_message(jid, "Working on it!")
        msgs = json.loads(c.get_messages(jid))
        assert msgs[0]["role"] == "freelancer"

    def test_multiple_messages_accumulate(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_active(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.send_message(jid, "Message 1")
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        c.send_message(jid, "Message 2")
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.send_message(jid, "Message 3")
        msgs = json.loads(c.get_messages(jid))
        assert len(msgs) == 3
        assert msgs[0]["content"] == "Message 1"
        assert msgs[1]["content"] == "Message 2"

    def test_cannot_message_open_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        with pytest.raises(Exception, match="before a freelancer takes"):
            c.send_message(jid, "Too early")

    def test_third_party_cannot_message(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_active(c, direct_vm)
        direct_vm.sender = _addr(_OTHER_BYTES)
        with pytest.raises(Exception, match="Only client or freelancer"):
            c.send_message(jid, "Intruder")

    def test_message_truncated_at_500_chars(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_active(c, direct_vm)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.send_message(jid, "A" * 600)
        msgs = json.loads(c.get_messages(jid))
        assert len(msgs[0]["content"]) == 500

    def test_get_messages_empty_returns_json_array(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        assert c.get_messages(jid) == "[]"

    def test_can_message_completed_job(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = self._setup_active(c, direct_vm)
        _submit_delivery(c, direct_vm, jid)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.release_manually(jid)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.send_message(jid, "Great job!")
        msgs = json.loads(c.get_messages(jid))
        assert len(msgs) == 1


# ── get_profile ───────────────────────────────────────────────────────────────

class TestGetProfile:
    def test_default_profile_for_new_address(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        profile = json.loads(c.get_profile(_other_hex()))
        assert profile["address"] == _other_hex().lower()
        assert profile["jobs_completed"] == 0
        assert profile["jobs_disputed"] == 0
        assert profile["total_earned"] == 0
        assert profile["reputation_score"] == 100

    def test_profile_updates_after_completion(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _APPROVE_RESPONSE)
        _mock_web(direct_vm)
        jid = _post_job(c, direct_vm, budget=500)
        _take_job(c, direct_vm, jid)
        _submit_delivery(c, direct_vm, jid)
        c.auto_evaluate(jid)
        profile = json.loads(c.get_profile(_freelancer_hex()))
        assert profile["jobs_completed"] == 1
        assert profile["total_earned"] == 500
        assert profile["reputation_score"] == 100

    def test_profile_updates_after_dispute(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _REJECT_RESPONSE)
        _mock_web(direct_vm)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        _submit_delivery(c, direct_vm, jid)
        c.auto_evaluate(jid)
        profile = json.loads(c.get_profile(_freelancer_hex()))
        assert profile["jobs_disputed"] == 1
        assert profile["reputation_score"] == 0

    def test_reputation_score_mixed(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        # Job 1 — complete
        _mock_llm(direct_vm, _APPROVE_RESPONSE)
        _mock_web(direct_vm)
        jid1 = _post_job(c, direct_vm, budget=100)
        _take_job(c, direct_vm, jid1)
        _submit_delivery(c, direct_vm, jid1)
        c.auto_evaluate(jid1)
        direct_vm.clear_mocks()
        # Job 2 — dispute
        _mock_llm(direct_vm, _REJECT_RESPONSE)
        _mock_web(direct_vm)
        jid2 = _post_job(c, direct_vm, budget=100)
        _take_job(c, direct_vm, jid2)
        _submit_delivery(c, direct_vm, jid2)
        c.auto_evaluate(jid2)
        profile = json.loads(c.get_profile(_freelancer_hex()))
        assert profile["reputation_score"] == 50  # 1 / 2

    def test_address_stored_lowercase(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        profile = json.loads(c.get_profile(_client_hex().upper()))
        assert profile["address"] == _client_hex().lower()


# ── view helpers ──────────────────────────────────────────────────────────────

class TestViewMethods:
    def test_get_all_jobs_returns_json_array(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _post_job(c, direct_vm)
        _post_job(c, direct_vm, title="Design logo",
                  description="Design a professional logo for a tech startup company")
        jobs = json.loads(c.get_all_jobs())
        assert len(jobs) == 2
        assert jobs[0]["title"] == "Build a website"
        assert jobs[1]["title"] == "Design logo"

    def test_get_all_jobs_empty(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        assert json.loads(c.get_all_jobs()) == []

    def test_get_jobs_by_client_filters_correctly(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _post_job(c, direct_vm)
        direct_vm.sender = _addr(_OTHER_BYTES)
        direct_vm.value = 200
        c.post_job("Other job", "A sufficiently long description from another user", "2026-12-31")
        result = json.loads(c.get_jobs_by_client(_client_hex()))
        assert len(result) == 1
        assert result[0]["client"].lower() == _client_hex().lower()

    def test_get_jobs_by_client_case_insensitive(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _post_job(c, direct_vm)
        assert len(json.loads(c.get_jobs_by_client(_client_hex().upper()))) == 1

    def test_get_jobs_by_freelancer(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid1 = _post_job(c, direct_vm)
        _post_job(c, direct_vm, title="Another task",
                  description="Another task with enough description text here", budget=200)
        _take_job(c, direct_vm, jid1)
        result = json.loads(c.get_jobs_by_freelancer(_freelancer_hex()))
        assert len(result) == 1
        assert result[0]["id"] == jid1

    def test_get_jobs_by_freelancer_empty(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _post_job(c, direct_vm)
        assert json.loads(c.get_jobs_by_freelancer(_freelancer_hex())) == []

    def test_get_job_returns_empty_for_nonexistent(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        assert c.get_job(999) == ""

    def test_get_job_count_starts_at_zero(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        assert c.get_job_count() == 0

    def test_get_job_count_after_posts(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        for _ in range(5):
            _post_job(c, direct_vm)
        assert c.get_job_count() == 5


# ── full lifecycle integration ─────────────────────────────────────────────────

class TestFullLifecycle:
    def test_happy_path_ai_approval(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _APPROVE_RESPONSE)
        _mock_web(direct_vm)
        jid = _post_job(c, direct_vm, budget=1000)
        _take_job(c, direct_vm, jid)
        assert _job(c, jid)["status"] == "active"
        _submit_delivery(c, direct_vm, jid)
        assert _job(c, jid)["status"] == "delivered"
        c.auto_evaluate(jid)
        assert _job(c, jid)["status"] == "completed"

    def test_happy_path_manual_release(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm, budget=500)
        _take_job(c, direct_vm, jid)
        _submit_delivery(c, direct_vm, jid)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.release_manually(jid)
        assert _job(c, jid)["status"] == "completed"

    def test_dispute_then_resubmit_then_approve(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _REJECT_RESPONSE)
        _mock_web(direct_vm)
        jid = _post_job(c, direct_vm, budget=300)
        _take_job(c, direct_vm, jid)
        _submit_delivery(c, direct_vm, jid)
        c.auto_evaluate(jid)
        assert _job(c, jid)["status"] == "disputed"
        direct_vm.clear_mocks()

        direct_vm.sender = _addr(_FREELANCER_BYTES)
        c.resubmit_delivery(jid, "https://updated.com", "Fixed everything")
        assert _job(c, jid)["status"] == "delivered"

        _mock_llm(direct_vm, _APPROVE_RESPONSE)
        _mock_web(direct_vm)
        c.auto_evaluate(jid)
        assert _job(c, jid)["status"] == "completed"

    def test_milestone_full_lifecycle(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job_milestones(c, direct_vm, budget=300, milestones=["Design", "Dev", "QA"])
        _take_job(c, direct_vm, jid)
        for i in range(3):
            _submit_milestone(c, direct_vm, jid, i)
            _approve_milestone(c, direct_vm, jid, i)
        assert _job(c, jid)["status"] == "completed"

    def test_multiple_jobs_independent(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        _mock_llm(direct_vm, _APPROVE_RESPONSE)
        _mock_web(direct_vm)
        jid1 = _post_job(c, direct_vm, budget=100)
        jid2 = _post_job(c, direct_vm, title="Design logo",
                          description="Design a professional logo for a tech startup company", budget=200)
        _take_job(c, direct_vm, jid1)
        _submit_delivery(c, direct_vm, jid1)
        c.auto_evaluate(jid1)
        assert _job(c, jid1)["status"] == "completed"
        assert _job(c, jid2)["status"] == "open"

    def test_messaging_throughout_lifecycle(self, direct_deploy, direct_vm):
        c = direct_deploy(CONTRACT)
        jid = _post_job(c, direct_vm)
        _take_job(c, direct_vm, jid)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.send_message(jid, "Can you start immediately?")
        direct_vm.sender = _addr(_FREELANCER_BYTES)
        c.send_message(jid, "Yes, starting now.")
        _submit_delivery(c, direct_vm, jid)
        direct_vm.sender = _addr(_CLIENT_BYTES)
        c.send_message(jid, "Looks good, releasing payment.")
        c.release_manually(jid)
        msgs = json.loads(c.get_messages(jid))
        assert len(msgs) == 3
        assert msgs[2]["role"] == "client"
