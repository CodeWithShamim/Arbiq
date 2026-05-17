# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json
import re


STATUS_OPEN = "open"
STATUS_ACTIVE = "active"
STATUS_DELIVERED = "delivered"
STATUS_COMPLETED = "completed"
STATUS_DISPUTED = "disputed"


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass


class Arbiq(gl.Contract):
    job_count: u256
    jobs: TreeMap[u256, str]

    def __init__(self):
        self.job_count = u256(0)
        self.jobs = TreeMap[u256, str]()

    def _load_job(self, job_id: u256):
        raw = self.jobs.get(job_id, "")
        if not raw:
            raise gl.vm.UserError(f"Job {int(job_id)} does not exist")
        return json.loads(raw)

    def _save_job(self, job_id: u256, job) -> None:
        self.jobs[job_id] = json.dumps(job)

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
            "status": STATUS_OPEN,
            "evidence_url": "",
            "evidence_note": "",
            "ai_reasoning": "",
        }

        self._save_job(job_id, job)

    @gl.public.write
    def take_job(self, job_id: int) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)

        if job["status"] != STATUS_OPEN:
            raise gl.vm.UserError("Job is not open")

        caller = gl.message.sender_address.as_hex
        if caller == job["client"]:
            raise gl.vm.UserError("Client cannot take their own job")

        job["freelancer"] = caller
        job["status"] = STATUS_ACTIVE

        self._save_job(jid, job)

    @gl.public.write
    def submit_delivery(self, job_id: int, evidence_url: str, evidence_note: str) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)

        if job["status"] != STATUS_ACTIVE:
            raise gl.vm.UserError("Job is not active")

        caller = gl.message.sender_address.as_hex
        if caller != job["freelancer"]:
            raise gl.vm.UserError("Only the assigned freelancer can submit delivery")

        if not evidence_url.strip():
            raise gl.vm.UserError("Evidence URL is required")

        job["evidence_url"] = evidence_url.strip()
        job["evidence_note"] = evidence_note.strip() if evidence_note else ""
        job["status"] = STATUS_DELIVERED

        self._save_job(jid, job)

    @gl.public.write
    def auto_evaluate(self, job_id: int) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)

        if job["status"] != STATUS_DELIVERED:
            raise gl.vm.UserError("Job has not been delivered yet")

        title = job["title"]
        description = job["description"]
        evidence_url = job["evidence_url"]
        evidence_note = job["evidence_note"]
        budget = job["budget"]
        freelancer_hex = job["freelancer"]

        def evaluate() -> str:
            prompt = f"""You are an impartial AI judge evaluating freelance work delivery for an escrow payment system.

JOB DETAILS:
- Title: {title}
- Description: {description}
- Budget: {budget} GEN tokens

FREELANCER SUBMISSION:
- Evidence URL: {evidence_url}
- Freelancer note: {evidence_note or "(none provided)"}

Determine whether the freelancer's submission satisfactorily fulfills the job requirements.

Criteria:
1. Does the evidence URL point to something relevant to the job?
2. Does the freelancer note describe completing the required work?
3. Is there a reasonable basis to believe the work was done?

Return ONLY valid JSON, no markdown, no extra text:
{{"approved": true, "reasoning": "Your 1-3 sentence reasoning here."}}"""

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

        approved = bool(parsed["approved"])
        reasoning = str(parsed["reasoning"])

        job["ai_reasoning"] = reasoning
        job["status"] = STATUS_COMPLETED if approved else STATUS_DISPUTED

        if approved:
            _Recipient(Address(freelancer_hex)).emit_transfer(value=budget)

        self._save_job(jid, job)

    @gl.public.write
    def release_manually(self, job_id: int) -> None:
        jid = u256(job_id)
        job = self._load_job(jid)

        if job["status"] != STATUS_DELIVERED:
            raise gl.vm.UserError("Job has not been delivered yet")

        caller = gl.message.sender_address.as_hex
        if caller != job["client"]:
            raise gl.vm.UserError("Only the client can manually release payment")

        _Recipient(Address(job["freelancer"])).emit_transfer(value=job["budget"])

        job["status"] = STATUS_COMPLETED
        job["ai_reasoning"] = "Manually approved by client."

        self._save_job(jid, job)

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
