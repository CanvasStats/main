import type { Achievement } from "../models";

const DB_NAME = 'pwa_stats_db';
const DB_VERSION = 14;
const SETTINGS_STORE = 'settings';
const ACHIEVEMENTS_STORE = 'achievements';
const CLAIMED_KEY = 'claimed_user';

/**
 * Initializes and opens the IndexedDB connection with schema migration support.
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db: IDBDatabase = request.result;
      const oldVersion = event.oldVersion;
      const newVersion = event.newVersion;

      console.log(`Database upgrade structural check: V${oldVersion} -> V${newVersion}`);

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }

      if (!db.objectStoreNames.contains(ACHIEVEMENTS_STORE)) {
        db.createObjectStore(ACHIEVEMENTS_STORE, { keyPath: 'id' });
      }

      const transaction = request.transaction;
      if (transaction && oldVersion > 0) {
        const settingsStore = transaction.objectStore(SETTINGS_STORE);
        settingsStore.put(oldVersion, 'last_known_version');
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      
      db.onversionchange = () => {
        db.close();
        window.dispatchEvent(new Event('db-version-changed'));
      };

      resolve(db);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves the claimed username to both IndexedDB and LocalStorage for dual-layer fallback protection.
 */
export async function setClaimedUser(username: string): Promise<void> {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction: IDBTransaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store: IDBObjectStore = transaction.objectStore(SETTINGS_STORE);
      const request: IDBRequest = store.put(username, CLAIMED_KEY);

      request.onsuccess = () => {
        localStorage.setItem(CLAIMED_KEY, username);
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    // Immediate fallback write if browser strictly blocks IndexedDB
    localStorage.setItem(CLAIMED_KEY, username);
    console.warn("IndexedDB execution failed, falling back to LocalStorage syncing exclusively:", error);
  }
}

/**
 * Retrieves the currently claimed user from IndexedDB, automatically healing from LocalStorage if evicted.
 */
export async function getClaimedUser(): Promise<string | null> {
  console.log("getting claimed user");
  try {
    const db = await openDB();
    
    return new Promise((resolve) => {
      const transaction: IDBTransaction = db.transaction(SETTINGS_STORE, 'readonly');
      const store: IDBObjectStore = transaction.objectStore(SETTINGS_STORE);
      const request: IDBRequest<string | undefined> = store.get(CLAIMED_KEY);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result);
        } else {
          // Check backup layer if browser ran an automated weekly data cleanup
          const backup = localStorage.getItem(CLAIMED_KEY);
          if (backup) {
            setClaimedUser(backup);
          }
          resolve(backup);
        }
      };
      
      request.onerror = () => {
        resolve(localStorage.getItem(CLAIMED_KEY));
      };
    });
  } catch (error) {
    console.error("Failed to access standard database layers, fetching backup reference:", error);
    return localStorage.getItem(CLAIMED_KEY);
  }
}

/**
 * Checks the state of local achievements and cross-references the database version.
 * @returns 'good' if data exists and version matches
 *          'update' if data exists but a database upgrade occurred
 *          'none' if no achievement records exist
 */
export async function checkForExistingAchievements(): Promise<'good' | 'update' | 'none'> {
  try {
    const db = await openDB();
    
    if (!db.objectStoreNames.contains(ACHIEVEMENTS_STORE) || !db.objectStoreNames.contains(SETTINGS_STORE)) {
      return 'none';
    }

    return new Promise((resolve) => {
      const tx = db.transaction([ACHIEVEMENTS_STORE, SETTINGS_STORE], 'readonly');
      const achievementsStore = tx.objectStore(ACHIEVEMENTS_STORE);
      const settingsStore = tx.objectStore(SETTINGS_STORE);

      const versionReq = settingsStore.get('last_known_version');
      const countReq = achievementsStore.count();

      tx.oncomplete = () => {
        const lastKnownVersion = versionReq.result;
        const recordCount = countReq.result || 0;

        // 1. No data exists at all
        if (recordCount === 0) {
          resolve('none');
        } 
        // 2. Data exists, but the user is on an older version of the schema
        else if (lastKnownVersion !== DB_VERSION) {
          resolve('update');
        } 
        // 3. Data exists and everything matches perfectly
        else {
          resolve('good');
        }
      };

      tx.onerror = () => {
        resolve('none');
      };
    });
  } catch (error) {
    console.error("Error reading database states:", error);
    return 'none';
  }
}

/**
 * Saves or updates an array of achievements inside a single atomic transaction.
 */
export async function addAchievementsToDB(achievements: Achievement[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([ACHIEVEMENTS_STORE, SETTINGS_STORE], 'readwrite');
    const achStore = tx.objectStore(ACHIEVEMENTS_STORE);
    const settingsStore = tx.objectStore(SETTINGS_STORE);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    for (const achievement of achievements) {
      const structuredRecord: Achievement & { id: string } = {
        ...achievement,
        id: achievement.name
      };
      achStore.put(structuredRecord);
    }

    settingsStore.put(DB_VERSION, 'last_known_version');
  });
}

/**
 * Retrieves all locally cached achievements from the store to populate the UI.
 */
export async function getAllAchievementsFromDB(): Promise<Achievement[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ACHIEVEMENTS_STORE, 'readonly');
      const store = tx.objectStore(ACHIEVEMENTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to fetch achievements from cache store layer:", error);
    return [];
  }
}

/**
 * Completely purges cached achievements when a user changes accounts or logs out.
 */
export async function clearAchievementsFromDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ACHIEVEMENTS_STORE, 'readwrite');
      const store = tx.objectStore(ACHIEVEMENTS_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to execute clearance operation on local store:", error);
  }
}

/**
 * Deletes a single achievement from the database by its ID (achievement name).
 */
export async function deleteAchievementFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ACHIEVEMENTS_STORE, 'readwrite');
      const store = tx.objectStore(ACHIEVEMENTS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to delete achievement with id "${id}":`, error);
    throw error;
  }
}