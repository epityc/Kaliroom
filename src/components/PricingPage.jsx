import { useState } from 'react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 3000,
    color: '#0ea5e9',
    dailyLimit: 1,
    totalLimit: 30,
    days: 30,
    popular: false,
    features: [
      'Suppression de fond IA',
      'Try-on vêtement sur avatar',
      'Vidéo avatar animée (MP4)',
      '1 vidéo par jour',
      '30 vidéos au total · 30 jours',
    ],
    unlocks: ['bgremove', 'tryon', 'video'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 6000,
    color: '#8b5cf6',
    dailyLimit: 2,
    totalLimit: 60,
    days: 30,
    popular: true,
    features: [
      'Suppression de fond IA',
      'Try-on vêtement sur avatar',
      'Vidéo avatar animée (MP4)',
      '2 vidéos par jour',
      '60 vidéos au total · 30 jours',
    ],
    unlocks: ['bgremove', 'tryon', 'video'],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 9000,
    color: '#f59e0b',
    dailyLimit: 3,
    totalLimit: 90,
    days: 30,
    popular: false,
    features: [
      'Suppression de fond IA',
      'Try-on vêtement sur avatar',
      'Vidéo avatar animée (MP4)',
      '3 vidéos par jour',
      '90 vidéos au total · 30 jours',
    ],
    unlocks: ['bgremove', 'tryon', 'video'],
  },
]

const WA_NUMBER = '22890643185'

function PaymentModal({ plan, onClose, onSuccess }) {
  const [step, setStep] = useState('instructions')
  const [ref, setRef] = useState('')
  const [error, setError] = useState('')

  const code = `KALI-${plan.id.toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

  const handleConfirm = () => {
    if (ref.trim().length < 4) {
      setError('Entrez la référence de votre transaction Mixx by Yas.')
      return
    }
    onSuccess(plan, ref.trim())
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {step === 'instructions' && (
          <>
            <div className="modal-icon">📱</div>
            <h3>Payer {plan.price.toLocaleString()} XOF</h3>
            <p className="modal-sub">
              via Mixx by Yas · {plan.totalLimit} vidéos sur {plan.days} jours
            </p>

            <div className="payment-steps">
              <div className="pay-step">
                <span className="pay-num">1</span>
                <div>
                  <strong>Ouvrez Mixx by Yas</strong>
                  <p>Ou composez <code>*145#</code></p>
                </div>
              </div>
              <div className="pay-step">
                <span className="pay-num">2</span>
                <div>
                  <strong>Envoyez {plan.price.toLocaleString()} XOF</strong>
                  <p>Au numéro <code>+{WA_NUMBER}</code></p>
                </div>
              </div>
              <div className="pay-step">
                <span className="pay-num">3</span>
                <div>
                  <strong>Notez votre référence</strong>
                  <p>Mentionnez <code>{code}</code> en motif</p>
                </div>
              </div>
            </div>

            <button className="studio-btn" style={{ width: '100%' }} onClick={() => setStep('verify')}>
              J'ai effectué le paiement →
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="modal-icon">✅</div>
            <h3>Confirmer le paiement</h3>
            <p className="modal-sub">Entrez la référence reçue par SMS après votre transaction</p>

            <input
              className="ref-input"
              type="text"
              placeholder="Ex : TG2024XXXXXX"
              value={ref}
              onChange={(e) => { setRef(e.target.value); setError('') }}
              autoFocus
            />
            {error && <p className="studio-error" style={{ marginTop: 8 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="studio-btn secondary" onClick={() => setStep('instructions')}>← Retour</button>
              <button className="studio-btn" style={{ flex: 1 }} onClick={handleConfirm}>Débloquer l'accès</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PricingPage({ onPlanSelected }) {
  const [activePlan, setActivePlan] = useState(null)

  const handleSuccess = (plan, ref) => {
    const today = new Date().toISOString().slice(0, 10)
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + plan.days)

    const access = {
      plan: plan.id,
      unlocks: plan.unlocks,
      dailyLimit: plan.dailyLimit,
      totalLimit: plan.totalLimit,
      totalUsed: 0,
      startDate: today,
      expiryDate: expiryDate.toISOString().slice(0, 10),
      ref,
    }
    localStorage.setItem('kaliroom_access', JSON.stringify(access))
    localStorage.setItem('kaliroom_quota', JSON.stringify({ date: today, count: 0 }))
    setActivePlan(null)
    onPlanSelected(access)
  }

  return (
    <div className="pricing-page">
      <h1 className="pricing-title">Créez vos vidéos marketing IA</h1>
      <p className="pricing-sub">Suppression de fond · Try-on vêtement · Vidéo avatar animée</p>

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`} style={{ '--plan-color': plan.color }}>
            {plan.popular && <span className="popular-badge">Populaire</span>}
            <div className="plan-header">
              <h2>{plan.name}</h2>
              <div className="plan-price">
                <span className="price-amount">{plan.price.toLocaleString()}</span>
                <span className="price-currency">XOF / 30 jours</span>
              </div>
            </div>
            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}><span className="check">✓</span>{f}</li>
              ))}
            </ul>
            <button
              className="plan-btn"
              style={{ background: plan.color }}
              onClick={() => setActivePlan(plan)}
            >
              Choisir {plan.name}
            </button>
          </div>
        ))}
      </div>

      {activePlan && (
        <PaymentModal
          plan={activePlan}
          onClose={() => setActivePlan(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

export { PLANS }
