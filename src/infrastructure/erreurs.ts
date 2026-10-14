/**
 * Erreurs des connecteurs : chaque échec porte sa nature et son remède, du
 * connecteur jusqu'au journal et aux commandes de test (piège 22 : la cause
 * n'est jamais avalée par une bibliothèque). Aucun secret n'y figure jamais.
 */

export const NATURES_ECHEC = [
  'identifiants',
  'injoignable',
  'delai',
  'certificat',
  'refus',
  'configuration',
  'autre',
] as const

export type NatureEchec = (typeof NATURES_ECHEC)[number]

export const LIBELLES_NATURE: Readonly<Record<NatureEchec, string>> = {
  identifiants: 'identifiants refusés',
  injoignable: 'serveur injoignable',
  delai: 'délai dépassé',
  certificat: 'chiffrement impossible (certificat ou TLS)',
  refus: 'demande refusée par le serveur',
  configuration: 'réglage incorrect',
  autre: 'échec',
}

/** Longueur maximale d'un détail venu d'un serveur : assez pour le code et le motif. */
const LONGUEUR_MAX_DETAIL = 300

export class ErreurConnecteur extends Error {
  override readonly name = 'ErreurConnecteur'

  /**
   * @param connecteur nom lisible du connecteur (« Envoi SMTP », « SMS OVH »...)
   * @param detail ce que le serveur ou la bibliothèque a dit, sans secret
   * @param remede ce qu'il faut faire, en français, pour un non-informaticien
   */
  constructor(
    readonly connecteur: string,
    readonly nature: NatureEchec,
    readonly detail: string,
    readonly remede: string,
  ) {
    super(`${connecteur} : ${LIBELLES_NATURE[nature]}. ${detail}`)
  }
}

/** Message d'une erreur quelconque, sur une ligne et borné (les réponses de serveur sont parfois longues). */
export function detailDe(erreur: unknown): string {
  const brut = erreur instanceof Error ? erreur.message : String(erreur)
  const uneLigne = brut.replace(/\s+/g, ' ').trim()
  return uneLigne.length > LONGUEUR_MAX_DETAIL
    ? `${uneLigne.slice(0, LONGUEUR_MAX_DETAIL)}...`
    : uneLigne
}

const REMEDE_INATTENDU =
  'Relancez la commande de test ; si l’erreur persiste, transmettez ce message à Anthony.'

/** Toute erreur en `ErreurConnecteur` : une erreur déjà nommée est gardée telle quelle. */
export function enErreurConnecteur(erreur: unknown, connecteur: string): ErreurConnecteur {
  return erreur instanceof ErreurConnecteur
    ? erreur
    : new ErreurConnecteur(connecteur, 'autre', detailDe(erreur), REMEDE_INATTENDU)
}

/** Présentation d'un échec pour un humain : ce qui s'est passé, puis quoi faire. */
export function decrireEchec(erreur: ErreurConnecteur): string[] {
  return [
    `${erreur.connecteur} : ${LIBELLES_NATURE[erreur.nature]}.`,
    `  Détail : ${erreur.detail}`,
    `  Que faire : ${erreur.remede}`,
  ]
}
