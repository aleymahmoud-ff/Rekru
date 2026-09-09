import { randomInt } from 'crypto'

/**
 * Character set used for generated passwords.
 * Visually ambiguous characters (0/O, 1/l/I) are excluded so a password can be
 * read aloud or copied by hand without transcription errors.
 */
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%*?-_'
const ALL = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS

export const GENERATED_PASSWORD_LENGTH = 14

/** Lower bound: four guaranteed character classes plus filler. */
const MIN_LENGTH = 8
/** Upper bound: bcrypt ignores input beyond 72 bytes, so longer is pointless. */
const MAX_LENGTH = 72

/**
 * Generates a cryptographically secure random password.
 *
 * Uses `crypto.randomInt` (rejection sampling) rather than `Math.random` so the
 * output is unbiased and unpredictable. The result always contains at least one
 * lowercase letter, uppercase letter, digit, and symbol. Guaranteeing those
 * four classes costs a little entropy versus a uniform draw over the full
 * charset (~76 bits vs ~85 at the default length) — immaterial here, and worth
 * it so the password satisfies any downstream complexity rule.
 *
 * `length` is clamped to [8, 72].
 *
 * Server-side only — `crypto.randomInt` is a Node API.
 */
export function generatePassword(length: number = GENERATED_PASSWORD_LENGTH): string {
  // Clamped at both ends: anything shorter can't satisfy the complexity
  // requirement below, and anything longer is discarded by bcrypt anyway.
  const size = Math.min(Math.max(length, MIN_LENGTH), MAX_LENGTH)

  const chars = [
    LOWERCASE[randomInt(LOWERCASE.length)],
    UPPERCASE[randomInt(UPPERCASE.length)],
    DIGITS[randomInt(DIGITS.length)],
    SYMBOLS[randomInt(SYMBOLS.length)],
  ]

  for (let i = chars.length; i < size; i++) {
    chars.push(ALL[randomInt(ALL.length)])
  }

  // Fisher-Yates shuffle so the guaranteed characters aren't always in front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}
