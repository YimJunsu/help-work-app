import crypto from 'crypto'

// Encryption algorithm and key
const ALGORITHM = 'aes-256-cbc'
// In production, this should be stored in environment variables or secure key storage
// For this example, we'll use a fixed key derived from the app name
const SECRET_KEY = crypto.scryptSync('help-work-app-secret', 'salt', 32)
const IV_LENGTH = 16

/**
 * Encrypt a password using AES-256-CBC
 * @param password - Plain text password
 * @returns Encrypted password in format: iv:encryptedData
 */
export function encryptPassword(password: string): string {
  if (!password) return ''

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv)

  let encrypted = cipher.update(password, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Return IV and encrypted data separated by ':'
  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a password using AES-256-CBC
 * @param encryptedPassword - Encrypted password in format: iv:encryptedData
 * @returns Decrypted plain text password
 */
export function decryptPassword(encryptedPassword: string): string {
  if (!encryptedPassword) return ''

  try {
    const parts = encryptedPassword.split(':')
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted password format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const encryptedData = parts[1]

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Error decrypting password:', error)
    return ''
  }
}
