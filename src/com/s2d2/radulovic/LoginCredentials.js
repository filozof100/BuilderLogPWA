const KEY_ALIAS = 'radulovic_login_password';
const PASSWORD = 'encrypted_password';
const IV = 'password_iv';
const encode = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const decode = text => Uint8Array.from(atob(text), character => character.charCodeAt(0));

export default class LoginCredentials {
  static lastError = '';
  static async #key() {
    // Prefer a non-extractable CryptoKey. Some WebKit builds cannot clone it into IndexedDB.
    const candidateBytes = crypto.getRandomValues(new Uint8Array(32));
    const candidate = await crypto.subtle.importKey('raw', candidateBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
    const storedKey = await new Promise((resolve, reject) => {
      const request = indexedDB.open('radulovic.keystore', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('keys');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('keys', 'readwrite');
        const keys = transaction.objectStore('keys');
        const stored = keys.get(KEY_ALIAS);
        let key;
        stored.onsuccess = () => {
          key = stored.result ?? candidate;
          if (stored.result) return;
          try {
            try { keys.put(candidate, KEY_ALIAS); }
            catch (error) {
              if (error.name !== 'DataCloneError') throw error;
              // Browser-only fallback; this does not provide Android Keystore protection.
              keys.put(candidateBytes, KEY_ALIAS);
            }
          } catch (error) { transaction.abort(); reject(error); }
        };
        transaction.oncomplete = () => { db.close(); resolve(key); };
        transaction.onabort = () => { db.close(); reject(transaction.error); };
      };
    });
    return storedKey instanceof CryptoKey ? storedKey
      : crypto.subtle.importKey('raw', storedKey, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }

  static async save(preferences, username, password, rememberMe) {
    LoginCredentials.lastError = '';
    let stage = 'crypto';
    try {
      if (!globalThis.crypto?.subtle) {
        LoginCredentials.lastError = 'Web Crypto unavailable; secure=' + globalThis.isSecureContext + '; protocol=' + globalThis.location?.protocol;
        LoginCredentials.clear(preferences);
        return false;
      }
      const iv = crypto.getRandomValues(new Uint8Array(12));
      stage = 'key';
      const key = await LoginCredentials.#key();
      stage = 'encrypt';
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(password));
      stage = 'preferences';
      preferences.edit().putString('username', username)
        .putString(PASSWORD, encode(encrypted)).putString(IV, encode(iv))
        .putBoolean('remember_me', rememberMe).remove('password').apply();
      return true;
    } catch (error) {
      LoginCredentials.lastError = stage + ': ' + (error?.name || 'StorageError') + (error?.message ? ' — ' + error.message : '');
      LoginCredentials.clear(preferences);
      return false;
    }
  }

  static async password(preferences) {
    const encrypted = preferences.getString(PASSWORD, null);
    if (encrypted == null) {
      const legacy = preferences.getString('password', null);
      if (legacy == null) return '';
      return await LoginCredentials.save(preferences, preferences.getString('username', ''), legacy,
        preferences.getBoolean('remember_me', false)) ? legacy : '';
    }
    try {
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(preferences.getString(IV)) },
        await LoginCredentials.#key(), decode(encrypted));
      return new TextDecoder().decode(decrypted);
    } catch {
      LoginCredentials.clear(preferences);
      return '';
    }
  }

  static clear(preferences) {
    try {
      preferences.edit().remove('username').remove('password').remove(PASSWORD).remove(IV)
        .putBoolean('remember_me', false).apply();
    } catch { /* Browser storage may be unavailable. */ }
  }
}
