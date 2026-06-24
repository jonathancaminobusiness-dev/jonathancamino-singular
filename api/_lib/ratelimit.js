// Rate limiter in-memory best-effort para o endpoint de login.
//
// LIMITAÇÃO: em funções serverless o estado vive só enquanto a instância está
// "quente". Cold starts e múltiplas instâncias concorrentes resetam o contador,
// então isto NÃO é uma garantia distribuída. Mesmo assim, adiciona fricção real
// a brute-force ingênuo (tentativas sequenciais costumam cair na mesma instância
// quente) sem nenhuma dependência externa. Para garantia forte e distribuída,
// trocar por Upstash/Vercel KV (contador por IP com TTL).
//
// Conta apenas FALHAS de login; um login bem-sucedido limpa o contador do IP.

const fails = new Map() // ip -> number[] (timestamps de falha, ms)

function recent(ip, windowMs, now) {
  const arr = (fails.get(ip) || []).filter((t) => now - t < windowMs)
  if (arr.length) fails.set(ip, arr)
  else fails.delete(ip)
  return arr
}

// true se o IP AINDA pode tentar (abaixo do limite de falhas na janela)
export function checkRate(ip, { max = 10, windowMs = 10 * 60 * 1000, now = Date.now() } = {}) {
  if (!ip) return true // sem IP identificável: não bloqueia (evita travar admin legítimo)
  return recent(ip, windowMs, now).length < max
}

export function recordFailure(ip, { windowMs = 10 * 60 * 1000, now = Date.now() } = {}) {
  if (!ip) return
  const arr = recent(ip, windowMs, now)
  arr.push(now)
  fails.set(ip, arr)
  // limpeza oportunista p/ não vazar memória em instâncias muito longevas
  if (fails.size > 5000) {
    for (const [k, v] of fails) if (!v.some((t) => now - t < windowMs)) fails.delete(k)
  }
}

export function clearFailures(ip) {
  if (ip) fails.delete(ip)
}

export function clientIp(req) {
  const fwd = req.headers?.['x-forwarded-for']
  if (fwd) return String(fwd).split(',')[0].trim()
  return req.socket?.remoteAddress || ''
}
