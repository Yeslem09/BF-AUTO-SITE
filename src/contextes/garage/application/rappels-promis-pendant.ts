import type { PeriodeFermeture } from '../domaine/fermeture.js'
import { dateIso } from '../domaine/temps-local.js'
import type { ListerRappelsPromis, RappelPromisLu } from './ports.js'

export type RappelsPromisPendant = (
  periode: Pick<PeriodeFermeture, 'du' | 'au'>,
) => Promise<readonly RappelPromisLu[]>

/**
 * Rappels promis aux clients pendant une fermeture, pour que le garagiste les
 * prévienne avant de fermer (« 1 client attend votre rappel aujourd'hui »).
 * Sans la capacité des demandes, aucune alerte : jamais une liste inventée.
 */
export function creerRappelsPromisPendant(
  lister: ListerRappelsPromis | null,
): RappelsPromisPendant {
  return async ({ du, au }) => (lister === null ? [] : lister(dateIso(du), dateIso(au)))
}
