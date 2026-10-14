/**
 * Lecteurs des valeurs du fichier du garage, un par forme de donnée. Chacun
 * signale ses défauts avec leur chemin et rend une valeur de secours : la
 * validation voit tout d'un coup, puis échoue s'il y a le moindre problème.
 */
import type {
  AdressePostale,
  CoordonneesGeographiques,
  TelephonePublic,
} from '../../../contrats/index.js'
import {
  MOYENS_PAIEMENT,
  ROLES_PRESTATAIRE,
  type Hebergeur,
  type Mediateur,
  type MoyenPaiement,
  type PhotoFacade,
  type PrestataireEnvoi,
} from './garage.js'
import { estObjet, lireTexte, sousChemin, verifierCles, type Rapport } from './lecture-json.js'
import type { Lecteur } from './lecture-valeur.js'
import { DELAIS_RAPPEL, type DelaiRappel } from './rappel.js'
import { normaliserSiret } from './siret.js'
import { normaliserTelephone } from './telephone.js'

export const LONGUEUR_MAX_NOM = 80
export const LONGUEUR_MAX_ACCROCHE = 160
const LONGUEUR_MAX_CHAMP = 200
const LONGUEUR_MAX_PHRASE = 400
const LONGUEUR_MAX_LISTE = 8
const LATITUDE_MAX = 90
const LONGITUDE_MAX = 180
const DIMENSION_MAX_PIXELS = 8000
/** Codes postaux français : départements 01 à 95, outre-mer 97, Monaco 98. */
const FORMAT_CODE_POSTAL = /^(?:0[1-9]|[1-8]\d|9[0-8])\d{3}$/
const FORMAT_COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Nom de domaine en minuscules, sans protocole ni chemin. */
const FORMAT_NOM_DE_DOMAINE =
  /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
const PREFIXE_IMAGES_GARAGE = '/img/garage/'
const FORMAT_CHEMIN_IMAGE = /^\/img\/garage\/[a-z0-9-]+\.(?:avif|webp|jpg|png)$/

export function lecteurTexte(longueurMax: number = LONGUEUR_MAX_CHAMP): Lecteur<string> {
  return (brut, chemin, rapport) => lireTexte(brut, chemin, rapport, longueurMax)
}

export const lirePhrase: Lecteur<string> = lecteurTexte(LONGUEUR_MAX_PHRASE)

export const lireBooleen: Lecteur<boolean> = (brut, chemin, rapport) => {
  if (typeof brut !== 'boolean') rapport.signaler(chemin, 'true ou false attendu')
  return brut === true
}

export const lireListeDeTextes: Lecteur<readonly string[]> = (brut, chemin, rapport) => {
  if (!Array.isArray(brut) || brut.length === 0 || brut.length > LONGUEUR_MAX_LISTE) {
    rapport.signaler(chemin, `liste de 1 à ${LONGUEUR_MAX_LISTE} textes attendue`)
    return []
  }
  return brut.map((element: unknown, index) =>
    lireTexte(element, sousChemin(chemin, index), rapport, LONGUEUR_MAX_PHRASE),
  )
}

/** Adresse https absolue : un lien sortant du site ne passe jamais en clair. */
export const lireLienHttps: Lecteur<string> = (brut, chemin, rapport) => {
  let url: URL | null = null
  try {
    url = typeof brut === 'string' ? new URL(brut) : null
  } catch {
    url = null
  }
  if (url === null || url.protocol !== 'https:') {
    rapport.signaler(chemin, `« ${String(brut)} » n’est pas une adresse https`)
    return ''
  }
  return url.href
}

export const lireNomDeDomaine: Lecteur<string> = (brut, chemin, rapport) => {
  if (typeof brut !== 'string' || !FORMAT_NOM_DE_DOMAINE.test(brut)) {
    rapport.signaler(
      chemin,
      `« ${String(brut)} » n’est pas un nom de domaine (minuscules, sans https:// ni chemin)`,
    )
    return ''
  }
  return brut
}

export const lireCourriel: Lecteur<string> = (brut, chemin, rapport) => {
  if (typeof brut !== 'string' || !FORMAT_COURRIEL.test(brut.trim())) {
    rapport.signaler(chemin, `« ${String(brut)} » n’est pas une adresse de courriel`)
    return ''
  }
  return brut.trim()
}

