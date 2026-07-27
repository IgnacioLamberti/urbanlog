import { useUsers, useChangeUserRole } from '../hooks/useUsers'

const ROLES = ['citizen', 'moderator', 'operator', 'admin']

export default function AdminUsersPage() {
  const { data: users, isLoading } = useUsers()
  const { mutate: changeRole, isPending, variables } = useChangeUserRole()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Usuarios</h1>
        <p className="text-sm mt-1" style={{ color: '#4b5563' }}>Gestión de roles del sistema</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {users.map((u, i) => (
            <div key={u._id} className="flex items-center gap-4 p-4" style={{ borderBottom: i < users.length - 1 ? '1px solid #1f2937' : 'none' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                {u.imageUrl ? <img src={u.imageUrl} alt="" className="w-full h-full object-cover" /> : u.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.name}</p>
                <p className="text-xs truncate" style={{ color: '#4b5563' }}>{u.email}</p>
              </div>
              <select
                value={u.role}
                onChange={(e) => changeRole({ id: u._id, role: e.target.value })}
                disabled={isPending && variables?.id === u._id}
                className="text-xs rounded px-3 py-1.5 capitalize"
                style={{ background: '#0a0f1e', border: '1px solid #374151', color: '#94a3b8', cursor: 'pointer', fontFamily: 'Space Grotesk' }}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
