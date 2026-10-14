/**
 * Code d'un parcours terminé, placé dans le lien « Être rappelé »
 * (`/demande?type=rappel&prediagnostic=<code>`) : le symptôme, les signes
 * cochés puis les réponses, en codes fermés. Exemple :
 * `bruit.aucun.freinage.sifflement`. Aucune réponse n'est enregistrée : le
 * code suffit à reconstituer le parcours, et il ne contient rien de personnel.
 */

/** Ce qu'un code porte : les réponses, sans l'état d'affichage. */
export interface ReponsesCodees {
  readonly symptome: string | null
  readonly signes: readonly string[]
  readonly reponses: readonly string[]
}

const SEPARATEUR_PARTIES = '.'
const SEPARATEUR_SIGNES = '_'
/** Symptôme, signes, puis zéro à trois réponses : codes en minuscules, chiffres et tirets. */
const FORMAT_CODE = /^[a-z0-9-]+\.[a-z0-9-]+(?:_[a-z0-9-]+)*(?:\.[a-z0-9-]+)*$/
const LONGUEUR_MAX = 240

export function coderEtat(etat: ReponsesCodees): string {
  return [etat.symptome ?? '', etat.signes.join(SEPARATEUR_SIGNES), ...etat.reponses].join(
    SEPARATEUR_PARTIES,
  )
}

/** `null` si le texte n'a pas la forme d'un code ; sa validité se juge ensuite sur l'arbre. */
export function lireCode(code: string): ReponsesCodees | null {
  if (code.length > LONGUEUR_MAX || !FORMAT_CODE.test(code)) return null
  const [symptome = '', signes = '', ...reponses] = code.split(SEPARATEUR_PARTIES)
  return { symptome, signes: signes.split(SEPARATEUR_SIGNES), reponses }
}
