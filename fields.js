// ══════════════════════════════════════════════════════════════════════════
// Définition des sections et champs du formulaire
// Source unique — utilisée par App, bilan_export et export global
// ══════════════════════════════════════════════════════════════════════════
import {
  ACADEMIC_YEARS, GRADES, GSMI_AXES, INTEGRATION_YEARS,
  PUBLICATION_YEARS, PUB_STAGES, PUB_DOC_TYPES, OA_TYPES, TRL_LEVELS,
} from './constants.js'

// ── Helpers de validation ─────────────────────────────────────────────────
const req = (v) => (!v || v === '') ? 'Champ obligatoire' : null
const gtField = (label, otherKey, otherLabel) => (v, form) =>
  +v > +(form[otherKey] || 9999) ? `${label} ne peut pas dépasser ${otherLabel}` : null
const isOrcid = (v) => v && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(v)
  ? 'Format ORCID invalide (ex: 0000-0000-0000-0000)' : null
const isNum = (v, min = 0, max = 9999) => {
  if (v === '' || v === undefined || v === null) return null
  if (isNaN(+v)) return 'Valeur numérique requise'
  if (+v < min) return `Minimum ${min}`
  if (+v > max) return `Maximum ${max}`
  return null
}

// ── Section Identification ────────────────────────────────────────────────
export const IDENTIFICATION = {
  id: 'identification', title: 'Identification', icon: '👤', color: '#0D1B2A',
  fields: [
    { id: 'nom',             label: 'Nom complet',           type: 'text',   required: true,  placeholder: 'Prénom NOM',
      validate: req },
    { id: 'email',           label: 'Email institutionnel',  type: 'email',  required: true,  placeholder: 'prenom.nom@um6p.ma',
      validate: v => !v ? 'Obligatoire' : !v.includes('@') ? 'Email invalide' : null },
    { id: 'grade',           label: 'Grade académique',      type: 'select', required: true,  options: GRADES, validate: req },
    { id: 'axe_recherche',   label: 'Axe de recherche',      type: 'select', required: true,  options: GSMI_AXES, validate: req },
    { id: 'annee_integ',     label: 'Année d\'intégration UM6P', type: 'select', required: true, options: INTEGRATION_YEARS, validate: req },
    { id: 'annee_academique',label: 'Année académique',      type: 'select', required: true,  options: ACADEMIC_YEARS, validate: req,
      hint: 'Année académique concernée par cette saisie' },
    { id: 'orcid',           label: 'ORCID',                 type: 'text',   required: false, placeholder: '0000-0000-0000-0000',
      hint: 'Format : 0000-0000-0000-0000', validate: isOrcid },
    { id: 'scopus_url',      label: 'Profil Scopus (URL)',   type: 'url',    required: false, placeholder: 'https://www.scopus.com/authid/...' },
  ],
}

