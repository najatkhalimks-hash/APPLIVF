// ══════════════════════════════════════════════════════════════════════════
// Génération du Bilan Annuel Excel — 6 onglets
// Logique : Écart 1 = Réalisé − Prévu | Écart 2 = Réalisé − Révisé S1
// ══════════════════════════════════════════════════════════════════════════
import * as XLSX from 'xlsx'
import { GSMI_FULL_NAME } from './constants.js'

// ── KPI enrichis pour le bilan ────────────────────────────────────────────
// KPIs principaux + KPIs de performance calculés
export function buildKPIs(prev, rev, real, details) {
  const p = prev || {}, r = rev || {}, b = real || {}
  const pubs = details?.pub_detail || []
  const projs = details?.proj_detail || []
  const rays  = details?.ray_detail || []
  const forms = details?.form_detail || []
  const prest = details?.prest_detail || []

  // Helpers
  const n  = v => +v || 0
  const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : null
  const statusLabel = (real_v, prev_v) => {
    if (!prev_v) return '—'
    const p = pct(real_v, prev_v)
    if (p >= 100) return '✅ Atteint'
    if (p >= 75)  return '🟡 Partiel'
    return '🔴 Non atteint'
  }

  const rows = [
    // section, label, prev_key|val, rev_key|val, real_val, unit
    { section: '🔬 PRODUCTION SCIENTIFIQUE', header: true },
    { label: 'Publications acceptées',           A: n(p.prev_pub_total),   B: n(r.rev_pub_total),   C: n(b.real_pub_acceptees),   unit: '' },
    { label: 'Dont publications Q1/Q2',          A: n(p.prev_pub_q1q2),    B: n(r.rev_pub_q1q2),    C: n(b.real_pub_q1q2),        unit: '' },
    { label: 'Publications publiées (Final)',     A: '—',                   B: '—',                  C: n(b.real_pub_final),       unit: '' },
    { label: 'Citations reçues (Scopus)',         A: n(p.prev_citations),   B: '—',                  C: n(b.real_citations),       unit: '' },
    { label: 'Publications Open Access',          A: '—',                   B: '—',                  C: n(b.real_oa),              unit: '' },
    { label: 'Livres & chapitres',               A: '—',                   B: '—',                  C: n(b.real_livres),          unit: '' },
    // KPI calculés — Production
    { label: 'Taux de réussite publication (%)', A: '—', B: '—',
      C: n(b.real_pub_soumises) > 0 ? pct(n(b.real_pub_acceptees), n(b.real_pub_soumises)) : '—', unit: '%', computed: true },
    { label: 'Part Q1/Q2 sur acceptées (%)',     A: '—', B: '—',
      C: n(b.real_pub_acceptees) > 0 ? pct(n(b.real_pub_q1q2), n(b.real_pub_acceptees)) : '—', unit: '%', computed: true },
    { label: 'Citations / publication',          A: '—', B: '—',
      C: n(b.real_pub_acceptees) > 0 ? (n(b.real_citations) / n(b.real_pub_acceptees)).toFixed(1) : '—', unit: '', computed: true },
    // Détail par semestre (issues des tableaux)
    { label: 'Publications S1 (détail)',         A: '—', B: '—', C: pubs.filter(x=>x.semester==='S1').length, unit: '', info: true },
    { label: 'Publications S2 (détail)',         A: '—', B: '—', C: pubs.filter(x=>x.semester==='S2').length, unit: '', info: true },

    { section: '💰 PROJETS DE RECHERCHE', header: true },
    { label: 'Projets soumis',                   A: '—',                   B: '—',                  C: n(b.real_proj_soumis),     unit: '' },
    { label: 'Projets obtenus',                  A: n(p.prev_projets),     B: n(r.rev_projets),     C: n(b.real_proj_obtenus),    unit: '' },
    { label: 'Budget total obtenu (MAD)',         A: n(p.prev_budget),      B: n(r.rev_budget),      C: n(b.real_budget),          unit: 'MAD' },
    { label: 'Projets internationaux',            A: '—',                   B: '—',                  C: n(b.real_proj_internat),   unit: '' },
    // KPI calculés — Projets
    { label: 'Taux de succès projets (%)',        A: '—', B: '—',
      C: n(b.real_proj_soumis) > 0 ? pct(n(b.real_proj_obtenus), n(b.real_proj_soumis)) : '—', unit: '%', computed: true },
    { label: 'Budget moyen / projet (MAD)',       A: '—', B: '—',
      C: n(b.real_proj_obtenus) > 0 ? Math.round(n(b.real_budget) / n(b.real_proj_obtenus)).toLocaleString('fr-MA') : '—', unit: 'MAD', computed: true },

    { section: '🌍 RAYONNEMENT & VALORISATION', header: true },
    { label: 'Conférences internationales',      A: n(p.prev_conf),        B: '—',                  C: n(b.real_conf_int),        unit: '' },
    { label: 'Communications invitées',          A: '—',                   B: '—',                  C: n(b.real_comm_inv),        unit: '' },
    { label: 'Brevets déposés',                  A: n(p.prev_brevets),     B: '—',                  C: n(b.real_brev_dep),        unit: '' },
    { label: 'Brevets acceptés',                 A: '—',                   B: '—',                  C: n(b.real_brev_acc),        unit: '' },
    { label: 'Prototypes / Transferts',          A: '—',                   B: '—',                  C: n(b.real_proto),           unit: '' },
    // KPI calculé — Taux de conversion brevets
    { label: 'Taux de conversion brevets (%)',   A: '—', B: '—',
      C: n(b.real_brev_dep) > 0 ? pct(n(b.real_brev_acc), n(b.real_brev_dep)) : '—', unit: '%', computed: true },

    { section: '🎓 FORMATION & ENCADREMENT', header: true },
    { label: 'H. Formation initiale (S1+S2)',    A: n(p.prev_h_init),      B: n(r.rev_h_init),      C: n(b.real_h_init),          unit: 'h' },
    { label: 'H. Formation exécutive',           A: n(p.prev_h_exec),      B: '—',                  C: n(b.real_h_exec),          unit: 'h' },
    { label: 'H. Formation doctorale',           A: n(p.prev_h_doct),      B: '—',                  C: n(b.real_h_doct),          unit: 'h' },
    { label: 'Doctorants encadrés',              A: n(p.prev_doctorants),  B: n(r.rev_doctorants),  C: n(b.real_doctorants),      unit: '' },
    { label: 'Thèses soutenues cette année',     A: '—',                   B: '—',                  C: n(b.real_theses_sout),     unit: '' },
    { label: 'PFE / Masters encadrés',           A: n(p.prev_pfe),         B: '—',                  C: n(b.real_pfe),             unit: '' },
    // KPI calculés — Formation
    { label: 'Total heures enseignement',        A: '—', B: '—',
      C: n(b.real_h_init) + n(b.real_h_exec) + n(b.real_h_doct), unit: 'h', computed: true },
    { label: 'Ratio S1/S2 heures formation',     A: '—', B: '—',
      C: forms.length > 0
        ? `S1:${forms.filter(x=>x.semester==='S1').reduce((a,x)=>a+(+x.h_real||0),0)}h / S2:${forms.filter(x=>x.semester==='S2').reduce((a,x)=>a+(+x.h_real||0),0)}h`
        : '—', unit: '', computed: true, info: true },

    { section: '💼 PRESTATIONS DE SERVICE', header: true },
    { label: 'Nb. prestations',                  A: n(p.prev_prestations), B: n(r.rev_prestations), C: n(b.real_nb_prest),        unit: '' },
    { label: 'Revenus générés (MAD)',             A: n(p.prev_revenus),     B: n(r.rev_revenus),     C: n(b.real_revenus),         unit: 'MAD' },
    { label: 'Missions pilotées (lead)',          A: '—',                   B: '—',
      C: prest.filter(x=>x.role==='Responsable (lead)').length, unit: '', info: true },
    { label: 'Revenu moyen / prestation (MAD)',  A: '—', B: '—',
      C: n(b.real_nb_prest) > 0 ? Math.round(n(b.real_revenus) / n(b.real_nb_prest)).toLocaleString('fr-MA') : '—', unit: 'MAD', computed: true },
  ]

  // Ajouter écarts et statut sur les lignes non-header
  return rows.map(row => {
    if (row.header || row.computed || row.info) return row
    const cA = typeof row.A === 'number' ? row.A : null
    const cB = typeof row.B === 'number' ? row.B : null
    const cC = typeof row.C === 'number' ? row.C : null
    return {
      ...row,
      ecart1: cA !== null && cC !== null ? cC - cA : '—',  // Réalisé − Prévu
      ecart2: cB !== null && cC !== null ? cC - cB : '—',  // Réalisé − Révisé
      statut: cA !== null && cC !== null ? statusLabel(cC, cA) : '—',
    }
  })
}

