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

/**
 * Generates a cryptographically secure random password.
 *
 * Uses `crypto.randomInt` (rejection sampling) rather than `Math.random` so the
 * output is unbiased and unpredictable. The result always contains at least one
 * lowercase letter, uppercase letter, digit, and symbol.
 *
 * Server-side only — `crypto.randomInt` is a Node API.
 */
export function generatePassword(length: number = GENERATED_PASSWORD_LENGTH): string {
  // Four guaranteed characters + filler; anything shorter can't satisfy the
  // complexity requirement below.
  const size = Math.max(length, 8)

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
