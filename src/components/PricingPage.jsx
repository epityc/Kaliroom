import { useState } from 'react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 3000,
    color: '#0ea5e9',
    features: [
      'Suppression de fond IA',
      'Fonds personnalisés & dégradés',
      'Export PNG illimité',
    ],
    unlocks: ['bgremove'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 6000,
    color: '#8b5cf6',
    popular: true,
    features: [
      'Tout Starter inclus',
      'Try-on vêtement sur avatar IA',
      '10 essais try-on',
    ],
    unlocks: ['bgremove', 'tryon'],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 9000,
    color: '#f59e0b',
    features: [
      'Tout Pro inclus',
      'Vidéo avatar animée (MP4)',
      '3 vidéos générées',
    ],
    unlocks: ['bgremove', 'tryon', 'video'],
  },
]

const WA_NUMBER = '22890643185'

function PaymentModal({ plan, onClose, onSuccess }) {
  const [step, setStep] = useState('instructions') // instructions | verify
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
            <p className="modal-sub">via Mixx by Yas (T-Money)</p>

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
    // Stocker l'accès en localStorage
    const access = { plan: plan.id, unlocks: plan.unlocks, ref, date: new Date().toISOString() }
    localStorage.setItem('kaliroom_access', JSON.stringify(access))
    setActivePlan(null)
    onPlanSelected(plan)
  }

  return (
    <div className="pricing-page">
      <h1 className="pricing-title">Choisissez votre formule</h1>
      <p className="pricing-sub">Payez une fois, utilisez immédiatement</p>

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`} style={{ '--plan-color': plan.color }}>
            {plan.popular && <span className="popular-badge">Populaire</span>}
            <div className="plan-header">
              <h2>{plan.name}</h2>
              <div className="plan-price">
                <span className="price-amount">{plan.price.toLocaleString()}</span>
                <span className="price-currency">XOF</span>
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
