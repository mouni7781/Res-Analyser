import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Safely convert any error value from the API into a plain string
 * so it can be rendered without "Error: [object Object]" appearing.
 */
function extractErrorMessage(err) {
  // Axios HTTP error — FastAPI sends { detail: string | array }
  if (err?.response?.data) {
    const detail = err.response.data.detail
    if (typeof detail === 'string') return detail
    // FastAPI validation errors come as an array of objects
    if (Array.isArray(detail)) {
      return detail
        .map((d) => (d.msg ? `${d.loc?.join('.')} — ${d.msg}` : JSON.stringify(d)))
        .join('; ')
    }
    if (typeof detail === 'object') return JSON.stringify(detail)
  }

  // Network / connection errors
  if (err?.code === 'ECONNREFUSED' || err?.code === 'ERR_NETWORK' || !err?.response) {
    return 'Cannot connect to the backend. Make sure the Python server is running on port 8000.'
  }

  // Timeout
  if (err?.code === 'ECONNABORTED') {
    return 'The request timed out. The AI is taking longer than expected — please try again.'
  }

  // Standard Error object
  if (typeof err?.message === 'string' && err.message) return err.message

  // Last resort
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Send job details + resume files to the backend for AI evaluation.
 * Uses multipart/form-data so files are streamed directly.
 */
export async function evaluateResumes(jobDetails, resumeFiles) {
  const form = new FormData()

  form.append('job_title', jobDetails.jobTitle)
  form.append('job_description', jobDetails.jobDescription)
  form.append('required_skills', jobDetails.requiredSkills)
  form.append('preferred_skills', jobDetails.preferredSkills || '')
  form.append('min_experience', String(jobDetails.minExperience))

  for (const file of resumeFiles) {
    form.append('resumes', file)
  }

  try {
    const response = await axios.post(`${BASE_URL}/evaluate`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min — LLM calls can be slow with many resumes
    })
    return response.data
  } catch (err) {
    throw new Error(extractErrorMessage(err))
  }
}
