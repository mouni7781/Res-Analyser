/**
 * Circular SVG progress ring that displays the match score.
 */
export default function ScoreRing({ score }) {
  const size = 56
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#10b981' :  // emerald
    score >= 60 ? '#3b82f6' :  // blue
    score >= 40 ? '#f59e0b' :  // amber
                  '#ef4444'    // red

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-sm font-bold"
          style={{ color }}
          aria-label={`Match score: ${score}%`}
        >
          {score}%
        </span>
      </div>
    </div>
  )
}
