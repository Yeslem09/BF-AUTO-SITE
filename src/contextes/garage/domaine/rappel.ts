import type { MomentReponse } from '../../../contrats/index.js'
import type { CalendrierConnu } from './calendrier.js'
import { dateEnLettres } from './dates-francaises.js'
import { prochainesDemiJournees, type DemiJournee, type Moment } from './demi-journees.js'
import { ECART_MAX_JOUR_NOMME } from './statut-ouverture.js'
import {
  ecartEnJours,
  jourDeLaSemaine,
  type DateCalendaire,
  type InstantLocal,
} from './temps-local.js'

/**
 * Délais de rappel que le garage peut valider. Un seul pour l'instant : la
 * prochaine demi-journée d'ouverture (Kano AT-3).
 */
export const DELAIS_RAPPEL = ['prochaine-demi-journee'] as const

export type DelaiRappel = (typeof DELAIS_RAPPEL)[number]

/**
 * Demi-journée où rappeler selon le moment où le client peut répondre, et la
 * précision qui s'ajoute au jour. `null` : n'importe quelle demi-journée.
 */
const CIBLES: Readonly<
  Record<MomentReponse, { readonly moment: Moment | null; readonly precision: string | null }>
> = {
  'des-que-possible': { moment: null, precision: null },
  matin: { moment: 'matin', precision: null },
  midi: { moment: 'matin', precision: 'à midi' },
  'fin-de-journee': { moment: 'apres-midi', precision: 'en fin de journée' },
}

/**
 * Phrase de rappel annoncée après une demande (Kano AT-3, US-13) : la première
 * demi-journée d'ouverture qui n'a pas encore commencé et où le client peut
 * répondre, fermetures exceptionnelles comprises. Jamais une heure : une
 * promesse à l'heure près serait rompue plus souvent que tenue. `null` si
 * aucune ouverture n'est en vue.
 */
export function annoncerRappel(
  calendrier: CalendrierConnu,
  envoi: InstantLocal,
  moment: MomentReponse,
): string | null {
  const cible = CIBLES[moment]
  const retenue = prochainesDemiJournees(calendrier, envoi, Number.POSITIVE_INFINITY).find(
    (demiJournee) => cible.moment === null || demiJournee.moment === cible.moment,
  )
  if (retenue === undefined) return null
  const quand =
    cible.precision === null
      ? designerDemiJournee(retenue, envoi.date)
      : `${designerJour(retenue.date, envoi.date)}, ${cible.precision}`
  return `Nous vous rappelons ${quand}.`
}

/** « ce matin », « cet après-midi », « jeudi matin », « le jeudi 8 octobre au matin ». */
function designerDemiJournee(demiJournee: DemiJournee, aujourdhui: DateCalendaire): string {
  const ecart = ecartEnJours(aujourdhui, demiJournee.date)
  const matin = demiJournee.moment === 'matin'
  if (ecart === 0) return matin ? 'ce matin' : 'cet après-midi'
  if (ecart <= ECART_MAX_JOUR_NOMME) {
    return `${jourDeLaSemaine(demiJournee.date)} ${matin ? 'matin' : 'après-midi'}`
  }
  const date = dateEnLettres(demiJournee.date)
  return matin ? `le ${date} au matin` : `le ${date} dans l’après-midi`
}

/** « aujourd’hui », « jeudi », « le jeudi 8 octobre ». */
function designerJour(date: DateCalendaire, aujourdhui: DateCalendaire): string {
  const ecart = ecartEnJours(aujourdhui, date)
  if (ecart === 0) return 'aujourd’hui'
  if (ecart <= ECART_MAX_JOUR_NOMME) return jourDeLaSemaine(date)
  return `le ${dateEnLettres(date)}`
}