// ── Section Prévisions ────────────────────────────────────────────────────
export const PREVISIONS = {
  id: 'previsions', title: 'Prévisions annuelles', icon: '🎯', color: '#1A56DB',
  hint: 'Définissez vos objectifs pour l\'année académique. Ces valeurs seront la référence pour mesurer vos écarts en fin d\'année.',
  fields: [
    // Production
    { id: 'prev_pub_total',   label: 'Publications — Objectif total',     type: 'number', required: true,  min: 0, max: 50, validate: v => isNum(v,0,50) },
    { id: 'prev_pub_q1q2',    label: 'Publications — Dont Q1/Q2',         type: 'number', required: true,  min: 0,
      validate: (v, f) => isNum(v,0,50) || gtField('Q1/Q2','prev_pub_total','total publications')(v,f) },
    { id: 'prev_citations',   label: 'Citations — Objectif',              type: 'number', required: false, min: 0 },
    // Projets
    { id: 'prev_projets',     label: 'Projets obtenus — Objectif',        type: 'number', required: true,  min: 0 },
    { id: 'prev_budget',      label: 'Budget à mobiliser (MAD)',          type: 'number', required: false, min: 0, hint: 'En dirhams marocains' },
    // Rayonnement
    { id: 'prev_conf',        label: 'Conférences internationales',       type: 'number', required: false, min: 0 },
    { id: 'prev_brevets',     label: 'Brevets à déposer',                 type: 'number', required: false, min: 0 },
    // Formation
    { id: 'prev_h_init',      label: 'H. Formation initiale',            type: 'number', required: true,  min: 0, hint: 'Cours, TD, TP en licence / master' },
    { id: 'prev_h_exec',      label: 'H. Formation exécutive',           type: 'number', required: false, min: 0 },
    { id: 'prev_h_doct',      label: 'H. Formation doctorale',           type: 'number', required: false, min: 0 },
    { id: 'prev_doctorants',  label: 'Doctorants à encadrer',            type: 'number', required: true,  min: 0 },
    { id: 'prev_pfe',         label: 'PFE / Masters à encadrer',         type: 'number', required: false, min: 0 },
    // Prestations
    { id: 'prev_prestations', label: 'Prestations de service (nb)',       type: 'number', required: false, min: 0 },
    { id: 'prev_revenus',     label: 'Revenus prestations (MAD)',         type: 'number', required: false, min: 0 },
    // Texte
    { id: 'objectifs_texte',  label: 'Description des priorités annuelles', type: 'textarea', required: false,
      placeholder: 'Décrire vos axes de travail, projets structurants, ambitions pour cette année académique...' },
  ],
}

// ── Section Révision S1 ───────────────────────────────────────────────────
export const REVISION = {
  id: 'revision', title: 'Révision mi-année — S1', icon: '🔄', color: '#047481',
  hint: 'Après 6 mois (fin S1), actualisez vos prévisions en fonction de l\'avancement réel.',
  fields: [
    { id: 'rev_pub_total',    label: 'Publications — Révision objectif', type: 'number', required: true,  min: 0 },
    { id: 'rev_pub_q1q2',     label: 'Publications Q1/Q2 — Révision',   type: 'number', required: false, min: 0,
      validate: (v,f) => gtField('Q1/Q2','rev_pub_total','total révisé')(v,f) },
    { id: 'rev_projets',      label: 'Projets obtenus — Révision',      type: 'number', required: true,  min: 0 },
    { id: 'rev_budget',       label: 'Budget révisé (MAD)',              type: 'number', required: false, min: 0 },
    { id: 'rev_h_init',       label: 'H. Formation initiale — Révisé',  type: 'number', required: true,  min: 0 },
    { id: 'rev_doctorants',   label: 'Doctorants — Révisé',             type: 'number', required: true,  min: 0 },
    { id: 'rev_prestations',  label: 'Prestations — Révisé',            type: 'number', required: false, min: 0 },
    { id: 'rev_revenus',      label: 'Revenus prestations révisés (MAD)',type: 'number', required: false, min: 0 },
    { id: 'rev_justification',label: 'Justification des révisions',      type: 'textarea', required: false,
      placeholder: 'Expliquer les raisons des ajustements par rapport aux prévisions initiales...' },
  ],
}

