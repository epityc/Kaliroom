// Replicate — IDM-VTON virtual try-on
export async function runTryOn(humanImageBase64, garmentImageBase64) {
  const token = import.meta.env.VITE_REPLICATE_API_TOKEN
  if (!token) throw new Error('VITE_REPLICATE_API_TOKEN manquant dans .env')

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4',
      input: {
        human_img: humanImageBase64,
        garm_img: garmentImageBase64,
        garment_des: 'vêtement',
        is_checked: true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42,
      },
    }),
  })

  if (!res.ok) throw new Error(`Replicate error ${res.status}`)
  let prediction = await res.json()

  // Poll until done
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    prediction = await poll.json()
  }

  if (prediction.status === 'failed') throw new Error('Try-on échoué : ' + prediction.error)
  return prediction.output // URL de l'image résultat
}
