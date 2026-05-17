"""
Unit tests for contracts/arbiq.py using the GenLayer mock runtime.
"""
import sys
import os
import json
import pytest

# Must install mock before importing the contract
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
import mock_genlayer  # noqa: F401 — side-effect: patches sys.modules

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from contracts.arbiq import Arbiq

# ── Helpers ───────────────────────────────────────────────────────────────────

CLIENT = "0xClient0000000000000000000000000000000001"
FREELANCER = "0xFreelancer000000000000000000000000000002"


def reset(sender=CLIENT, value=0, budget=None):
    """Reset all mutable mock state and return a fresh contract instance."""
    mock_genlayer.clear_events()
    mock_genlayer.reset_ledger()
    mock_genlayer.set_sender(sender)
    mock_genlayer.set_value(value)
    mock_genlayer.nondet.web._responses.clear()
    mock_genlayer.nondet.set_prompt_response(
        {"approved": True, "reasoning": "Work looks good.", "confidence": "high"}
    )
    return Arbiq()


def post_job(contract, *, title="Build a website", description="Build a full-stack website with auth and CRUD", deadline="2026-12-31", budget=1000):
    mock_genlayer.set_sender(CLIENT)
    mock_genlayer.set_value(budget)
    mock_genlayer.fund_contract(budget)
    return contract.post_job(title, description, deadline)


def take_job(contract, job_id):
    mock_genlayer.set_sender(FREELANCER)
    mock_genlayer.set_value(0)
    contract.take_job(job_id)


def submit_delivery(contract, job_id, url="https://github.com/foo/bar", note="Done!"):
    mock_genlayer.set_sender(FREELANCER)
    mock_genlayer.set_value(0)
    contract.submit_delivery(job_id, url, note)


# ── post_job ──────────────────────────────────────────────────────────────────

class TestPostJob:
    def test_creates_job_with_correct_fields(self):
        c = reset()
        job_id = post_job(c)
        job = json.loads(c.get_job(job_id))
        assert job["id"] == 0
        assert job["title"] == "Build a website"
        assert job["client"] == CLIENT
        assert job["budget"] == 1000
        assert job["status"] == "open"
        assert job["freelancer"] == ""

    def test_increments_job_count(self):
        c = reset()
        assert c.get_job_count() == 0
        post_job(c)
        assert c.get_job_count() == 1
        post_job(c)
        assert c.get_job_count() == 2

    def test_emits_job_posted_event(self):
        c = reset()
        post_job(c, title="API work")
        events = mock_genlayer.get_emitted_events()
        assert len(events) == 1
        ev = events[0]
        assert ev.__class__.__name__ == "JobPosted"
        assert ev.title == "API work"
        assert ev.budget == 1000

    def test_rejects_empty_title(self):
        c = reset()
        mock_genlayer.set_value(100)
        with pytest.raises(ValueError, match="Title"):
            c.post_job("", "A sufficiently long description for the job", "2026-12-31")

    def test_rejects_short_title(self):
        c = reset()
        mock_genlayer.set_value(100)
        with pytest.raises(ValueError, match="Title"):
            c.post_job("ab", "A sufficiently long description for the job", "2026-12-31")

    def test_rejects_short_description(self):
        c = reset()
        mock_genlayer.set_value(100)
        with pytest.raises(ValueError, match="Description"):
            c.post_job("Good title", "Too short", "2026-12-31")

    def test_rejects_zero_budget(self):
        c = reset()
        mock_genlayer.set_value(0)
        with pytest.raises(ValueError, match="Budget"):
            c.post_job("Good title", "A sufficiently long description for the job", "2026-12-31")

    def test_rejects_missing_deadline(self):
        c = reset()
        mock_genlayer.set_value(100)
        with pytest.raises(ValueError, match="Deadline"):
            c.post_job("Good title", "A sufficiently long description for the job", "")

    def test_strips_whitespace_from_title_and_description(self):
        c = reset()
        mock_genlayer.set_value(100)
        mock_genlayer.fund_contract(100)
        mock_genlayer.set_sender(CLIENT)
        jid = c.post_job("  My Job  ", "  " + "x" * 30 + "  ", "2026-12-31")
        job = json.loads(c.get_job(jid))
        assert job["title"] == "My Job"
        assert not job["description"].startswith(" ")


