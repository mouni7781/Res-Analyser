import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, X, UploadCloud } from 'lucide-react'

const MAX_FILES = 20
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResumeUploader({ files, onChange }) {
  const onDrop = useCallback(
    (accepted) => {
      // Merge, deduplicate by name
      const existing = new Set(files.map((f) => f.name))
      const fresh = accepted.filter((f) => !existing.has(f.name))
      const merged = [...files, ...fresh].slice(0, MAX_FILES)
      onChange(merged)
    },
    [files, onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: MAX_FILES,
    multiple: true,
  })

  const remove = (name) => onChange(files.filter((f) => f.name !== name))

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
          }`}
      >
        <input {...getInputProps()} />
        <UploadCloud
          className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-brand-500' : 'text-slate-400'}`}
        />
        {isDragActive ? (
          <p className="text-brand-600 font-semibold">Drop resumes here…</p>
        ) : (
          <>
            <p className="text-slate-700 font-semibold">Drag & drop resumes here</p>
            <p className="text-slate-400 text-sm mt-1">or click to browse files</p>
            <p className="text-slate-400 text-xs mt-2">PDF and DOCX · up to {MAX_FILES} files</p>
          </>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-600">
            {files.length} resume{files.length !== 1 ? 's' : ''} selected
          </p>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{file.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatBytes(file.size)}</span>
                </div>
                <button
                  onClick={() => remove(file.name)}
                  className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
