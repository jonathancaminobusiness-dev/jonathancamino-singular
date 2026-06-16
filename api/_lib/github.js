const API = 'https://api.github.com'

function repo() {
  const r = process.env.GITHUB_REPO
  if (!r) throw new Error('GITHUB_REPO ausente')
  return r
}
function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'singular-admin',
  }
}

export async function getFileSha(path) {
  const res = await fetch(`${API}/repos/${repo()}/contents/${path}`, { headers: headers() })
  if (!res.ok) { if (res.status === 404) return null; throw new Error(`github get ${res.status}`) }
  const data = await res.json()
  return data.sha || null
}

export async function putFile(path, content, message) {
  const sha = await getFileSha(path)
  const base64 = Buffer.isBuffer(content) ? content.toString('base64') : Buffer.from(content).toString('base64')
  const body = { message, content: base64 }
  if (sha) body.sha = sha
  const res = await fetch(`${API}/repos/${repo()}/contents/${path}`, {
    method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`github put ${res.status}: ${await res.text()}`)
  return res.json()
}
