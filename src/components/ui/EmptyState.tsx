export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center text-slate-400">
      <span className="text-4xl">{icon}</span>
      <p className="max-w-[220px] text-sm">{text}</p>
    </div>
  )
}
