"""
LangGraph-based AI agent for resume analysis using Google Gemini.

Graph flow:
  extract_job_requirements
      → extract_candidate_profiles
          → score_candidates
              → rank_candidates
                  → END
"""
import os                                                                          
import json
import re
import time
from typing import TypedDict, List, Dict, Any
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

from logger import get_logger
from scorer import fallback_score, get_recommendation

load_dotenv()

logger = get_logger("agent")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


# ─── State schema ─────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    job_details: Dict[str, Any]
    candidates: List[Dict[str, Any]]
    job_requirements: Dict[str, Any]
    candidate_profiles: List[Dict[str, Any]]
    scored_candidates: List[Dict[str, Any]]
    ranked_results: List[Dict[str, Any]]


# ─── LLM helpers ──────────────────────────────────────────────────────────────

def _get_llm() -> ChatGoogleGenerativeAI:
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is not set. Add it to your .env file."
        )
    logger.debug("Initialising Gemini LLM (gemini-3.5-flash-lite)")
    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash-lite",
        google_api_key=GEMINI_API_KEY,
        temperature=0.1,
    )


def _invoke_llm(llm: ChatGoogleGenerativeAI, messages: list, label: str) -> str:
    """Call the LLM and log timing + token information."""
    logger.debug(f"LLM call [{label}] — sending request …")
    t0 = time.perf_counter()
    try:
        response = llm.invoke(messages)
    except Exception as exc:
        elapsed = (time.perf_counter() - t0) * 1000
        logger.error(f"LLM call [{label}] FAILED after {elapsed:.1f} ms: {type(exc).__name__}: {exc}")
        raise
    elapsed = (time.perf_counter() - t0) * 1000
    chars = len(response.content)
    logger.debug(f"LLM call [{label}] completed in {elapsed:.1f} ms — response {chars} chars")
    return response.content


def _parse_json_from_response(text: str, label: str = "") -> Any:
    """Robustly extract the first JSON object/array from an LLM response."""
    cleaned = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        start = cleaned.find(start_char)
        if start != -1:
            depth = 0
            for i, ch in enumerate(cleaned[start:], start=start):
                if ch == start_char:
                    depth += 1
                elif ch == end_char:
                    depth -= 1
                    if depth == 0:
                        try:
                            parsed = json.loads(cleaned[start:i + 1])
                            logger.debug(f"JSON parse OK [{label}] — {len(cleaned[start:i+1])} chars")
                            return parsed
                        except json.JSONDecodeError as exc:
                            logger.warning(f"JSON parse failed [{label}]: {exc}  raw snippet: {cleaned[start:start+200]!r}")
                            break
    raise ValueError(f"Could not parse JSON from LLM response [{label}]: {text[:300]}")


# ─── Node 1: Extract structured job requirements ──────────────────────────────

def extract_job_requirements(state: AgentState) -> AgentState:
    logger.info("► Node: extract_job_requirements")
    llm = _get_llm()
    job = state["job_details"]

    logger.debug(f"  Job title: {job['job_title']}")
    logger.debug(f"  Required skills: {job['required_skills']}")
    logger.debug(f"  Min experience: {job['min_experience']} years")

    prompt = f"""You are a technical recruiter assistant. Analyze the job posting below and return ONLY a valid JSON object.

Job Title: {job['job_title']}
Job Description: {job['job_description']}
Required Skills: {', '.join(job['required_skills'])}
Preferred Skills: {', '.join(job.get('preferred_skills', []))}
Minimum Experience: {job['min_experience']} years

Return this exact JSON structure:
{{
  "core_skills": ["list of essential technical skills derived from the description"],
  "preferred_skills": ["list of nice-to-have skills"],
  "min_experience_years": <integer>,
  "key_responsibilities": ["short list of main responsibilities"],
  "certifications": ["any required or preferred certifications, empty list if none"],
  "education": "required education level or empty string"
}}"""

    messages = [
        SystemMessage(content="You are a precise JSON-generating assistant. Output only valid JSON, no explanation."),
        HumanMessage(content=prompt),
    ]

    raw = _invoke_llm(llm, messages, "extract_job_requirements")
    requirements = _parse_json_from_response(raw, "extract_job_requirements")

    # Merge with explicitly provided skills
    all_required = list(set(requirements.get("core_skills", []) + job["required_skills"]))
    requirements["core_skills"] = all_required
    requirements["min_experience_years"] = max(
        float(requirements.get("min_experience_years", 0)), float(job["min_experience"])
    )

    logger.info(f"  ✓ Extracted {len(requirements['core_skills'])} core skills, "
                f"min_exp={requirements['min_experience_years']} years")
    state["job_requirements"] = requirements
    return state


