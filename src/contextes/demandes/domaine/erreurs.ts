/** Fichier de données des demandes invalide : chaque problème nomme le champ fautif. */
export class ErreurDonneesDemandes extends Error {
  override readonly name = 'ErreurDonneesDemandes'

  constructor(readonly problemes: readonly string[]) {
    super(
      `Données des demandes invalides :\n${problemes.map((probleme) => `- ${probleme}`).join('\n')}`,
    )
  }
}

/** Le notificateur n'a pas pu remettre le message : la demande reste enregistrée et sera renvoyée. */
export class ErreurNotification extends Error {
  override readonly name = 'ErreurNotification'
}
