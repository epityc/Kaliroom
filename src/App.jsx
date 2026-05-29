import { useState, useRef, useCallback, useEffect } from 'react'
import { removeBackground } from '@imgly/background-removal'
import AvatarStudio from './components/AvatarStudio'
import './App.css'

// ─── Couleurs & dégradés ────────────────────────────────────────────────────

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

// ─── Header ─────────────────────────────────────────────────────────────────

function Header({ mode, onModeChange, onUploadNew }) {
  return (
    <header className="header">
      <a className="logo" href="/">
        <span className="logo-icon">✦</span>
        Kaliroom
      </a>

      <nav className="header-nav">
        <button
          className={`nav-tab ${mode === 'bgremove' ? 'active' : ''}`}
          onClick={() => onModeChange('bgremove')}
        >
          🖼️ Fond
        </button>
        <button
          className={`nav-tab ${mode === 'avatar' ? 'active' : ''}`}
          onClick={() => onModeChange('avatar')}
        >
          🎬 Avatar Studio
        </button>
      </nav>

      <div className="header-actions">
        {onUploadNew && mode === 'bgremove' && (
          <button className="btn btn-ghost" onClick={onUploadNew}>← Nouvelle image</button>
        )}
      </div>
    </header>
  )
}

// ─── Background removal ──────────────────────────────────────────────────────

function DropZone({ onFile }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }, [onFile])

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
      <h3>Déposez votre image ici</h3>
      <p>ou cliquez pour parcourir · PNG, JPG, WebP</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
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
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>Dégradés</span>
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
        <label htmlFor="custom-color">Couleur :</label>
        <input
          id="custom-color"
          type="color"
          value={customColor}
          onChange={(e) => { onCustomColor(e.target.value); onSelect(e.target.value) }}
        />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{customColor}</span>
      </div>
    </div>
  )
}

function ComposedCanvas({ resultUrl, background }) {
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

function BgRemoveEditor({ file, onReset }) {
  const [originalUrl, setOriginalUrl] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [processing, setProcessing] = useState(true)
  const [progress, setProgress] = useState(0)
  const [background, setBackground] = useState('#ffffff')
  const [customColor, setCustomColor] = useState('#7c3aed')
  const [view, setView] = useState('result')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setOriginalUrl(url)
    setProcessing(true)
    setProgress(0)
    removeBackground(file, {
      progress: (key, current, total) => {
        if (total > 0) setProgress(Math.round((current / total) * 100))
      },
    }).then((blob) => {
      setResultUrl(URL.createObjectURL(blob))
      setProcessing(false)
    }).catch(() => setProcessing(false))
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
      link.download = 'kaliroom-' + (file.name || 'image').replace(/\.[^.]+$/, '') + '.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = resultUrl
  }, [resultUrl, background, file.name])

  return (
    <div className="editor">
      <div className="editor-canvas">
        <div className="canvas-bg" />
        {processing && (
          <div className="processing-overlay">
            <div className="spinner" />
            <div style={{ textAlign: 'center' }}>
              <strong>Suppression du fond…</strong>
              <p>IA embarquée · {progress}%</p>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        <div className="canvas-result">
          {view === 'original' && originalUrl && <img src={originalUrl} alt="Original" />}
          {view === 'result' && resultUrl && <ComposedCanvas resultUrl={resultUrl} background={background} />}
          {view === 'result' && !resultUrl && !processing && originalUrl && <img src={originalUrl} alt="Original" />}
        </div>
      </div>

      <aside className="sidebar">
        <div className="sidebar-section">
          <h4>Aperçu</h4>
          <div className="compare-toggle">
            <button className={view === 'result' ? 'active' : ''} onClick={() => setView('result')}>Résultat</button>
            <button className={view === 'original' ? 'active' : ''} onClick={() => setView('original')}>Original</button>
          </div>
        </div>
        <div className="sidebar-section">
          <h4>Fond</h4>
          <BackgroundPicker selected={background} onSelect={setBackground} customColor={customColor} onCustomColor={setCustomColor} />
        </div>
        <div className="sidebar-section">
          <button className="download-btn" onClick={handleDownload} disabled={!resultUrl} style={{ opacity: resultUrl ? 1 : 0.5 }}>
            ↓ Télécharger PNG
          </button>
        </div>
      </aside>
    </div>
  )
}

function LandingHero({ onFile }) {
  return (
    <>
      <main className="hero">
        <h1>Supprimez les fonds<br />en un clic</h1>
        <p>Uploadez une photo et l'IA de Kaliroom efface le fond instantanément — gratuitement, dans votre navigateur.</p>
        <DropZone onFile={onFile} />
      </main>
      <div className="features">
        {[
          { icon: '⚡', text: 'Suppression IA instantanée' },
          { icon: '🔒', text: 'Données sur votre appareil' },
          { icon: '🎨', text: 'Fonds personnalisés' },
          { icon: '📥', text: 'Téléchargement PNG gratuit' },
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

// ─── WhatsApp button ─────────────────────────────────────────────────────────

const WA_NUMBER = '22890643185'
const WA_MESSAGE = encodeURIComponent('Bonjour ! Je voudrais en savoir plus sur Kaliroom 👋')

function WhatsAppButton() {
  return (
    <a
      className="wa-btn"
      href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter sur WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span>WhatsApp</span>
    </a>
  )
}

// ─── App root ────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState('bgremove')
  const [file, setFile] = useState(null)

  return (
    <>
      <Header
        mode={mode}
        onModeChange={(m) => { setMode(m); setFile(null) }}
        onUploadNew={file ? () => setFile(null) : null}
      />

      {mode === 'bgremove' && (
        file
          ? <BgRemoveEditor file={file} onReset={() => setFile(null)} />
          : <LandingHero onFile={setFile} />
      )}

      {mode === 'avatar' && <AvatarStudio />}

      <WhatsAppButton />
    </>
  )
}
