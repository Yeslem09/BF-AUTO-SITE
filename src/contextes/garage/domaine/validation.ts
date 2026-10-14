import { ErreurDonneesGarage } from './erreurs.js'
import type {
  Editeur,
  Garage,
  Hebergement,
  IdentiteGarage,
  Marque,
  InformationsPratiques,
  SocleDeConfiance,
  SuiviClient,
} from './garage.js'
import {
  lireAdresse,
  lireBooleen,
  lireCoordonnees,
  lireCourriel,
  lireDelaiRappel,
  lireHebergeur,
  lireLienHttps,
  lireListeDeTextes,
  lireMediateur,
  lireMoyensPaiement,
  lireNomDeDomaine,
  lirePhotoFacade,
  lirePhrase,
  lirePrestataires,
  lireSiret,
  lireTelephone,
  lecteurTexte,
  LONGUEUR_MAX_ACCROCHE,
  LONGUEUR_MAX_NOM,
} from './lecteurs.js'
import { estObjet, Rapport, sousChemin, verifierCles, type ObjetJson } from './lecture-json.js'
import { lireValeur, lireValeurIndispensable, type Lecteur } from './lecture-valeur.js'
import { lireSemaine } from './validation-horaires.js'
import type { ValeurIndispensable, ValeurPubliee } from './valeur-publiee.js'

const GROUPES = [
  'identite',
  'horaires',
  'socle_de_confiance',
  'pratique',
  'suivi_client',
  'editeur',
  'hebergement',
  'mediateur',
  'marque',
] as const
const CLES_FACULTATIVES_RACINE = ['commentaire'] as const

const CLES_IDENTITE = [
  'nom',
  'ancien_nom',
  'accroche',
  'activites',
  'adresse',
  'telephone',
  'courriel',
  'coordonnees',
] as const
const CLES_SOCLE = [
  'prenom_garagiste',
  'photo_facade',
  'devis_ecrit_avant_travaux',
  'appel_avant_travaux_supplementaires',
  'accueil_sans_rendez_vous',
] as const
const CLES_PRATIQUE = [
  'pieces_remplacees_restituees',
  'moyens_paiement',
  'documents_a_apporter',
  'stationnement',
  'attente_sur_place',
  'enseigne_actuelle',
  'reperes',
  'transports',
] as const
const CLES_SUIVI = [
  'delai_rappel',
  'lien_avis_google',
  'lien_gestion_fiche_google',
  'meme_exploitant',
] as const
const CLES_EDITEUR = [
  'raison_sociale',
  'forme_juridique',
  'capital',
  'siege',
  'registre',
  'siret',
  'tva',
  'directeur_publication',
] as const
const CLES_HEBERGEMENT = [
  'hebergeur',
  'region',
  'prestataires_envoi',
  'encadrement_transferts',
] as const

const CLES_MARQUE = ['nom_de_domaine', 'anteriorite_marque'] as const

const lireTexteCourt = lecteurTexte()

/** Accès aux valeurs d'un groupe, avec le chemin de chacune pour les messages. */
class Groupe {
  constructor(
    private readonly objet: ObjetJson,
    private readonly chemin: string,
    private readonly rapport: Rapport,
  ) {}

  valeur<T>(cle: string, lire: Lecteur<T>): ValeurPubliee<T> {
    return lireValeur(this.objet[cle], sousChemin(this.chemin, cle), this.rapport, lire)
  }

  indispensable<T>(cle: string, lire: Lecteur<T>, secours: T): ValeurIndispensable<T> {
    return lireValeurIndispensable(
      this.objet[cle],
      sousChemin(this.chemin, cle),
      this.rapport,
      lire,
      secours,
    )
  }
}

function groupe(racine: ObjetJson, cle: string, cles: readonly string[], rapport: Rapport): Groupe {
  const brut = racine[cle]
  if (!estObjet(brut)) {
    rapport.signaler(cle, 'objet attendu')
    return new Groupe({}, cle, rapport)
  }
  verifierCles(brut, cle, cles, rapport)
  return new Groupe(brut, cle, rapport)
}

function lireIdentite(g: Groupe): IdentiteGarage {
  return {
    nom: g.indispensable('nom', lecteurTexte(LONGUEUR_MAX_NOM), ''),
    ancienNom: g.valeur('ancien_nom', lecteurTexte(LONGUEUR_MAX_NOM)),
    accroche: g.valeur('accroche', lecteurTexte(LONGUEUR_MAX_ACCROCHE)),
    activites: g.valeur('activites', lecteurTexte(LONGUEUR_MAX_ACCROCHE)),
    adresse: g.indispensable('adresse', lireAdresse, { voie: '', codePostal: '', ville: '' }),
    telephone: g.indispensable('telephone', lireTelephone, { affichable: '', lien: '' }),
    courriel: g.valeur('courriel', lireCourriel),
    coordonnees: g.valeur('coordonnees', lireCoordonnees),
  }
}

