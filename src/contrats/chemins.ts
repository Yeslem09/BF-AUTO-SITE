/**
 * Adresses publiques des pages. Partagées parce que la navigation, le pied de
 * page et les liens entre contextes doivent tous pointer au même endroit.
 *
 * Vocabulaire : le « diagnostic » désigne uniquement l'examen à l'atelier ;
 * l'orientation par questions en ligne s'appelle le « pré-diagnostic ».
 */
export const CHEMINS = {
  accueil: '/',
  preDiagnostic: '/pre-diagnostic',
  /** Liste des familles d'intervention ; une famille : `/pieces-et-reparations/<famille>`. */
  catalogue: '/pieces-et-reparations',
  tarifs: '/tarifs',
  demande: '/demande',
  demandeEnvoyee: '/demande/envoyee',
  acces: '/acces-et-horaires',
  droits: '/vos-droits',
  /** Redirection vers le formulaire d'avis de la fiche Google. */
  avis: '/avis',
  mentionsLegales: '/mentions-legales',
  confidentialite: '/confidentialite',
  garagiste: '/garagiste',
  garagisteConnexion: '/garagiste/connexion',
  /** Demandes reçues, tenues par le contexte demandes, citées par l'accueil de l'espace. */
  garagisteDemandes: '/garagiste/demandes',
  /** Fermetures exceptionnelles, tenues par le contexte garage, citées par l'accueil de l'espace. */
  garagisteFermetures: '/garagiste/fermetures',
} as const

export type Chemin = (typeof CHEMINS)[keyof typeof CHEMINS]

/** Les quatre types d'une demande, portés par le paramètre `type` de `/demande`. */
export const TYPES_DEMANDE = ['rendez-vous', 'devis', 'rappel'] as const

export type TypeDemande = (typeof TYPES_DEMANDE)[number]

/**
 * Paramètres de requête qui préremplissent une demande :
 * `/demande?type=devis&famille=<identifiant>` depuis le catalogue, avec
 * `&modalite=retrait` ou `&modalite=pose` pour pré-cocher le retrait au
 * garage ou la pose à l'atelier (`MODALITES_DEMANDE`), `&piece=<nom>` pour
 * pré-cocher une pièce de `ReferenceFamille.pieces` (nom exact, par exemple
 * « Plaquettes avant » depuis la ligne de tarif « Plaquettes avant posées »),
 * `&prestation=<nom>` pour une prestation de `ReferenceFamille.prestations`
 * (« Révision ») : ni pièces, ni gamme, ni retrait ; toute autre valeur de
 * `piece` ou de `prestation` est ignorée ;
 * `/demande?type=rappel&prediagnostic=<code>` depuis le pré-diagnostic.
 * Le mot « avis » est réservé aux avis Google : il n'apparaît jamais ici.
 */
export const PARAMETRES_DEMANDE = {
  type: 'type',
  famille: 'famille',
  prediagnostic: 'prediagnostic',
  modalite: 'modalite',
  piece: 'piece',
  prestation: 'prestation',
} as const

/**
 * Valeurs du paramètre `modalite` d'une demande de prix, quand la vente au
 * comptoir est publiée : la pièce seule, à retirer au garage, ou posée à
 * l'atelier. Le formulaire pré-coche le choix ; toute autre valeur est ignorée.
 */
export const MODALITES_DEMANDE = ['retrait', 'pose'] as const

export type ModaliteDemande = (typeof MODALITES_DEMANDE)[number]

/**
 * Paramètre de `/garagiste/connexion` : la page de l'espace garagiste demandée
 * avant la connexion, où revenir ensuite. La page de connexion n'y renvoie que
 * si la valeur est un chemin local de l'espace garagiste (pas de redirection ouverte).
 */
export const PARAMETRES_CONNEXION = {
  retour: 'retour',
} as const
