export default function StatsCards({ stats }) {
  const cards = [
    { label: 'Total', value: stats?.total, color: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
    { label: 'Abiertos', value: stats?.open, color: '#818cf8', bg: 'rgba(129,140,248,0.08)' },
    { label: 'En Proceso', value: stats?.inProgress, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
    { label: 'Resueltos', value: stats?.resolved, color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    { label: 'Críticos', value: stats?.critical, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
  ]

  return (
    <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
      {cards.map(item => (
        <div key={item.label} className="card fade-in" style={{ background: item.bg, border: `1px solid ${item.color}22` }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: item.color }}>
            {item.label}
          </p>
          <p className="text-4xl font-bold" style={{ color: item.color }}>{item.value ?? 0}</p>
        </div>
      ))}
    </div>
  )
}
