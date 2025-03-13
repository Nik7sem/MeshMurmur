import {IndexedDBManager} from "@/utils/IndexedDBManager.ts";
import {AESDerivedKeyManager} from "@/utils/crypto/AESDerivedKeyManager.ts";
import {EncryptionResult} from "@/utils/crypto/types.ts";

export class SecureStorage {
  private db: IndexedDBManager
  private crypto: AESDerivedKeyManager

  constructor(private passphrase: string) {
    this.db = new IndexedDBManager()
    this.crypto = new AESDerivedKeyManager(passphrase)
  }

  /**
   * Stores encrypted data in IndexedDB
   * @param key - Unique storage identifier
   * @param plaintext - Data to encrypt and store
   * @param passphrase - Encryption passphrase
   */
  async storeSecureData(
    key: string,
    plaintext: string,
  ) {
    const encrypted = await this.crypto.encrypt(plaintext)
    await this.db.storeData(key, {
      encrypted,
      created: Date.now()
    })
  }

  /**
   * Retrieves and decrypts data from IndexedDB
   * @param key - Unique storage identifier
   * @param passphrase - Decryption passphrase
   */
  async retrieveSecureData(
    key: string,
  ): Promise<string | null> {
    const data = await this.db.retrieveData(key)
    if (!data || !('encrypted' in data)) {
      return null
    }
    return this.crypto.decrypt(data.encrypted as EncryptionResult)
  }

  /**
   * Removes encrypted data from IndexedDB
   * @param key - Unique storage identifier
   */
  async deleteSecureData(key: string): Promise<void> {
    await this.db.deleteData(key)
  }

  async deleteDB() {
    await this.db.deleteDB()
  }
}