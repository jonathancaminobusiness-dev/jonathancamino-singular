import { describe, it, expect } from 'vitest'
import { checkRate, recordFailure, clearFailures, clientIp } from '../api/_lib/ratelimit.js'

describe('rate limiter de login', () => {
  it('permite enquanto abaixo do limite e bloqueia ao atingir', () => {
    const ip = '1.2.3.4'; const now = 1_000_000; const opt = { max: 3, windowMs: 1000 }
    expect(checkRate(ip, { ...opt, now })).toBe(true)
    recordFailure(ip, { ...opt, now })
    recordFailure(ip, { ...opt, now })
    expect(checkRate(ip, { ...opt, now })).toBe(true) // 2 falhas < 3
    recordFailure(ip, { ...opt, now })
    expect(checkRate(ip, { ...opt, now })).toBe(false) // 3 falhas → bloqueado
  })

  it('login bem-sucedido limpa o contador', () => {
    const ip = '5.6.7.8'; const now = 2_000_000; const opt = { max: 2, windowMs: 1000 }
    recordFailure(ip, { ...opt, now })
    recordFailure(ip, { ...opt, now })
    expect(checkRate(ip, { ...opt, now })).toBe(false)
    clearFailures(ip)
    expect(checkRate(ip, { ...opt, now })).toBe(true)
  })

  it('falhas fora da janela não contam mais', () => {
    const ip = '9.9.9.9'; const opt = { max: 1, windowMs: 1000 }
    recordFailure(ip, { ...opt, now: 3_000_000 })
    expect(checkRate(ip, { ...opt, now: 3_000_000 })).toBe(false)
    expect(checkRate(ip, { ...opt, now: 3_000_000 + 2000 })).toBe(true) // janela passou
  })

  it('sem IP nunca bloqueia (não trava admin legítimo)', () => {
    expect(checkRate('', { max: 1, now: 1 })).toBe(true)
    recordFailure('', { now: 1 })
    expect(checkRate('', { max: 1, now: 1 })).toBe(true)
  })

  it('clientIp lê x-forwarded-for (primeiro IP) e cai pro socket', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': '203.0.113.5, 70.41.3.18' } })).toBe('203.0.113.5')
    expect(clientIp({ headers: {}, socket: { remoteAddress: '198.51.100.2' } })).toBe('198.51.100.2')
    expect(clientIp({ headers: {} })).toBe('')
  })
})
