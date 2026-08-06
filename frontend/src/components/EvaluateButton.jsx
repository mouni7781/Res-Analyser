import { Sparkles, Loader2 } from 'lucide-react'

export default function EvaluateButton({ onClick, disabled, loading, resumeCount }) {
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="btn-primary text-base px-8 py-3.5"
        onClick={onClick}
        disabled={disabled}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Evaluating…
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Evaluate Candidates
          </>
        )}
      </button>
    </div>
  )
}
