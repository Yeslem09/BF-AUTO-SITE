import {
  DEMANDES_MAX_PAR_ADRESSE,
  DUREE_LIEN_MINUTES,
  DUREE_SESSION_JOURS,
  SEUIL_ALERTE_GLOBALE,
} from './regles.js'
import { libelleNature, type Signalement } from './signalement.js'

/** Message prêt à partir, lisible sans se connecter à quoi que ce soit. */
export interface MessageRedige {
  readonly objet: string
  readonly texte: string
}

export function redigerMessageLien(adresseDuLien: string): MessageRedige {
  return {
    objet: 'Votre lien de connexion à l’espace garagiste',
    texte: [
      'Bonjour,',
      '',
      'Voici votre lien de connexion à l’espace garagiste du site :',
      adresseDuLien,
      '',
      `Il est valable ${DUREE_LIEN_MINUTES} minutes et ne sert qu’une fois. Ouvrez-le sur le téléphone où vous voulez rester connecté : la session y dure ${DUREE_SESSION_JOURS} jours, prolongée à chaque visite.`,
      '',
      'Si vous n’avez rien demandé, ignorez ce message : sans ce lien, personne ne peut entrer.',
    ].join('\n'),
  }
}

export function redigerAlerteDemandesLien(demandesDansLHeure: number): MessageRedige {
  return {
    objet: 'Alerte : demandes de lien de connexion inhabituelles',
    texte: [
      `L’espace garagiste a reçu ${demandesDansLHeure} demandes de lien de connexion en moins d’une heure (seuil d’alerte : ${SEUIL_ALERTE_GLOBALE}).`,
      '',
      `Le compte n’est pas verrouillé : chaque adresse reste limitée à ${DEMANDES_MAX_PAR_ADRESSE} demandes par heure, et les liens ne partent que vers l’adresse du garagiste. Consultez les journaux du serveur.`,
      '',
      'Cette alerte ne se répète pas avant une heure.',
    ].join('\n'),
  }
}

export function redigerSignalement(signalement: Signalement): MessageRedige {
  const nature = libelleNature(signalement.nature)
  return {
    objet: `Signalement du garagiste : ${nature}`,
    texte: [
      'Le garagiste signale un changement depuis son espace.',
      '',
      `Ce qui change : ${nature}`,
      '',
      'Son message :',
      signalement.texte,
      '',
      'Le fichier de données du site n’a pas été modifié : la mise à jour reste à faire.',
    ].join('\n'),
  }
}
