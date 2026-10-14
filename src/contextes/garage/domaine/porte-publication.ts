import type { Garage } from './garage.js'
import type { ValeurPubliee } from './valeur-publiee.js'

/**
 * Données sans lesquelles le site ne peut pas être mis en ligne (Kano D8) :
 * identité et horaires (statut, rappel, données structurées), éditeur et
 * hébergement (LCEN, RGPD), médiateur (R616-1), socle de confiance (D6, hors
 * prix : taux horaire et premier contrôle sont recensés par le catalogue, seule
 * source des prix), nom de domaine et recherche d'antériorité de la marque (D13).
 * `exigeAccord` : un engagement du socle doit être validé ET accepté ; un refus
 * du garagiste n'est pas un repli, il rouvre la décision (D6).
 */
interface DonneeBloquante {
  readonly chemin: string
  readonly libelle: string
  readonly valeur: ValeurPubliee<unknown>
  readonly exigeAccord?: boolean
}

function donneesBloquantes(garage: Garage): readonly DonneeBloquante[] {
  const { identite, socle, editeur, hebergement } = garage
  return [
    { chemin: 'identite.nom', libelle: 'nom du garage', valeur: identite.nom },
    { chemin: 'identite.adresse', libelle: 'adresse', valeur: identite.adresse },
    { chemin: 'identite.telephone', libelle: 'téléphone', valeur: identite.telephone },
    {
      chemin: 'identite.courriel',
      libelle: 'courriel public de contact',
      valeur: identite.courriel,
    },
    { chemin: 'horaires', libelle: 'horaires jour par jour', valeur: garage.horaires },
    {
      chemin: 'socle_de_confiance.prenom_garagiste',
      libelle: 'prénom du garagiste et son accord',
      valeur: socle.prenomGaragiste,
    },
    {
      chemin: 'socle_de_confiance.photo_facade',
      libelle: 'photo de la façade',
      valeur: socle.photoFacade,
    },
    {
      chemin: 'socle_de_confiance.devis_ecrit_avant_travaux',
      libelle: 'engagement « Devis écrit avant travaux »',
      valeur: socle.devisEcritAvantTravaux,
      exigeAccord: true,
    },
    {
      chemin: 'socle_de_confiance.appel_avant_travaux_supplementaires',
      libelle: 'engagement « Nous vous appelons avant tout travail supplémentaire »',
      valeur: socle.appelAvantTravauxSupplementaires,
      exigeAccord: true,
    },
    {
      chemin: 'socle_de_confiance.accueil_sans_rendez_vous',
      libelle: 'accueil sans rendez-vous (oui ou non)',
      valeur: socle.accueilSansRendezVous,
    },
    {
      chemin: 'editeur.raison_sociale',
      libelle: 'dénomination sociale',
      valeur: editeur.raisonSociale,
    },
    {
      chemin: 'editeur.forme_juridique',
      libelle: 'forme juridique',
      valeur: editeur.formeJuridique,
    },
    { chemin: 'editeur.capital', libelle: 'capital social', valeur: editeur.capital },
    { chemin: 'editeur.siege', libelle: 'siège social', valeur: editeur.siege },
    { chemin: 'editeur.registre', libelle: 'registre d’immatriculation', valeur: editeur.registre },
    { chemin: 'editeur.siret', libelle: 'numéro d’immatriculation (SIRET)', valeur: editeur.siret },
    { chemin: 'editeur.tva', libelle: 'numéro de TVA intracommunautaire', valeur: editeur.tva },
    {
      chemin: 'editeur.directeur_publication',
      libelle: 'directeur de la publication',
      valeur: editeur.directeurPublication,
    },
    { chemin: 'hebergement.hebergeur', libelle: 'hébergeur', valeur: hebergement.hebergeur },
    { chemin: 'hebergement.region', libelle: 'région d’hébergement', valeur: hebergement.region },
    {
      chemin: 'hebergement.prestataires_envoi',
      libelle: 'prestataires d’envoi et lieu de traitement',
      valeur: hebergement.prestatairesEnvoi,
    },
    {
      chemin: 'hebergement.encadrement_transferts',
      libelle: 'encadrement des transferts hors de l’Union européenne',
      valeur: hebergement.encadrementTransferts,
    },
    { chemin: 'mediateur', libelle: 'médiateur de la consommation', valeur: garage.mediateur },
    {
      chemin: 'marque.nom_de_domaine',
      libelle: 'nom de domaine',
      valeur: garage.marque.nomDeDomaine,
    },
    {
      chemin: 'marque.anteriorite_marque',
      libelle: 'recherche d’antériorité de la marque',
      valeur: garage.marque.anterioriteMarque,
    },
  ]
}

/**
 * Ce qui empêche la mise en ligne, une ligne par donnée, lisible par Anthony.
 * La racine de composition l'agrège avec les manques des autres contextes en
 * une seule porte de démarrage : en production, une liste non vide arrête le
 * site ; relecture et démonstration ne sont jamais en ligne.
 */
export function manquesPourLaProduction(garage: Garage): readonly string[] {
  return donneesBloquantes(garage).flatMap((donnee) => {
    const { valeur } = donnee
    if (valeur.statut !== 'valide') {
      const note = valeur.note === null ? '' : ` : ${valeur.note}`
      return [`${donnee.chemin} (${donnee.libelle}) à valider${note}`]
    }
    if (donnee.exigeAccord === true && valeur.valeur !== true) {
      return [
        `${donnee.chemin} (${donnee.libelle}) refusé par le garagiste : le site ne sort pas en l’état, décision à rouvrir (Kano D6)`,
      ]
    }
    return []
  })
}
