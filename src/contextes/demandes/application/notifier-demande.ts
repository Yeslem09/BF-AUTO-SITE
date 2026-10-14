import { prochainEssai } from '../domaine/etat-notification.js'
import { redigerNotification } from '../domaine/message-notification.js'
import { redigerSms } from '../domaine/message-sms.js'
import type { AlerteSms, DepotDemandes, Horloge, Journal, Notificateur } from './ports.js'

/** Longueur gardée du motif d'échec, pour la fiche et le journal. */
const LONGUEUR_MAX_ERREUR = 300

export interface DependancesNotifierDemande {
  readonly depot: DepotDemandes
  readonly notificateur: Notificateur
  readonly horloge: Horloge
  readonly journal: Journal
  /** Adresse de la fiche dans l'espace garagiste, citée dans le message. */
  readonly lienFiche: (id: string) => string
  /**
   * SMS au garagiste pour « Ne roulez pas » (Kano connecteurs, C6) ; absent
   * sans identifiants de fournisseur. Il part au premier essai seulement, en
   * plus du courriel, et son échec n'empêche jamais le courriel.
   */
  readonly alerteSms?: AlerteSms
}

/**
 * Avertit le garagiste d'une demande déjà enregistrée. Ne rejette jamais :
 * un échec est enregistré sur la demande (visible sur sa fiche), journalisé,
 * et programme le prochain essai de la file de renvoi (D5, US-16).
 *
 * Un seul envoi à la fois par demande : si la file de renvoi reprend une
 * demande dont l'envoi est encore en cours (serveur de courriel lent), elle
 * la laisse, au lieu d'envoyer deux messages et de compter deux essais.
 */
export type NotifierDemande = (id: string) => Promise<void>

export function creerNotifierDemande(dependances: DependancesNotifierDemande): NotifierDemande {
  const { depot, notificateur, horloge, journal } = dependances
  const enCours = new Set<string>()
  return async (id) => {
    if (enCours.has(id)) return
    enCours.add(id)
    try {
      const lecture = await depot.trouver(id)
      if (lecture.etat !== 'trouvee') {
        journal.erreur('Notification impossible : demande introuvable ou illisible', {
          demande: id,
        })
        return
      }
      const { demande } = lecture
      if (demande.statut === 'traitee' || demande.notification.etat === 'envoyee') return
      const message = redigerNotification(demande, dependances.lienFiche(id))
      if (demande.notification.etat === 'en-attente') await alerterParSms(dependances, demande)
      try {
        await notificateur.envoyer(message)
      } catch (erreur) {
        const maintenant = horloge.maintenant()
        const precedent = demande.notification.etat === 'en-echec' ? demande.notification : null
        const premierEchecLe = precedent?.premierEchecLe ?? maintenant
        const essais = (precedent?.essais ?? 0) + 1
        const prochainEssaiLe = prochainEssai(premierEchecLe, essais, maintenant)
        const derniereErreur = (erreur instanceof Error ? erreur.message : String(erreur)).slice(
          0,
          LONGUEUR_MAX_ERREUR,
        )
        await depot.enregistrerNotification(id, {
          etat: 'en-echec',
          premierEchecLe,
          essais,
          prochainEssaiLe,
          derniereErreur,
        })
        journal.erreur('Notification non envoyée : nouvel essai programmé', {
          demande: id,
          canal: notificateur.canal,
          essais,
          prochainEssai: prochainEssaiLe.toISOString(),
          erreur: derniereErreur,
        })
        return
      }
      await depot.enregistrerNotification(id, { etat: 'envoyee', envoyeeLe: horloge.maintenant() })
      journal.info('Notification envoyée', { demande: id, canal: notificateur.canal })
    } catch (erreur) {
      journal.erreur('Notification : suivi impossible à enregistrer', {
        demande: id,
        erreur: erreur instanceof Error ? erreur.message : String(erreur),
      })
    } finally {
      enCours.delete(id)
    }
  }
}

async function alerterParSms(
  dependances: DependancesNotifierDemande,
  demande: Parameters<typeof redigerSms>[0],
): Promise<void> {
  const texte = redigerSms(demande)
  if (texte === null || dependances.alerteSms === undefined) return
  try {
    await dependances.alerteSms.envoyer(texte)
    dependances.journal.info('SMS « Ne roulez pas » envoyé au garagiste', { demande: demande.id })
  } catch (erreur) {
    dependances.journal.erreur('SMS « Ne roulez pas » non envoyé : le courriel part quand même', {
      demande: demande.id,
      erreur: (erreur instanceof Error ? erreur.message : String(erreur)).slice(
        0,
        LONGUEUR_MAX_ERREUR,
      ),
    })
  }
}
