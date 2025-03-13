export class IndexedDBManager {
  private dbVersion: number = 1

  constructor(
    private readonly dbName: string = 'SecureStore',
    private readonly storeName: string = 'EncryptedData') {
  }

  /**
   * Initializes the database connection
   */
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {keyPath: 'key'})
        }
      }

      request.onsuccess = () => resolve(request.result as IDBDatabase)
      request.onerror = () => reject(new Error('IndexedDB initialization failed'))
    })
  }

  /**
   * Stores encrypted data in IndexedDB
   * @param key - Unique identifier for the data
   * @param data - Encrypted data payload
   */
  async storeData(key: string, data: any): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)
      const request = store.put({key, ...data})

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Data storage failed'))
    })
  }

  /**
   * Retrieves encrypted data from IndexedDB
   * @param key - Unique identifier for the data
   */
  async retrieveData(key: string): Promise<any> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly')
      const store = tx.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(new Error('Data retrieval failed'))
    })
  }

  /**
   * Deletes encrypted data from IndexedDB
   * @param key - Unique identifier for the data
   */
  async deleteData(key: string) {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve('success')
      request.onerror = () => reject(new Error('Data deletion failed'))
    })
  }

  async deleteDB() {
    indexedDB.deleteDatabase('SecureStore')
  }
}
