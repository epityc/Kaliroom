import { useState, useRef, useCallback, useEffect } from 'react'
import { removeBackground } from '@imgly/background-removal'
import './App.css'

const SOLID_COLORS = [
  { label: 'Transparent', value: null },
  { label: 'White', value: '#ffffff' },
  { label: 'Light Gray', value: '#f3f4f6' },
  { label: 'Warm Beige', value: '#f5f0e8' },
  { label: 'Cream', value: '#fef9c3' },
  { label: 'Black', value: '#000000' },
  { label: 'Dark', value: '#111827' },
  { label: 'Navy', value: '#1e3a5f' },
  { label: 'Purple', value: '#4c1d95' },
  { label: 'Deep Red', value: '#7f1d1d' },
  { label: 'Forest', value: '#14532d' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Rose', value: '#fb7185' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Amber', value: '#f59e0b' },
]

const GRADIENTS = [
  { label: 'Purple Dream', value: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { label: 'Ocean', value: 'linear-gradient(135deg, #0f2027, #2980b9)' },
  { label: 'Sunrise', value: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { label: 'Forest', value: 'linear-gradient(135deg, #134e5e, #71b280)' },
  { label: 'Gold', value: 'linear-gradient(135deg, #f7971e, #ffd200)' },
]

function Header({ onUploadNew }) {
  return (
    <header className="header">
      <a className="logo" href="/">
        <span className="logo-icon">✦</span>
        Kaliroom
      </a>
      <div className="header-actions">
        {onUploadNew && (
          <button className="btn btn-ghost" onClick={onUploadNew}>
            ← New Image
          </button>
        )}
      </div>
    </header>
  )
}

function DropZone({ onFile }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }, [onFile])

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={`dropzone ${dragging ? 'active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <span className="dropzone-icon">🖼️</span>
      <h3>Drop your image here</h3>
      <p>or click to browse · PNG, JPG, WebP</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'none' }}
      />
    </div>
  )
}

function BackgroundPicker({ selected, onSelect, customColor, onCustomColor }) {
  return (
    <div>
      <div className="bg-grid">
        {SOLID_COLORS.map((c) => (
          <button
            key={c.label}
            title={c.label}
            className={`bg-swatch ${c.value === null ? 'transparent-swatch' : ''} ${selected === c.value ? 'selected' : ''}`}
            style={c.value ? { background: c.value } : {}}
            onClick={() => onSelect(c.value)}
            aria-label={c.label}
          />
        ))}
      </div>

      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>Gradients</span>
      </div>
      <div className="bg-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {GRADIENTS.map((g) => (
          <button
            key={g.label}
            title={g.label}
            className={`bg-swatch ${selected === g.value ? 'selected' : ''}`}
            style={{ background: g.value }}
            onClick={() => onSelect(g.value)}
            aria-label={g.label}
          />
        ))}
      </div>

      <div className="color-input-row">
        <label htmlFor="custom-color">Custom:</label>
        <input
          id="custom-color"
          type="color"
          value={customColor}
          onChange={(e) => {
            onCustomColor(e.target.value)
            onSelect(e.target.value)
          }}
        />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{customColor}</span>
      </div>
    </div>
  )
}

function ComposedCanvas({ originalUrl, resultUrl, background }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!resultUrl || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const img = new Image()
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (background) {
        if (background.startsWith('linear-gradient')) {
          // draw gradient
          const match = background.match(/#[0-9a-fA-F]{6}/g)
          if (match && match.length >= 2) {
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
            grad.addColorStop(0, match[0])
            grad.addColorStop(1, match[1])
            ctx.fillStyle = grad
          } else {
            ctx.fillStyle = '#ffffff'
          }
        } else {
          ctx.fillStyle = background
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0)
    }
    img.src = resultUrl
  }, [resultUrl, background])

  return (
    <canvas
      ref={canvasRef}
      style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 180px)', borderRadius: 8, display: 'block' }}
    />
  )
}

function Editor({ file, onReset }) {
  const [originalUrl, setOriginalUrl] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [processing, setProcessing] = useState(true)
  const [progress, setProgress] = useState(0)
  const [background, setBackground] = useState('#ffffff')
  const [customColor, setCustomColor] = useState('#7c3aed')
  const [view, setView] = useState('result') // 'original' | 'result'

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setOriginalUrl(url)
    setProcessing(true)
    setProgress(0)

    removeBackground(file, {
      progress: (key, current, total) => {
        if (total > 0) setProgress(Math.round((current / total) * 100))
      },
    })
      .then((blob) => {
        const resultObjectUrl = URL.createObjectURL(blob)
        setResultUrl(resultObjectUrl)
        setProcessing(false)
      })
      .catch((err) => {
        console.error(err)
        setProcessing(false)
      })

    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleDownload = useCallback(() => {
    if (!resultUrl) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      if (background) {
        if (background.startsWith('linear-gradient')) {
          const match = background.match(/#[0-9a-fA-F]{6}/g)
          if (match && match.length >= 2) {
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
            grad.addColorStop(0, match[0])
            grad.addColorStop(1, match[1])
            ctx.fillStyle = grad
          } else {
            ctx.fillStyle = '#ffffff'
          }
        } else {
          ctx.fillStyle = background
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0)
      const link = document.createElement('a')
      link.download = 'kaliroom-' + (file.name || 'image.png').replace(/\.[^.]+$/, '') + '.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = resultUrl
  }, [resultUrl, background, file.name])

  return (
    <>
      <Header onUploadNew={onReset} />
      <div className="editor">
        <div className="editor-canvas">
          <div className="canvas-bg" />

          {processing && (
            <div className="processing-overlay">
              <div className="spinner" />
              <div style={{ textAlign: 'center' }}>
                <strong>Removing background…</strong>
                <p>Powered by AI · {progress}%</p>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="canvas-result">
            {view === 'original' && originalUrl && (
              <img src={originalUrl} alt="Original" />
            )}
            {view === 'result' && resultUrl && (
              <ComposedCanvas
                originalUrl={originalUrl}
                resultUrl={resultUrl}
                background={background}
              />
            )}
            {view === 'result' && !resultUrl && !processing && originalUrl && (
              <img src={originalUrl} alt="Original" />
            )}
          </div>
        </div>

        <aside className="sidebar">
          {/* View toggle */}
          <div className="sidebar-section">
            <h4>Preview</h4>
            <div className="compare-toggle">
              <button
                className={view === 'result' ? 'active' : ''}
                onClick={() => setView('result')}
              >
                Result
              </button>
              <button
                className={view === 'original' ? 'active' : ''}
                onClick={() => setView('original')}
              >
                Original
              </button>
            </div>
          </div>

          {/* Background */}
          <div className="sidebar-section">
            <h4>Background</h4>
            <BackgroundPicker
              selected={background}
              onSelect={setBackground}
              customColor={customColor}
              onCustomColor={setCustomColor}
            />
          </div>

          {/* Actions */}
          <div className="sidebar-section" style={{ marginTop: 'auto' }}>
            <button
              className="download-btn"
              onClick={handleDownload}
              disabled={!resultUrl}
              style={{ opacity: resultUrl ? 1 : 0.5 }}
            >
              ↓ Download PNG
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

function LandingHero({ onFile }) {
  return (
    <>
      <Header />
      <main className="hero">
        <h1>Remove backgrounds<br />in one click</h1>
        <p>Upload any photo and Kaliroom's AI will instantly erase the background — for free, right in your browser.</p>
        <DropZone onFile={onFile} />
      </main>

      <div className="features">
        {[
          { icon: '⚡', text: 'Instant AI removal' },
          { icon: '🔒', text: 'Stays on your device' },
          { icon: '🎨', text: 'Custom backgrounds' },
          { icon: '📥', text: 'Free PNG download' },
        ].map(({ icon, text }) => (
          <div key={text} className="feature">
            <span className="feature-icon">{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export default function App() {
  const [file, setFile] = useState(null)

  if (file) {
    return <Editor file={file} onReset={() => setFile(null)} />
  }

  return <LandingHero onFile={setFile} />
}
