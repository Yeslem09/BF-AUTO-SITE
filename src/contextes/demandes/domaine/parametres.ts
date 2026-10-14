import { ErreurDonneesDemandes } from './erreurs.js'
import type { NumeroRappel } from './numero-rappel.js'
import { normaliserTelephoneClient } from './telephone.js'

/** Paramètres des demandes propres au garage, lus dans `donnees/demandes.json`. */
export interface ParametresDemandes {
  readonly numeroRappel: NumeroRappel
}

const CLES_RACINE = new Set(['commentaire', 'numero_rappel'])
const CLES_VALEUR = new Set(['valeur', 'statut', 'source', 'note'])
const STATUTS = new Set(['valide', 'a_valider'])

type Objet = Readonly<Record<string, unknown>>

function estObjet(valeur: unknown): valeur is Objet {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

/**
 * Valide le contenu du fichier. Tous les problèmes sont rassemblés : un
 * démarrage raté dit tout d'un coup. Une valeur à valider peut porter une
 * proposition (montrée en démonstration), jamais un faux fait (D8).
 */
export function lireParametresDemandes(contenu: unknown): ParametresDemandes {
  const problemes: string[] = []
  if (!estObjet(contenu)) throw new ErreurDonneesDemandes(['la racine doit être un objet'])
  for (const cle of Object.keys(contenu)) {
    if (!CLES_RACINE.has(cle)) problemes.push(`clé inconnue « ${cle} »`)
  }
  const numero = contenu['numero_rappel']
  if (!estObjet(numero)) {
    throw new ErreurDonneesDemandes([...problemes, 'numero_rappel : objet attendu'])
  }
  for (const cle of Object.keys(numero)) {
    if (!CLES_VALEUR.has(cle)) problemes.push(`numero_rappel : clé inconnue « ${cle} »`)
  }
  const statut = numero['statut']
  if (typeof statut !== 'string' || !STATUTS.has(statut)) {
    problemes.push('numero_rappel.statut : « valide » ou « a_valider » attendu')
  }
  if (typeof numero['source'] !== 'string' || numero['source'].trim() === '') {
    problemes.push('numero_rappel.source : texte attendu (qui a donné ou proposé la valeur)')
  }
  const valeur = numero['valeur']
  const telephone = typeof valeur === 'string' ? normaliserTelephoneClient(valeur) : null
  if (valeur !== null && telephone === null) {
    problemes.push('numero_rappel.valeur : numéro français ou null attendu')
  }
  if (statut === 'valide' && valeur === null) {
    problemes.push('numero_rappel.valeur : obligatoire quand le statut est « valide »')
  }
  if (problemes.length > 0) throw new ErreurDonneesDemandes(problemes)
  return {
    numeroRappel: { telephone, statut: statut === 'valide' ? 'valide' : 'a_valider' },
  }
}
