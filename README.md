# Resume AI Analyzer

An AI-powered recruiter tool that evaluates multiple resumes against a job opening using **Google Gemini** via a **LangGraph** agent pipeline.

## Architecture

```
frontend/ (React + Vite + Tailwind)
    └── Vite dev server  :5173  →  proxies /evaluate  →  backend
backend/ (FastAPI + LangGraph + Gemini)
    └── FastAPI server   :8000
```

### LangGraph Pipeline (4 nodes)

```
extract_job_requirements
        ↓
extract_candidate_profiles  (one LLM call per resume)
        ↓
score_candidates            (one LLM call per candidate)
        ↓
rank_candidates             (pure sort, no LLM)
        ↓
       END
```

---

## Quick Start

### 1. Get a Gemini API Key

Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key.

### 2. Backend setup

```bash
cd backend

# Create a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and paste your Gemini API key
```

`.env` contents:
```
GEMINI_API_KEY=your_actual_key_here
```

Start the server:
```bash
python main.py
# API available at http://localhost:8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Usage

1. Fill in the **Job Details** form (title, description, skills, min experience).
2. **Drag & drop** or browse for candidate resumes (PDF or DOCX, up to 20 files).
3. Click **Evaluate Candidates**.
4. View ranked results with:
   - Match score (0–100%)
   - Matching / missing skills
   - Years of relevant experience
   - Recommendation label (Strong Fit / Fit / Partial Fit / Not Recommended)
   - AI reasoning summary

---

## Project Structure

```
Resume AI Analyzer/
├── backend/
│   ├── main.py          # FastAPI app, /evaluate endpoint
│   ├── agent.py         # LangGraph pipeline (4 nodes)
│   ├── extractor.py     # PDF & DOCX text extraction
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── JobDetailsForm.jsx
│   │       ├── ResumeUploader.jsx
│   │       ├── EvaluateButton.jsx
│   │       ├── ResultsPanel.jsx
│   │       ├── SummaryStats.jsx
│   │       ├── CandidateCard.jsx
│   │       └── ScoreRing.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
└── README.md
```

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18, Vite, Tailwind CSS, react-dropzone, lucide-react |
| Backend   | FastAPI, Uvicorn |
| AI Agent  | LangGraph, LangChain, Google Gemini 1.5 Flash |
| Parsing   | pypdf (PDF), python-docx (DOCX) |
