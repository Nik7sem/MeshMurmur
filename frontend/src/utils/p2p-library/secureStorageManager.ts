import {SecureStorage} from "@/utils/crypto/secureStorage.ts";

export class SecureStorageManager {
  private storage: SecureStorage
  static keysRetrieved = false;

  constructor(passphrase: string) {
    this.storage = new SecureStorage(passphrase)
  }

  async retrievePeerKeys() {
    if (SecureStorageManager.keysRetrieved) {
      console.error('Trying to retrieve peerKeys again!')
      return null
    }

    try {
      SecureStorageManager.keysRetrieved = true;
      return await this.storage.retrieveSecureData('peer-keys');
    } catch (e) {
      return null
    }
  }

  async storePeerKeys(peerKeys: string) {
    await this.storage.storeSecureData('peer-keys', peerKeys)
  }

  async retrieveUserData() {
    try {
      return await this.storage.retrieveSecureData('user-data')
    } catch (e) {
      return null
    }
  }

  async storeUserData(userData: string) {
    await this.storage.storeSecureData('user-data', userData)
  }
}