// ── Section Réalisations (bilan) ──────────────────────────────────────────
export const REALISATIONS_FIELDS = {
  id: 'realisations_kpi', title: 'Réalisations annuelles', icon: '📊', color: '#5521B5',
  hint: 'Saisir les chiffres réalisés sur l\'ensemble de l\'année académique (S1 + S2).',
  fields: [
    // Production
    { id: 'real_pub_soumises',  label: 'Publications soumises (total année)', type: 'number', required: true,  min: 0,
      hint: 'Tous articles envoyés à des journaux / conférences S1+S2' },
    { id: 'real_pub_acceptees', label: 'Publications acceptées',              type: 'number', required: true,  min: 0,
      validate: (v,f) => gtField('Acceptées','real_pub_soumises','soumises')(v,f) },
    { id: 'real_pub_q1q2',      label: 'Dont publications Q1/Q2',            type: 'number', required: false, min: 0,
      validate: (v,f) => gtField('Q1/Q2','real_pub_acceptees','acceptées')(v,f) },
    { id: 'real_pub_final',     label: 'Publications publiées (Final)',       type: 'number', required: false, min: 0 },
    { id: 'real_citations',     label: 'Citations reçues (Scopus)',           type: 'number', required: false, min: 0,
      hint: 'Vérifier sur votre profil Scopus' },
    { id: 'real_oa',            label: 'Publications Open Access',            type: 'number', required: false, min: 0,
      validate: (v,f) => gtField('OA','real_pub_acceptees','acceptées')(v,f) },
    { id: 'doi_list',           label: 'DOI des publications (vérification)', type: 'doi',    required: false,
      hint: 'Saisir un DOI par ligne — format 10.XXXX/XXXXX — vérification automatique' },
    { id: 'real_livres',        label: 'Livres & chapitres publiés',         type: 'number', required: false, min: 0 },
    // Projets
    { id: 'real_proj_soumis',   label: 'Projets soumis',                     type: 'number', required: true,  min: 0 },
    { id: 'real_proj_obtenus',  label: 'Projets obtenus / acceptés',         type: 'number', required: true,  min: 0,
      validate: (v,f) => gtField('Obtenus','real_proj_soumis','soumis')(v,f) },
    { id: 'real_budget',        label: 'Budget total obtenu (MAD)',           type: 'number', required: false, min: 0 },
    { id: 'real_proj_internat', label: 'Projets internationaux',             type: 'number', required: false, min: 0,
      validate: (v,f) => gtField('Internationaux','real_proj_obtenus','obtenus')(v,f) },
    // Rayonnement
    { id: 'real_conf_int',      label: 'Conférences internationales',        type: 'number', required: false, min: 0 },
    { id: 'real_comm_inv',      label: 'Communications invitées',            type: 'number', required: false, min: 0 },
    { id: 'real_brev_dep',      label: 'Brevets déposés',                    type: 'number', required: false, min: 0 },
    { id: 'real_brev_acc',      label: 'Brevets acceptés',                   type: 'number', required: false, min: 0,
      validate: (v,f) => gtField('Acceptés','real_brev_dep','déposés')(v,f) },
    { id: 'real_proto',         label: 'Prototypes / Transferts technologiques', type: 'number', required: false, min: 0 },
    // Formation
    { id: 'real_h_init',        label: 'H. Formation initiale (S1+S2)',      type: 'number', required: true,  min: 0 },
    { id: 'real_h_exec',        label: 'H. Formation exécutive (S1+S2)',     type: 'number', required: false, min: 0 },
    { id: 'real_h_doct',        label: 'H. Formation doctorale (S1+S2)',     type: 'number', required: false, min: 0 },
    { id: 'real_doctorants',    label: 'Doctorants encadrés (total en cours)',type: 'number', required: true,  min: 0 },
    { id: 'real_theses_sout',   label: 'Thèses soutenues cette année',       type: 'number', required: false, min: 0,
      validate: (v,f) => gtField('Soutenues','real_doctorants','encadrés')(v,f) },
    { id: 'real_pfe',           label: 'PFE / Masters encadrés',             type: 'number', required: false, min: 0 },
    // Prestations
    { id: 'real_nb_prest',      label: 'Nb. prestations de service',         type: 'number', required: false, min: 0 },
    { id: 'real_revenus',       label: 'Revenus prestations (MAD)',          type: 'number', required: false, min: 0 },
    // Commentaires
    { id: 'faits_marquants',    label: 'Faits marquants de l\'année',        type: 'textarea', required: false,
      placeholder: 'Prix & distinctions, nouvelles collaborations, événements marquants...' },
    { id: 'justif_ecarts',      label: 'Justification des écarts (si ≥ 20%)',type: 'textarea', required: false,
      hint: 'Obligatoire pour tout écart dépassant 20% par rapport aux prévisions',
      placeholder: 'Expliquer les raisons des écarts entre objectifs et réalisations...' },
    { id: 'perspectives',       label: 'Perspectives pour l\'année suivante', type: 'textarea', required: false,
      placeholder: 'Publications prévues, projets à soumettre, nouvelles initiatives...' },
    { id: 'besoins_support',    label: 'Besoins de support (Direction)',      type: 'textarea', required: false,
      placeholder: 'Ressources, équipements, budget, formations, partenariats souhaités...' },
  ],
}

