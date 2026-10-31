// Browser equivalent of the small SharedPreferences API used by this app.
export default function getSharedPreferences(name) {
  function read() {
    try { return JSON.parse(localStorage.getItem(name) ?? '{}'); }
    catch { return {}; }
  }
  return {
    getString(key, fallback = null) { return read()[key] ?? fallback; },
    getBoolean(key, fallback = false) { return read()[key] ?? fallback; },
    edit() {
      const values = read();
      return {
        putString(key, value) { values[key] = value; return this; },
        putBoolean(key, value) { values[key] = value; return this; },
        remove(key) { delete values[key]; return this; },
        apply() { localStorage.setItem(name, JSON.stringify(values)); },
      };
    },
  };
}
