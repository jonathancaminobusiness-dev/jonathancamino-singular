import { hashPassword } from '../api/_lib/auth.js'

const pw = process.argv[2]
if (!pw) { console.error('uso: node scripts/hash-password.mjs <senha>'); process.exit(1) }
console.log(hashPassword(pw))
