import { useState } from 'react'
import Header from './components/Header'
import JobDetailsForm from './components/JobDetailsForm'
import ResumeUploader from './components/ResumeUploader'
import EvaluateButton from './components/EvaluateButton'
import ResultsPanel from './components/ResultsPanel'
import { evaluateResumes } from './api'

const INITIAL_JOB = {
  jobTitle: '',
  jobDescription: '',
  requiredSkills: '',
  preferredSkills: '',
  minExperience: '',
}

export default function App() {
  const [jobDetails, setJobDetails] = useState(INITIAL_JOB)
  const [resumes, setResumes] = useState([])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleEvaluate = async () => {
    setError(null)
    setResults(null)
    setLoading(true)

    try {
      const data = await evaluateResumes(jobDetails, resumes)
      setResults(data.results)
    } catch (err) {
      // Ensure we always store a plain string — never an object
      const msg =
        typeof err?.message === 'string' && err.message
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setJobDetails(INITIAL_JOB)
    setResumes([])
    setResults(null)
    setError(null)
  }

  const isReady =
    jobDetails.jobTitle.trim() &&
    jobDetails.jobDescription.trim() &&
    jobDetails.requiredSkills.trim() &&
    jobDetails.minExperience !== '' &&
    resumes.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {!results ? (
          <>
            {/* Job Details */}
            <section className="card p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-7 h-7 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                Job Details
              </h2>
              <JobDetailsForm values={jobDetails} onChange={setJobDetails} />
            </section>

            {/* Resume Upload */}
            <section className="card p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-7 h-7 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                Upload Resumes
              </h2>
              <ResumeUploader files={resumes} onChange={setResumes} />
            </section>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm animate-fade-in">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Evaluate */}
            <div className="flex justify-end animate-fade-in">
              <EvaluateButton
                onClick={handleEvaluate}
                disabled={!isReady || loading}
                loading={loading}
                resumeCount={resumes.length}
              />
            </div>
          </>
        ) : (
          <ResultsPanel
            results={results}
            jobDetails={jobDetails}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}
