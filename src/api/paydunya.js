// PayDunya — création d'une facture de paiement
// ⚠️ En production, déplacer côté serveur pour ne pas exposer les clés
const PAYDUNYA_BASE = 'https://app.paydunya.com/api/v1'

export async function createInvoice({ amount, description, cancelUrl, returnUrl, ipnUrl }) {
  const masterKey = import.meta.env.VITE_PAYDUNYA_MASTER_KEY
  const privateKey = import.meta.env.VITE_PAYDUNYA_PRIVATE_KEY
  const token = import.meta.env.VITE_PAYDUNYA_TOKEN

  if (!masterKey || !privateKey || !token) {
    throw new Error('Clés PayDunya manquantes dans .env')
  }

  const res = await fetch(`${PAYDUNYA_BASE}/checkout-invoice/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': masterKey,
      'PAYDUNYA-PRIVATE-KEY': privateKey,
      'PAYDUNYA-TOKEN': token,
    },
    body: JSON.stringify({
      invoice: {
        total_amount: amount,
        description,
      },
      store: {
        name: 'Kaliroom',
        tagline: 'Créez votre vidéo marketing IA',
        postal_address: 'Dakar, Sénégal',
        logo_url: 'https://kaliroom.vercel.app/favicon.svg',
        website_url: returnUrl,
        phone: '',
      },
      actions: {
        cancel_url: cancelUrl,
        return_url: returnUrl,
        callback_url: ipnUrl,
      },
    }),
  })

  if (!res.ok) throw new Error(`PayDunya error ${res.status}`)
  const data = await res.json()

  if (data.response_code !== '00') {
    throw new Error('PayDunya : ' + data.response_text)
  }

  return {
    token: data.token,
    checkoutUrl: data.response_text, // URL de paiement hébergée
  }
}
