import { useState } from 'react'
import { runTryOn } from '../api/replicate'
import { generateVideo } from '../api/did'

const AVATARS = [
  { id: 1, name: 'Sofia',  img: 'https://i.pravatar.cc/300?img=47', tag: 'Femme · Casual' },
  { id: 2, name: 'Amara',  img: 'https://i.pravatar.cc/300?img=44', tag: 'Femme · Élégant' },
  { id: 3, name: 'Lena',   img: 'https://i.pravatar.cc/300?img=48', tag: 'Femme · Sport' },
  { id: 4, name: 'Karim',  img: 'https://i.pravatar.cc/300?img=12', tag: 'Homme · Business' },
  { id: 5, name: 'Marcus', img: 'https://i.pravatar.cc/300?img=15', tag: 'Homme · Casual' },
  { id: 6, name: 'Yann',   img: 'https://i.pravatar.cc/300?img=11', tag: 'Homme · Urbain' },
]

const STEPS = ['Avatar', 'Vêtement', 'Vidéo']

// ─── Quota helpers ───────────────────────────────────────────────────────────

function getQuota() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem('kaliroom_quota')
    const q = raw ? JSON.parse(raw) : null
    if (!q || q.date !== today) return { date: today, count: 0 }
    return q
  } catch { return { date: new Date().toISOString().slice(0, 10), count: 0 } }
}

function incrementQuota() {
  const q = getQuota()
  q.count += 1
  localStorage.setItem('kaliroom_quota', JSON.stringify(q))
  return q.count
}

// ─── Step bar ────────────────────────────────────────────────────────────────

function StepBar({ current }) {
  return (
    <div className="step-bar">
      {STEPS.map((s, i) => (
        <div key={s} className={`step-item ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}`}>
          <span className="step-dot">{i < current ? '✓' : i + 1}</span>
          <span className="step-label">{s}</span>
          {i < STEPS.length - 1 && <span className="step-line" />}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1 : Avatar ─────────────────────────────────────────────────────────

function Step1Avatar({ onNext }) {
  const [selected, setSelected] = useState(null)
  return (
    <div className="studio-step">
      <h2>Choisissez votre avatar</h2>
      <p className="step-desc">Sélectionnez le personnage qui portera vos vêtements</p>
      <div className="avatar-grid">
        {AVATARS.map((av) => (
          <div
            key={av.id}
            className={`avatar-card ${selected?.id === av.id ? 'selected' : ''}`}
            onClick={() => setSelected(av)}
          >
            <img src={av.img} alt={av.name} />
            <div className="avatar-info">
              <strong>{av.name}</strong>
              <span>{av.tag}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="studio-btn" disabled={!selected} onClick={() => onNext(selected)}>
        Continuer →
      </button>
    </div>
  )
}

// ─── Step 2 : Try-on ─────────────────────────────────────────────────────────

function Step2TryOn({ avatar, onNext }) {
  const [garmentFile, setGarmentFile] = useState(null)
  const [garmentPreview, setGarmentPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleGarment = (file) => {
    setGarmentFile(file)
    setGarmentPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  const fileToBase64 = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result)
      r.onerror = rej
      r.readAsDataURL(file)
    })

  const handleTryOn = async () => {
    setLoading(true)
    setError(null)
    try {
      const garmentB64 = await fileToBase64(garmentFile)
      const output = await runTryOn(avatar.img, garmentB64)
      setResult(Array.isArray(output) ? output[0] : output)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="studio-step">
      <h2>Uploadez le vêtement</h2>
      <p className="step-desc">L'IA habillera votre avatar avec ce vêtement</p>

      <div className="tryon-layout">
        <div className="tryon-col">
          <div className="tryon-label">Avatar</div>
          <img className="tryon-preview" src={avatar.img} alt={avatar.name} />
        </div>
        <div className="tryon-col">
          <div className="tryon-label">Vêtement</div>
          <label className={`tryon-upload ${garmentPreview ? 'has-image' : ''}`}>
            {garmentPreview
              ? <img src={garmentPreview} alt="vêtement" />
              : <span>+ Ajouter</span>}
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && handleGarment(e.target.files[0])} />
          </label>
        </div>
        {result && (
          <div className="tryon-col">
            <div className="tryon-label">✨ Résultat</div>
            <img className="tryon-preview" src={result} alt="try-on" />
          </div>
        )}
      </div>

      {error && <div className="studio-error">{error}</div>}

      <div className="studio-actions">
        {garmentFile && !result && (
          <button className="studio-btn secondary" onClick={handleTryOn} disabled={loading}>
            {loading ? '⏳ Traitement IA…' : '✨ Essayer le vêtement'}
          </button>
        )}
        {result && (
          <button className="studio-btn" onClick={() => onNext(result)}>
            Continuer → Vidéo
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Step 3 : Vidéo ──────────────────────────────────────────────────────────

function Step3Video({ tryOnImage, dailyLimit }) {
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState(null)
  const [script, setScript] = useState("Bonjour ! Découvrez notre nouvelle collection, élégante et tendance.")

  const quota = getQuota()
  const remaining = dailyLimit - quota.count
  const exhausted = remaining <= 0

  const handleGenerate = async () => {
    if (exhausted) return
    setLoading(true)
    setError(null)
    try {
      const url = await generateVideo(tryOnImage, script)
      incrementQuota()
      setVideoUrl(url)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="studio-step">
      <h2>Générer la vidéo</h2>
      <p className="step-desc">L'avatar prononcera votre texte et bougera naturellement</p>

      <div className="quota-bar">
        <span>Vidéos restantes aujourd'hui</span>
        <div className="quota-dots">
          {Array.from({ length: dailyLimit }).map((_, i) => (
            <span key={i} className={`quota-dot ${i < remaining ? 'available' : 'used'}`} />
          ))}
        </div>
        <strong>{remaining}/{dailyLimit}</strong>
      </div>

      {exhausted ? (
        <div className="quota-exhausted">
          <span>⏳</span>
          <p>Quota journalier atteint. Revenez demain ou passez à une formule supérieure.</p>
        </div>
      ) : (
        <>
          <div className="script-box">
            <label className="script-label">Script de la vidéo</label>
            <textarea
              className="script-textarea"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Texte que l'avatar va prononcer…"
            />
            <span className="script-count">{script.length}/300</span>
          </div>

          {error && <div className="studio-error">{error}</div>}

          {!videoUrl && (
            <button className="studio-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? '⏳ Génération en cours (~2 min)…' : '🎬 Générer la vidéo'}
            </button>
          )}
        </>
      )}

      {videoUrl && (
        <div className="video-result">
          <video src={videoUrl} controls autoPlay loop className="video-player" />
          <a className="studio-btn download-video" href={videoUrl} download="kaliroom-video.mp4">
            ↓ Télécharger MP4
          </a>
          {remaining - 1 > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Il vous reste {remaining - 1} vidéo{remaining - 1 > 1 ? 's' : ''} aujourd'hui.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function AvatarStudio({ dailyLimit = 1 }) {
  const [step, setStep] = useState(0)
  const [avatar, setAvatar] = useState(null)
  const [tryOnResult, setTryOnResult] = useState(null)

  return (
    <div className="avatar-studio">
      <StepBar current={step} />
      {step === 0 && <Step1Avatar onNext={(av) => { setAvatar(av); setStep(1) }} />}
      {step === 1 && <Step2TryOn avatar={avatar} onNext={(r) => { setTryOnResult(r); setStep(2) }} />}
      {step === 2 && <Step3Video tryOnImage={tryOnResult} dailyLimit={dailyLimit} />}
    </div>
  )
}
