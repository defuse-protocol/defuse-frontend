export const config = {
  dbName: "intents_sdk.gift_maker_gifts",
  storeName: "gifts",
  version: 1,
  transactionModes: {
    readonly: "readonly" as const,
    readwrite: "readwrite" as const,
  },
  handleRequest: <T>(request: IDBRequest<T>) => {
    return new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  },
} as const

export const indexedDBStorage = {
  openDB: () => {
    const request = indexedDB.open(config.dbName, config.version)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(config.storeName)) {
        db.createObjectStore(config.storeName)
      }
    }
    return config.handleRequest(request)
  },

  getItem: async (name: string) => {
    const db = await indexedDBStorage.openDB()
    const transaction = db.transaction(
      config.storeName,
      config.transactionModes.readonly
    )
    const store = transaction.objectStore(config.storeName)
    return config.handleRequest(store.get(name))
  },

  setItem: async (name: string, value: string) => {
    const db = await indexedDBStorage.openDB()
    const transaction = db.transaction(
      config.storeName,
      config.transactionModes.readwrite
    )
    const store = transaction.objectStore(config.storeName)
    return config.handleRequest(store.put(value, name))
  },

  removeItem: async (name: string) => {
    const db = await indexedDBStorage.openDB()
    const transaction = db.transaction(
      config.storeName,
      config.transactionModes.readwrite
    )
    const store = transaction.objectStore(config.storeName)
    return config.handleRequest(store.delete(name))
  },
}
