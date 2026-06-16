async function call(url, opts = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
  if (res.status === 401) throw new Error('NOT_AUTH')
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || ('erro ' + res.status))
  return res.json()
}

export function fetchContent() { return call('/api/content') }
export function login(password) { return call('/api/login', { method: 'POST', body: JSON.stringify({ password }) }) }
export function logout() { return call('/api/logout', { method: 'POST' }) }
export function save(content) { return call('/api/save', { method: 'POST', body: JSON.stringify({ content }) }) }
export function uploadImage(filename, dataBase64) {
  return call('/api/upload', { method: 'POST', body: JSON.stringify({ filename, dataBase64 }) })
}