// ── Tables détaillées des réalisations ───────────────────────────────────
export const DETAIL_TABLES = [
  {
    id: 'pub_detail',
    title: 'Publications — Détail Scopus',
    icon: '🔬',
    color: '#047481',
    hint: 'Saisir chaque publication individuellement — Format conforme Scopus',
    cols: [
      { id: 'authors',   label: 'Author(s)',                  type: 'text',   w: 160, required: true  },
      { id: 'title',     label: 'Document title',             type: 'text',   w: 220, required: true  },
      { id: 'year',      label: 'Year',                       type: 'select', w: 80,  required: true,  options: PUBLICATION_YEARS },
      { id: 'semester',  label: 'Sem.',                       type: 'select', w: 70,  required: true,  options: ['S1', 'S2'] },
      { id: 'source',    label: 'Source title',               type: 'text',   w: 160, required: true  },
      { id: 'vol_pages', label: 'Volume, issue, pages',       type: 'text',   w: 120, required: false },
      { id: 'citations', label: 'Citations',                  type: 'number', w: 80,  required: false, min: 0 },
      { id: 'doc_type',  label: 'Source & document type',     type: 'select', w: 150, required: true,  options: PUB_DOC_TYPES },
      { id: 'stage',     label: 'Publication stage',          type: 'select', w: 130, required: true,  options: PUB_STAGES },
      { id: 'doi',       label: 'DOI',                        type: 'doi',    w: 180, required: false },
      { id: 'oa',        label: 'Open access',                type: 'select', w: 110, required: false, options: OA_TYPES },
      { id: 'eid',       label: 'EID Scopus',                 type: 'text',   w: 140, required: false },
      { id: 'comment',   label: 'Commentaire',                type: 'text',   w: 130, required: false },
    ],
    aggregates: [
      { k: 'Total',          fn: r => r.length },
      { k: 'Final/Accepté',  fn: r => r.filter(x=>['Final','Accepted','Article in Press'].includes(x.stage)).length },
      { k: 'Citations',      fn: r => r.reduce((a,x)=>a+(+x.citations||0),0) },
      { k: 'Open Access',    fn: r => r.filter(x=>x.oa && x.oa!=='None').length },
      { k: 'S1',             fn: r => r.filter(x=>x.semester==='S1').length },
      { k: 'S2',             fn: r => r.filter(x=>x.semester==='S2').length },
    ],
  },
  {
    id: 'proj_detail',
    title: 'Projets de recherche — Détail',
    icon: '💰',
    color: '#057A55',
    hint: 'Un projet par ligne — Statut : Soumis / Accepté / Rejeté / En cours / Terminé',
    cols: [
      { id: 'annee',    label: 'Année',          type: 'select', w: 80,  required: true,  options: PUBLICATION_YEARS },
      { id: 'type',     label: 'Type',           type: 'select', w: 110, required: true,
        options: ['National','International','Industriel','Institutionnel UM6P','Bilatéral'] },
      { id: 'intitule', label: 'Intitulé',       type: 'text',   w: 200, required: true  },
      { id: 'role',     label: 'Rôle',           type: 'select', w: 100, required: true,
        options: ['PI','Co-PI','Participant','Coordinateur','Consultant'] },
      { id: 'statut',   label: 'Statut',         type: 'select', w: 100, required: true,
        options: ['Soumis','Accepté','Rejeté','En cours','Terminé'] },
      { id: 'financeur',label: 'Financeur',      type: 'text',   w: 130, required: false },
      { id: 'budget',   label: 'Budget (MAD)',   type: 'number', w: 120, required: false, min: 0 },
      { id: 'debut',    label: 'Début',          type: 'text',   w: 80,  required: false },
      { id: 'fin',      label: 'Fin',            type: 'text',   w: 80,  required: false },
    ],
    aggregates: [
      { k: 'Soumis',      fn: r => r.filter(x=>['Soumis','Accepté','Rejeté'].includes(x.statut)).length },
      { k: 'Obtenus',     fn: r => r.filter(x=>['Accepté','En cours','Terminé'].includes(x.statut)).length },
      { k: 'Budget (MAD)',fn: r => r.filter(x=>['Accepté','En cours','Terminé'].includes(x.statut)).reduce((a,x)=>a+(+x.budget||0),0).toLocaleString('fr-MA') },
      { k: 'Internationaux',fn: r => r.filter(x=>['International','Bilatéral'].includes(x.type)).length },
    ],
  },
  {
    id: 'ray_detail',
    title: 'Rayonnement & Valorisation — Détail',
    icon: '🌍',
    color: '#5521B5',
    hint: 'Conférences, brevets, prototypes, transferts de technologie',
    cols: [
      { id: 'annee',     label: 'Année',         type: 'select', w: 80,  required: true,  options: PUBLICATION_YEARS },
      { id: 'categorie', label: 'Catégorie',     type: 'select', w: 170, required: true,
        options: ['Conférence internationale','Communication invitée','Brevet déposé','Brevet accepté','Prototype','Transfert technologique','Startup','Prix & Distinction'] },
      { id: 'titre',     label: 'Titre / Intitulé',type:'text',  w: 200, required: true  },
      { id: 'support',   label: 'Événement / Support',type:'text',w:150, required: false },
      { id: 'pays',      label: 'Pays',          type: 'text',   w: 90,  required: false },
      { id: 'trl',       label: 'TRL',           type: 'select', w: 70,  required: false, options: TRL_LEVELS },
      { id: 'statut',    label: 'Statut',        type: 'select', w: 100, required: false,
        options: ['Prévu','Réalisé','Soumis','Accepté'] },
      { id: 'revenus',   label: 'Revenus (MAD)', type: 'number', w: 110, required: false, min: 0 },
    ],
    aggregates: [
      { k: 'Conférences int.', fn: r => r.filter(x=>x.categorie==='Conférence internationale').length },
      { k: 'Comm. invitées',   fn: r => r.filter(x=>x.categorie==='Communication invitée').length },
      { k: 'Brevets déposés',  fn: r => r.filter(x=>x.categorie==='Brevet déposé').length },
      { k: 'Prototypes',       fn: r => r.filter(x=>['Prototype','Transfert technologique','Startup'].includes(x.categorie)).length },
    ],
  },
  {
    id: 'form_detail',
    title: 'Formation & Encadrement — Détail',
    icon: '🎓',
    color: '#5521B5',
    hint: 'Saisir les heures par semestre, type et activité',
    cols: [
      { id: 'semester',  label: 'Sem.',         type: 'select', w: 70,  required: true,  options: ['S1','S2'] },
      { id: 'type_form', label: 'Type',         type: 'select', w: 170, required: true,
        options: ['Formation Initiale','Formation Exécutive','Formation Doctorale'] },
      { id: 'activite',  label: 'Activité',     type: 'select', w: 190, required: true,
        options: ['Animation cours','Conception cours','Préparation examens','Encadrement PFE','Encadrement stages','Conception programmes','Cours doctoraux','Encadrement thèses'] },
      { id: 'filiere',   label: 'Filière / Programme', type: 'text', w: 160, required: false },
      { id: 'h_prev',    label: 'H. Prévues',   type: 'number', w: 90,  required: false, min: 0 },
      { id: 'h_real',    label: 'H. Réalisées', type: 'number', w: 90,  required: true,  min: 0 },
    ],
    aggregates: [
      { k: 'H. Initiale',  fn: r => r.filter(x=>x.type_form==='Formation Initiale').reduce((a,x)=>a+(+x.h_real||0),0) },
      { k: 'H. Exécutive', fn: r => r.filter(x=>x.type_form==='Formation Exécutive').reduce((a,x)=>a+(+x.h_real||0),0) },
      { k: 'H. Doctorale', fn: r => r.filter(x=>x.type_form==='Formation Doctorale').reduce((a,x)=>a+(+x.h_real||0),0) },
      { k: 'Total S1',     fn: r => r.filter(x=>x.semester==='S1').reduce((a,x)=>a+(+x.h_real||0),0) },
      { k: 'Total S2',     fn: r => r.filter(x=>x.semester==='S2').reduce((a,x)=>a+(+x.h_real||0),0) },
    ],
  },
  {
    id: 'prest_detail',
    title: 'Prestations de service — Détail',
    icon: '💼',
    color: '#B45309',
    hint: 'Montant = Jours homme × Tarif journalier (saisir les deux pour calcul auto)',
    cols: [
      { id: 'annee',    label: 'Année',          type: 'select', w: 80,  required: true,  options: PUBLICATION_YEARS },
      { id: 'intitule', label: 'Mission',         type: 'text',   w: 200, required: true  },
      { id: 'type',     label: 'Type',           type: 'select', w: 140, required: true,
        options: ['Expertise technique','Audit / Diagnostic','Formation continue','Consulting','Étude de faisabilité','Autre'] },
      { id: 'client',   label: 'Client',         type: 'text',   w: 130, required: false },
      { id: 'role',     label: 'Rôle',           type: 'select', w: 130, required: false,
        options: ['Responsable (lead)','Co-responsable','Contributeur','Expert associé'] },
      { id: 'jours',    label: 'Jours',          type: 'number', w: 70,  required: false, min: 0 },
      { id: 'tarif',    label: 'Tarif/j (MAD)', type: 'number', w: 100, required: false, min: 0 },
      { id: 'montant',  label: 'Montant (MAD)', type: 'number', w: 110, required: false, min: 0 },
      { id: 'statut',   label: 'Statut',         type: 'select', w: 90,  required: false,
        options: ['Planifié','En cours','Réalisé','Facturé','Annulé'] },
    ],
    aggregates: [
      { k: 'Nb. missions',     fn: r => r.length },
      { k: 'Revenus (MAD)',    fn: r => r.reduce((a,x)=>a+(+x.montant||0),0).toLocaleString('fr-MA') },
      { k: 'Jours totaux',     fn: r => r.reduce((a,x)=>a+(+x.jours||0),0) },
      { k: 'Missions lead',    fn: r => r.filter(x=>x.role==='Responsable (lead)').length },
    ],
  },
]