export const lireTelephone: Lecteur<TelephonePublic> = (brut, chemin, rapport) => {
  const telephone = typeof brut === 'string' ? normaliserTelephone(brut) : null
  if (telephone === null) {
    rapport.signaler(
      chemin,
      `« ${String(brut)} » n’est pas un numéro français (10 chiffres commençant par 0, ou +33)`,
    )
    return { affichable: '', lien: '' }
  }
  return telephone
}

export const lireSiret: Lecteur<string> = (brut, chemin, rapport) => {
  const siret = typeof brut === 'string' ? normaliserSiret(brut) : null
  if (siret === null) {
    rapport.signaler(
      chemin,
      `« ${String(brut)} » n’est pas un SIRET valide (14 chiffres, clé de contrôle)`,
    )
    return ''
  }
  return siret
}

export const lireAdresse: Lecteur<AdressePostale> = (brut, chemin, rapport) => {
  if (!estObjet(brut)) {
    rapport.signaler(chemin, 'objet { voie, code_postal, ville } attendu')
    return { voie: '', codePostal: '', ville: '' }
  }
  verifierCles(brut, chemin, ['voie', 'code_postal', 'ville'], rapport)
  const codePostal = brut['code_postal']
  if (typeof codePostal !== 'string' || !FORMAT_CODE_POSTAL.test(codePostal)) {
    rapport.signaler(
      sousChemin(chemin, 'code_postal'),
      `« ${String(codePostal)} » n’est pas un code postal français (5 chiffres, texte)`,
    )
  }
  return {
    voie: lireTexte(brut['voie'], sousChemin(chemin, 'voie'), rapport, LONGUEUR_MAX_CHAMP),
    codePostal: typeof codePostal === 'string' ? codePostal : '',
    ville: lireTexte(brut['ville'], sousChemin(chemin, 'ville'), rapport, LONGUEUR_MAX_CHAMP),
  }
}

export const lireCoordonnees: Lecteur<CoordonneesGeographiques> = (brut, chemin, rapport) => {
  if (!estObjet(brut)) {
    rapport.signaler(chemin, 'objet { latitude, longitude } attendu')
    return { latitude: 0, longitude: 0 }
  }
  verifierCles(brut, chemin, ['latitude', 'longitude'], rapport)
  const latitude = brut['latitude']
  const longitude = brut['longitude']
  if (typeof latitude !== 'number' || Math.abs(latitude) > LATITUDE_MAX) {
    rapport.signaler(sousChemin(chemin, 'latitude'), 'nombre entre -90 et 90 attendu')
  }
  if (typeof longitude !== 'number' || Math.abs(longitude) > LONGITUDE_MAX) {
    rapport.signaler(sousChemin(chemin, 'longitude'), 'nombre entre -180 et 180 attendu')
  }
  return {
    latitude: typeof latitude === 'number' ? latitude : 0,
    longitude: typeof longitude === 'number' ? longitude : 0,
  }
}

function lireDimension(brut: unknown, chemin: string, rapport: Rapport): number {
  if (
    typeof brut !== 'number' ||
    !Number.isInteger(brut) ||
    brut < 1 ||
    brut > DIMENSION_MAX_PIXELS
  ) {
    rapport.signaler(chemin, `entier de 1 à ${DIMENSION_MAX_PIXELS} pixels attendu`)
    return 1
  }
  return brut
}

export const lirePhotoFacade: Lecteur<PhotoFacade> = (brut, chemin, rapport) => {
  const secours = { chemin: '', texteAlternatif: '', largeur: 1, hauteur: 1 }
  if (!estObjet(brut)) {
    rapport.signaler(chemin, 'objet { chemin, texte_alternatif, largeur, hauteur } attendu')
    return secours
  }
  verifierCles(brut, chemin, ['chemin', 'texte_alternatif', 'largeur', 'hauteur'], rapport)
  const cheminImage = brut['chemin']
  if (typeof cheminImage !== 'string' || !FORMAT_CHEMIN_IMAGE.test(cheminImage)) {
    rapport.signaler(
      sousChemin(chemin, 'chemin'),
      `chemin d’image sous ${PREFIXE_IMAGES_GARAGE} attendu (avif, webp, jpg ou png)`,
    )
  }
  return {
    chemin: typeof cheminImage === 'string' ? cheminImage : '',
    texteAlternatif: lireTexte(
      brut['texte_alternatif'],
      sousChemin(chemin, 'texte_alternatif'),
      rapport,
      LONGUEUR_MAX_CHAMP,
    ),
    largeur: lireDimension(brut['largeur'], sousChemin(chemin, 'largeur'), rapport),
    hauteur: lireDimension(brut['hauteur'], sousChemin(chemin, 'hauteur'), rapport),
  }
}

