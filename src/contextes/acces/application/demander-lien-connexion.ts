import { cheminRetourSur } from '../domaine/chemin-retour.js'
import { alerteGlobaleDue, debutFenetre, evaluerLimiteAdresse } from '../domaine/limitation.js'
import { redigerAlerteDemandesLien, redigerMessageLien } from '../domaine/messages.js'
import type { Alerteur, Canal, Horloge, RegistreDemandesLien, Remise } from './ports.js'
import { preparerLien, type DependancesPreparerLien } from './preparer-lien.js'

export interface DependancesDemanderLien extends DependancesPreparerLien {
  readonly registre: RegistreDemandesLien
  readonly horloge: Horloge
  /** Seul canal où part le lien ; `null` tant que l'adresse du garagiste n'est pas configurée. */
  readonly canalGaragiste: Canal | null
  readonly alerteur: Alerteur
  /** Adresse absolue du lien, bâtie sur l'origine publique configurée (jamais sur la requête). */
  readonly adresseDuLien: (jeton: string) => string
}

export interface DemandeLien {
  /** Adresse du client telle que Fastify l'a établie ; clé de la limitation. */
  readonly adresseClient: string
  /** Page de l'espace demandée avant la connexion ; nettoyée ici. */
  readonly retour: unknown
}

export type ResultatDemandeLien =
  | {
      readonly issue: 'envoye'
      /** Ce qu'est devenu le message : la page le dit tel quel. */
      readonly remise: Remise
      /** En démonstration seulement, le lien revient à la page, faute de boîte à lettres. */
      readonly lienVisible: string | null
    }
  | { readonly issue: 'trop-de-demandes'; readonly attenteMs: number }
  | { readonly issue: 'canal-absent' }
  | { readonly issue: 'echec-envoi'; readonly erreur: unknown }

export type DemanderLienConnexion = (demande: DemandeLien) => Promise<ResultatDemandeLien>

/**
 * « Recevoir un lien de connexion » : le lien part vers le seul canal
 * configuré, quel que soit le contenu de la requête. Aucune adresse n'est lue
 * dans la demande, si bien qu'aucune réponse ne révèle un compte (Kano D5, US-33).
 */
export function creerDemanderLienConnexion(
  dependances: DependancesDemanderLien,
): DemanderLienConnexion {
  const { registre, horloge, alerteur } = dependances
  return async ({ adresseClient, retour }) => {
    const maintenant = horloge.maintenant()
    const depuis = debutFenetre(maintenant)

    registre.noterReception(maintenant)
    const recues = registre.recuesDepuis(depuis)
    if (alerteGlobaleDue(recues, registre.derniereAlerte(), maintenant)) {
      registre.noterAlerte(maintenant)
      const alerte = redigerAlerteDemandesLien(recues.length)
      await alerteur.alerter(alerte.objet, alerte.texte)
    }

    const decision = evaluerLimiteAdresse(
      registre.accepteesDepuis(adresseClient, depuis),
      maintenant,
    )
    if (!decision.autorisee) return { issue: 'trop-de-demandes', attenteMs: decision.attenteMs }

    const canal = dependances.canalGaragiste
    if (canal === null) return { issue: 'canal-absent' }

    registre.noterAcceptation(adresseClient, maintenant)
    const { jeton } = preparerLien(dependances, maintenant, cheminRetourSur(retour))
    const adresseDuLien = dependances.adresseDuLien(jeton)
    const message = redigerMessageLien(adresseDuLien)
    try {
      await canal.messagerie.envoyer({ destinataire: canal.destinataire, ...message })
    } catch (erreur) {
      return { issue: 'echec-envoi', erreur }
    }
    return {
      issue: 'envoye',
      remise: canal.remise,
      lienVisible: canal.remise === 'demonstration' ? adresseDuLien : null,
    }
  }
}
