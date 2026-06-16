const KEY = 'gsmi_v5'
const SCRIPT_URL = (() => { try { return import.meta.env.VITE_APPS_SCRIPT_URL || null } catch { return null } })()

export async function saveSubmission(data) {
  const all = loadAll()
  const entry = { ...data, timestamp: new Date().toISOString() }
  const idx = all.findIndex(s =>
    s.email === entry.email &&
    s.annee_academique === entry.annee_academique &&
    s.mode === entry.mode
  )
  idx >= 0 ? all[idx] = entry : all.push(entry)
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch {}
  if (SCRIPT_URL) {
    fetch(SCRIPT_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body: JSON.stringify(entry) }).catch(() => {})
  }
  return all
}

export function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export async function loadSubmissions() { return loadAll() }
export function clearAll() { try { localStorage.removeItem(KEY) } catch {} }

// Chercher les 3 modes pour un prof + année
export function findProfData(email, annee) {
  const all = loadAll()
  const find = mode => all.find(s => s.email === email && s.annee_academique === annee && s.mode === mode) || null
  return { prev: find('prevision'), rev: find('revision_s1'), real: find('bilan_annuel') }
}

// Vérifier si les 3 modes sont complétés → déclencher bilan auto
export function isBilanReady(email, annee) {
  const { prev, rev, real } = findProfData(email, annee)
  return !!(prev && rev && real)
}
