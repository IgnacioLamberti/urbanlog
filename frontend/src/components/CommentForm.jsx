import { useState } from 'react'
import { useCreateComment } from '../hooks/useComments'

export default function CommentForm({ incidentId }) {
  const [text, setText] = useState('')
  const { mutate, isPending } = useCreateComment(incidentId)

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    mutate(text, { onSuccess: () => setText('') })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
      <input
        className="input-field"
        placeholder="Escribí un comentario o actualización..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="btn-primary" disabled={isPending || !text.trim()}>
        Enviar
      </button>
    </form>
  )
}