# ── take_job ──────────────────────────────────────────────────────────────────

class TestTakeJob:
    def test_freelancer_can_take_open_job(self):
        c = reset()
        jid = post_job(c)
        take_job(c, jid)
        job = json.loads(c.get_job(jid))
        assert job["status"] == "active"
        assert job["freelancer"] == FREELANCER

    def test_emits_job_taken_event(self):
        c = reset()
        jid = post_job(c)
        mock_genlayer.clear_events()
        take_job(c, jid)
        events = mock_genlayer.get_emitted_events()
        assert len(events) == 1
        ev = events[0]
        assert ev.__class__.__name__ == "JobTaken"
        assert ev.job_id == jid

    def test_client_cannot_take_own_job(self):
        c = reset()
        jid = post_job(c)
        mock_genlayer.set_sender(CLIENT)
        with pytest.raises(ValueError, match="Client cannot"):
            c.take_job(jid)

    def test_cannot_take_active_job(self):
        c = reset()
        jid = post_job(c)
        take_job(c, jid)
        mock_genlayer.set_sender(FREELANCER)
        with pytest.raises(ValueError, match="not open"):
            c.take_job(jid)

    def test_cannot_take_nonexistent_job(self):
        c = reset()
        with pytest.raises(ValueError, match="does not exist"):
            c.take_job(99)


# ── submit_delivery ────────────────────────────────────────────────────────────

class TestSubmitDelivery:
    def test_freelancer_submits_delivery(self):
        c = reset()
        jid = post_job(c)
        take_job(c, jid)
        submit_delivery(c, jid)
        job = json.loads(c.get_job(jid))
        assert job["status"] == "delivered"
        assert job["evidence_url"] == "https://github.com/foo/bar"

    def test_emits_delivery_submitted_event(self):
        c = reset()
        jid = post_job(c)
        take_job(c, jid)
        mock_genlayer.clear_events()
        submit_delivery(c, jid, url="https://example.com")
        events = mock_genlayer.get_emitted_events()
        assert len(events) == 1
        ev = events[0]
        assert ev.__class__.__name__ == "DeliverySubmitted"
        assert ev.evidence_url == "https://example.com"

    def test_only_assigned_freelancer_can_submit(self):
        c = reset()
        jid = post_job(c)
        take_job(c, jid)
        mock_genlayer.set_sender("0xOtherUser000000000000000000000000000099")
        with pytest.raises(ValueError, match="Only the assigned freelancer"):
            c.submit_delivery(jid, "https://example.com", "done")

    def test_cannot_submit_on_open_job(self):
        c = reset()
        jid = post_job(c)
        mock_genlayer.set_sender(FREELANCER)
        with pytest.raises(ValueError, match="not active"):
            c.submit_delivery(jid, "https://example.com", "done")

    def test_requires_evidence_url(self):
        c = reset()
        jid = post_job(c)
        take_job(c, jid)
        mock_genlayer.set_sender(FREELANCER)
        with pytest.raises(ValueError, match="Evidence URL"):
            c.submit_delivery(jid, "", "done")

    def test_accepts_empty_note(self):
        c = reset()
        jid = post_job(c)
        take_job(c, jid)
        mock_genlayer.set_sender(FREELANCER)
        c.submit_delivery(jid, "https://example.com", "")
        job = json.loads(c.get_job(jid))
        assert job["status"] == "delivered"
        assert job["evidence_note"] == ""


# ── auto_evaluate ─────────────────────────────────────────────────────────────

