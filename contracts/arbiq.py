# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json
import re


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass


class Arbiq(gl.Contract):
    job_count: u256
    jobs: TreeMap[u256, str]
    messages: TreeMap[u256, str]
    profiles: TreeMap[str, str]

    def __init__(self):
        self.job_count = u256(0)

    def _load_job(self, job_id: u256):
        raw = self.jobs.get(job_id, "")
        if not raw:
            raise gl.vm.UserError(f"Job {int(job_id)} does not exist")
        return json.loads(raw)

    def _save_job(self, job_id: u256, job) -> None:
        self.jobs[job_id] = json.dumps(job)

    def _load_profile(self, address: str) -> dict:
        key = address.lower()
        raw = self.profiles.get(key, "")
        if not raw:
            return {
                "address": key,
                "jobs_completed": 0,
                "jobs_disputed": 0,
                "total_earned": 0,
                "reputation_score": 100,
            }
        return json.loads(raw)

    def _save_profile(self, address: str, profile: dict) -> None:
        self.profiles[address.lower()] = json.dumps(profile)

    def _update_freelancer_profile(self, freelancer: str, budget: int, disputed: bool) -> None:
        p = self._load_profile(freelancer)
        if disputed:
            p["jobs_disputed"] += 1
        else:
            p["jobs_completed"] += 1
            p["total_earned"] += budget
        total = p["jobs_completed"] + p["jobs_disputed"]
        p["reputation_score"] = int((p["jobs_completed"] / total) * 100) if total > 0 else 100
        self._save_profile(freelancer, p)

    @gl.public.write.payable
    def post_job(self, title: str, description: str, deadline: str) -> None:
        if len(title.strip()) < 3:
            raise gl.vm.UserError("Title must be at least 3 characters")
        if len(description.strip()) < 20:
            raise gl.vm.UserError("Description must be at least 20 characters")
        if not deadline:
            raise gl.vm.UserError("Deadline is required")
        budget = gl.message.value
        if budget == u256(0):
            raise gl.vm.UserError("Must send GEN to escrow as job budget")

        job_id = self.job_count
        self.job_count = self.job_count + u256(1)

        job = {
            "id": int(job_id),
            "title": title.strip(),
            "description": description.strip(),
            "budget": int(budget),
            "deadline": deadline,
            "client": gl.message.sender_address.as_hex,
            "freelancer": "",
            "status": "open",
            "evidence_url": "",
            "evidence_note": "",
            "ai_reasoning": "",
            "ai_scores": "{}",
            "ai_confidence": "",
            "resubmit_count": 0,
            "has_milestones": False,
            "created_at": 0,
            "updated_at": 0,
        }
        self._save_job(job_id, job)

    @gl.public.write.payable
    def post_job_milestones(self, title: str, description: str, deadline: str, milestone_titles: list) -> None:
        if len(title.strip()) < 3:
            raise gl.vm.UserError("Title must be at least 3 characters")
        if len(description.strip()) < 20:
            raise gl.vm.UserError("Description must be at least 20 characters")
        if not deadline:
            raise gl.vm.UserError("Deadline is required")
        if not milestone_titles or len(milestone_titles) < 2:
            raise gl.vm.UserError("At least 2 milestones are required")
        if len(milestone_titles) > 5:
            raise gl.vm.UserError("Maximum 5 milestones allowed")
        budget = gl.message.value
        if budget == u256(0):
            raise gl.vm.UserError("Must send GEN to escrow as job budget")

        n = len(milestone_titles)
        base_share = int(budget) // n
        remainder = int(budget) - base_share * n

        milestones = []
        for i, m_title in enumerate(milestone_titles):
            amount = base_share + (remainder if i == n - 1 else 0)
            milestones.append({
                "title": str(m_title).strip(),
                "amount": amount,
                "status": "pending",
                "evidence_url": "",
                "evidence_note": "",
                "approved": False,
            })

        job_id = self.job_count
        self.job_count = self.job_count + u256(1)

        job = {
            "id": int(job_id),
            "title": title.strip(),
            "description": description.strip(),
            "budget": int(budget),
            "deadline": deadline,
            "client": gl.message.sender_address.as_hex,
            "freelancer": "",
            "status": "open",
            "evidence_url": "",
            "evidence_note": "",
            "ai_reasoning": "",
            "ai_scores": "{}",
            "ai_confidence": "",
            "resubmit_count": 0,
            "has_milestones": True,
            "milestones": milestones,
            "created_at": 0,
            "updated_at": 0,
        }
        self._save_job(job_id, job)

    @gl.public.write
    def take_job(self, job_id: int) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)
        if job["status"] != "open":
            raise gl.vm.UserError("Job is not open")
        caller = gl.message.sender_address.as_hex
        if caller == job["client"]:
            raise gl.vm.UserError("Client cannot take their own job")
        job["freelancer"] = caller
        job["status"] = "active"
        job["updated_at"] = 0
        self._save_job(jid, job)

    @gl.public.write
    def submit_delivery(self, job_id: int, evidence_url: str, evidence_note: str) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)
        if job["status"] != "active":
            raise gl.vm.UserError("Job is not active")
        caller = gl.message.sender_address.as_hex
        if caller != job["freelancer"]:
            raise gl.vm.UserError("Only the assigned freelancer can submit delivery")
        if not evidence_url.strip():
            raise gl.vm.UserError("Evidence URL is required")
        job["evidence_url"] = evidence_url.strip()
        job["evidence_note"] = evidence_note.strip() if evidence_note else ""
        job["status"] = "delivered"
        job["updated_at"] = 0
        self._save_job(jid, job)

    @gl.public.write
    def submit_milestone_delivery(self, job_id: int, milestone_idx: int, evidence_url: str, evidence_note: str) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)
        if not job.get("has_milestones"):
            raise gl.vm.UserError("This job does not use milestones")
        if job["status"] != "active":
            raise gl.vm.UserError("Job is not active")
        caller = gl.message.sender_address.as_hex
        if caller != job["freelancer"]:
            raise gl.vm.UserError("Only the assigned freelancer can submit milestone delivery")
        milestones = job["milestones"]
        if milestone_idx < 0 or milestone_idx >= len(milestones):
            raise gl.vm.UserError("Invalid milestone index")
        m = milestones[milestone_idx]
        if m["status"] != "pending":
            raise gl.vm.UserError("Milestone is not in pending state")
        if not evidence_url.strip():
            raise gl.vm.UserError("Evidence URL is required")
        m["evidence_url"] = evidence_url.strip()
        m["evidence_note"] = evidence_note.strip() if evidence_note else ""
        m["status"] = "delivered"
        job["updated_at"] = 0
        self._save_job(jid, job)

    @gl.public.write
    def approve_milestone(self, job_id: int, milestone_idx: int) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)
        if not job.get("has_milestones"):
            raise gl.vm.UserError("This job does not use milestones")
        if job["status"] != "active":
            raise gl.vm.UserError("Job is not active")
        caller = gl.message.sender_address.as_hex
        if caller != job["client"]:
            raise gl.vm.UserError("Only the client can approve milestones")
        milestones = job["milestones"]
        if milestone_idx < 0 or milestone_idx >= len(milestones):
            raise gl.vm.UserError("Invalid milestone index")
        m = milestones[milestone_idx]
        if m["status"] != "delivered":
            raise gl.vm.UserError("Milestone has not been delivered yet")
        if m["approved"]:
            raise gl.vm.UserError("Milestone already approved")

        m["approved"] = True
        m["status"] = "approved"
        _Recipient(Address(job["freelancer"])).emit_transfer(value=m["amount"])

        all_approved = all(ms["approved"] for ms in milestones)
        if all_approved:
            job["status"] = "completed"
            job["ai_reasoning"] = "All milestones approved by client."
            self._update_freelancer_profile(job["freelancer"], int(job["budget"]), disputed=False)

        job["updated_at"] = 0
        self._save_job(jid, job)

    @gl.public.write
    def auto_evaluate(self, job_id: int) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)
        if job["status"] != "delivered":
            raise gl.vm.UserError("Job has not been delivered yet")

        title = job["title"]
        description = job["description"]
        evidence_url = job["evidence_url"]
        evidence_note = job["evidence_note"]
        budget = job["budget"]
        freelancer_hex = job["freelancer"]

        def evaluate() -> str:
            prompt = f"""You are an impartial AI judge for a freelance escrow payment system.

JOB DETAILS:
- Title: {title}
- Description: {description}
- Budget: {budget} GEN tokens

FREELANCER SUBMISSION:
- Evidence URL: {evidence_url}
- Freelancer note: {evidence_note or "(none provided)"}

Score the submission on these 5 criteria, each from 0 to 10:
1. Relevance (0-10): Does the evidence URL and note relate to the job domain?
2. Completeness (0-10): Are all deliverables described in the job spec addressed?
3. Quality (0-10): Does the evidence suggest professional, working output?
4. Meets Spec (0-10): Does the submission satisfy the explicit requirements word-for-word?
5. Professional (0-10): Is the presentation, documentation, and delivery professional?

The submission is APPROVED if the average of all five scores is >= 6. Otherwise it is REJECTED.

Respond using ONLY the following JSON format, nothing else:
{{
  "approved": bool,
  "reasoning": str,
  "scores": {{
    "relevance": int,
    "completeness": int,
    "quality": int,
    "meets_spec": int,
    "professional": int
  }},
  "confidence": str
}}
It is mandatory that you respond only using the JSON format above, nothing else.
Do not include any other words or characters.
This result must be perfectly parseable by a JSON parser without errors."""

            result = gl.nondet.exec_prompt(prompt)
            return result.replace("```json", "").replace("```", "")

        result_str = gl.eq_principle.strict_eq(evaluate)

        try:
            parsed = json.loads(result_str)
        except Exception:
            match = re.search(r'\{.*\}', result_str, re.DOTALL)
            if match:
                parsed = json.loads(match.group())
            else:
                raise gl.vm.UserError("AI returned invalid JSON response")

        if "approved" not in parsed or "reasoning" not in parsed:
            raise gl.vm.UserError("AI response missing required fields")

        scores = parsed.get("scores", {})
        if scores and len(scores) == 5:
            avg = sum(scores.values()) / 5
            approved = avg >= 6.0
        else:
            approved = bool(parsed["approved"])

        reasoning = str(parsed["reasoning"])
        confidence = str(parsed.get("confidence", ""))

        job["ai_reasoning"] = reasoning
        job["ai_scores"] = json.dumps(scores) if scores else "{}"
        job["ai_confidence"] = confidence
        job["status"] = "completed" if approved else "disputed"
        job["updated_at"] = 0

        if approved:
            _Recipient(Address(freelancer_hex)).emit_transfer(value=budget)

        self._save_job(jid, job)
        self._update_freelancer_profile(freelancer_hex, int(budget), disputed=(not approved))

    @gl.public.write
    def release_manually(self, job_id: int) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)
        if job["status"] != "delivered":
            raise gl.vm.UserError("Job has not been delivered yet")
        caller = gl.message.sender_address.as_hex
        if caller != job["client"]:
            raise gl.vm.UserError("Only the client can manually release payment")
        _Recipient(Address(job["freelancer"])).emit_transfer(value=job["budget"])
        job["status"] = "completed"
        job["ai_reasoning"] = "Manually approved by client."
        job["updated_at"] = 0
        self._save_job(jid, job)
        self._update_freelancer_profile(job["freelancer"], int(job["budget"]), disputed=False)

    @gl.public.write
    def resubmit_delivery(self, job_id: int, evidence_url: str, evidence_note: str) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)
        if job["status"] != "disputed":
            raise gl.vm.UserError("Job is not in disputed state")
        caller = gl.message.sender_address.as_hex
        if caller != job["freelancer"]:
            raise gl.vm.UserError("Only the assigned freelancer can resubmit")
        if not evidence_url.strip():
            raise gl.vm.UserError("Evidence URL is required")
        count = int(job.get("resubmit_count", 0))
        if count >= 2:
            raise gl.vm.UserError("Maximum resubmits (2) reached")
        job["evidence_url"] = evidence_url.strip()
        job["evidence_note"] = evidence_note.strip() if evidence_note else ""
        job["status"] = "delivered"
        job["resubmit_count"] = count + 1
        job["ai_reasoning"] = ""
        job["ai_scores"] = "{}"
        job["ai_confidence"] = ""
        job["updated_at"] = 0
        self._save_job(jid, job)

    @gl.public.write
    def send_message(self, job_id: int, content: str) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)
        if job["status"] == "open":
            raise gl.vm.UserError("Cannot message before a freelancer takes the job")
        sender = gl.message.sender_address.as_hex
        if sender != job["client"] and sender != job["freelancer"]:
            raise gl.vm.UserError("Only client or freelancer can message")
        msgs = json.loads(self.messages.get(jid, "[]"))
        msgs.append({
            "sender": sender,
            "content": content[:500],
            "role": "client" if sender == job["client"] else "freelancer",
            "timestamp": 0,
        })
        self.messages[jid] = json.dumps(msgs)

    @gl.public.view
    def get_messages(self, job_id: int) -> str:
        return self.messages.get(u256(job_id), "[]")

    @gl.public.view
    def get_job(self, job_id: int) -> str:
        return self.jobs.get(u256(job_id), "")

    @gl.public.view
    def get_all_jobs(self) -> str:
        result = []
        for i in range(int(self.job_count)):
            raw = self.jobs.get(u256(i), "")
            if raw:
                result.append(json.loads(raw))
        return json.dumps(result)

    @gl.public.view
    def get_jobs_by_client(self, client: str) -> str:
        result = []
        for i in range(int(self.job_count)):
            raw = self.jobs.get(u256(i), "")
            if raw:
                job = json.loads(raw)
                if job["client"].lower() == client.lower():
                    result.append(job)
        return json.dumps(result)

    @gl.public.view
    def get_jobs_by_freelancer(self, freelancer: str) -> str:
        result = []
        for i in range(int(self.job_count)):
            raw = self.jobs.get(u256(i), "")
            if raw:
                job = json.loads(raw)
                if job["freelancer"].lower() == freelancer.lower():
                    result.append(job)
        return json.dumps(result)

    @gl.public.view
    def get_job_count(self) -> int:
        return int(self.job_count)

    @gl.public.view
    def get_profile(self, address: str) -> str:
        return json.dumps(self._load_profile(address))
