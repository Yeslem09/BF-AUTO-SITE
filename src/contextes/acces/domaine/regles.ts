/**
 * Règles chiffrées de l'accès à l'espace garagiste (Kano D5, US-33). Les
 * textes affichés et envoyés citent ces constantes : changer une règle change
 * aussi ce qui en est dit.
 */
export const MINUTE_MS = 60_000
const HEURE_MS = 60 * MINUTE_MS
const JOUR_MS = 24 * HEURE_MS

/** Un lien de connexion ne sert qu'une fois et vaut 15 minutes. */
export const DUREE_LIEN_MINUTES = 15
export const DUREE_LIEN_MS = DUREE_LIEN_MINUTES * MINUTE_MS

/** Une session dure 90 jours glissants : chaque usage repousse l'échéance. */
export const DUREE_SESSION_JOURS = 90
export const DUREE_SESSION_MS = DUREE_SESSION_JOURS * JOUR_MS

/** L'échéance d'une session n'est réécrite en base qu'une fois par jour au plus. */
export const PAS_DE_PROLONGATION_MS = JOUR_MS

/**
 * Un lien utilisé ou expiré reste connu un jour : on peut alors répondre « déjà
 * servi » ou « expiré » plutôt que « inconnu », puis il est purgé.
 */
export const CONSERVATION_LIEN_MS = JOUR_MS

/** Fenêtre glissante de la limitation des demandes de lien. */
export const FENETRE_LIMITATION_MS = HEURE_MS

/** Demandes de lien acceptées par adresse client dans la fenêtre. */
export const DEMANDES_MAX_PAR_ADRESSE = 5

/**
 * Au-delà de ce nombre de demandes reçues dans la fenêtre, toutes adresses
 * confondues, Anthony est alerté ; le compte n'est jamais verrouillé.
 */
export const SEUIL_ALERTE_GLOBALE = 20