function lireSocle(g: Groupe): SocleDeConfiance {
  return {
    prenomGaragiste: g.valeur('prenom_garagiste', lecteurTexte(LONGUEUR_MAX_NOM)),
    photoFacade: g.valeur('photo_facade', lirePhotoFacade),
    devisEcritAvantTravaux: g.valeur('devis_ecrit_avant_travaux', lireBooleen),
    appelAvantTravauxSupplementaires: g.valeur('appel_avant_travaux_supplementaires', lireBooleen),
    accueilSansRendezVous: g.valeur('accueil_sans_rendez_vous', lireBooleen),
  }
}

function lirePratique(g: Groupe): InformationsPratiques {
  return {
    piecesRemplaceesRestituees: g.valeur('pieces_remplacees_restituees', lireBooleen),
    moyensPaiement: g.valeur('moyens_paiement', lireMoyensPaiement),
    documentsAApporter: g.valeur('documents_a_apporter', lireListeDeTextes),
    stationnement: g.valeur('stationnement', lirePhrase),
    attenteSurPlace: g.valeur('attente_sur_place', lirePhrase),
    enseigneActuelle: g.valeur('enseigne_actuelle', lirePhrase),
    reperes: g.valeur('reperes', lireListeDeTextes),
    transports: g.valeur('transports', lireListeDeTextes),
  }
}

function lireSuivi(g: Groupe): SuiviClient {
  return {
    delaiRappel: g.valeur('delai_rappel', lireDelaiRappel),
    lienAvisGoogle: g.valeur('lien_avis_google', lireLienHttps),
    lienGestionFicheGoogle: g.valeur('lien_gestion_fiche_google', lireLienHttps),
    memeExploitant: g.valeur('meme_exploitant', lireBooleen),
  }
}

function lireEditeur(g: Groupe): Editeur {
  return {
    raisonSociale: g.valeur('raison_sociale', lireTexteCourt),
    formeJuridique: g.valeur('forme_juridique', lireTexteCourt),
    capital: g.valeur('capital', lireTexteCourt),
    siege: g.valeur('siege', lireTexteCourt),
    registre: g.valeur('registre', lireTexteCourt),
    siret: g.valeur('siret', lireSiret),
    tva: g.valeur('tva', lireTexteCourt),
    directeurPublication: g.valeur('directeur_publication', lireTexteCourt),
  }
}

function lireHebergement(g: Groupe): Hebergement {
  return {
    hebergeur: g.valeur('hebergeur', lireHebergeur),
    region: g.valeur('region', lireTexteCourt),
    prestatairesEnvoi: g.valeur('prestataires_envoi', lirePrestataires),
    encadrementTransferts: g.valeur('encadrement_transferts', lirePhrase),
  }
}

function lireMarque(g: Groupe): Marque {
  return {
    nomDeDomaine: g.valeur('nom_de_domaine', lireNomDeDomaine),
    anterioriteMarque: g.valeur('anteriorite_marque', lirePhrase),
  }
}

/**
 * Valide le fichier du garage et le convertit en modèle du domaine. Lève
 * `ErreurDonneesGarage` avec la liste complète des problèmes, chacun nommé
 * par son chemin (`socle_de_confiance.taux_horaire.valeur.date_effet`).
 */
export function validerDonneesGarage(brut: unknown): Garage {
  if (!estObjet(brut)) throw new ErreurDonneesGarage(['la racine doit être un objet JSON'])
  const rapport = new Rapport()
  verifierCles(brut, '', GROUPES, rapport, CLES_FACULTATIVES_RACINE)
  if ('commentaire' in brut && typeof brut['commentaire'] !== 'string') {
    rapport.signaler('commentaire', 'texte attendu')
  }
  const garage: Garage = {
    identite: lireIdentite(groupe(brut, 'identite', CLES_IDENTITE, rapport)),
    horaires: lireValeur(brut['horaires'], 'horaires', rapport, lireSemaine),
    socle: lireSocle(groupe(brut, 'socle_de_confiance', CLES_SOCLE, rapport)),
    pratique: lirePratique(groupe(brut, 'pratique', CLES_PRATIQUE, rapport)),
    suivi: lireSuivi(groupe(brut, 'suivi_client', CLES_SUIVI, rapport)),
    editeur: lireEditeur(groupe(brut, 'editeur', CLES_EDITEUR, rapport)),
    hebergement: lireHebergement(groupe(brut, 'hebergement', CLES_HEBERGEMENT, rapport)),
    mediateur: lireValeur(brut['mediateur'], 'mediateur', rapport, lireMediateur),
    marque: lireMarque(groupe(brut, 'marque', CLES_MARQUE, rapport)),
  }
  if (rapport.problemes.length > 0) throw new ErreurDonneesGarage(rapport.problemes)
  return garage
}