# ─── Node 2: Extract candidate profiles ──────────────────────────────────────

def extract_candidate_profiles(state: AgentState) -> AgentState:
    logger.info(f"► Node: extract_candidate_profiles ({len(state['candidates'])} resumes)")
    llm = _get_llm()
    profiles = []

    for idx, candidate in enumerate(state["candidates"], start=1):
        filename = candidate["filename"]
        resume_text = candidate["text"][:8000]
        logger.info(f"  [{idx}/{len(state['candidates'])}] Processing '{filename}' "
                    f"({len(candidate['text'])} chars, truncated to {len(resume_text)})")

        prompt = f"""Analyze the resume below and extract key information. Return ONLY a valid JSON object.

RESUME:
{resume_text}

Return this exact JSON structure:
{{
  "name": "candidate full name or 'Unknown' if not found",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "total_experience_years": <number, estimate based on work history>,
  "skills": ["list of all technical and soft skills mentioned"],
  "certifications": ["list of certifications and credentials"],
  "education": "highest education level and field",
  "job_titles": ["list of past job titles"],
  "companies": ["list of companies worked at"],
  "projects": ["brief descriptions of notable projects"],
  "summary": "2-3 sentence professional summary of this candidate"
}}"""

        messages = [
            SystemMessage(content="You are a precise JSON-generating assistant. Output only valid JSON, no explanation."),
            HumanMessage(content=prompt),
        ]

        try:
            raw = _invoke_llm(llm, messages, f"extract_profile:{filename}")
            profile = _parse_json_from_response(raw, f"extract_profile:{filename}")
            logger.info(f"    ✓ Name='{profile.get('name', 'Unknown')}'  "
                        f"skills={len(profile.get('skills', []))}  "
                        f"exp={profile.get('total_experience_years', 0)} yrs")
        except Exception as exc:
            logger.warning(f"    ✗ Profile extraction failed for '{filename}': {type(exc).__name__}: {exc}")
            profile = {
                "name": filename.replace(".pdf", "").replace(".docx", ""),
                "email": "",
                "phone": "",
                "total_experience_years": 0,
                "skills": [],
                "certifications": [],
                "education": "",
                "job_titles": [],
                "companies": [],
                "projects": [],
                "summary": "Could not extract profile information.",
            }

        profile["_filename"] = filename
        profiles.append(profile)

    logger.info(f"  ✓ All profiles extracted ({len(profiles)} total)")
    state["candidate_profiles"] = profiles
    return state


# ─── Node 3: Score candidates ─────────────────────────────────────────────────