// ── Styles Excel ──────────────────────────────────────────────────────────
function s(bold, bg='FFFFFF', fg='111928', align='left', sz=10) {
  return {
    font: { name:'Calibri', bold, sz, color:{rgb:fg} },
    fill: { patternType:'solid', fgColor:{rgb:bg.replace('#','')} },
    alignment: { horizontal:align, vertical:'center', wrapText:true },
    border: { top:{style:'thin',color:{rgb:'E5E7EB'}}, bottom:{style:'thin',color:{rgb:'E5E7EB'}}, left:{style:'thin',color:{rgb:'E5E7EB'}}, right:{style:'thin',color:{rgb:'E5E7EB'}} },
  }
}

// ── Export principal ──────────────────────────────────────────────────────
export function generateBilanExcel(prev, rev, real, details) {
  const wb = XLSX.utils.book_new()
  const nomProf = prev?.nom || real?.nom || '—'
  const annee   = prev?.annee_academique || real?.annee_academique || '—'
  const axe     = prev?.axe_recherche || real?.axe_recherche || '—'
  const grade   = prev?.grade || real?.grade || '—'
  const date    = new Date().toLocaleDateString('fr-MA')
  const kpis    = buildKPIs(prev, rev, real, details)

  // ── ONGLET 1: Dashboard KPI ───────────────────────────────────────────
  const rows1 = [
    [`BILAN ANNUEL — ${GSMI_FULL_NAME.toUpperCase()} / UM6P`, '', '', '', '', '', ''],
    [`Professeur : ${nomProf}`, `Grade : ${grade}`, `Axe : ${axe}`, `Année : ${annee}`, `Généré le : ${date}`, '', ''],
    [''],
    ['Indicateur KPI', 'A — Prévu', 'B — Révisé S1', 'C — Réalisé', 'Écart C−A (vs Prévu)', 'Écart C−B (vs Révisé)', 'Statut'],
  ]

  const SECCOLORS = {
    '🔬 PRODUCTION SCIENTIFIQUE': '047481',
    '💰 PROJETS DE RECHERCHE':    '057A55',
    '🌍 RAYONNEMENT & VALORISATION':'5521B5',
    '🎓 FORMATION & ENCADREMENT':  '1A56DB',
    '💼 PRESTATIONS DE SERVICE':   'B45309',
  }

  kpis.forEach(row => {
    if (row.header) { rows1.push([row.section, '', '', '', '', '', '']); return }
    const fmt = v => v === '—' || v === null || v === undefined ? '—' : v
    rows1.push([
      row.label + (row.computed ? ' ★' : row.info ? ' ℹ' : ''),
      fmt(row.A), fmt(row.B), fmt(row.C),
      row.ecart1 !== undefined ? fmt(row.ecart1) : '—',
      row.ecart2 !== undefined ? fmt(row.ecart2) : '—',
      row.statut || '—',
    ])
  })

  const ws1 = XLSX.utils.aoa_to_sheet(rows1)

  // Apply styles row by row
  let secColor = '374151'
  for (let ri = 0; ri < rows1.length; ri++) {
    const rowData = rows1[ri]
    // Detect section row
    const secKey = Object.keys(SECCOLORS).find(k => rowData[0]?.includes(k))
    if (secKey) secColor = SECCOLORS[secKey]

    for (let ci = 0; ci < 7; ci++) {
      const addr = XLSX.utils.encode_cell({r:ri,c:ci})
      if (!ws1[addr]) ws1[addr] = {v:'',t:'s'}
      if (ri === 0)  { ws1[addr].s = s(true,'0D1B2A','FFFFFF','left',14); continue }
      if (ri === 1)  { ws1[addr].s = s(false,'1B2A3B','FBBF24','left',9); continue }
      if (ri === 3)  { ws1[addr].s = s(true,'0D1B2A','FFFFFF','center',10); continue }
      if (secKey)    { ws1[addr].s = s(true,secColor,'FFFFFF','left',10); continue }

      const isComputed = rowData[0]?.includes('★')
      const isInfo     = rowData[0]?.includes('ℹ')
      const bg = isComputed ? 'FFF8E6' : isInfo ? 'EFF6FF' : ri%2===0?'F9FAFB':'FFFFFF'

      if (ci===0) { ws1[addr].s = s(isComputed||isInfo, bg, isComputed?'B45309':isInfo?'1A56DB':'111928', 'left'); continue }
      if (ci===1) { ws1[addr].s = s(true, bg, '1A56DB', 'center'); continue }
      if (ci===2) { ws1[addr].s = s(true, bg, '047481', 'center'); continue }
      if (ci===3) { ws1[addr].s = s(true, bg, '5521B5', 'center'); continue }
      if (ci===4) {
        const v = +rowData[4]; const fg = isNaN(v)?'374151':v>=0?'057A55':'BE123C'
        ws1[addr].s = s(true, bg, fg, 'center'); continue
      }
      if (ci===5) {
        const v = +rowData[5]; const fg = isNaN(v)?'374151':v>=0?'047481':'C27803'
        ws1[addr].s = s(true, bg, fg, 'center'); continue
      }
      if (ci===6) {
        const v = String(rowData[6]||'')
        const fg = v.includes('✅')?'057A55':v.includes('🟡')?'B45309':v.includes('🔴')?'BE123C':'374151'
        ws1[addr].s = s(true, bg, fg, 'center'); continue
      }
    }
  }

  ws1['!cols'] = [{wch:36},{wch:14},{wch:14},{wch:14},{wch:20},{wch:20},{wch:16}]
  ws1['!merges'] = [{s:{r:0,c:0},e:{r:0,c:6}},{s:{r:1,c:0},e:{r:1,c:4}}]
  ws1['!rows'] = rows1.map((_,i) => i===0?{hpt:36}:i===1?{hpt:22}:i===3?{hpt:28}:{hpt:22})
  XLSX.utils.book_append_sheet(wb, ws1, '📊 Bilan KPI')

  // ── ONGLET 2: Publications ─────────────────────────────────────────────
  const pubCols = ['Author(s)','Document title','Year','Semester','Source title','Volume,issue,pages','Citations','Source & doc type','Publication stage','DOI','Open access','EID Scopus','Commentaire']
  const pubRows = (details?.pub_detail||[]).map(r=>[r.authors||'',r.title||'',r.year||'',r.semester||'',r.source||'',r.vol_pages||'',r.citations||0,r.doc_type||'',r.stage||'',r.doi||'',r.oa||'',r.eid||'',r.comment||''])
  appendSheet(wb, pubCols, pubRows, '🔬 Publications', '047481')

  // ── ONGLET 3: Projets ─────────────────────────────────────────────────
  const projCols = ['Année','Type','Intitulé du projet','Rôle','Statut','Financeur','Budget (MAD)','Début','Fin']
  const projRows = (details?.proj_detail||[]).map(r=>[r.annee||'',r.type||'',r.intitule||'',r.role||'',r.statut||'',r.financeur||'',r.budget||0,r.debut||'',r.fin||''])
  appendSheet(wb, projCols, projRows, '💰 Projets', '057A55')

  // ── ONGLET 4: Rayonnement ─────────────────────────────────────────────
  const rayCols = ['Année','Catégorie','Titre / Intitulé','Événement / Support','Pays','TRL','Statut','Revenus (MAD)']
  const rayRows = (details?.ray_detail||[]).map(r=>[r.annee||'',r.categorie||'',r.titre||'',r.support||'',r.pays||'',r.trl||'',r.statut||'',r.revenus||0])
  appendSheet(wb, rayCols, rayRows, '🌍 Rayonnement', '5521B5')

  // ── ONGLET 5: Formation ───────────────────────────────────────────────
  const formCols = ['Semestre','Type formation','Activité','Filière / Programme','H. Prévues','H. Réalisées']
  const formRows = (details?.form_detail||[]).map(r=>[r.semester||'',r.type_form||'',r.activite||'',r.filiere||'',r.h_prev||0,r.h_real||0])
  appendSheet(wb, formCols, formRows, '🎓 Formation', '5521B5')

  // ── ONGLET 6: Prestations ─────────────────────────────────────────────
  const prestCols = ['Année','Mission','Type','Client','Rôle','Jours','Tarif/j','Montant (MAD)','Statut']
  const prestRows = (details?.prest_detail||[]).map(r=>[r.annee||'',r.intitule||'',r.type||'',r.client||'',r.role||'',r.jours||0,r.tarif||0,r.montant||0,r.statut||''])
  appendSheet(wb, prestCols, prestRows, '💼 Prestations', 'B45309')

  // ── ONGLET 7: Note justificative ──────────────────────────────────────
  const noteRows = [
    ['NOTE DE BILAN ANNUEL — CARNET DU CHERCHEUR GSMI'],
    [''],
    ['Professeur :',       nomProf],
    ['Grade :',            grade],
    ['Axe de recherche :', axe],
    ['Année académique :', annee],
    ['Date de génération :', date],
    [''],
    ['OBJECTIFS ANNUELS (Prévisions initiales) :'],
    [prev?.objectifs_texte || '—'],
    [''],
    ['JUSTIFICATION DES RÉVISIONS S1 :'],
    [rev?.rev_justification || '—'],
    [''],
    ['FAITS MARQUANTS DE L\'ANNÉE :'],
    [real?.faits_marquants || '—'],
    [''],
    ['JUSTIFICATION DES ÉCARTS :'],
    [real?.justif_ecarts || '—'],
    [''],
    ['PERSPECTIVES :'],
    [real?.perspectives || '—'],
    [''],
    ['BESOINS DE SUPPORT :'],
    [real?.besoins_support || '—'],
    [''],
    ['Statut objectifs globaux :', real?.statut_obj || '—'],
    [''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'],
    ['Signature du Professeur : ___________________________', 'Date : ___________'],
    ['Visa Direction GSMI :     ___________________________', 'Date : ___________'],
    ['Visa Doyen / DoR :        ___________________________', 'Date : ___________'],
    [''],
    ['★ = KPI calculé automatiquement', 'ℹ = Information issue des tableaux de détail'],
    ['Légende écarts : ✅ ≥ 100% | 🟡 75–99% | 🔴 < 75%'],
  ]
  const wsNote = XLSX.utils.aoa_to_sheet(noteRows)
  if (wsNote['A1']) wsNote['A1'].s = s(true,'0D1B2A','FFFFFF','left',13)
  noteRows.forEach((_,i) => {
    const addr = `A${i+1}`
    if (wsNote[addr] && !wsNote[addr].s) {
      const isLbl = wsNote[addr]?.v && String(wsNote[addr].v).endsWith(':')
      wsNote[addr].s = s(isLbl, isLbl?'F0F4FF':'FFFFFF', isLbl?'0D1B2A':'374151', 'left')
    }
    const addrB = `B${i+1}`
    if (wsNote[addrB]) wsNote[addrB].s = s(false,'FFFFFF','374151','left')
  })
  wsNote['!cols'] = [{wch:40},{wch:50}]
  XLSX.utils.book_append_sheet(wb, wsNote, '📝 Note justificative')

  const fn = `GSMI_Bilan_${nomProf.replace(/\s+/g,'_')}_${annee.replace('/','_')}.xlsx`
  XLSX.writeFile(wb, fn)
  return fn
}

function appendSheet(wb, headers, rows, title, color) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const r = XLSX.utils.decode_range(ws['!ref'])
  for (let c = r.s.c; c <= r.e.c; c++) {
    const a = XLSX.utils.encode_cell({r:0,c})
    if (ws[a]) ws[a].s = s(true, color, 'FFFFFF', 'center')
  }
  for (let ri = 1; ri <= r.e.r; ri++) {
    for (let ci = r.s.c; ci <= r.e.c; ci++) {
      const a = XLSX.utils.encode_cell({r:ri,c:ci})
      if (!ws[a]) ws[a] = {v:'',t:'s'}
      ws[a].s = s(false, ri%2===0?'F9FAFB':'FFFFFF','111928', ci===0?'left':'center')
    }
  }
  ws['!cols'] = Array(headers.length).fill({wch:18})
  ws['!rows']= [{hpt:26},...Array(rows.length).fill({hpt:20})]
  XLSX.utils.book_append_sheet(wb, ws, title)
}