class TestAutoEvaluate:
    def _setup_delivered(self):
        c = reset()
        jid = post_job(c, budget=500)
        take_job(c, jid)
        submit_delivery(c, jid)
        return c, jid

    def test_approved_releases_funds_to_freelancer(self):
        c, jid = self._setup_delivered()
        mock_genlayer.nondet.set_prompt_response(
            {"approved": True, "reasoning": "Excellent work.", "confidence": "high"}
        )
        c.auto_evaluate(jid)
        job = json.loads(c.get_job(jid))
        assert job["status"] == "completed"
        assert mock_genlayer.get_balance(FREELANCER) == 500
        assert mock_genlayer.get_contract_balance() == 0

    def test_rejected_marks_job_disputed(self):
        c, jid = self._setup_delivered()
        mock_genlayer.nondet.set_prompt_response(
            {"approved": False, "reasoning": "Evidence is unrelated.", "confidence": "high"}
        )
        c.auto_evaluate(jid)
        job = json.loads(c.get_job(jid))
        assert job["status"] == "disputed"
        assert mock_genlayer.get_balance(FREELANCER) == 0

    def test_ai_reasoning_saved_to_job(self):
        c, jid = self._setup_delivered()
        mock_genlayer.nondet.set_prompt_response(
            {"approved": True, "reasoning": "All criteria met.", "confidence": "high"}
        )
        c.auto_evaluate(jid)
        job = json.loads(c.get_job(jid))
        assert job["ai_reasoning"] == "All criteria met."

    def test_emits_job_evaluated_event(self):
        c, jid = self._setup_delivered()
        mock_genlayer.clear_events()
        c.auto_evaluate(jid)
        events = mock_genlayer.get_emitted_events()
        assert len(events) == 1
        ev = events[0]
        assert ev.__class__.__name__ == "JobEvaluated"
        assert ev.approved is True

    def test_cannot_evaluate_non_delivered_job(self):
        c = reset()
        jid = post_job(c)
        take_job(c, jid)
        with pytest.raises(ValueError, match="not been delivered"):
            c.auto_evaluate(jid)

    def test_fetches_evidence_url_content(self):
        c, jid = self._setup_delivered()
        mock_genlayer.nondet.web.register(
            "https://github.com/foo/bar", "# My Project\nAll deliverables complete."
        )
        mock_genlayer.nondet.set_prompt_response(
            {"approved": True, "reasoning": "Fetched URL confirms completion.", "confidence": "high"}
        )
        c.auto_evaluate(jid)
        job = json.loads(c.get_job(jid))
        assert job["status"] == "completed"

    def test_raises_on_missing_ai_fields(self):
        c, jid = self._setup_delivered()
        mock_genlayer.nondet.set_prompt_response({"approved": True})
        with pytest.raises(ValueError, match="missing field"):
            c.auto_evaluate(jid)


# ── release_manually ──────────────────────────────────────────────────────────

class TestReleaseManually:
    def _setup_delivered(self, budget=750):
        c = reset()
        jid = post_job(c, budget=budget)
        take_job(c, jid)
        submit_delivery(c, jid)
        return c, jid

    def test_client_can_release_payment(self):
        c, jid = self._setup_delivered()
        mock_genlayer.set_sender(CLIENT)
        c.release_manually(jid)
        job = json.loads(c.get_job(jid))
        assert job["status"] == "completed"
        assert mock_genlayer.get_balance(FREELANCER) == 750

    def test_emits_job_released_event(self):
        c, jid = self._setup_delivered()
        mock_genlayer.clear_events()
        mock_genlayer.set_sender(CLIENT)
        c.release_manually(jid)
        events = mock_genlayer.get_emitted_events()
        assert len(events) == 1
        assert events[0].__class__.__name__ == "JobReleased"

    def test_only_client_can_release(self):
        c, jid = self._setup_delivered()
        mock_genlayer.set_sender(FREELANCER)
        with pytest.raises(ValueError, match="Only the client"):
            c.release_manually(jid)

    def test_cannot_release_non_delivered_job(self):
        c = reset()
        jid = post_job(c)
        take_job(c, jid)
        mock_genlayer.set_sender(CLIENT)
        with pytest.raises(ValueError, match="not been delivered"):
            c.release_manually(jid)

    def test_sets_manual_reasoning(self):
        c, jid = self._setup_delivered()
        mock_genlayer.set_sender(CLIENT)
        c.release_manually(jid)
        job = json.loads(c.get_job(jid))
        assert "Manually approved" in job["ai_reasoning"]


# ── View methods ──────────────────────────────────────────────────────────────

