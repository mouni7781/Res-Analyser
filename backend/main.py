import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import List
import uvicorn

from logger import get_logger
from agent import ResumeAnalysisAgent
from extractor import extract_text_from_file

logger = get_logger("main")

app = FastAPI(title="Resume AI Analyzer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / response logging middleware ───────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    logger.info(f"→ {request.method} {request.url.path}  client={request.client.host if request.client else 'unknown'}")
    try:
        response = await call_next(request)
    except Exception as exc:
        elapsed = (time.perf_counter() - start) * 1000
        logger.exception(f"✗ {request.method} {request.url.path} raised an unhandled exception after {elapsed:.1f} ms")
        raise
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(f"← {request.method} {request.url.path}  status={response.status_code}  {elapsed:.1f} ms")
    return response


# ─── Global error handlers ───────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    messages = []
    for e in exc.errors():
        loc = " → ".join(str(l) for l in e.get("loc", []))
        msg = e.get("msg", "Invalid value")
        messages.append(f"{loc}: {msg}" if loc else msg)
    detail = "; ".join(messages)
    logger.warning(f"Validation error on {request.method} {request.url.path}: {detail}")
    return JSONResponse(status_code=422, content={"detail": detail})


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {str(exc)}"},
    )


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    logger.debug("Health check called")
    return {"status": "ok"}


@app.post("/evaluate")
async def evaluate_resumes(
    job_title: str = Form(...),
    job_description: str = Form(...),
    required_skills: str = Form(...),
    preferred_skills: str = Form(""),
    min_experience: float = Form(...),
    resumes: List[UploadFile] = File(...),
):
    logger.info("─── /evaluate called ───────────────────────────────")
    logger.info(f"  job_title        : {job_title}")
    logger.info(f"  min_experience   : {min_experience} years")
    logger.info(f"  required_skills  : {required_skills}")
    logger.info(f"  preferred_skills : {preferred_skills}")
    logger.info(f"  resume count     : {len(resumes)}")
    for r in resumes:
        logger.info(f"    file → {r.filename}  content_type={r.content_type}")

    if not resumes:
        logger.warning("No resumes provided — rejecting request")
        raise HTTPException(status_code=400, detail="At least one resume is required.")

    required_skills_list = [s.strip() for s in required_skills.split(",") if s.strip()]
    preferred_skills_list = [s.strip() for s in preferred_skills.split(",") if s.strip()]

    job_details = {
        "job_title": job_title,
        "job_description": job_description,
        "required_skills": required_skills_list,
        "preferred_skills": preferred_skills_list,
        "min_experience": min_experience,
    }

    # ── Text extraction ───────────────────────────────────────────────────────
    candidates = []
    for resume_file in resumes:
        content = await resume_file.read()
        filename = resume_file.filename or "unknown"
        logger.debug(f"Extracting text from '{filename}'  size={len(content)} bytes")

        try:
            text = extract_text_from_file(content, filename)
            logger.info(f"  ✓ Extracted {len(text)} chars from '{filename}'")
        except Exception as exc:
            logger.warning(f"  ✗ Could not extract text from '{filename}': {type(exc).__name__}: {exc}")
            continue

        if not text.strip():
            logger.warning(f"  ✗ Extracted text is empty for '{filename}' — skipping")
            continue

        candidates.append({"filename": filename, "text": text})

    if not candidates:
        logger.error("No readable resumes after extraction — aborting")
        raise HTTPException(
            status_code=400,
            detail="No readable resumes found. Please upload valid PDF or DOCX files.",
        )

    logger.info(f"Proceeding with {len(candidates)} readable resume(s)")

    # ── Agent analysis ────────────────────────────────────────────────────────
    logger.info("Starting LangGraph agent analysis …")
    t0 = time.perf_counter()
    try:
        agent = ResumeAnalysisAgent()
        results = agent.analyze(job_details, candidates)
    except Exception as exc:
        elapsed = (time.perf_counter() - t0) * 1000
        logger.exception(f"Agent raised an exception after {elapsed:.1f} ms: {type(exc).__name__}: {exc}")
        raise HTTPException(status_code=500, detail=f"Agent error: {str(exc)}")

    elapsed = (time.perf_counter() - t0) * 1000
    logger.info(f"Agent finished in {elapsed:.1f} ms — {len(results)} candidate(s) ranked")
    for r in results:
        logger.info(
            f"  #{r.get('rank', '?')} {r.get('candidate_name', 'Unknown'):30s}  "
            f"score={r.get('match_score', 0):3d}  recommendation={r.get('recommendation', '')}"
        )

    logger.info("─── /evaluate complete ─────────────────────────────")
    return JSONResponse(content={"results": results})


if __name__ == "__main__":
    logger.info("Starting Resume AI Analyzer backend on http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
