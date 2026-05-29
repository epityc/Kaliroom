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

function getAccess() {
  try { return JSON.parse(localStorage.getItem('kaliroom_access') || 'null') } catch { return null }
}

function getDailyQuota() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem('kaliroom_quota')
    const q = raw ? JSON.parse(raw) : null
    if (!q || q.date !== today) return { date: today, count: 0 }
    return q
  } catch { return { date: new Date().toISOString().slice(0, 10), count: 0 } }
}

function incrementQuota() {
  // daily
  const q = getDailyQuota()
  q.count += 1
  localStorage.setItem('kaliroom_quota', JSON.stringify(q))
  // total
  const access = getAccess()
  if (access) {
    access.totalUsed = (access.totalUsed || 0) + 1
    localStorage.setItem('kaliroom_access', JSON.stringify(access))
  }
}

function isExpired(access) {
  if (!access?.expiryDate) return false
  return new Date().toISOString().slice(0, 10) > access.expiryDate
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

function Step3Video({ tryOnImage, dailyLimit, totalLimit }) {
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState(null)
  const [script, setScript] = useState("Bonjour ! Découvrez notre nouvelle collection, élégante et tendance.")

  const access = getAccess()
  const expired = isExpired(access)
  const totalUsed = access?.totalUsed || 0
  const totalRemaining = totalLimit - totalUsed

  const dailyQuota = getDailyQuota()
  const dailyRemaining = dailyLimit - dailyQuota.count
  const dailyExhausted = dailyRemaining <= 0
  const totalExhausted = totalRemaining <= 0

  const daysLeft = access?.expiryDate
    ? Math.max(0, Math.ceil((new Date(access.expiryDate) - new Date()) / 86400000))
    : 0

  const blocked = expired || totalExhausted || dailyExhausted

  const handleGenerate = async () => {
    if (blocked) return
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

      {/* Compteurs */}
      <div className="quota-board">
        <div className="quota-cell">
          <span className="quota-val">{dailyRemaining}</span>
          <span className="quota-lbl">vidéo{dailyRemaining > 1 ? 's' : ''} aujourd'hui</span>
        </div>
        <div className="quota-sep" />
        <div className="quota-cell">
          <span className="quota-val">{totalRemaining}</span>
          <span className="quota-lbl">vidéos restantes</span>
        </div>
        <div className="quota-sep" />
        <div className="quota-cell">
          <span className="quota-val">{daysLeft}</span>
          <span className="quota-lbl">jours restants</span>
        </div>
      </div>

      {expired && (
        <div className="quota-exhausted"><span>📅</span><p>Votre abonnement a expiré. Renouvelez pour continuer.</p></div>
      )}
      {!expired && totalExhausted && (
        <div className="quota-exhausted"><span>🎬</span><p>Vous avez utilisé vos {totalLimit} vidéos. Renouvelez votre abonnement.</p></div>
      )}
      {!expired && !totalExhausted && dailyExhausted && (
        <div className="quota-exhausted"><span>⏳</span><p>Quota journalier atteint ({dailyLimit}/jour). Revenez demain.</p></div>
      )}

      {!blocked && (
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
        </div>
      )}
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function AvatarStudio({ dailyLimit = 1, totalLimit = 30 }) {
  const [step, setStep] = useState(0)
  const [avatar, setAvatar] = useState(null)
  const [tryOnResult, setTryOnResult] = useState(null)

  return (
    <div className="avatar-studio">
      <StepBar current={step} />
      {step === 0 && <Step1Avatar onNext={(av) => { setAvatar(av); setStep(1) }} />}
      {step === 1 && <Step2TryOn avatar={avatar} onNext={(r) => { setTryOnResult(r); setStep(2) }} />}
      {step === 2 && <Step3Video tryOnImage={tryOnResult} dailyLimit={dailyLimit} totalLimit={totalLimit} />}
    </div>
  )
}
