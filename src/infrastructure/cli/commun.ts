/** Outils communs aux commandes d'exploitation des connecteurs. */
import type { ResultatVerification } from '../connecteurs.js'
import { decrireEchec, type ErreurConnecteur } from '../erreurs.js'

export const CODES_SORTIE = { succes: 0, echec: 1, usage: 2 } as const

export type CodeSortie = (typeof CODES_SORTIE)[keyof typeof CODES_SORTIE]

export interface Sorties {
  readonly ecrire: (texte: string) => void
  readonly ecrireErreur: (texte: string) => void
}

/** Écrit des lignes, une par ligne de sortie. */
export function ecrireLignes(sorties: Sorties, lignes: readonly string[]): void {
  for (const ligne of lignes) sorties.ecrire(`${ligne}\n`)
}

/** Ligne de résultat d'une vérification, puis cause et remède en cas d'échec. */
export function lignesVerification(titre: string, resultat: ResultatVerification): string[] {
  switch (resultat.etat) {
    case 'inactif':
      return [`${titre} : non configuré`]
    case 'reussi':
      return [`${titre} : réussi, ${resultat.detail}`]
    case 'echec':
      return lignesEchec(titre, resultat.erreur)
  }
}

export function lignesEchec(titre: string, erreur: ErreurConnecteur): string[] {
  return [`${titre} : ÉCHEC`, ...decrireEchec(erreur).map((ligne) => `  ${ligne}`)]
}

/** Argument de ligne de commande : pnpm transmet parfois un `--` isolé, ignoré. */
export function argumentsUtiles(argumentsRecus: readonly string[]): string[] {
  return argumentsRecus.filter((argument) => argument !== '--')
}

const FUSEAU_AFFICHAGE = 'Europe/Paris'
const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU_AFFICHAGE,
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formaterDate(date: Date): string {
  return FORMAT_DATE.format(date)
}
