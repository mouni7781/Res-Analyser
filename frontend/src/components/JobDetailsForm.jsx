export default function JobDetailsForm({ values, onChange }) {
  const set = (field) => (e) =>
    onChange((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Row 1: Title + Experience */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="jobTitle">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            id="jobTitle"
            type="text"
            className="input-field"
            placeholder="e.g. Senior Frontend Engineer"
            value={values.jobTitle}
            onChange={set('jobTitle')}
          />
        </div>

        <div>
          <label className="label" htmlFor="minExperience">
            Min. Experience (years) <span className="text-red-500">*</span>
          </label>
          <input
            id="minExperience"
            type="number"
            min="0"
            max="30"
            step="0.5"
            className="input-field"
            placeholder="e.g. 0.5, 2, 3.5"
            value={values.minExperience}
            onChange={set('minExperience')}
          />
          <p className="mt-1 text-xs text-slate-400">Decimals allowed (e.g. 0.5, 1.5)</p>
        </div>
      </div>

      {/* Job Description */}
      <div>
        <label className="label" htmlFor="jobDescription">
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="jobDescription"
          rows={5}
          className="input-field resize-none"
          placeholder="Describe the role, responsibilities, and context..."
          value={values.jobDescription}
          onChange={set('jobDescription')}
        />
      </div>

      {/* Skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="requiredSkills">
            Required Skills <span className="text-red-500">*</span>
          </label>
          <input
            id="requiredSkills"
            type="text"
            className="input-field"
            placeholder="React, TypeScript, Node.js, SQL"
            value={values.requiredSkills}
            onChange={set('requiredSkills')}
          />
          <p className="mt-1 text-xs text-slate-400">Comma-separated</p>
        </div>

        <div>
          <label className="label" htmlFor="preferredSkills">
            Preferred Skills
          </label>
          <input
            id="preferredSkills"
            type="text"
            className="input-field"
            placeholder="AWS, Docker, GraphQL"
            value={values.preferredSkills}
            onChange={set('preferredSkills')}
          />
          <p className="mt-1 text-xs text-slate-400">Comma-separated (optional)</p>
        </div>
      </div>
    </div>
  )
}
