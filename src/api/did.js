// D-ID — génération de vidéo avatar animé
const DID_BASE = 'https://api.d-id.com'

function authHeader() {
  const key = import.meta.env.VITE_DID_API_KEY
  if (!key) throw new Error('VITE_DID_API_KEY manquant dans .env')
  return `Basic ${btoa(key + ':')}`
}

export async function generateVideo(sourceImageUrl, text = "Bonjour, découvrez notre nouvelle collection !") {
  const res = await fetch(`${DID_BASE}/talks`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: sourceImageUrl,
      script: {
        type: 'text',
        input: text,
        provider: {
          type: 'microsoft',
          voice_id: 'fr-FR-DeniseNeural',
        },
      },
      config: { fluent: true, pad_audio: 0 },
    }),
  })

  if (!res.ok) throw new Error(`D-ID error ${res.status}`)
  const { id } = await res.json()

  // Poll jusqu'à ce que la vidéo soit prête
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const poll = await fetch(`${DID_BASE}/talks/${id}`, {
      headers: { Authorization: authHeader() },
    })
    const data = await poll.json()
    if (data.status === 'done') return data.result_url
    if (data.status === 'error') throw new Error('D-ID : ' + data.description)
  }

  throw new Error('Timeout : la vidéo prend trop de temps')
}