class TestViewMethods:
    def test_get_all_jobs_returns_json_array(self):
        c = reset()
        post_job(c)
        post_job(c, title="Design logo", description="Design a professional logo for a tech startup company", deadline="2026-11-01")
        jobs = json.loads(c.get_all_jobs())
        assert len(jobs) == 2
        assert jobs[0]["title"] == "Build a website"
        assert jobs[1]["title"] == "Design logo"

    def test_get_jobs_by_client(self):
        c = reset()
        post_job(c)
        OTHER = "0xOther000000000000000000000000000000000099"
        mock_genlayer.set_sender(OTHER)
        mock_genlayer.set_value(200)
        mock_genlayer.fund_contract(200)
        c.post_job("Other job", "A sufficiently long description from another client", "2026-12-31")
        result = json.loads(c.get_jobs_by_client(CLIENT))
        assert len(result) == 1
        assert result[0]["client"] == CLIENT

    def test_get_jobs_by_freelancer(self):
        c = reset()
        jid1 = post_job(c)
        jid2 = post_job(c, title="Another task", description="Another task with enough description text here", budget=200)
        mock_genlayer.fund_contract(200)
        take_job(c, jid1)
        result = json.loads(c.get_jobs_by_freelancer(FREELANCER))
        assert len(result) == 1
        assert result[0]["id"] == jid1

    def test_get_job_returns_empty_for_nonexistent(self):
        c = reset()
        result = c.get_job(999)
        assert result == ""

    def test_get_job_count_empty(self):
        c = reset()
        assert c.get_job_count() == 0


# ── Full lifecycle integration ─────────────────────────────────────────────────

class TestFullLifecycle:
    def test_happy_path_ai_approval(self):
        """post → take → deliver → AI approves → funds transferred"""
        c = reset()
        budget = 1000
        jid = post_job(c, budget=budget)

        take_job(c, jid)
        job = json.loads(c.get_job(jid))
        assert job["status"] == "active"

        submit_delivery(c, jid, url="https://github.com/foo/project", note="Completed all requirements")
        job = json.loads(c.get_job(jid))
        assert job["status"] == "delivered"

        mock_genlayer.nondet.set_prompt_response(
            {"approved": True, "reasoning": "Work is complete.", "confidence": "high"}
        )
        c.auto_evaluate(jid)
        job = json.loads(c.get_job(jid))
        assert job["status"] == "completed"
        assert mock_genlayer.get_balance(FREELANCER) == budget

    def test_happy_path_manual_release(self):
        """post → take → deliver → client releases → funds transferred"""
        c = reset()
        budget = 500
        jid = post_job(c, budget=budget)
        take_job(c, jid)
        submit_delivery(c, jid)
        mock_genlayer.set_sender(CLIENT)
        c.release_manually(jid)
        assert mock_genlayer.get_balance(FREELANCER) == budget

    def test_dispute_path(self):
        """post → take → deliver → AI rejects → disputed, no funds moved"""
        c = reset()
        budget = 300
        jid = post_job(c, budget=budget)
        take_job(c, jid)
        submit_delivery(c, jid, url="https://unrelated.example.com", note="Did something unrelated")
        mock_genlayer.nondet.set_prompt_response(
            {"approved": False, "reasoning": "Evidence is unrelated to spec.", "confidence": "high"}
        )
        c.auto_evaluate(jid)
        job = json.loads(c.get_job(jid))
        assert job["status"] == "disputed"
        assert mock_genlayer.get_balance(FREELANCER) == 0
        assert mock_genlayer.get_contract_balance() == budget

    def test_multiple_jobs_independent(self):
        """Two jobs proceed independently without interfering."""
        c = reset()

        jid1 = post_job(c, budget=100)
        mock_genlayer.fund_contract(200)
        mock_genlayer.set_sender(CLIENT)
        mock_genlayer.set_value(200)
        jid2 = c.post_job("Design logo", "Design a professional logo for a tech startup company", "2026-12-31")

        take_job(c, jid1)
        submit_delivery(c, jid1)
        mock_genlayer.nondet.set_prompt_response(
            {"approved": True, "reasoning": "Job 1 done.", "confidence": "high"}
        )
        c.auto_evaluate(jid1)

        job1 = json.loads(c.get_job(jid1))
        job2 = json.loads(c.get_job(jid2))
        assert job1["status"] == "completed"
        assert job2["status"] == "open"
