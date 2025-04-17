import {SecureStorage} from "@/utils/crypto/secureStorage.ts";

export class SecureStorageManager {
  private storage: SecureStorage

  constructor(passphrase: string) {
    this.storage = new SecureStorage(passphrase)
  }

  async retrievePeerKeys() {
    try {
      return await this.storage.retrieveSecureData('peer-keys');
    } catch (e) {
      return null
    }
  }

  async storePeerKeys(peerKeys: string) {
    await this.storage.storeSecureData('peer-keys', peerKeys)
  }
}