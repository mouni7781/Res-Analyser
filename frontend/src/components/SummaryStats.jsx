import { CheckCircle2, XCircle, AlertCircle, MinusCircle } from 'lucide-react'

const RECOMMENDATION_META = {
  'Strong Fit':      { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', Icon: CheckCircle2 },
  'Fit':             { color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    Icon: CheckCircle2 },
  'Partial Fit':     { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   Icon: AlertCircle },
  'Not Recommended': { color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200',     Icon: XCircle },
}

export default function SummaryStats({ results }) {
  const counts = results.reduce((acc, r) => {
    acc[r.recommendation] = (acc[r.recommendation] || 0) + 1
    return acc
  }, {})

  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.match_score, 0) / results.length)
    : 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {/* Average score */}
      <div className="card p-4 sm:col-span-1 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold text-brand-600">{avgScore}%</span>
        <span className="text-xs text-slate-500 mt-1">Avg. Score</span>
      </div>

      {/* Per-recommendation counts */}
      {Object.entries(RECOMMENDATION_META).map(([label, meta]) => {
        const count = counts[label] || 0
        return (
          <div
            key={label}
            className={`card p-4 flex flex-col items-center justify-center text-center border ${meta.border} ${meta.bg}`}
          >
            <span className={`text-2xl font-bold ${meta.color}`}>{count}</span>
            <span className={`text-xs font-medium mt-1 ${meta.color}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
