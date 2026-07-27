export default function CommentList({ comments }) {
  if (!comments || comments.length === 0) {
    return <p className="text-sm text-center py-4" style={{ color: '#4b5563' }}>Sin comentarios todavía</p>
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment._id} className="flex gap-3 py-2" style={{ borderBottom: '1px solid #1f2937' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
            {comment.author?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">{comment.author?.name}</p>
              <span className="text-xs capitalize" style={{ color: '#4b5563' }}>{comment.author?.role}</span>
              <span className="text-xs" style={{ color: '#374151' }}>
                {new Date(comment.createdAt).toLocaleString('es-AR')}
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
