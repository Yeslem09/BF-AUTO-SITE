/** Fichier du catalogue invalide : chaque problème nomme le champ fautif. */
export class ErreurDonneesCatalogue extends Error {
  override readonly name = 'ErreurDonneesCatalogue'

  constructor(readonly problemes: readonly string[]) {
    super(
      `Données du catalogue invalides :\n${problemes.map((probleme) => `- ${probleme}`).join('\n')}`,
    )
  }
}
