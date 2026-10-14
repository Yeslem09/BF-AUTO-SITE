/**
 * Typographie française à l'écran : une espace insécable avant « ? », « ! »,
 * « ; », « : » et « » », et après « « », pour qu'aucun de ces signes ne
 * commence une ligne sur un écran étroit ; et entre les paires de chiffres
 * d'un numéro de téléphone (« 06 12 34 56 78 »), qui se lit d'un bloc.
 *
 * S'applique aux textes affichés (libellés, messages, textes venus d'un autre
 * contexte), jamais à une valeur saisie renvoyée dans un champ : le client
 * doit retrouver ce qu'il a tapé. Idempotente.
 */

const ESPACE_INSECABLE = '\u00a0'
const ESPACE_AVANT_PONCTUATION_HAUTE = / ([?!;:»])/g
const ESPACE_APRES_GUILLEMET_OUVRANT = /« /g
/** Une paire de chiffres suivie d'une autre paire, et d'aucun autre chiffre. */
const ESPACE_ENTRE_PAIRES_DE_CHIFFRES = /(\d{2}) (?=\d{2}(?!\d))/g

export function insecables(texte: string): string {
  return texte
    .replace(ESPACE_AVANT_PONCTUATION_HAUTE, `${ESPACE_INSECABLE}$1`)
    .replace(ESPACE_APRES_GUILLEMET_OUVRANT, `«${ESPACE_INSECABLE}`)
    .replace(ESPACE_ENTRE_PAIRES_DE_CHIFFRES, `$1${ESPACE_INSECABLE}`)
}

/** Une heure (« 10 h », « 10 h 05 »), avec le « à » qui la précède s'il y en a un. */
const HEURE = /(à )?(\d{1,2}) h( \d{2})?(?!\d)/g

/**
 * « à 10 h 05 » se lit d'un bloc : dans une colonne étroite (tableau, carte
 * sur téléphone), l'heure ne se coupe jamais entre ses chiffres et son « h ».
 */
export function heureInsecable(texte: string): string {
  return texte.replace(
    HEURE,
    (_heure, a: string | undefined, heures: string, minutes: string | undefined) =>
      `${a === undefined ? '' : `à${ESPACE_INSECABLE}`}${heures}${ESPACE_INSECABLE}h${minutes === undefined ? '' : `${ESPACE_INSECABLE}${minutes.trim()}`}`,
  )
}
