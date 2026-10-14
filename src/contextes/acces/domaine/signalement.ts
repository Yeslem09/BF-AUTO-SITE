/**
 * Signalement d'un changement (Kano D5, US-49) : le garagiste ne touche à
 * aucun fichier, il envoie un message structuré à Anthony, qui met à jour la
 * source unique versionnée.
 */
export const NATURES_CHANGEMENT = [
  { code: 'horaires', libelle: 'Horaires habituels' },
  { code: 'prix', libelle: 'Prix' },
  { code: 'prestation', libelle: 'Prestation' },
  { code: 'autre', libelle: 'Autre' },
] as const

export type NatureChangement = (typeof NATURES_CHANGEMENT)[number]['code']

/** Un texte court : ce qui change, en quelques phrases. */
export const TEXTE_SIGNALEMENT_MAX = 500

export interface Signalement {
  readonly nature: NatureChangement
  readonly texte: string
}

/** Saisie telle que reçue du formulaire, rendue au formulaire si elle est refusée. */
export interface SaisieSignalement {
  readonly nature: string
  readonly texte: string
}

export type ChampSignalement = keyof SaisieSignalement
export type ErreursSignalement = Partial<Record<ChampSignalement, string>>

export type LectureSignalement =
  | { readonly valide: true; readonly signalement: Signalement }
  | {
      readonly valide: false
      readonly saisie: SaisieSignalement
      readonly erreurs: ErreursSignalement
    }

export const SAISIE_VIDE: SaisieSignalement = { nature: '', texte: '' }

/** Retour à la ligne tel qu'un formulaire l'envoie (CRLF) ou qu'un autre client l'écrit (CR). */
const RETOUR_A_LA_LIGNE_ENVOYE = /\r\n?/g

function texteRecu(valeur: unknown): string {
  return typeof valeur === 'string' ? valeur : ''
}

/**
 * Un navigateur compte un retour à la ligne pour un caractère dans `maxlength`,
 * mais l'envoie sous la forme CRLF (deux caractères) : on le ramène à un seul
 * avant de compter, sinon un texte accepté par le champ serait refusé ici.
 */
function texteNormalise(valeur: unknown): string {
  return texteRecu(valeur).replace(RETOUR_A_LA_LIGNE_ENVOYE, '\n').trim()
}

export function libelleNature(nature: NatureChangement): string {
  return NATURES_CHANGEMENT.find((connue) => connue.code === nature)?.libelle ?? nature
}

/** Valide la saisie ; chaque erreur dit quoi faire, champ par champ. */
export function lireSignalement(recue: {
  readonly nature?: unknown
  readonly texte?: unknown
}): LectureSignalement {
  const saisie: SaisieSignalement = {
    nature: texteRecu(recue.nature),
    texte: texteNormalise(recue.texte),
  }
  const erreurs: ErreursSignalement = {}
  const nature = NATURES_CHANGEMENT.find((connue) => connue.code === saisie.nature)?.code
  if (nature === undefined) erreurs.nature = 'Choisissez ce qui change.'
  if (saisie.texte === '') {
    erreurs.texte = 'Décrivez le changement en quelques mots.'
  } else if (saisie.texte.length > TEXTE_SIGNALEMENT_MAX) {
    erreurs.texte = `Votre texte fait ${saisie.texte.length} caractères : ${TEXTE_SIGNALEMENT_MAX} au plus.`
  }
  if (nature === undefined || Object.keys(erreurs).length > 0) {
    return { valide: false, saisie, erreurs }
  }
  return { valide: true, signalement: { nature, texte: saisie.texte } }
}
