import { NIVEAUX_URGENCE, type NiveauUrgence } from '../../../contrats/index.js'
import { decrireSujet, libelleTypeDemande, urgenceDe, type Demande, type Sujet } from './demande.js'
import {
  GAMMES,
  LIBELLE_MODALITE,
  MODALITES_PIECE,
  MOMENTS_RAPPEL,
  libelleDe,
} from './referentiels.js'
import { formaterInstant } from './temps.js'
import { referenceDeDemande } from './reference.js'
import { decrireVehicule } from './vehicule.js'

export interface MessageNotification {
  readonly sujet: string
  readonly texte: string
  /** Référence de la demande dans les courriels (`BF-XXXXXX`), pour relier la réponse du garagiste. */
  readonly reference: string
}

const LIBELLES_URGENCE: Readonly<Record<NiveauUrgence, string>> = {
  'ne-pas-rouler': 'Ne roulez pas : appelez-nous',
  'a-controler': 'Roulez prudemment et faites contrôler dans les prochains jours',
  'sans-urgence': 'Pas d’urgence : à vérifier lors d’un prochain passage',
}

/** Libellé de la conduite à tenir, tel que le client l'a lu (contrat du pré-diagnostic). */
export function libelleUrgence(niveau: NiveauUrgence): string {
  return LIBELLES_URGENCE[niveau]
}

/**
 * La conduite à tenir lue par le garagiste : ce qui a été dit au client, pas
 * la phrase qui s'adresse à lui (« appelez-nous » sonne faux côté atelier).
 */
const CONSIGNES_DONNEES: Readonly<Record<NiveauUrgence, string>> = {
  'ne-pas-rouler': 'Consigne donnée au client : ne pas rouler',
  'a-controler':
    'Consigne donnée au client : rouler prudemment, faire contrôler dans les prochains jours',
  'sans-urgence':
    'Consigne donnée au client : pas d’urgence, à vérifier lors d’un prochain passage',
}

export function consigneDonnee(niveau: NiveauUrgence): string {
  return CONSIGNES_DONNEES[niveau]
}

/** Rang de gravité : plus il est haut, plus c'est grave ; -1 sans pré-diagnostic. */
export function rangUrgence(niveau: NiveauUrgence | null): number {
  return niveau === null ? -1 : NIVEAUX_URGENCE.indexOf(niveau)
}

const RETOURS_A_LA_LIGNE = /[\r\n]+/g

/** Intitulé des pièces cochées, sur la notification, la confirmation et la fiche. */
export const LIBELLE_PIECES = 'Pièces concernées'

/**
 * Message qui se suffit à lui-même (D5, US-50) : le garagiste rappelle sans se
 * connecter. « Ne roulez pas » en tête s'il y a lieu, puis le type, le cas en
 * toutes lettres, le véhicule, le moment où le client peut répondre, son
 * prénom, son téléphone composable et le lien vers la fiche.
 */
export function redigerNotification(demande: Demande, lienFiche: string): MessageNotification {
  const urgente = urgenceDe(demande) === 'ne-pas-rouler'
  const { contact } = demande
  const titre = `${libelleTypeDemande(demande)} de ${contact.prenom}, ${contact.telephone.affichable}`
  const lignes: string[] = []
  if (urgente) lignes.push(`${LIBELLES_URGENCE['ne-pas-rouler']}.`, '')
  lignes.push(
    libelleTypeDemande(demande),
    `Reçue le ${formaterInstant(demande.recueLe)}`,
    '',
    `Prénom : ${contact.prenom}`,
    `Téléphone : ${contact.telephone.affichable} (${contact.telephone.lien})`,
    `Joignable : ${libelleDe(MOMENTS_RAPPEL, contact.moment)}`,
    '',
    ...lignesSujet(demande.sujet),
  )
  if (demande.pieces.length > 0) lignes.push(`${LIBELLE_PIECES} : ${demande.pieces.join(', ')}`)
  if (demande.vehicule !== null) lignes.push(`Véhicule : ${decrireVehicule(demande.vehicule)}`)
  if (demande.creneaux.length > 0) {
    lignes.push(`Possibilités : ${demande.creneaux.map((creneau) => creneau.libelle).join(' ; ')}`)
  }
  if (demande.gamme !== null) lignes.push(`Pièce : ${libelleDe(GAMMES, demande.gamme)}`)
  if (demande.modalite !== null) {
    lignes.push(`${LIBELLE_MODALITE} : ${libelleDe(MODALITES_PIECE, demande.modalite)}`)
  }
  if (demande.precisions !== null) lignes.push(`Précisions : ${demande.precisions}`)
  lignes.push('', `Fiche : ${lienFiche}`)
  return {
    sujet: (urgente ? `Ne roulez pas : ${titre}` : titre).replace(RETOURS_A_LA_LIGNE, ' '),
    texte: `${lignes.join('\n')}\n`,
    reference: referenceDeDemande(demande.id),
  }
}

function lignesSujet(sujet: Sujet): string[] {
  if (sujet.nature !== 'pre-diagnostic') return [`Objet : ${decrireSujet(sujet)}`]
  const { resume } = sujet
  return [
    `Pré-diagnostic : ${resume.symptome.libelle}`,
    ...resume.reponses.map((reponse) => `- ${reponse.question} : ${reponse.reponse}`),
    `Conduite à tenir : ${LIBELLES_URGENCE[resume.urgence]}`,
    `Conclusion : ${resume.conclusion}`,
  ]
}