// ── Toutes les sections ordonnées par mode ────────────────────────────────
export function getSectionsForMode(mode) {
  if (mode === 'prevision')    return [IDENTIFICATION, PREVISIONS]
  if (mode === 'revision_s1')  return [IDENTIFICATION, REVISION]
  if (mode === 'bilan_annuel') return [IDENTIFICATION, REALISATIONS_FIELDS]
  return []
}

// ── Liste plate de tous les IDs pour l'export ─────────────────────────────
export const ALL_KPI_IDS = [
  'nom','email','grade','axe_recherche','annee_integ','annee_academique','orcid','scopus_url',
  'prev_pub_total','prev_pub_q1q2','prev_citations','prev_projets','prev_budget','prev_conf','prev_brevets',
  'prev_h_init','prev_h_exec','prev_h_doct','prev_doctorants','prev_pfe','prev_prestations','prev_revenus','objectifs_texte',
  'rev_pub_total','rev_pub_q1q2','rev_projets','rev_budget','rev_h_init','rev_doctorants','rev_prestations','rev_revenus','rev_justification',
  'real_pub_soumises','real_pub_acceptees','real_pub_q1q2','real_pub_final','real_citations','real_oa','doi_list','real_livres',
  'real_proj_soumis','real_proj_obtenus','real_budget','real_proj_internat',
  'real_conf_int','real_comm_inv','real_brev_dep','real_brev_acc','real_proto',
  'real_h_init','real_h_exec','real_h_doct','real_doctorants','real_theses_sout','real_pfe',
  'real_nb_prest','real_revenus',
  'faits_marquants','justif_ecarts','perspectives','besoins_support',
]
