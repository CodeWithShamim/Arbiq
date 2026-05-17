# { "Depends": "py-genlayer:v1" }
from genlayer import *
import json

class JobPosted(gl.Event):
    job_id: int
    client: gl.Address
    title: str
    budget: int

class JobTaken(gl.Event):
    job_id: int
    freelancer: gl.Address

class DeliverySubmitted(gl.Event):
    job_id: int
    evidence_url: str

class JobEvaluated(gl.Event):
    job_id: int
    approved: bool
    reasoning: str

class JobReleased(gl.Event):
    job_id: int

STATUS_OPEN = "open"
STATUS_ACTIVE = "active"
STATUS_DELIVERED = "delivered"
STATUS_COMPLETED = "completed"
STATUS_DISPUTED = "disputed"

class Arbiq(gl.Contract):
    """
    Arbiq: AI-enforced freelance escrow marketplace on GenLayer.

    Clients post jobs with escrowed GEN. Freelancers submit deliveries.
    An AI validator evaluates submissions against the original job spec
    and either releases funds or flags the job as disputed.
    """

    job_count: int
    jobs: gl.TreeMap[int, str]

    def __init__(self):
        self.job_count = 0
        self.jobs = gl.TreeMap[int, str]()

    # ─── Internal helpers ────────────────────────────────────────────────────

    def _load_job(self, job_id: int) -> dict:
        raw = self.jobs.get(job_id, "")
        if not raw:
            raise ValueError(f"Job {job_id} does not exist")
        return json.loads(raw)

    def _save_job(self, job_id: int, job: dict) -> None:
        self.jobs[job_id] = json.dumps(job)

    # ─── Write methods ───────────────────────────────────────────────────────

    @gl.public.write
    def post_job(self, title: str, description: str, deadline: str) -> int:
        """
        Post a new job. The GEN sent with this call is held in escrow.

        Args:
            title: Short job title
            description: Natural language spec describing deliverables
            deadline: ISO date string (YYYY-MM-DD)

        Returns:
            job_id of the newly created job
        """
        if not title or len(title.strip()) < 3:
            raise ValueError("Title must be at least 3 characters")
        if not description or len(description.strip()) < 20:
            raise ValueError("Description must be at least 20 characters")
        if not deadline:
            raise ValueError("Deadline is required")

        budget = gl.message.value
        if budget <= 0:
            raise ValueError("Budget must be greater than 0")

        job_id = self.job_count
        self.job_count += 1

        job = {
            "id": job_id,
            "title": title.strip(),
            "description": description.strip(),
            "budget": budget,
            "deadline": deadline,
            "client": str(gl.message.sender),
            "freelancer": "",
            "status": STATUS_OPEN,
            "evidence_url": "",
            "evidence_note": "",
            "ai_reasoning": "",
            "created_at": str(gl.message.timestamp),
            "updated_at": str(gl.message.timestamp),
        }

        self._save_job(job_id, job)
        JobPosted(job_id, gl.message.sender, title.strip(), budget).emit()
        return job_id

    @gl.public.write
    def take_job(self, job_id: int) -> None:
        """
        Accept an open job as a freelancer.

        Args:
            job_id: The ID of the job to take
        """
        job = self._load_job(job_id)

        if job["status"] != STATUS_OPEN:
            raise ValueError("Job is not open")

        freelancer = gl.message.sender
        if str(freelancer) == job["client"]:
            raise ValueError("Client cannot take their own job")

        job["freelancer"] = str(freelancer)
        job["status"] = STATUS_ACTIVE
        job["updated_at"] = str(gl.message.timestamp)

        self._save_job(job_id, job)
        JobTaken(job_id, freelancer).emit()

    @gl.public.write
    def submit_delivery(self, job_id: int, evidence_url: str, evidence_note: str) -> None:
        """
        Submit work evidence for an active job.

        Args:
            job_id: The job being delivered
            evidence_url: Link to work (GitHub repo, live site, etc.)
            evidence_note: Explanation of what was delivered
        """
        job = self._load_job(job_id)

        if job["status"] != STATUS_ACTIVE:
            raise ValueError("Job is not active")

        freelancer = gl.message.sender
        if str(freelancer) != job["freelancer"]:
            raise ValueError("Only the assigned freelancer can submit delivery")

        if not evidence_url or not evidence_url.strip():
            raise ValueError("Evidence URL is required")

        job["evidence_url"] = evidence_url.strip()
        job["evidence_note"] = evidence_note.strip() if evidence_note else ""
        job["status"] = STATUS_DELIVERED
        job["updated_at"] = str(gl.message.timestamp)

        self._save_job(job_id, job)
        DeliverySubmitted(job_id, evidence_url.strip()).emit()

    @gl.public.write
    def auto_evaluate(self, job_id: int) -> None:
        """
        Trigger AI evaluation of a delivered job.

        Non-deterministic: uses LLM to compare delivery evidence against
        the original job description and decide whether to release funds.
        Uses gl.eq_principle.strict_eq for validator consensus.
        """
        job = self._load_job(job_id)

        if job["status"] != STATUS_DELIVERED:
            raise ValueError("Job has not been delivered yet")

        title = job["title"]
        description = job["description"]
        evidence_url = job["evidence_url"]
        evidence_note = job["evidence_note"]
        budget = job["budget"]

        def evaluate() -> dict:
            # Fetch evidence content if it's a URL we can read
            evidence_content = ""
            try:
                if evidence_url.startswith("http"):
                    response = gl.nondet.web.get(evidence_url)
                    evidence_content = response.text[:3000] if hasattr(response, 'text') else ""
            except Exception:
                evidence_content = ""

            prompt = f"""You are an impartial AI judge evaluating freelance work delivery for an escrow payment system.

JOB DETAILS:
- Title: {title}
- Description: {description}
- Budget: {budget} GEN tokens

FREELANCER'S SUBMISSION:
- Evidence URL: {evidence_url}
- Freelancer's note: {evidence_note or "(none provided)"}
- Evidence content preview: {evidence_content or "(could not fetch URL content)"}

EVALUATION TASK:
Determine whether the freelancer's submission satisfactorily fulfills the job requirements described above.

Criteria:
1. Does the evidence URL point to something relevant to the job?
2. Does the freelancer's note describe completing the required work?
3. Based on the evidence, is there a reasonable basis to believe the work was done?

Be fair but firm. Give benefit of the doubt if evidence is plausible and relevant.
If the evidence is completely unrelated or clearly insufficient, reject.

Return ONLY a JSON object with exactly these fields:
- "approved": boolean (true = release funds, false = dispute)
- "reasoning": string (1-3 sentences explaining your decision)
- "confidence": string ("high", "medium", or "low")"""

            return gl.nondet.exec_prompt(prompt, response_format="json")

        result = gl.eq_principle.strict_eq(evaluate)

        required = ["approved", "reasoning", "confidence"]
        for key in required:
            if key not in result:
                raise ValueError(f"AI response missing field: {key}")

        approved = bool(result["approved"])
        reasoning = str(result["reasoning"])

        job["ai_reasoning"] = reasoning
        job["status"] = STATUS_COMPLETED if approved else STATUS_DISPUTED
        job["updated_at"] = str(gl.message.timestamp)

        if approved:
            # Release escrowed funds to freelancer
            freelancer_addr = gl.Address(job["freelancer"])
            gl.message.value  # budget already held in contract
            # Transfer budget to freelancer
            gl.send(freelancer_addr, job["budget"])

        self._save_job(job_id, job)
        JobEvaluated(job_id, approved, reasoning).emit()

    @gl.public.write
    def release_manually(self, job_id: int) -> None:
        """
        Client manually approves and releases payment without AI evaluation.

        Args:
            job_id: The delivered job to approve
        """
        job = self._load_job(job_id)

        if job["status"] != STATUS_DELIVERED:
            raise ValueError("Job has not been delivered yet")

        caller = gl.message.sender
        if str(caller) != job["client"]:
            raise ValueError("Only the client can manually release payment")

        freelancer_addr = gl.Address(job["freelancer"])
        gl.send(freelancer_addr, job["budget"])

        job["status"] = STATUS_COMPLETED
        job["ai_reasoning"] = "Manually approved by client."
        job["updated_at"] = str(gl.message.timestamp)

        self._save_job(job_id, job)
        JobReleased(job_id).emit()

    # ─── View methods ────────────────────────────────────────────────────────

    @gl.public.view
    def get_job(self, job_id: int) -> str:
        """Return a single job as JSON."""
        return self.jobs.get(job_id, "")

    @gl.public.view
    def get_all_jobs(self) -> str:
        """Return all jobs as a JSON array."""
        result = []
        for i in range(self.job_count):
            raw = self.jobs.get(i, "")
            if raw:
                result.append(json.loads(raw))
        return json.dumps(result)

    @gl.public.view
    def get_jobs_by_client(self, client: str) -> str:
        """Return all jobs posted by a specific client address."""
        result = []
        for i in range(self.job_count):
            raw = self.jobs.get(i, "")
            if raw:
                job = json.loads(raw)
                if job["client"].lower() == client.lower():
                    result.append(job)
        return json.dumps(result)

    @gl.public.view
    def get_jobs_by_freelancer(self, freelancer: str) -> str:
        """Return all jobs taken by a specific freelancer address."""
        result = []
        for i in range(self.job_count):
            raw = self.jobs.get(i, "")
            if raw:
                job = json.loads(raw)
                if job["freelancer"].lower() == freelancer.lower():
                    result.append(job)
        return json.dumps(result)

    @gl.public.view
    def get_job_count(self) -> int:
        """Return total number of jobs created."""
        return self.job_count
