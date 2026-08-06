import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  GraduationCap,
  Award,
  Briefcase,
} from 'lucide-react'
import ScoreRing from './ScoreRing'

const RECOMMENDATION_META = {
  'Strong Fit': {
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    Icon: CheckCircle2,
  },
  Fit: {
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-700 border border-blue-200',
    Icon: CheckCircle2,
  },
  'Partial Fit': {
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    Icon: AlertCircle,
  },
  'Not Recommended': {
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-700 border border-red-200',
    Icon: XCircle,
  },
}

function SkillTag({ label, variant }) {
  const styles = {
    match:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
    missing: 'bg-red-50 text-red-600 border border-red-200',
    preferred: 'bg-blue-50 text-blue-600 border border-blue-200',
  }
  return (
    <span className={`tag ${styles[variant]}`}>{label}</span>
  )
}

export default function CandidateCard({ candidate }) {
  const [expanded, setExpanded] = useState(false)
  const meta = RECOMMENDATION_META[candidate.recommendation] || RECOMMENDATION_META['Not Recommended']
  const { Icon } = meta

  return (
    <div className={`card overflow-hidden border ${meta.border} transition-shadow hover:shadow-md`}>
      {/* Summary row */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        {/* Rank badge */}
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">
          #{candidate.rank}
        </div>

        {/* Score ring */}
        <ScoreRing score={candidate.match_score} />

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-base truncate">
              {candidate.candidate_name}
            </h3>
            <span className={`tag text-xs ${meta.badge}`}>
              <Icon className="w-3.5 h-3.5 mr-1" />
              {candidate.recommendation}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
            {candidate.email && (
              <span className="truncate">{candidate.email}</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {candidate.years_relevant_experience ?? 0} yrs relevant exp
            </span>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <span className="text-slate-400 text-xs hidden sm:inline truncate">{candidate.filename}</span>
          </div>
        </div>

        {/* Expand toggle */}
        <div className="flex-shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-5 animate-fade-in">
          {/* AI Assessment or Profile Summary — show only one */}
          {(candidate.reasoning || candidate.summary) && (
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 italic border border-slate-200">
              <span className="font-semibold not-italic text-slate-700">
                {candidate.reasoning ? 'AI Assessment: ' : 'Profile Summary: '}
              </span>
              {candidate.reasoning || candidate.summary}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Matching skills */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Matching Skills ({candidate.matching_skills.length})
              </h4>
              {candidate.matching_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {candidate.matching_skills.map((s) => (
                    <SkillTag key={s} label={s} variant="match" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">None identified</p>
              )}
            </div>

            {/* Missing skills */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                Missing Skills ({candidate.missing_skills.length})
              </h4>
              {candidate.missing_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {candidate.missing_skills.map((s) => (
                    <SkillTag key={s} label={s} variant="missing" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-600 font-medium">All required skills covered</p>
              )}
            </div>
          </div>

          {/* Preferred skill matches */}
          {candidate.matching_preferred_skills?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                Matching Preferred Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.matching_preferred_skills.map((s) => (
                  <SkillTag key={s} label={s} variant="preferred" />
                ))}
              </div>
            </div>
          )}

          {/* Additional info row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {/* Years of relevant experience — always show */}
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Relevant Experience</p>
                <p className="text-slate-700 font-semibold">
                  {candidate.years_relevant_experience ?? 0}{' '}
                  {candidate.years_relevant_experience === 1 ? 'year' : 'years'}
                </p>
              </div>
            </div>

            {candidate.education && (
              <div className="flex items-start gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Education</p>
                  <p className="text-slate-700">{candidate.education}</p>
                </div>
              </div>
            )}

            {candidate.certifications?.length > 0 && (
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Certifications</p>
                  <p className="text-slate-700">{candidate.certifications.join(', ')}</p>
                </div>
              </div>
            )}

            {candidate.job_titles?.length > 0 && (
              <div className="flex items-start gap-2">
                <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Past Roles</p>
                  <p className="text-slate-700 line-clamp-2">{candidate.job_titles.slice(0, 3).join(', ')}</p>
                </div>
              </div>
            )}
          </div>

          {/* (summary already shown above in AI Assessment block) */}
        </div>
      )}
    </div>
  )
}
