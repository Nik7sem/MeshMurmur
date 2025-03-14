// ---------------------- Crypto Helpers ----------------------
import {bytesToNumberBE} from "@noble/curves/abstract/utils";

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function generateNonce(length: number = 16): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(length))
}

// firebase forbiddenChars '.$[]#/'
// abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
// -_~!@*()
// вгдёжзийлнпртуфцчшщъыьэюяВГДЁЖЗИЙЛНПРТУФЦЧШЩЪЫЬЭЮЯ

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const base = BigInt(chars.length)

export function arrayBufferToCustomEncoding(bytes: Uint8Array): string {
  let encoded = ""
  let num = bytesToNumberBE(bytes)

  while (num) {
    encoded += chars[Number(num % base)]
    num /= base
  }

  return encoded.split("").reverse().join("") || "0"
}

export function customEncodingToArrayBuffer(encoded: string): Uint8Array {
  let num = 0n
  for (const char of encoded) {
    num = num * base + BigInt(chars.indexOf(char))
  }

  let hex = num.toString(16)
  hex = hex.length % 2 != 0 ? "0" + hex : hex
  const buffer = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    buffer[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }

  return buffer
}
