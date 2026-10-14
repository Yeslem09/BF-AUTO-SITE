import type { DemiJourneeProposee, MomentReponse } from '../../../contrats/index.js'
import { dateAParis, estDateValide, jourEnLettres } from './temps.js'

/**
 * Rappel promis au client après l'envoi (Kano AT-3, US-13). La phrase vient
 * du garage (contrat `AnnoncerRappel`) ; la date et la demi-journée sont
 * retenues au même instant, pour que le garagiste voie ce qui a été promis
 * (« Promis au client : jeudi 24 septembre, en fin de journée ») et que le
 * garage le prévienne s'il ferme ce jour-là (contrat `ListerRappelsPromis`).
 * Jamais une heure, jamais une mesure de délai (AE-34, AE-36).
 */

export const DEMI_JOURNEES = ['matin', 'apres-midi'] as const

export type DemiJournee = (typeof DEMI_JOURNEES)[number]

export interface EcheanceRappel {
  /** Date promise, heure de Paris : `AAAA-MM-JJ`. */
  readonly date: string
  readonly demiJournee: DemiJournee
}

export interface PromesseRappel extends EcheanceRappel {
  /** Phrase lue par le client sur sa confirmation : « Nous vous rappelons jeudi, en fin de journée. » */
  readonly phrase: string
}

/**
 * Demi-journée où rappeler selon le moment où le client peut répondre ;
 * `null` : la première venue. Même règle que l'annonce du garage : « à midi »
 * se tient à la fin du matin, « en fin de journée » l'après-midi.
 */
const DEMI_JOURNEE_DU_MOMENT: Readonly<Record<MomentReponse, DemiJournee | null>> = {
  'des-que-possible': null,
  matin: 'matin',
  midi: 'matin',
  'fin-de-journee': 'apres-midi',
}

/** Code stable d'une demi-journée proposée par le garage : `2026-09-24-matin` (contrat). */
const CODE_DEMI_JOURNEE = /^(\d{4}-\d{2}-\d{2})-(matin|apres-midi)$/

function lireCode(code: string): EcheanceRappel | null {
  const lu = CODE_DEMI_JOURNEE.exec(code)
  const date = lu?.[1]
  const demiJournee = DEMI_JOURNEES.find((connue) => connue === lu?.[2])
  if (date === undefined || demiJournee === undefined || !estDateValide(date)) return null
  return { date, demiJournee }
}

/**
 * Échéance du rappel annoncé : la première demi-journée d'ouverture proposée
 * qui convient au client ; `null` si aucune ne convient ou ne se lit.
 */
export function echeanceDuRappel(
  demiJournees: readonly DemiJourneeProposee[],
  moment: MomentReponse,
): EcheanceRappel | null {
  const voulue = DEMI_JOURNEE_DU_MOMENT[moment]
  for (const proposee of demiJournees) {
    const echeance = lireCode(proposee.code)
    if (echeance !== null && (voulue === null || echeance.demiJournee === voulue)) return echeance
  }
  return null
}

/** Le moment promis dans la journée, en toutes lettres : « le matin », « à midi »... */
export function quandPromis(moment: MomentReponse, demiJournee: DemiJournee): string {
  switch (moment) {
    case 'midi':
      return 'à midi'
    case 'fin-de-journee':
      return 'en fin de journée'
    case 'matin':
    case 'des-que-possible':
      return demiJournee === 'matin' ? 'le matin' : 'l’après-midi'
  }
}

/**
 * La promesse lue par le garagiste, à l'instant `maintenant` : « ce matin »,
 * « aujourd’hui, en fin de journée », « jeudi 24 septembre, à midi ». Le jour
 * est toujours nommé, jamais « demain » : lu la nuit, « demain » se trompe de jour.
 */
export function libellePromesse(
  promesse: EcheanceRappel,
  moment: MomentReponse,
  maintenant: Date,
): string {
  const quand = quandPromis(moment, promesse.demiJournee)
  if (promesse.date === dateAParis(maintenant)) {
    if (quand === 'le matin') return 'ce matin'
    if (quand === 'l’après-midi') return 'cet après-midi'
    return `aujourd’hui, ${quand}`
  }
  return `${jourEnLettres(promesse.date, maintenant)}, ${quand}`
}

/** Rang d'une échéance, pour trier : par date, puis le matin avant l'après-midi. */
export function rangEcheance(echeance: EcheanceRappel): string {
  return `${echeance.date}-${DEMI_JOURNEES.indexOf(echeance.demiJournee)}`
}
