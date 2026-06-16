// ══════════════════════════════════════════════════════════════════════════
// GSMI — Geology and Sustainable Mining Institute / UM6P
// Carnet du Chercheur — Application web finale v6
// ══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { C, GSMI_FULL_NAME, GSMI_AXES, ACADEMIC_YEARS } from './constants.js'
import { getSectionsForMode, DETAIL_TABLES } from './fields.js'
import { saveSubmission, loadAll, loadSubmissions, clearAll, findProfData, isBilanReady } from './storage.js'
import { generateBilanExcel } from './bilan.js'

const ADMIN_CODE = (() => { try { return import.meta.env.VITE_ADMIN_CODE || 'GSMI2025' } catch { return 'GSMI2025' } })()

// ══════════════════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ══════════════════════════════════════════════════════════════════════════
function Toast({ t, bottom = 28 }) {
  return (
    <div style={{ position:'fixed', bottom, left:'50%', transform:'translateX(-50%)',
      background: t.type==='error' ? C.red : t.type==='info' ? C.blue : t.type==='warning' ? C.amber : C.navy,
      color:'#fff', padding:'12px 24px', borderRadius:10, fontSize:13, fontWeight:500,
      zIndex:9999, maxWidth:'90vw', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,.22)' }}>
      {t.msg}
    </div>
  )
}

function DoiVerifier({ value, onChange }) {
  const [lines, setLines] = useState(value ? value.split('\n').filter(Boolean) : [''])
  const [st, setSt]       = useState({})
  const [busy, setBusy]   = useState({})

  const update = (i, v) => {
    const n = [...lines]; n[i] = v; setLines(n); onChange(n.filter(Boolean).join('\n'))
  }
  const remove = i => {
    const n = lines.filter((_,j) => j!==i); const nn = n.length ? n : ['']
    setLines(nn); onChange(nn.filter(Boolean).join('\n'))
    setSt(p => { const q={...p}; delete q[i]; return q })
  }
  const verify = async (i, doi) => {
    if (!doi) return
    const clean = doi.trim().replace(/^https?:\/\/doi\.org\//i, '')
    if (!/^10\.\d{4,}\//.test(clean)) {
      setSt(p => ({...p, [i]: { ok:false, msg:'❌ Format invalide — attendu : 10.XXXX/XXXXX' }})); return
    }
    setBusy(p => ({...p, [i]: true}))
    setSt(p => ({...p, [i]: { ok:null, msg:'🔍 Vérification en cours…' }}))
    try {
      const r = await fetch(`https://doi.org/api/handles/${encodeURIComponent(clean)}`)
      const d = await r.json()
      setSt(p => ({...p, [i]: d.responseCode===1
        ? { ok:true,  msg:'✅ DOI vérifié — publication confirmée sur doi.org' }
        : { ok:false, msg:'⚠️ DOI non trouvé sur doi.org — vérifier la valeur exacte' }
      }))
    } catch { setSt(p => ({...p, [i]: { ok:null, msg:'🌐 Hors-ligne — format DOI valide' }})) }
    setBusy(p => ({...p, [i]: false}))
  }

  return (
    <div>
      {lines.map((doi, i) => (
        <div key={i} style={{ marginBottom:8 }}>
          <div style={{ display:'flex', gap:6 }}>
            <input type="text" value={doi}
              onChange={e => update(i, e.target.value)}
              onBlur={e => verify(i, e.target.value)}
              placeholder="10.XXXX/XXXXX"
              style={{ flex:1, padding:'9px 12px', fontFamily:'monospace', fontSize:13, color:C.gd,
                       border:`1.5px solid ${st[i]?.ok===true ? C.green : st[i]?.ok===false ? C.red : C.g3}`,
                       borderRadius:8, outline:'none', background:'#fff' }} />
            <button onClick={() => verify(i, doi)} disabled={busy[i]}
              style={{ padding:'9px 12px', background:C.blue, color:'#fff', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
              {busy[i] ? '…' : '🔍 Vérifier'}
            </button>
            {lines.length > 1 && (
              <button onClick={() => remove(i)}
                style={{ padding:'9px 10px', background:'transparent', color:C.red, border:`1px solid ${C.g3}`, borderRadius:8, cursor:'pointer' }}>✕</button>
            )}
          </div>
          {st[i] && <p style={{ fontSize:12, margin:'3px 0 0', color:st[i].ok===true?C.green:st[i].ok===false?C.red:C.amber }}>{st[i].msg}</p>}
        </div>
      ))}
      <button onClick={() => setLines([...lines, ''])}
        style={{ marginTop:4, width:'100%', padding:'7px', background:'transparent', color:C.blue,
                 border:`1px dashed ${C.blue}`, borderRadius:8, fontSize:13, cursor:'pointer' }}>
        + Ajouter un DOI
      </button>
    </div>
  )
}

function Field({ f, form, onChange, errors }) {
  const val = form[f.id] ?? ''
  const err = errors[f.id]
  const [focused, setFoc] = useState(false)

  const baseStyle = {
    width:'100%', padding:'10px 12px', outline:'none', fontFamily:'inherit', boxSizing:'border-box',
    border:`1.5px solid ${err ? C.red : focused ? C.blue : C.g3}`, borderRadius:8,
    fontSize:14, color:C.gd, background:'#fff', transition:'border-color .15s',
    boxShadow: focused ? `0 0 0 3px ${C.blue}18` : 'none',
  }
  const ch = e => onChange(f.id, e.target.value)

  if (f.type === 'doi') return (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.gd, marginBottom:5 }}>{f.label}</label>
      {f.hint && <p style={{ fontSize:12, color:C.gt, margin:'0 0 6px', lineHeight:1.4 }}>{f.hint}</p>}
      <DoiVerifier value={val} onChange={v => onChange(f.id, v)} />
      {err && <p style={{ fontSize:12, color:C.red, margin:'4px 0 0' }}>⚠ {err}</p>}
    </div>
  )

  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.gd, marginBottom:5 }}>
        {f.label}{f.required && <span style={{ color:C.red, marginLeft:3 }}>*</span>}
      </label>
      {f.hint && <p style={{ fontSize:12, color:C.gt, margin:'0 0 5px', lineHeight:1.4 }}>{f.hint}</p>}
      {f.type === 'textarea'
        ? <textarea value={val} onChange={ch} placeholder={f.placeholder||''}
            onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
            style={{ ...baseStyle, minHeight:76, resize:'vertical', lineHeight:1.5 }} />
        : f.type === 'select'
        ? <select value={val} onChange={ch} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} style={{ ...baseStyle, cursor:'pointer' }}>
            <option value="">— Sélectionner —</option>
            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        : <input type={f.type === 'number' ? 'number' : f.type} value={val} onChange={ch}
            placeholder={f.placeholder||''} min={f.min} max={f.max}
            onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} style={baseStyle} />
      }
      {err && <p style={{ fontSize:12, color:C.red, margin:'4px 0 0' }}>⚠ {err}</p>}
    </div>
  )
}

