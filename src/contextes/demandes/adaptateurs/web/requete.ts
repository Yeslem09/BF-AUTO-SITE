import type { FastifyRequest } from 'fastify'
import type { EnvoiDemande } from '../../application/envoyer-demande.js'
import type { ParametresFormulaire } from '../../application/preparer-formulaire.js'
import type { SaisieDemande } from '../../domaine/validation.js'
import { PARAMETRES_DEMANDE } from '../../../../contrats/index.js'
import { CHAMPS_HTML } from './adresses.js'

/**
 * Lecture des requêtes HTTP : corps de formulaire et paramètres d'adresse
 * deviennent des textes simples, jamais autre chose. Tout le contrôle métier
 * se fait ensuite dans le domaine.
 */

type Brut = Readonly<Record<string, unknown>>

/** Au-delà, une valeur est coupée : aucun champ légitime n'en approche. */
const LONGUEUR_MAX_VALEUR = 2_000
/** Au-delà, les cases cochées en trop sont ignorées (trois au plus sont admises). */
const CASES_MAX = 20

function enObjet(valeur: unknown): Brut {
  return typeof valeur === 'object' && valeur !== null ? (valeur as Brut) : {}
}

/** Première valeur texte d'un champ (un champ répété garde sa première occurrence). */
function texte(source: Brut, nom: string): string {
  const valeur = source[nom]
  const premiere = Array.isArray(valeur) ? valeur[0] : valeur
  return typeof premiere === 'string' ? premiere.slice(0, LONGUEUR_MAX_VALEUR) : ''
}

/** Toutes les valeurs d'un champ à cases multiples. */
function textes(source: Brut, nom: string): readonly string[] {
  const valeur = source[nom]
  const liste = Array.isArray(valeur) ? valeur : [valeur]
  return liste
    .filter((element): element is string => typeof element === 'string')
    .slice(0, CASES_MAX)
    .map((element) => element.slice(0, LONGUEUR_MAX_VALEUR))
}

/**
 * Paramètres de `/demande?type=...&famille=...&prediagnostic=...&modalite=...&piece=...&prestation=...`.
 * Une pièce ou une prestation qui n'est pas publiée dans la famille est ignorée.
 */
export function lireParametres(requete: FastifyRequest): ParametresFormulaire {
  const source = enObjet(requete.query)
  return {
    type: texte(source, CHAMPS_HTML.type),
    famille: texte(source, CHAMPS_HTML.famille),
    prediagnostic: texte(source, CHAMPS_HTML.prediagnostic),
    modalite: texte(source, PARAMETRES_DEMANDE.modalite),
    piece: texte(source, PARAMETRES_DEMANDE.piece),
    prestation: texte(source, PARAMETRES_DEMANDE.prestation),
  }
}

export function lireSaisie(source: Brut): SaisieDemande {
  return {
    type: texte(source, CHAMPS_HTML.type),
    objet: texte(source, CHAMPS_HTML.objet),
    motif: texte(source, CHAMPS_HTML.motif),
    creneaux: textes(source, CHAMPS_HTML.creneaux),
    pieces: textes(source, CHAMPS_HTML.pieces),
    plaque: texte(source, CHAMPS_HTML.plaque),
    marque: texte(source, CHAMPS_HTML.marque),
    modele: texte(source, CHAMPS_HTML.modele),
    annee: texte(source, CHAMPS_HTML.annee),
    energie: texte(source, CHAMPS_HTML.energie),
    gamme: texte(source, CHAMPS_HTML.gamme),
    modalite: texte(source, CHAMPS_HTML.modalite),
    precisions: texte(source, CHAMPS_HTML.precisions),
    prenom: texte(source, CHAMPS_HTML.prenom),
    telephone: texte(source, CHAMPS_HTML.telephone),
    moment: texte(source, CHAMPS_HTML.moment),
  }
}

/** Corps d'un envoi du formulaire de demande. */
export function lireEnvoi(requete: FastifyRequest): EnvoiDemande {
  const source = enObjet(requete.body)
  return {
    saisie: lireSaisie(source),
    rattachements: {
      famille: texte(source, CHAMPS_HTML.famille),
      prediagnostic: texte(source, CHAMPS_HTML.prediagnostic),
      prestation: texte(source, CHAMPS_HTML.prestation),
    },
    jeton: texte(source, CHAMPS_HTML.jeton),
    piegeRempli: texte(source, CHAMPS_HTML.piege).trim() !== '',
    cleClient: cleClient(requete),
  }
}

/** Paramètre texte simple de l'adresse (première occurrence). */
export function parametreDeRequete(requete: FastifyRequest, nom: string): string {
  return texte(enObjet(requete.query), nom)
}

/** Champ texte simple d'un corps de formulaire (espace garagiste). */
export function champDuCorps(requete: FastifyRequest, nom: string): string {
  return texte(enObjet(requete.body), nom)
}

const ADRESSES_DE_BOUCLAGE = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

/**
 * Clé de limitation de débit : l'adresse du client telle que Fastify l'établit
 * (derrière un mandataire, selon son réglage `trustProxy`), jamais l'en-tête
 * `X-Forwarded-For` lu brut (D9, US-47).
 *
 * Le poste lui-même (adresse de bouclage) n'est pas limité : c'est le
 * développement local, ou un mandataire local sans `trustProxy`, où tous les
 * visiteurs partageraient une seule adresse ; les limiter ensemble bloquerait
 * de vrais clients à cause des autres.
 */
export function cleClient(requete: FastifyRequest): string | null {
  return ADRESSES_DE_BOUCLAGE.has(requete.ip) ? null : requete.ip
}

/**
 * Vérification de l'en-tête `Origin` (D9, D5) : un envoi venu d'un autre site
 * est refusé. Sans en-tête (client hors navigateur, navigateur ancien), aucune
 * falsification intersites n'est possible par ce biais : l'envoi passe, le
 * jeton signé et l'anti-abus s'appliquent toujours.
 */
export function origineAutorisee(requete: FastifyRequest): boolean {
  const origine = requete.headers.origin
  if (origine === undefined) return true
  try {
    const envoyeuse = new URL(origine)
    // L'hôte reçu est relu avec le schéma de l'origine : « site.fr:443 » et « site.fr » se valent en https.
    const receveuse = new URL(`${envoyeuse.protocol}//${requete.host}`)
    return envoyeuse.host === receveuse.host
  } catch {
    return false
  }
}