/** Valeur prise dans une liste fermée. */
function lecteurCode<C extends string>(codes: readonly C[]): Lecteur<C> {
  return (brut, chemin, rapport) => {
    const code = codes.find((connu) => connu === brut)
    if (code === undefined) {
      rapport.signaler(chemin, `« ${String(brut)} » inconnu (${codes.join(', ')})`)
      return codes[0] as C
    }
    return code
  }
}

export const lireDelaiRappel: Lecteur<DelaiRappel> = lecteurCode(DELAIS_RAPPEL)

const lireMoyenPaiement = lecteurCode(MOYENS_PAIEMENT)

export const lireMoyensPaiement: Lecteur<readonly MoyenPaiement[]> = (brut, chemin, rapport) => {
  if (!Array.isArray(brut) || brut.length === 0) {
    rapport.signaler(chemin, `liste non vide attendue (${MOYENS_PAIEMENT.join(', ')})`)
    return []
  }
  const moyens = brut.map((element: unknown, index) =>
    lireMoyenPaiement(element, sousChemin(chemin, index), rapport),
  )
  if (new Set(brut).size !== brut.length) rapport.signaler(chemin, 'moyen de paiement en double')
  return moyens
}

export const lireHebergeur: Lecteur<Hebergeur> = (brut, chemin, rapport) => {
  if (!estObjet(brut)) {
    rapport.signaler(chemin, 'objet { nom, adresse, telephone } attendu')
    return { nom: '', adresse: '', telephone: '' }
  }
  verifierCles(brut, chemin, ['nom', 'adresse', 'telephone'], rapport)
  const texte = lecteurTexte()
  return {
    nom: texte(brut['nom'], sousChemin(chemin, 'nom'), rapport),
    adresse: texte(brut['adresse'], sousChemin(chemin, 'adresse'), rapport),
    telephone: texte(brut['telephone'], sousChemin(chemin, 'telephone'), rapport),
  }
}

const lireRolePrestataire = lecteurCode(ROLES_PRESTATAIRE)

export const lirePrestataires: Lecteur<readonly PrestataireEnvoi[]> = (brut, chemin, rapport) => {
  if (!Array.isArray(brut) || brut.length === 0) {
    rapport.signaler(chemin, 'liste non vide de { role, nom, lieu_traitement } attendue')
    return []
  }
  const texte = lecteurTexte()
  return brut.map((element: unknown, index) => {
    const cheminElement = sousChemin(chemin, index)
    if (!estObjet(element)) {
      rapport.signaler(cheminElement, 'objet { role, nom, lieu_traitement } attendu')
      return { role: 'courriel', nom: '', lieuTraitement: '' }
    }
    verifierCles(element, cheminElement, ['role', 'nom', 'lieu_traitement'], rapport)
    return {
      role: lireRolePrestataire(element['role'], sousChemin(cheminElement, 'role'), rapport),
      nom: texte(element['nom'], sousChemin(cheminElement, 'nom'), rapport),
      lieuTraitement: texte(
        element['lieu_traitement'],
        sousChemin(cheminElement, 'lieu_traitement'),
        rapport,
      ),
    }
  })
}

export const lireMediateur: Lecteur<Mediateur> = (brut, chemin, rapport) => {
  if (!estObjet(brut)) {
    rapport.signaler(chemin, 'objet { nom, adresse, site } attendu')
    return { nom: '', adresse: '', site: '' }
  }
  verifierCles(brut, chemin, ['nom', 'adresse', 'site'], rapport)
  const texte = lecteurTexte()
  return {
    nom: texte(brut['nom'], sousChemin(chemin, 'nom'), rapport),
    adresse: texte(brut['adresse'], sousChemin(chemin, 'adresse'), rapport),
    site: lireLienHttps(brut['site'], sousChemin(chemin, 'site'), rapport),
  }
}
