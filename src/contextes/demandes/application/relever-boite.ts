import { prochainEssai } from '../domaine/etat-notification.js'
import type { Demande } from '../domaine/demande.js'
import { referenceDeDemande } from '../domaine/reference.js'
import { JOUR_MS } from '../domaine/temps.js'
import type {
  DepotDemandes,
  EvenementBoite,
  Horloge,
  Journal,
  ReleveBoite,
  SourceBoite,
} from './ports.js'

/** Une réponse ne vise qu'une demande à rappeler ou traitée depuis peu. */
const FENETRE_RECHERCHE_MS = 30 * JOUR_MS
const PREMIER_ESSAI = 1

export interface DependancesReleverBoite {
  readonly depot: DepotDemandes
  readonly source: SourceBoite
  readonly horloge: Horloge
  readonly journal: Journal
  /** Adresses dont une commande est acceptée (le garage, la boîte lue), en minuscules. */
  readonly expediteursAdmis: readonly string[]
}

export interface ReleverBoite {
  /** Relève la boîte et applique ce qu'elle rapporte ; ne rejette jamais. */
  relever(): Promise<void>
  /** Instant du premier relevé en échec d'une série en cours ; `null` si le dernier a réussi. */
  enEchecDepuis(): Date | null
}

/**
 * Applique ce que la boîte du garage rapporte (Kano connecteurs, C5) :
 * « fait », « rappelé » ou « traité » du garagiste range la demande
 * « Traitée » ; une autre réponse est notée « non reconnue » ; un courriel
 * revenu en erreur remet la notification en échec (file de renvoi, `/sante`)
 * et le motif s'affiche sur la fiche. Une commande d'un autre expéditeur, ou
 * signalée en échec d'authentification, est ignorée.
 */
export function creerReleverBoite(dependances: DependancesReleverBoite): ReleverBoite {
  const { depot, source, horloge, journal } = dependances
  const admis = new Set(dependances.expediteursAdmis.map((adresse) => adresse.toLowerCase()))
  let premierEchecLe: Date | null = null

  async function appliquer(evenement: EvenementBoite, demande: Demande): Promise<void> {
    const maintenant = horloge.maintenant()
    if (evenement.nature === 'non-remise') {
      await depot.noterSuiviCourriel(demande.id, {
        nature: 'non-remise',
        le: evenement.recueLe,
        motif: evenement.motif,
      })
      if (demande.statut === 'a-rappeler') {
        await depot.enregistrerNotification(demande.id, {
          etat: 'en-echec',
          premierEchecLe: maintenant,
          essais: PREMIER_ESSAI,
          prochainEssaiLe: prochainEssai(maintenant, PREMIER_ESSAI, maintenant),
          derniereErreur: `Notification non remise : ${evenement.motif}`,
        })
      }
      journal.erreur('Notification revenue en erreur', { demande: demande.id })
      return
    }
    const expediteurAdmis = evenement.expediteur !== null && admis.has(evenement.expediteur)
    if (!expediteurAdmis || evenement.authentificationEchouee) {
      journal.avertir('Réponse ignorée : expéditeur non admis ou authentification en échec', {
        demande: demande.id,
      })
      return
    }
    if (!evenement.commandeTraitee) {
      await depot.noterSuiviCourriel(demande.id, {
        nature: 'reponse-non-reconnue',
        le: evenement.recueLe,
      })
      journal.info('Réponse du garagiste reçue, non reconnue', { demande: demande.id })
      return
    }
    if (demande.statut === 'a-rappeler') {
      await depot.changerStatut(demande.id, 'traitee', maintenant)
      journal.info('Demande rangée « Traitée » par réponse au courriel', { demande: demande.id })
    }
  }

  return {
    enEchecDepuis: () => premierEchecLe,
    async relever() {
      let releve: ReleveBoite
      try {
        releve = await source.relever()
        premierEchecLe = null
      } catch (erreur) {
        premierEchecLe ??= horloge.maintenant()
        journal.erreur('Relevé de la boîte en échec', {
          erreur: erreur instanceof Error ? erreur.message : String(erreur),
        })
        return
      }
      const { evenements } = releve
      if (evenements.length === 0) {
        await releve.confirmer()
        return
      }
      const limite = new Date(horloge.maintenant().getTime() - FENETRE_RECHERCHE_MS)
      const { demandes } = await depot.listerPourLeGaragiste(limite)
      const parReference = new Map(
        demandes.map((demande) => [referenceDeDemande(demande.id), demande]),
      )
      for (const evenement of evenements) {
        for (const reference of evenement.references) {
          const demande = parReference.get(reference)
          if (demande === undefined) {
            journal.info('Référence de courriel sans demande en cours', { reference })
            continue
          }
          await appliquer(evenement, demande)
        }
      }
      await releve.confirmer()
    },
  }
}