function DetailTable({ tbl, rows, onChange }) {
  const add = () => onChange([...rows, {}])
  const del = i => onChange(rows.filter((_,j)=>j!==i))
  const set = (i,id,v) => { const n=[...rows]; n[i]={...n[i],[id]:v}; onChange(n) }

  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <h4 style={{ margin:0, fontSize:14, fontWeight:700, color:tbl.color }}>{tbl.icon} {tbl.title}</h4>
          {tbl.hint && <p style={{ margin:'3px 0 0', fontSize:11, color:C.gt }}>{tbl.hint}</p>}
        </div>
        <button onClick={add} style={{ padding:'8px 14px', background:tbl.color, color:'#fff', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
          + Ligne
        </button>
      </div>

      {rows.length === 0
        ? <div style={{ border:`1.5px dashed ${C.g3}`, borderRadius:10, padding:'22px', textAlign:'center', color:C.gt, fontSize:13 }}>
            Cliquer "+ Ligne" pour saisir vos réalisations
          </div>
        : <div style={{ overflowX:'auto', borderRadius:10, border:`1px solid ${C.g3}` }}>
            <table style={{ borderCollapse:'collapse', fontSize:12, width:'100%', minWidth:'max-content' }}>
              <thead>
                <tr style={{ background:tbl.color }}>
                  {tbl.cols.map(c => (
                    <th key={c.id} style={{ padding:'8px 10px', color:'#fff', fontWeight:600, whiteSpace:'nowrap', minWidth:c.w, textAlign:'left', fontSize:11 }}>
                      {c.label}{c.required&&<span style={{color:C.gold,marginLeft:2}}>*</span>}
                    </th>
                  ))}
                  <th style={{ padding:'8px 8px', color:'#fff', width:30 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row,i) => (
                  <tr key={i} style={{ borderBottom:`0.5px solid ${C.g3}`, background:i%2===0?'#fff':C.g1 }}>
                    {tbl.cols.map(c => (
                      <td key={c.id} style={{ padding:'5px 7px', minWidth:c.w }}>
                        {c.type === 'doi'
                          ? <DoiVerifier value={row[c.id]||''} onChange={v=>set(i,c.id,v)}/>
                          : c.type === 'select'
                          ? <select value={row[c.id]||''} onChange={e=>set(i,c.id,e.target.value)}
                              style={{ width:'100%', padding:'6px 8px', border:`1px solid ${C.g3}`, borderRadius:6, fontSize:12, color:C.gd, background:'#fff', outline:'none' }}>
                              <option value="">—</option>
                              {c.options.map(o=><option key={o} value={o}>{o}</option>)}
                            </select>
                          : <input type={c.type==='number'?'number':'text'}
                              value={row[c.id]===undefined?'':row[c.id]}
                              onChange={e=>set(i,c.id,c.type==='number'?+e.target.value:e.target.value)}
                              min={c.min} max={c.max}
                              style={{ width:'100%', padding:'6px 8px', border:`1px solid ${C.g3}`, borderRadius:6, fontSize:12, color:C.gd, background:'transparent', outline:'none', boxSizing:'border-box' }}/>
                        }
                      </td>
                    ))}
                    <td style={{ padding:'5px 6px', textAlign:'center' }}>
                      <button onClick={()=>del(i)} style={{ background:'transparent', border:'none', color:C.red, cursor:'pointer', fontSize:15, padding:'2px 5px' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }

      {rows.length > 0 && (
        <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:8 }}>
          {tbl.aggregates.map(agg => (
            <div key={agg.k} style={{ background:tbl.color+'18', border:`1px solid ${tbl.color}35`, borderRadius:8, padding:'5px 12px' }}>
              <span style={{ fontSize:11, color:C.gt }}>{agg.k}: </span>
              <strong style={{ fontSize:13, color:tbl.color }}>{agg.fn(rows)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// BILAN VIEWER — affiché automatiquement quand les 3 modes sont complétés
// ══════════════════════════════════════════════════════════════════════════
import { buildKPIs } from './bilan.js'

function BilanViewer({ prev, rev, real, details, onDownload, onClose }) {
  const kpis = buildKPIs(prev, rev, real, details)
  const nomProf = prev?.nom || real?.nom || '—'
  const annee   = prev?.annee_academique || real?.annee_academique || '—'
  const grade   = prev?.grade || real?.grade || '—'
  const axe     = prev?.axe_recherche || real?.axe_recherche || '—'

  const secColors = {
    '🔬 PRODUCTION SCIENTIFIQUE': C.teal,
    '💰 PROJETS DE RECHERCHE':    C.green,
    '🌍 RAYONNEMENT & VALORISATION': C.violet,
    '🎓 FORMATION & ENCADREMENT': C.blue,
    '💼 PRESTATIONS DE SERVICE':  C.orange,
  }

  const ecartChip = (v) => {
    if (v === '—' || v === null || v === undefined || isNaN(+v)) return <span style={{color:C.gt}}>—</span>
    const n = +v
    return <span style={{fontWeight:700, color:n>=0?C.green:C.red}}>{n>=0?'+':''}{n}</span>
  }

  const statusChip = (v) => {
    if (!v || v==='—') return <span style={{color:C.gt}}>—</span>
    const col = v.includes('✅')?C.green:v.includes('🟡')?C.amber:v.includes('🔴')?C.red:C.gt
    return <span style={{background:col+'18',color:col,padding:'2px 9px',borderRadius:10,fontSize:11,fontWeight:600}}>{v}</span>
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:1000, overflowY:'auto', padding:'20px 16px' }}>
      <div style={{ maxWidth:960, margin:'0 auto', background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
        {/* Header */}
        <div style={{ background:C.navy, padding:'22px 28px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
          <div>
            <p style={{ color:C.gold, fontSize:11, letterSpacing:'.12em', textTransform:'uppercase', margin:'0 0 6px', fontWeight:600 }}>
              GSMI / UM6P — Bilan Annuel Automatique
            </p>
            <h2 style={{ color:'#fff', fontSize:22, fontWeight:700, margin:'0 0 4px' }}>{nomProf}</h2>
            <p style={{ color:'#8899BB', fontSize:13, margin:0 }}>{grade} · {axe} · Année {annee}</p>
          </div>
          <div style={{ display:'flex', gap:10, flexShrink:0 }}>
            <button onClick={onDownload}
              style={{ background:C.green, color:'#fff', border:'none', borderRadius:8, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              ⬇ Excel
            </button>
            <button onClick={onClose}
              style={{ background:'transparent', color:'#8899BB', border:'1.5px solid #2D3F55', borderRadius:8, padding:'10px 14px', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              ✕ Fermer
            </button>
          </div>
        </div>

        {/* Légende */}
        <div style={{ background:'#F0F7FF', padding:'10px 28px', display:'flex', flexWrap:'wrap', gap:16, fontSize:11, color:C.blue, borderBottom:`1px solid ${C.g3}` }}>
          <span><strong>A</strong> = Pré
            sé S1 (mi-année)</span>
          <span><strong>C</strong> = Réalisé (bilan annuel)</span>
          <span><strong>Écart 1</strong> = C − A (vs Objectif initial)</span>
          <span><strong>Écart 2</strong> = C − B (vs Révision S1)</span>
          <span>★ = KPI calculé auto</span>
        </div>

        {/* Table KPI */}
        <div style={{ padding:'0', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:C.navy }}>
                {['Indicateur KPI','A — Prévu','B — Révisé S1','C — Réalisé','Écart C−A','Écart C−B','Statut'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', color:'#fff', fontWeight:600, textAlign:h==='Indicateur KPI'?'left':'center', fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kpis.map((row, i) => {
                if (row.header) {
                  const col = Object.entries(secColors).find(([k]) => row.section?.includes(k.split(' ')[1]))?.[1] || C.navy
                  const secCol = Object.entries(secColors).find(([k]) => row.section === k)
                  const sc = secCol ? secCol[1] : C.navy
                  return (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding:'11px 14px', background:sc, color:'#fff', fontWeight:700, fontSize:13 }}>
                        {row.section}
                      </td>
                    </tr>
                  )
                }
                const isComp = row.computed
                const isInfo = row.info
                const bg = isComp ? '#FFF8E6' : isInfo ? '#EFF6FF' : i%2===0?C.g1:'#fff'
                const fgLabel = isComp ? C.orange : isInfo ? C.blue : C.gd
                return (
                  <tr key={i} style={{ borderBottom:`0.5px solid ${C.g3}` }}>
                    <td style={{ padding:'10px 14px', background:bg, color:fgLabel, fontWeight:isComp||isInfo?600:400 }}>
                      {row.label}
                      {isComp && <span style={{ fontSize:10, color:C.orange, marginLeft:5 }}>★</span>}
                      {isInfo && <span style={{ fontSize:10, color:C.blue, marginLeft:5 }}>ℹ</span>}
                    </td>
                    {[row.A, row.B, row.C].map((v,ci) => (
                      <td key={ci} style={{ padding:'10px 14px', background:bg, textAlign:'center',
                        color:[C.blue,C.teal,C.violet][ci], fontWeight:600 }}>
                        {v === '—' || v === null || v === undefined ? <span style={{color:C.gt}}>—</span> : v}
                      </td>
                    ))}
                    <td style={{ padding:'10px 14px', background:bg, textAlign:'center' }}>{ecartChip(row.ecart1)}</td>
                    <td style={{ padding:'10px 14px', background:bg, textAlign:'center' }}>{ecartChip(row.ecart2)}</td>
                    <td style={{ padding:'10px 14px', background:bg, textAlign:'center' }}>{statusChip(row.statut)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Commentaires qualitatifs */}
        {(real?.faits_marquants || real?.justif_ecarts || real?.perspectives) && (
          <div style={{ padding:'20px 28px', borderTop:`1px solid ${C.g3}`, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 }}>
            {real?.faits_marquants && (
              <div style={{ background:C.g1, borderRadius:10, padding:'14px 16px', borderLeft:`3px solid ${C.gold}` }}>
                <p style={{ margin:'0 0 6px', fontWeight:700, fontSize:12, color:C.navy }}>🌟 Faits marquants</p>
                <p style={{ margin:0, fontSize:12, color:C.gt, lineHeight:1.6 }}>{real.faits_marquants}</p>
              </div>
            )}
            {real?.justif_ecarts && (
              <div style={{ background:C.g1, borderRadius:10, padding:'14px 16px', borderLeft:`3px solid ${C.orange}` }}>
                <p style={{ margin:'0 0 6px', fontWeight:700, fontSize:12, color:C.navy }}>📐 Justification des écarts</p>
                <p style={{ margin:0, fontSize:12, color:C.gt, lineHeight:1.6 }}>{real.justif_ecarts}</p>
              </div>
            )}
            {real?.perspectives && (
              <div style={{ background:C.g1, borderRadius:10, padding:'14px 16px', borderLeft:`3px solid ${C.blue}` }}>
                <p style={{ margin:'0 0 6px', fontWeight:700, fontSize:12, color:C.navy }}>🔭 Perspectives</p>
                <p style={{ margin:0, fontSize:12, color:C.gt, lineHeight:1.6 }}>{real.perspectives}</p>
              </div>
            )}
          </div>
        )}

        <div style={{ padding:'16px 28px', borderTop:`1px solid ${C.g3}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:C.g1 }}>
          <p style={{ margin:0, fontSize:11, color:C.gt }}>
            Bilan généré automatiquement · ★ KPIs calculés · ℹ Données des tableaux de détail · Légende : ✅ ≥ 100% · 🟡 75–99% · 🔴 &lt; 75%
          </p>
          <button onClick={onDownload}
            style={{ background:C.navy, color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            ⬇ Télécharger Excel (7 onglets)
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView]         = useState('home')
  const [mode, setMode]         = useState(null)
  const [step, setStep]         = useState(0)
  const [form, setForm]         = useState({})
  const [errors, setErrors]     = useState({})
  const [details, setDetails]   = useState({}) // tables de détail
  const [subs, setSubs]         = useState([])
  const [loading, setLoading]   = useState(false)
  const [toast, setToast]       = useState(null)
  // Admin
  const [adminCode, setAdminCode] = useState('')
  const [adminOk, setAdminOk]     = useState(false)
  const [adminSearch, setAdminSearch] = useState('')
  const [adminTab, setAdminTab]   = useState('kpi')
  // Bilan viewer
  const [bilanData, setBilanData] = useState(null) // { prev, rev, real, details }

  useEffect(() => { loadSubmissions().then(setSubs) }, [])

  function showToast(msg, type='success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4500)
  }

  const sections = mode && mode !== 'details' ? getSectionsForMode(mode) : []
  const sec = sections[step]

  const handleChange = useCallback((id, v) => {
    setForm(p => ({ ...p, [id]: v }))
    setErrors(p => { const n={...p}; delete n[id]; return n })
  }, [])

  function validate(stepIdx) {
    const s = sections[stepIdx]; if (!s) return true
    const errs = {}
    s.fields.forEach(f => {
      const val = form[f.id] ?? ''
      if (f.required && (!val || val === '')) { errs[f.id] = 'Champ obligatoire'; return }
      if (f.validate) { const msg = f.validate(val, form); if (msg) errs[f.id] = msg }
      if (f.type === 'number' && val !== '' && (isNaN(+val) || +val < (f.min ?? -Infinity))) {
        errs[f.id] = `Valeur invalide (min: ${f.min ?? 0})`
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function startMode(m) {
    setMode(m); setForm({ mode: m }); setStep(0); setErrors({})
    setDetails({}); setView('form'); window.scrollTo(0,0)
  }

  function next() {
    if (!validate(step)) { showToast('Veuillez corriger les erreurs avant de continuer', 'error'); return }
    if (step < sections.length - 1) { setStep(s => s+1); window.scrollTo(0,0) }
    else submitForm()
  }
  function prev() { setStep(s => Math.max(0, s-1)); setErrors({}); window.scrollTo(0,0) }

  async function submitForm() {
    setLoading(true)
    try {
      const payload = { ...form, mode, details: Object.keys(details).length ? details : undefined }
      const all = await saveSubmission(payload)
      setSubs(all)

      // Vérifier si bilan auto-disponible
      const email = form.email
      const annee = form.annee_academique
      if (email && annee && isBilanReady(email, annee)) {
        const { prev, rev, real } = findProfData(email, annee)
        const realDetails = real?.details || details || {}
        setBilanData({ prev, rev, real, details: realDetails })
        showToast('✅ Bilan annuel généré automatiquement — tous les 3 modes complétés !', 'info')
        setView('bilan_auto')
      } else {
        setView('thanks')
      }
    } catch { showToast('Erreur lors de la soumission. Réessayez.', 'error') }
    setLoading(false)
  }

  function downloadBilan(data) {
    const { prev, rev, real, details: det } = data || bilanData
    generateBilanExcel(prev, rev, real, det)
    showToast('Excel téléchargé — 7 onglets : KPI + Publications + Projets + Rayonnement + Formation + Prestations + Note')
  }

  // ── HOME ────────────────────────────────────────────────────────────────
  if (view === 'home') return (
    <div style={{ minHeight:'100vh', background:C.g1, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <style>{`*{box-sizing:border-box}button{transition:opacity .15s,transform .1s;font-family:inherit}button:hover{opacity:.87}button:active{transform:scale(.97)}`}</style>

      {/* Hero compact */}
      <div style={{ background:C.navy, padding:'44px 24px 36px', textAlign:'center' }}>
        <p style={{ color:C.gold, fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', margin:'0 0 10px', fontWeight:700 }}>
          {GSMI_FULL_NAME} · UM6P
        </p>
        <h1 style={{ color:'#fff', fontSize:30, fontWeight:700, margin:'0 0 8px', lineHeight:1.15 }}>
          Carnet du Chercheur
        </h1>
        <p style={{ color:'#8899BB', fontSize:14, margin:'0 0 28px', maxWidth:460, marginLeft:'auto', marginRight:'auto', lineHeight:1.6 }}>
          Outil de pilotage annuel des activités académiques et de recherche
        </p>
        {/* Placeholder logos */}
        <div style={{ display:'inline-block', background:'rgba(255,255,255,.07)', border:'1px dashed rgba(255,255,255,.15)', borderRadius:8, padding:'8px 20px', marginBottom:4 }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.35)', fontStyle:'italic' }}>
          </span>
        </div>
      </div>

      {/* Cycle + objectif */}
      <div style={{ maxWidth:700, margin:'0 auto', padding:'28px 18px 0' }}>
        <div style={{ background:'#fff', border:`0.5px solid ${C.g3}`, borderRadius:12, padding:'18px 22px', marginBottom:18 }}>
          <h3 style={{ margin:'0 0 10px', fontSize:14, fontWeight:700, color:C.navy }}>🎯 Objectif</h3>
          <p style={{ margin:'0 0 14px', fontSize:13, color:C.gt, lineHeight:1.65 }}>
            Chaque professeur saisit ses <strong>prévisions annuelles</strong>, les révise à <strong>mi-année (S1)</strong>,
            puis documente ses <strong>réalisations détaillées</strong> et présente son <strong>bilan annuel</strong> à l'Academic Meeting.
            Le bilan se génère <strong>automatiquement</strong> dès que les 3 étapes sont complétées.
          </p>
          <div style={{ background:'#FFF8E6', borderRadius:8, padding:'10px 14px', borderLeft:`3px solid ${C.gold}` }}>
            <p style={{ margin:0, fontSize:12, color:C.amber, fontWeight:500 }}>
              📐 Double logique d'écarts : <strong>Écart 1 = Réalisé − Prévu</strong> (vs objectif initial) · <strong>Écart 2 = Réalisé − Révisé S1</strong> (vs ajustement mi-année)
            </p>
          </div>
        </div>

        {/* 4 modes */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:18 }}>
          {[
            { m:'prevision',    icon:'🎯', col:C.blue,   title:'① Prévisions annuelles',      sub:'À remplir en début d\'année académique' },
            { m:'revision_s1',  icon:'🔄', col:C.teal,   title:'② Révision S1 — Mi-année',   sub:'Après 6 mois — actualiser les objectifs' },
            { m:'bilan_annuel', icon:'📊', col:C.violet, title:'③ Réalisations & Bilan',       sub:'Fin d\'année — chiffres réels + commentaires' },
            { m:'details',      icon:'📋', col:C.navy,   title:'④ Détails (Scopus, Projets…)', sub:'Publications ligne par ligne + tableaux complets' },
          ].map(m => (
            <button key={m.m} onClick={() => startMode(m.m)}
              style={{ background:'#fff', border:`1.5px solid ${C.g3}`, borderRadius:12, padding:'16px',
                       cursor:'pointer', textAlign:'left', borderTop:`4px solid ${m.col}` }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{m.icon}</div>
              <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:13, color:C.gd, lineHeight:1.2 }}>{m.title}</p>
              <p style={{ margin:0, fontSize:11, color:C.gt, lineHeight:1.4 }}>{m.sub}</p>
            </button>
          ))}
        </div>

        <div style={{ textAlign:'center', paddingBottom:36 }}>
          <button onClick={() => setView('admin')}
            style={{ background:'transparent', color:C.gt, border:`0.5px solid ${C.g3}`, borderRadius:8,
                     padding:'9px 18px', fontSize:13, cursor:'pointer' }}>
            🔒 Accès Direction GSMI
          </button>
        </div>
      </div>
      {toast && <Toast t={toast}/>}
    </div>
  )

  // ── FORM standard (prevision / revision / bilan) ─────────────────────
  if (view === 'form' && mode !== 'details' && sec) return (
    <div style={{ minHeight:'100vh', background:C.g1, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <style>{`*{box-sizing:border-box}button:hover{opacity:.87}button:active{transform:scale(.97)}`}</style>

      {/* Sticky header */}
      <div style={{ background:sec.color, padding:'16px 20px 0', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:640, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <button onClick={() => setView('home')} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,.7)', fontSize:13, cursor:'pointer', padding:0 }}>
              ← Accueil
            </button>
            <span style={{ color:'rgba(255,255,255,.6)', fontSize:12 }}>
              {step+1} / {sections.length}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:22 }}>{sec.icon}</span>
            <div>
              <p style={{ color:'rgba(255,255,255,.5)', fontSize:10, margin:'0 0 1px', textTransform:'uppercase', letterSpacing:'.08em' }}>
                {mode === 'prevision' ? '① Prévisions' : mode === 'revision_s1' ? '② Révision S1' : '③ Réalisations & Bilan'} · Section {step+1}/{sections.length}
              </p>
              <h2 style={{ color:'#fff', fontSize:17, fontWeight:700, margin:0 }}>{sec.title}</h2>
            </div>
          </div>
          <div style={{ display:'flex', gap:3 }}>
            {sections.map((_,i) => (
              <div key={i} style={{ flex:1, height:3, borderRadius:'3px 3px 0 0',
                background: i < step ? '#4ADE80' : i === step ? '#fff' : 'rgba(255,255,255,.2)',
                transition:'background .3s' }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'22px 20px 110px' }}>
        {step === 0 && (
          <div style={{ background:'#EFF6FF', borderRadius:8, padding:'10px 14px', marginBottom:20, borderLeft:`3px solid ${C.blue}` }}>
            <p style={{ margin:0, fontSize:12, color:'#1e40af' }}>
              📧 Un accusé de réception sera envoyé à votre email institutionnel après soumission.
              {mode === 'bilan_annuel' && ' Si vos 3 étapes sont complètes, le bilan annuel se génèrera automatiquement.'}
            </p>
          </div>
        )}
        {sec.hint && (
          <div style={{ background:sec.color+'12', borderRadius:8, padding:'10px 14px', marginBottom:20, borderLeft:`3px solid ${sec.color}` }}>
            <p style={{ margin:0, fontSize:13, color:sec.color, lineHeight:1.5 }}>{sec.hint}</p>
          </div>
        )}
        {sec.fields.map(f => <Field key={f.id} f={f} form={form} onChange={handleChange} errors={errors}/>)}
      </div>

      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:`0.5px solid ${C.g3}`,
                    padding:'13px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:10 }}>
        <button onClick={prev} disabled={step===0}
          style={{ background:'transparent', border:`1px solid ${C.g3}`, borderRadius:8, padding:'10px 18px',
                   fontSize:14, cursor:step===0?'not-allowed':'pointer', color:step===0?C.gt:C.gd, opacity:step===0?.35:1 }}>
          ← Précédent
        </button>
        <div style={{ display:'flex', gap:6 }}>
          {sections.map((_,i) => (
            <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:i===step?sec.color:i<step?C.green:C.g3,
                                  transform:i===step?'scale(1.3)':'scale(1)', transition:'all .25s' }} />
          ))}
        </div>
        <button onClick={next} disabled={loading}
          style={{ background:sec.color, color:'#fff', border:'none', borderRadius:8, padding:'10px 22px',
                   fontSize:14, fontWeight:600, cursor:loading?'wait':'pointer', minWidth:110 }}>
          {loading ? '…' : step===sections.length-1 ? 'Soumettre ✓' : 'Suivant →'}
        </button>
      </div>
      {toast && <Toast t={toast} bottom={90}/>}
    </div>
  )

  // ── DETAILS FORM ──────────────────────────────────────────────────────
  if (view === 'form' && mode === 'details') return (
    <div style={{ minHeight:'100vh', background:C.g1, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <style>{`*{box-sizing:border-box}button:hover{opacity:.87}button:active{transform:scale(.97)}`}</style>
      <div style={{ background:C.navy, padding:'16px 22px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setView('home')} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,.7)', fontSize:13, cursor:'pointer', padding:0 }}>← Accueil</button>
            <h2 style={{ color:'#fff', fontSize:15, fontWeight:700, margin:0 }}>📋 Réalisations détaillées</h2>
          </div>
          <button onClick={submitForm} disabled={loading}
            style={{ background:C.green, color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            {loading ? '…' : '✓ Enregistrer'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'22px 18px 40px' }}>
        {/* Identification */}
        <div style={{ background:'#fff', border:`0.5px solid ${C.g3}`, borderRadius:12, padding:'18px 20px', marginBottom:20 }}>
          <h3 style={{ margin:'0 0 14px', fontSize:13, fontWeight:700, color:C.navy }}>👤 Identification</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
            {[
              {id:'nom',label:'Nom complet',type:'text',required:true,placeholder:'Prénom NOM'},
              {id:'email',label:'Email UM6P',type:'email',required:true,placeholder:'prenom.nom@um6p.ma'},
              {id:'annee_academique',label:'Année académique',type:'select',required:true,options:ACADEMIC_YEARS},
            ].map(f => <Field key={f.id} f={f} form={form} onChange={handleChange} errors={errors}/>)}
          </div>
        </div>

        {DETAIL_TABLES.map(tbl => (
          <div key={tbl.id} style={{ background:'#fff', border:`0.5px solid ${C.g3}`, borderRadius:12, padding:'18px 20px', marginBottom:14 }}>
            <DetailTable tbl={tbl} rows={details[tbl.id]||[]} onChange={rows => setDetails(p=>({...p,[tbl.id]:rows}))}/>
          </div>
        ))}

        <div style={{ textAlign:'right' }}>
          <button onClick={submitForm} disabled={loading}
            style={{ background:C.navy, color:'#fff', border:'none', borderRadius:10, padding:'13px 28px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            {loading ? '…' : '✓ Enregistrer les réalisations'}
          </button>
        </div>
      </div>
      {toast && <Toast t={toast}/>}
    </div>
  )

  // ── BILAN AUTO VIEWER ──────────────────────────────────────────────────
  if (view === 'bilan_auto' && bilanData) return (
    <div style={{ minHeight:'100vh', background:C.g1, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <style>{`*{box-sizing:border-box}button:hover{opacity:.87}button:active{transform:scale(.97)}`}</style>
      <div style={{ background:C.navy, padding:'16px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <p style={{ color:C.gold, fontSize:11, margin:'0 0 2px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.1em' }}>GSMI / UM6P</p>
          <h1 style={{ color:'#fff', fontSize:18, fontWeight:700, margin:0 }}>Bilan Annuel — Généré automatiquement</h1>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => downloadBilan(bilanData)}
            style={{ background:C.green, color:'#fff', border:'none', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            ⬇ Excel (7 onglets)
          </button>
          <button onClick={() => { setView('thanks'); setBilanData(null) }}
            style={{ background:'transparent', color:'#8899BB', border:'1.5px solid #2D3F55', borderRadius:8, padding:'9px 14px', fontSize:13, cursor:'pointer' }}>
            ✓ Terminer
          </button>
        </div>
      </div>
      <div style={{ maxWidth:1060, margin:'0 auto', padding:'20px 18px' }}>
        <BilanViewer {...bilanData} onDownload={() => downloadBilan(bilanData)} onClose={() => { setView('thanks'); setBilanData(null) }}/>
      </div>
      {toast && <Toast t={toast}/>}
    </div>
  )

  // ── THANKS ─────────────────────────────────────────────────────────────
  if (view === 'thanks') return (
    <div style={{ minHeight:'100vh', background:C.g1, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif', padding:20 }}>
      <div style={{ textAlign:'center', maxWidth:420 }}>
        <div style={{ width:68, height:68, borderRadius:'50%', background:'#D1FAE5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 18px' }}>✓</div>
        <h2 style={{ color:C.gd, fontSize:22, fontWeight:700, margin:'0 0 10px' }}>Soumission enregistrée</h2>
        <p style={{ color:C.gt, fontSize:14, lineHeight:1.65, margin:'0 0 24px' }}>
          Vos données ont été transmises à la Direction GSMI et intégrées dans le tableau de consolidation.
        </p>
        {form.email && (
          <div style={{ background:'#EFF6FF', borderRadius:8, padding:'12px 16px', borderLeft:`3px solid ${C.blue}`, textAlign:'left', marginBottom:22 }}>
            <p style={{ margin:0, fontSize:13, color:'#1e40af' }}>📧 Accusé de réception envoyé à <strong>{form.email}</strong></p>
          </div>
        )}
        <div style={{ background:C.g1, borderRadius:10, padding:'14px 16px', textAlign:'left', marginBottom:22 }}>
          <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:600, color:C.navy }}>Étapes restantes :</p>
          {['prevision','revision_s1','bilan_annuel'].map(m => {
            const all = loadAll()
            const done = all.some(s => s.email === form.email && s.annee_academique === form.annee_academique && s.mode === m)
            return (
              <div key={m} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, fontSize:12, color:done?C.green:C.gt }}>
                <span>{done ? '✅' : '⏳'}</span>
                <span>{m==='prevision'?'① Prévisions annuelles':m==='revision_s1'?'② Révision S1':m==='details'?'④ Réalisations détaillées':'③ Réalisations & Bilan'}</span>
              </div>
            )
          })}
        </div>
        <button onClick={() => { setView('home'); setMode(null) }}
          style={{ background:C.blue, color:'#fff', border:'none', borderRadius:10, padding:'12px 26px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          ← Retour à l'accueil
        </button>
      </div>
    </div>
  )

  // ── ADMIN ───────────────────────────────────────────────────────────────
  if (view === 'admin') {
    if (!adminOk) return (
      <div style={{ minHeight:'100vh', background:C.g1, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif' }}>
        <style>{`button:hover{opacity:.87}input:focus{outline:none;border-color:#1A56DB!important}`}</style>
        <div style={{ background:'#fff', border:`0.5px solid ${C.g3}`, borderRadius:14, padding:'32px 28px', width:'100%', maxWidth:320 }}>
          <div style={{ width:50, height:50, borderRadius:12, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:16 }}>🔒</div>
          <h2 style={{ margin:'0 0 6px', fontSize:17, fontWeight:700, color:C.gd }}>Accès Direction GSMI</h2>
          <p style={{ margin:'0 0 18px', fontSize:13, color:C.gt }}>Code administrateur</p>
          <input type="password" value={adminCode} onChange={e=>setAdminCode(e.target.value)}
            placeholder="Code d'accès..."
            style={{ width:'100%', padding:'11px 14px', border:`1.5px solid ${C.g3}`, borderRadius:8, fontSize:14, boxSizing:'border-box', marginBottom:12, fontFamily:'inherit', color:C.gd, background:'#fff' }}
            onKeyDown={e => e.key==='Enter' && (adminCode===ADMIN_CODE ? setAdminOk(true) : showToast('Code incorrect','error'))}/>
          <button onClick={() => adminCode===ADMIN_CODE ? setAdminOk(true) : showToast('Code incorrect','error')}
            style={{ width:'100%', background:C.navy, color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:10 }}>
            Accéder
          </button>
          <button onClick={() => setView('home')} style={{ width:'100%', background:'transparent', color:C.gt, border:'none', fontSize:13, cursor:'pointer', padding:6 }}>← Retour</button>
        </div>
        {toast && <Toast t={toast}/>}
      </div>
    )

    // Build prof map
    const profMap = {}
    subs.forEach(s => {
      const k = (s.email||s.nom||'?') + '__' + (s.annee_academique||'')
      if (!profMap[k]) profMap[k] = { nom:s.nom, email:s.email, grade:s.grade, axe:s.axe_recherche, annee:s.annee_academique }
      profMap[k][s.mode] = s
    })
    const profs = Object.values(profMap)
    const filtered = profs.filter(p =>
      !adminSearch || (p.nom||'').toLowerCase().includes(adminSearch.toLowerCase()) || (p.email||'').toLowerCase().includes(adminSearch.toLowerCase())
    )

    // KPI par Axe
    const axeData = GSMI_AXES.map(axe => {
      const axSubs = subs.filter(s => s.axe_recherche === axe)
      const prev   = axSubs.filter(s => s.mode==='prevision')
      const real   = axSubs.filter(s => s.mode==='bilan_annuel')
      const sum    = (arr,k) => arr.reduce((a,s)=>a+(+s[k]||0),0)
      return {
        axe,
        profs: new Set(axSubs.map(s => s.email||s.nom)).size,
        pub_prev:     sum(prev,'prev_pub_total'),
        pub_real:     sum(real,'real_pub_acceptees'),
        q1q2_real:    sum(real,'real_pub_q1q2'),
        citations:    sum(real,'real_citations'),
        proj_prev:    sum(prev,'prev_projets'),
        proj_real:    sum(real,'real_proj_obtenus'),
        budget_prev:  sum(prev,'prev_budget'),
        budget_real:  sum(real,'real_budget'),
        h_init_real:  sum(real,'real_h_init'),
        doct_real:    sum(real,'real_doctorants'),
        theses_real:  sum(real,'real_theses_sout'),
        prest_real:   sum(real,'real_nb_prest'),
        revenus_real: sum(real,'real_revenus'),
        conf_real:    sum(real,'real_conf_int'),
        brev_real:    sum(real,'real_brev_dep'),
      }
    })

    const AXE_COLORS = [C.teal, C.green, C.violet]

    return (
      <div style={{ minHeight:'100vh', background:C.g1, fontFamily:'system-ui,-apple-system,sans-serif' }}>
        <style>{`button:hover{opacity:.87}button:active{transform:scale(.97)}`}</style>

        <div style={{ background:C.navy, padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, position:'sticky', top:0, zIndex:10 }}>
          <div>
            <p style={{ color:C.gold, fontSize:11, letterSpacing:'.1em', margin:'0 0 2px', textTransform:'uppercase', fontWeight:600 }}>GSMI — Direction</p>
            <h1 style={{ color:'#fff', fontSize:17, fontWeight:700, margin:0 }}>Tableau de bord consolidé</h1>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>

            <button onClick={() => { clearAll(); setSubs([]); showToast('Données effacées','warning') }}
              style={{ background:'transparent', color:'#8899BB', border:'1.5px solid #2D3F55', borderRadius:8, padding:'8px 12px', fontSize:12, cursor:'pointer' }}>
              🗑 Effacer
            </button>
            <button onClick={() => { setAdminOk(false); setAdminCode(''); setView('home') }}
              style={{ background:'transparent', color:'#8899BB', border:'1.5px solid #2D3F55', borderRadius:8, padding:'8px 12px', fontSize:12, cursor:'pointer' }}>
              Déconnexion
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background:'#fff', borderBottom:`1px solid ${C.g3}`, padding:'0 22px', display:'flex', gap:0 }}>
          {[
            {id:'kpi',    label:'📊 KPI par Axe de Recherche'},
            {id:'profs',  label:'👥 Suivi Professeurs'},
            {id:'bilan',  label:'📋 Bilan Individuel'},
          ].map(tab => (
            <button key={tab.id} onClick={() => setAdminTab(tab.id)}
              style={{ padding:'13px 18px', background:'none', border:'none',
                       borderBottom:adminTab===tab.id?`3px solid ${C.blue}`:'3px solid transparent',
                       fontWeight:adminTab===tab.id?700:400, color:adminTab===tab.id?C.blue:C.gt,
                       cursor:'pointer', fontSize:13, whiteSpace:'nowrap' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ maxWidth:1080, margin:'0 auto', padding:'20px 18px' }}>

          {/* ── TAB KPI par Axe ── */}
          {adminTab === 'kpi' && (
            <div>
              {axeData.map((ax, i) => (
                <div key={ax.axe} style={{ background:'#fff', border:`0.5px solid ${C.g3}`, borderRadius:12, marginBottom:16, overflow:'hidden' }}>
                  <div style={{ background:AXE_COLORS[i], padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <h3 style={{ color:'#fff', margin:0, fontSize:14, fontWeight:700 }}>{ax.axe}</h3>
                    <span style={{ background:'rgba(255,255,255,.2)', color:'#fff', borderRadius:6, padding:'3px 10px', fontSize:12 }}>
                      {ax.profs} professeur{ax.profs>1?'s':''}
                    </span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:0 }}>
                    {[
                      { l:'Publications acc.', P:ax.pub_prev, R:ax.pub_real },
                      { l:'Q1/Q2',             P:'—',         R:ax.q1q2_real },
                      { l:'Citations',          P:'—',         R:ax.citations },
                      { l:'Projets obtenus',   P:ax.proj_prev, R:ax.proj_real },
                      { l:'Budget (MAD)',       P:ax.budget_prev.toLocaleString('fr-MA'), R:ax.budget_real.toLocaleString('fr-MA'), noE:true },
                      { l:'H. Formation',       P:'—',         R:ax.h_init_real, suf:'h' },
                      { l:'Doctorants',         P:'—',         R:ax.doct_real },
                      { l:'Thèses soutenues',  P:'—',         R:ax.theses_real },
                      { l:'Conférences int.',   P:'—',         R:ax.conf_real },
                      { l:'Brevets déposés',   P:'—',         R:ax.brev_real },
                      { l:'Prestations',        P:ax.prest_real?'—':'—', R:ax.prest_real },
                      { l:'Revenus prest. (MAD)',P:'—',        R:ax.revenus_real.toLocaleString('fr-MA'), noE:true },
                    ].map((kpi, j) => {
                      const ecart = !kpi.noE && typeof kpi.P==='number' && typeof kpi.R==='number' ? kpi.R-kpi.P : null
                      return (
                        <div key={kpi.l} style={{ padding:'12px 14px', borderRight:j<11?`0.5px solid ${C.g3}`:'none', borderTop:`0.5px solid ${C.g3}` }}>
                          <p style={{ margin:'0 0 6px', fontSize:10, color:C.gt, lineHeight:1.3 }}>{kpi.l}</p>
                          <p style={{ margin:0, fontSize:19, fontWeight:700, color:C.gd }}>{kpi.R}{kpi.suf||''}</p>
                          {kpi.P!=='—'&&<p style={{ margin:'2px 0 0', fontSize:10, color:C.gt }}>Prévu: {kpi.P}{kpi.suf||''}</p>}
                          {ecart!==null&&<p style={{ margin:'2px 0 0', fontSize:11, fontWeight:600, color:ecart>=0?C.green:C.red }}>{ecart>=0?'+':''}{ecart}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB Suivi Professeurs ── */}
          {adminTab === 'profs' && (
            <div>
              <input value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
                placeholder="Rechercher un professeur (nom ou email)…"
                style={{ width:'100%', maxWidth:380, padding:'10px 14px', border:`1.5px solid ${C.g3}`, borderRadius:8, fontSize:14, outline:'none', marginBottom:14, fontFamily:'inherit', color:C.gd, background:'#fff' }}/>
              <div style={{ background:'#fff', border:`0.5px solid ${C.g3}`, borderRadius:12, overflow:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:720 }}>
                  <thead>
                    <tr style={{ background:C.navy }}>
                      {['Nom / Email','Grade','Axe','Année','🎯 Prévu','🔄 Révisé S1','📊 Bilan','📋 Détails','Bilan Excel','Complétude'].map(h=>(
                        <th key={h} style={{ padding:'10px 11px', color:'#fff', fontWeight:600, textAlign:'left', fontSize:11, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0
                      ? <tr><td colSpan={10} style={{ padding:'32px', textAlign:'center', color:C.gt }}>{adminSearch?'Aucun résultat':'Aucune soumission'}</td></tr>
                      : filtered.map((p,i) => {
                          const done = ['prevision','revision_s1','bilan_annuel','details'].filter(m=>p[m]).length
                          const pct  = Math.round(done/4*100)
                          const pc   = pct===100?C.green:pct>=50?C.amber:C.red
                          return (
                            <tr key={i} style={{ borderBottom:`0.5px solid ${C.g3}`, background:i%2===0?'#fff':C.g1 }}>
                              <td style={{ padding:'9px 11px', fontWeight:600, color:C.gd }}>
                                {p.nom||'—'}<br/><span style={{ fontSize:10, color:C.gt, fontWeight:400 }}>{p.email||''}</span>
                              </td>
                              <td style={{ padding:'9px 11px', color:C.gt, fontSize:11 }}>{p.grade||'—'}</td>
                              <td style={{ padding:'9px 11px', color:C.gt, fontSize:10 }}>{(p.axe||'').replace('Mine & Mineral Processing (MMP)','MMP').replace('Sustainable Mining & Environment (SME)','SME')}</td>
                              <td style={{ padding:'9px 11px', color:C.gt }}>{p.annee||'—'}</td>
                              {['prevision','revision_s1','bilan_annuel','details'].map(m => (
                                <td key={m} style={{ padding:'9px 11px', textAlign:'center' }}>
                                  {p[m] ? <span style={{color:C.green,fontSize:16}}>✅</span> : <span style={{color:C.g3,fontSize:16}}>⏳</span>}
                                </td>
                              ))}
                              <td style={{ padding:'9px 11px' }}>
                                {(p.prevision||p.revision_s1||p.bilan_annuel) && (
                                  <button
                                    onClick={() => {
                                      const det = (p.bilan_annuel||p.prevision||{}).details || {}
                                      generateBilanExcel(p.prevision, p.revision_s1, p.bilan_annuel, det)
                                      showToast('Bilan Excel généré')
                                    }}
                                    style={{ padding:'5px 10px', background:C.navy, color:'#fff', border:'none', borderRadius:6, fontSize:11, cursor:'pointer', whiteSpace:'nowrap' }}>
                                    ⬇ Excel
                                  </button>
                                )}
                              </td>
                              <td style={{ padding:'9px 11px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                  <div style={{ flex:1, height:5, background:C.g3, borderRadius:3 }}>
                                    <div style={{ width:`${pct}%`, height:'100%', background:pc, borderRadius:3 }}/>
                                  </div>
                                  <span style={{ fontSize:10, color:pc, fontWeight:700, minWidth:28 }}>{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB Bilan Individuel ── */}
          {adminTab === 'bilan' && (
            <div>
              <div style={{ background:'#fff', border:`0.5px solid ${C.g3}`, borderRadius:12, padding:'20px 22px', marginBottom:16 }}>
                <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:C.navy }}>Générer le bilan d'un professeur</h3>
                <input value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
                  placeholder="Rechercher par nom ou email…"
                  style={{ width:'100%', maxWidth:380, padding:'10px 14px', border:`1.5px solid ${C.g3}`, borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit', color:C.gd, marginBottom:14, background:'#fff' }}/>
                {adminSearch && filtered.map(p => (
                  <div key={p.email} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:C.g1, borderRadius:8, marginBottom:8, gap:12, flexWrap:'wrap' }}>
                    <div>
                      <p style={{ margin:0, fontWeight:600, fontSize:13, color:C.gd }}>{p.nom} <span style={{fontSize:11,color:C.gt,fontWeight:400}}>— {p.email}</span></p>
                      <p style={{ margin:'3px 0 0', fontSize:11, color:C.gt }}>
                        {p.axe} · {p.annee} · {['prevision','revision_s1','bilan_annuel'].filter(m=>p[m]).length}/3 étapes
                      </p>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button
                        onClick={() => {
                          const det = (p.bilan_annuel||p.prevision||{}).details || {}
                          const kpis = buildKPIs(p.prevision, p.revision_s1, p.bilan_annuel, det)
                          setBilanData({ prev:p.prevision, rev:p.revision_s1, real:p.bilan_annuel, details:det })
                          setView('bilan_admin')
                        }}
                        style={{ padding:'8px 14px', background:C.blue, color:'#fff', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                        👁 Visualiser
                      </button>
                      <button
                        onClick={() => {
                          const det = (p.bilan_annuel||p.prevision||{}).details || {}
                          generateBilanExcel(p.prevision, p.revision_s1, p.bilan_annuel, det)
                          showToast('Bilan Excel généré — 7 onglets')
                        }}
                        style={{ padding:'8px 14px', background:C.navy, color:'#fff', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                        ⬇ Excel
                      </button>
                    </div>
                  </div>
                ))}
                {adminSearch && filtered.length === 0 && <p style={{ color:C.gt, fontSize:13 }}>Aucun professeur trouvé</p>}
              </div>
              <div style={{ background:'#EFF6FF', borderRadius:10, padding:'14px 18px', borderLeft:`3px solid ${C.blue}` }}>
                <p style={{ margin:0, fontSize:13, color:'#1e40af', lineHeight:1.7 }}>
                  <strong>Contenu du bilan Excel (7 onglets) :</strong><br/>
                  📊 Bilan KPI — Tableau comparatif Prévu / Révisé S1 / Réalisé + Écart 1 (C−A) + Écart 2 (C−B) + Statut + KPIs calculés (taux, ratios, moyennes)<br/>
                  🔬 Publications Scopus détaillées · 💰 Projets de recherche · 🌍 Rayonnement<br/>
                  🎓 Formation & Encadrement · 💼 Prestations · 📝 Note justificative (signatures)
                </p>
              </div>
            </div>
          )}
        </div>
        {toast && <Toast t={toast}/>}
      </div>
    )
  }

  // ── BILAN ADMIN VIEWER ──────────────────────────────────────────────────
  if (view === 'bilan_admin' && bilanData) return (
    <div style={{ minHeight:'100vh', background:C.g1, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <style>{`*{box-sizing:border-box}button:hover{opacity:.87}`}</style>
      <div style={{ background:C.navy, padding:'14px 22px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <h2 style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>
          Bilan — {bilanData.prev?.nom || bilanData.real?.nom || '—'}
        </h2>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => downloadBilan(bilanData)}
            style={{ background:C.green, color:'#fff', border:'none', borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            ⬇ Excel
          </button>
          <button onClick={() => { setView('admin'); setAdminTab('bilan') }}
            style={{ background:'transparent', color:'#8899BB', border:'1.5px solid #2D3F55', borderRadius:8, padding:'8px 12px', fontSize:12, cursor:'pointer' }}>
            ← Retour
          </button>
        </div>
      </div>
      <div style={{ maxWidth:1060, margin:'0 auto', padding:'20px 18px' }}>
        <BilanViewer {...bilanData} onDownload={() => downloadBilan(bilanData)} onClose={() => { setView('admin'); setAdminTab('bilan') }}/>
      </div>
      {toast && <Toast t={toast}/>}
    </div>
  )

  return null
}
