/**
 * Lecture d'un rapport de non-remise (RFC 3464) : action, destinataire,
 * code d'état et motif (Kano connecteurs, C5 et AT-C2). Fonction pure : elle
 * reçoit les textes du rapport, quelle que soit la partie qui les portait.
 */

export interface RapportLu {
  readonly action: 'echec' | 'retard'
  readonly destinataire: string | null
  readonly statut: string | null
  readonly motif: string | null
}

const LONGUEUR_MAX_MOTIF = 200
const LIGNE_CONTINUEE = /\r?\n[ \t]+/g
const RETOURS = /\r?\n/
const CHAMP = /^([A-Za-z-]+)\s*:\s*(.*)$/
const TYPE_ADRESSE = /^\s*(rfc822|utf-8)\s*;\s*/i
const TYPE_DIAGNOSTIC = /^\s*(smtp|x-[a-z-]+)\s*;\s*/i
const CODE_ETAT = /\b[245]\.\d{1,3}\.\d{1,3}\b/
const OBJET_RETARD = /delay|retard|différ|differ/i
/** Actions RFC 3464 : seules « failed » et « delayed » concernent un courriel non remis. */
const ACTIONS: Readonly<Record<string, RapportLu['action'] | null>> = {
  failed: 'echec',
  delayed: 'retard',
  delivered: null,
  relayed: null,
  expanded: null,
}

/**
 * `null` si le rapport annonce une remise réussie (« delivered », « relayed ») :
 * ce n'est pas une non-remise.
 */
export function lireRapportNonRemise(
  textes: readonly string[],
  objet: string | null,
  destinatairesEchoues: string | null,
): RapportLu | null {
  const champs = lireChamps(textes)
  const actionBrute = champs.get('action')?.toLowerCase() ?? null
  let action: RapportLu['action'] | null
  if (actionBrute === null) {
    action = OBJET_RETARD.test(objet ?? '') ? 'retard' : 'echec'
  } else {
    const connue = ACTIONS[actionBrute]
    action = connue === undefined ? 'echec' : connue
  }
  if (action === null) return null
  const adresse =
    champs.get('final-recipient') ??
    champs.get('original-recipient') ??
    destinatairesEchoues?.split(',')[0] ??
    null
  const diagnostic = champs.get('diagnostic-code') ?? null
  const statut = champs.get('status') ?? diagnostic ?? ''
  return {
    action,
    destinataire: adresse === null ? null : adresse.replace(TYPE_ADRESSE, '').trim().toLowerCase(),
    statut: CODE_ETAT.exec(statut)?.[0] ?? null,
    motif: diagnostic === null ? null : borner(diagnostic.replace(TYPE_DIAGNOSTIC, '')),
  }
}

/** Premier exemplaire de chaque champ, lignes repliées dépliées, noms en minuscules. */
function lireChamps(textes: readonly string[]): Map<string, string> {
  const champs = new Map<string, string>()
  for (const texte of textes) {
    for (const ligne of texte.replace(LIGNE_CONTINUEE, ' ').split(RETOURS)) {
      const trouve = CHAMP.exec(ligne.trim())
      const nom = trouve?.[1]?.toLowerCase()
      const valeur = trouve?.[2]?.trim()
      if (nom !== undefined && valeur !== undefined && valeur !== '' && !champs.has(nom)) {
        champs.set(nom, valeur)
      }
    }
  }
  return champs
}

function borner(texte: string): string {
  const uneLigne = texte.replace(/\s+/g, ' ').trim()
  return uneLigne.length > LONGUEUR_MAX_MOTIF
    ? `${uneLigne.slice(0, LONGUEUR_MAX_MOTIF)}...`
    : uneLigne
}
