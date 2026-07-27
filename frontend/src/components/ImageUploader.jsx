import { useState } from 'react'

const MAX_FILES = 4

export default function ImageUploader({ files, onChange }) {
  const [previews, setPreviews] = useState([])

  function handleFiles(e) {
    const selected = Array.from(e.target.files).slice(0, MAX_FILES)
    onChange(selected)
    setPreviews(selected.map((f) => URL.createObjectURL(f)))
  }

  function removeAt(index) {
    const next = files.filter((_, i) => i !== index)
    onChange(next)
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
        Imágenes (opcional, máximo {MAX_FILES})
      </label>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} className="input-field" />

      {previews.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {previews.map((src, i) => (
            <div key={src} className="relative">
              <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg" style={{ border: '1px solid #1f2937' }} />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center"
                style={{ background: '#f87171', color: 'white' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
