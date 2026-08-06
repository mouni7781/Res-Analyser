import { BrainCircuit } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
          <BrainCircuit className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Resume AI Analyzer</h1>
        </div>
      </div>
    </header>
  )
}
