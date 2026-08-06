import { ArrowLeft, Trophy, Users } from 'lucide-react'
import CandidateCard from './CandidateCard'
import SummaryStats from './SummaryStats'

export default function ResultsPanel({ results, jobDetails, onReset }) {
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Evaluation Results
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {results.length} candidate{results.length !== 1 ? 's' : ''} ranked for&nbsp;
            <span className="font-semibold text-slate-700">{jobDetails.jobTitle}</span>
          </p>
        </div>
        <button className="btn-secondary" onClick={onReset}>
          <ArrowLeft className="w-4 h-4" />
          New Analysis
        </button>
      </div>

      {/* Summary stats */}
      <SummaryStats results={results} />

      {/* Candidate cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4" />
          Ranked Candidates
        </h3>
        {results.map((candidate) => (
          <CandidateCard key={candidate.filename} candidate={candidate} />
        ))}
      </div>
    </div>
  )
}
