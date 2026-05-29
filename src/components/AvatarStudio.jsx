import { useState, useRef } from 'react'
import { runTryOn } from '../api/replicate'
import { generateVideo } from '../api/did'
import { createInvoice } from '../api/paydunya'

const AVATARS = [
  { id: 1, name: 'Sofia', img: 'https://i.pravatar.cc/300?img=47', tag: 'Femme · Casual' },
  { id: 2, name: 'Amara', img: 'https://i.pravatar.cc/300?img=44', tag: 'Femme · Élégant' },
  { id: 3, name: 'Lena', img: 'https://i.pravatar.cc/300?img=48', tag: 'Femme · Sport' },
  { id: 4, name: 'Karim', img: 'https://i.pravatar.cc/300?img=12', tag: 'Homme · Business' },
  { id: 5, name: 'Marcus', img: 'https://i.pravatar.cc/300?img=15', tag: 'Homme · Casual' },
  { id: 6, name: 'Yann', img: 'https://i.pravatar.cc/300?img=11', tag: 'Homme · Urbain' },
]

const STEPS = ['Avatar', 'Vêtement', 'Paiement', 'Vidéo']
const VIDEO_PRICE = 1500 // FCFA

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
      <button
        className="studio-btn"
        disabled={!selected}
        onClick={() => onNext(selected)}
      >
        Continuer →
      </button>
    </div>
  )
}

function Step2TryOn({ avatar, onNext }) {
  const [garmentFile, setGarmentFile] = useState(null)
  const [garmentPreview, setGarmentPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

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
      const humanB64 = avatar.img // URL publique pour la démo
      const garmentB64 = await fileToBase64(garmentFile)
      const output = await runTryOn(humanB64, garmentB64)
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
      <p className="step-desc">Glissez ou cliquez pour choisir l'image du vêtement</p>

      <div className="tryon-layout">
        <div className="tryon-col">
          <div className="tryon-label">Avatar sélectionné</div>
          <img className="tryon-preview" src={avatar.img} alt={avatar.name} />
        </div>

        <div className="tryon-col">
          <div className="tryon-label">Vêtement</div>
          <div
            className={`tryon-upload ${garmentPreview ? 'has-image' : ''}`}
            onClick={() => inputRef.current?.click()}
          >
            {garmentPreview
              ? <img src={garmentPreview} alt="vêtement" />
              : <span>+ Ajouter un vêtement</span>
            }
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && handleGarment(e.target.files[0])} />
          </div>
        </div>

        {result && (
          <div className="tryon-col">
            <div className="tryon-label">✨ Résultat</div>
            <img className="tryon-preview" src={result} alt="try-on result" />
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
            Continuer → Paiement
          </button>
        )}
      </div>
    </div>
  )
}

function Step3Payment({ onNext, onSimulate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePay = async () => {
    setLoading(true)
    setError(null)
    try {
      const { checkoutUrl } = await createInvoice({
        amount: VIDEO_PRICE,
        description: 'Génération vidéo marketing Kaliroom',
        returnUrl: window.location.href,
        cancelUrl: window.location.href,
        ipnUrl: window.location.href,
      })
      window.location.href = checkoutUrl
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="studio-step">
      <h2>Paiement</h2>
      <p className="step-desc">Générez votre vidéo marketing pour {VIDEO_PRICE} FCFA</p>

      <div className="payment-card">
        <div className="payment-row">
          <span>Génération vidéo IA</span>
          <strong>{VIDEO_PRICE} FCFA</strong>
        </div>
        <div className="payment-row muted">
          <span>Durée estimée</span>
          <span>~2 minutes</span>
        </div>
        <div className="payment-row muted">
          <span>Format</span>
          <span>MP4 téléchargeable</span>
        </div>
        <hr className="payment-hr" />
        <div className="payment-row total">
          <span>Total</span>
          <strong>{VIDEO_PRICE} FCFA</strong>
        </div>
      </div>

      {error && <div className="studio-error">{error}</div>}

      <div className="studio-actions">
        <button className="studio-btn" onClick={handlePay} disabled={loading}>
          {loading ? '⏳ Redirection…' : '💳 Payer avec PayDunya'}
        </button>
        <button className="studio-btn secondary" onClick={onSimulate}>
          🧪 Simuler le paiement (démo)
        </button>
      </div>

      <p className="payment-note">
        Paiement sécurisé via <strong>PayDunya</strong> — Mobile Money, carte bancaire
      </p>
    </div>
  )
}

function Step4Video({ tryOnImage }) {
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState(null)
  const [script, setScript] = useState("Bonjour ! Découvrez notre nouvelle collection, élégante et tendance.")

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = await generateVideo(tryOnImage, script)
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
      <p className="step-desc">L'avatar va prononcer votre texte et bouger naturellement</p>

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

      {videoUrl && (
        <div className="video-result">
          <video src={videoUrl} controls autoPlay loop className="video-player" />
          <a className="studio-btn download-video" href={videoUrl} download="kaliroom-video.mp4">
            ↓ Télécharger la vidéo MP4
          </a>
        </div>
      )}
    </div>
  )
}

export default function AvatarStudio() {
  const [step, setStep] = useState(0)
  const [avatar, setAvatar] = useState(null)
  const [tryOnResult, setTryOnResult] = useState(null)

  const handleStep1 = (av) => { setAvatar(av); setStep(1) }
  const handleStep2 = (result) => { setTryOnResult(result); setStep(2) }
  const handleStep3 = () => setStep(3)

  return (
    <div className="avatar-studio">
      <StepBar current={step} />
      {step === 0 && <Step1Avatar onNext={handleStep1} />}
      {step === 1 && <Step2TryOn avatar={avatar} onNext={handleStep2} />}
      {step === 2 && <Step3Payment onNext={handleStep3} onSimulate={handleStep3} />}
      {step === 3 && <Step4Video tryOnImage={tryOnResult} />}
    </div>
  )
}
