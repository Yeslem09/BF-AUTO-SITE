/** Données du garage invalides : chaque problème nomme le champ fautif. */
export class ErreurDonneesGarage extends Error {
  override readonly name = 'ErreurDonneesGarage'

  constructor(readonly problemes: readonly string[]) {
    super(
      `Données du garage invalides :\n${problemes.map((probleme) => `- ${probleme}`).join('\n')}`,
    )
  }
}