def score_candidates(state: AgentState) -> AgentState:
    logger.info(f"► Node: score_candidates ({len(state['candidate_profiles'])} profiles)")
    llm = _get_llm()
    job_req = state["job_requirements"]
    scored = []

    for idx, profile in enumerate(state["candidate_profiles"], start=1):
        name = profile.get("name", "Unknown")
        filename = profile.get("_filename", "")
        logger.info(f"  [{idx}/{len(state['candidate_profiles'])}] Scoring '{name}' ({filename})")

        prompt = f"""You are a technical recruiter scoring a candidate against a job opening.

JOB REQUIREMENTS:
- Core Skills Required: {json.dumps(job_req.get('core_skills', []))}
- Preferred Skills: {json.dumps(job_req.get('preferred_skills', []))}
- Minimum Experience: {job_req.get('min_experience_years', 0)} years
- Certifications: {json.dumps(job_req.get('certifications', []))}
- Education: {job_req.get('education', 'Not specified')}

CANDIDATE PROFILE:
- Name: {name}
- Skills: {json.dumps(profile.get('skills', []))}
- Total Experience: {profile.get('total_experience_years', 0)} years
- Certifications: {json.dumps(profile.get('certifications', []))}
- Education: {profile.get('education', 'Not specified')}
- Job Titles: {json.dumps(profile.get('job_titles', []))}
- Summary: {profile.get('summary', '')}

Score this candidate and return ONLY a valid JSON object:
{{
  "match_score": <integer 0-100>,
  "matching_skills": ["skills the candidate has that match requirements"],
  "missing_skills": ["required skills the candidate lacks"],
  "matching_preferred_skills": ["preferred skills the candidate has"],
  "experience_match": <true or false>,
  "years_relevant_experience": <number>,
  "recommendation": "<one of: Strong Fit, Fit, Partial Fit, Not Recommended>",
  "reasoning": "2-3 sentence explanation of the score and recommendation"
}}

Scoring guide:
- Required skills coverage: 50 points max
- Experience meets minimum: 20 points max
- Preferred skills bonus: 15 points max
- Education and certifications: 15 points max
- Strong Fit: 80-100, Fit: 60-79, Partial Fit: 40-59, Not Recommended: 0-39"""

        messages = [
            SystemMessage(content="You are a precise JSON-generating assistant. Output only valid JSON, no explanation."),
            HumanMessage(content=prompt),
        ]

        try:
            raw = _invoke_llm(llm, messages, f"score:{name}")
            score_data = _parse_json_from_response(raw, f"score:{name}")
            logger.info(f"    ✓ score={score_data.get('match_score', 0)}  "
                        f"recommendation='{score_data.get('recommendation', '')}'  "
                        f"matching_skills={len(score_data.get('matching_skills', []))}")
        except Exception as exc:
            logger.warning(f"    ✗ Scoring failed for '{name}': {type(exc).__name__}: {exc} — using fallback scorer")
            fb = fallback_score(
                candidate_skills=profile.get("skills", []),
                required_skills=job_req.get("core_skills", []),
                preferred_skills=job_req.get("preferred_skills", []),
                years_experience=float(profile.get("total_experience_years", 0)),
                min_experience=int(job_req.get("min_experience_years", 0)),
            )
            score_data = {
                **fb,
                "experience_match": float(profile.get("total_experience_years", 0)) >= int(job_req.get("min_experience_years", 0)),
                "years_relevant_experience": profile.get("total_experience_years", 0),
                "reasoning": "Scored using fallback engine (LLM scoring unavailable).",
            }

        result = {
            "candidate_name": name,
            "filename": filename,
            "email": profile.get("email", ""),
            "match_score": score_data.get("match_score", 0),
            "matching_skills": score_data.get("matching_skills", []),
            "missing_skills": score_data.get("missing_skills", []),
            "matching_preferred_skills": score_data.get("matching_preferred_skills", []),
            "years_relevant_experience": score_data.get("years_relevant_experience", 0),
            "experience_match": score_data.get("experience_match", False),
            "recommendation": score_data.get("recommendation", "Not Recommended"),
            "reasoning": score_data.get("reasoning", ""),
            "education": profile.get("education", ""),
            "certifications": profile.get("certifications", []),
            "summary": profile.get("summary", ""),
            "job_titles": profile.get("job_titles", []),
        }
        scored.append(result)

    logger.info(f"  ✓ All candidates scored ({len(scored)} total)")
    state["scored_candidates"] = scored
    return state


# ─── Node 4: Rank candidates ──────────────────────────────────────────────────

def rank_candidates(state: AgentState) -> AgentState:
    logger.info("► Node: rank_candidates")
    ranked = sorted(
        state["scored_candidates"],
        key=lambda c: c["match_score"],
        reverse=True,
    )
    for i, candidate in enumerate(ranked, start=1):
        candidate["rank"] = i
        logger.info(f"  #{i:2d}  {candidate['candidate_name']:30s}  score={candidate['match_score']:3d}  {candidate['recommendation']}")

    state["ranked_results"] = ranked
    logger.info(f"  ✓ Ranking complete — top candidate: {ranked[0]['candidate_name'] if ranked else 'none'}")
    return state


# ─── Build the LangGraph ──────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    logger.debug("Building LangGraph …")
    graph = StateGraph(AgentState)

    graph.add_node("extract_job_requirements", extract_job_requirements)
    graph.add_node("extract_candidate_profiles", extract_candidate_profiles)
    graph.add_node("score_candidates", score_candidates)
    graph.add_node("rank_candidates", rank_candidates)

    graph.set_entry_point("extract_job_requirements")
    graph.add_edge("extract_job_requirements", "extract_candidate_profiles")
    graph.add_edge("extract_candidate_profiles", "score_candidates")
    graph.add_edge("score_candidates", "rank_candidates")
    graph.add_edge("rank_candidates", END)

    compiled = graph.compile()
    logger.debug("LangGraph compiled successfully")
    return compiled


# ─── Public interface ─────────────────────────────────────────────────────────

class ResumeAnalysisAgent:
    def __init__(self):
        logger.info("Initialising ResumeAnalysisAgent")
        self.graph = build_graph()

    def analyze(
        self,
        job_details: Dict[str, Any],
        candidates: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        logger.info(f"ResumeAnalysisAgent.analyze — {len(candidates)} candidate(s)")
        initial_state: AgentState = {
            "job_details": job_details,
            "candidates": candidates,
            "job_requirements": {},
            "candidate_profiles": [],
            "scored_candidates": [],
            "ranked_results": [],
        }
        t0 = time.perf_counter()
        final_state = self.graph.invoke(initial_state)
        elapsed = (time.perf_counter() - t0) * 1000
        logger.info(f"Graph invoke completed in {elapsed:.1f} ms")
        return final_state["ranked_results"]
