// ══════════════════════════════════════════════════════════════════════════
// GSMI — Geology and Sustainable Mining Institute / UM6P
// Source unique de vérité — constantes partagées par tous les modules
// ══════════════════════════════════════════════════════════════════════════

export const GSMI_FULL_NAME = 'Geology and Sustainable Mining Institute'
export const GSMI_SHORT = 'GSMI'
export const GSMI_PARENT = 'UM6P'

export const ACADEMIC_YEARS = Array.from({ length: 10 }, (_, i) => `${2025 + i}/${2026 + i}`)

export const GRADES = [
  'Assistant Professor',
  'Associate Professor',
  'Full Professor',
  'Professeur Invité',
]

export const GSMI_AXES = [
  'Geology & Exploration',
  'Mine & Mineral Processing (MMP)',
  'Sustainable Mining & Environment (SME)',
]

export const INTEGRATION_YEARS = Array.from({ length: 20 }, (_, i) => String(2005 + i))

export const PUBLICATION_YEARS = Array.from({ length: 10 }, (_, i) => String(2025 + i))

export const PUB_STAGES   = ['Final', 'Article in Press', 'Accepted', 'Submitted', 'Withdrawn']
export const PUB_DOC_TYPES = ['Journal Article', 'Conference Paper', 'Review', 'Book Chapter', 'Book', 'Report', 'Other']
export const OA_TYPES      = ['None', 'Gold OA', 'Green OA', 'Hybrid Gold', 'Diamond OA']
export const TRL_LEVELS    = ['N/A', 'TRL 1', 'TRL 2', 'TRL 3', 'TRL 4', 'TRL 5', 'TRL 6', 'TRL 7', 'TRL 8', 'TRL 9']

export const ADMIN_CODE = '__GSMI_ADMIN_2025__'  // overridden by env

export const C = {
  navy:   '#0D1B2A',
  blue:   '#1A56DB',
  teal:   '#047481',
  green:  '#057A55',
  violet: '#5521B5',
  orange: '#B45309',
  red:    '#BE123C',
  gold:   '#FBBF24',
  amber:  '#D97706',
  g1:     '#F9FAFB',
  g2:     '#F3F4F6',
  g3:     '#E5E7EB',
  gt:     '#6B7280',
  gd:     '#111928',
  white:  '#FFFFFF',
}
