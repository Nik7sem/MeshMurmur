import {arrayBufferToBase64, base64ToArrayBuffer, generateNonce} from "@/utils/crypto/helpers.ts";
import {EncryptionResult} from "@/utils/crypto/types.ts";

export class AesDerivedKeyManager {
  private readonly pbkdf2Iterations = 600000
  private readonly saltLength = 32  // bytes
  private readonly ivLength = 16    // bytes

  constructor(private readonly passphrase: string) {
  }

  /**
   * Derives a cryptographic key from a passphrase using PBKDF2
   */
  private async deriveKey(
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passphraseKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(this.passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.pbkdf2Iterations,
        hash: 'SHA-384'
      },
      passphraseKey,
      {name: 'AES-GCM', length: 256},
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Encrypts plaintext using AES-GCM
   * @returns Object containing salt, IV, and ciphertext (all base64 encoded)
   */
  async encrypt(
    plaintext: string,
  ): Promise<EncryptionResult> {
    // Generate random salt and IV
    const salt = generateNonce(this.saltLength)
    const iv = generateNonce(this.ivLength)

    // Derive encryption key
    const key = await this.deriveKey(salt)

    // Perform encryption
    const encoder = new TextEncoder()
    const ciphertext = await window.crypto.subtle.encrypt(
      {name: 'AES-GCM', iv},
      key,
      encoder.encode(plaintext)
    )

    return {
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(ciphertext)
    }
  }

  /**
   * Decrypts ciphertext using AES-GCM
   */
  async decrypt(
    encrypted: EncryptionResult,
  ): Promise<string> {
    // Convert base64 strings to ArrayBuffers
    const salt = base64ToArrayBuffer(encrypted.salt)
    const iv = base64ToArrayBuffer(encrypted.iv)
    const ciphertext = base64ToArrayBuffer(encrypted.ciphertext)

    // Derive decryption key
    const key = await this.deriveKey(new Uint8Array(salt))

    // Perform decryption
    const decrypted = await window.crypto.subtle.decrypt(
      {name: 'AES-GCM', iv},
      key,
      ciphertext
    )

    return new TextDecoder().decode(decrypted)
  }
}