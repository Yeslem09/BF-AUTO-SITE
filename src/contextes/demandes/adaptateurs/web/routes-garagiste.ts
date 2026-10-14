import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { OutilsPage } from '../../../../web/index.js'
import type { ChangerStatut } from '../../application/changer-statut.js'
import type { ConsulterFiche } from '../../application/consulter-fiche.js'
import type { ListerDemandes, TableauDemandes } from '../../application/lister-demandes.js'
import type { AnnulerTentative, NoterTentative } from '../../application/noter-tentative.js'
import type { Horloge } from '../../application/ports.js'
import { STATUTS_DEMANDE } from '../../domaine/demande.js'
import { FORMAT_IDENTIFIANT } from '../jetons/aleas-crypto.js'
import {
  CHAMPS_HTML,
  CHAMP_DEPUIS,
  CHEMIN_DEMANDES_GARAGISTE,
  DEPUIS_FICHE,
  PARAMETRES_COMPTE_RENDU,
  cheminFicheApres,
  cheminListeApres,
} from './adresses.js'
import { champDuCorps, parametreDeRequete } from './requete.js'
import {
  ACTIONS_FAITES,
  ACTIONS_FICHE,
  vueActionRefusee,
  vueFicheDemande,
  vueFicheIllisible,
  vueListeDemandes,
  type CompteRendu,
} from './vues/garagiste.js'

const STATUT_VOIR_AILLEURS = 303
const STATUT_REQUETE_INVALIDE = 400

export interface CasUsageGaragiste {
  readonly listerDemandes: ListerDemandes
  readonly consulterFiche: ConsulterFiche
  readonly changerStatut: ChangerStatut
  readonly noterTentative: NoterTentative
  readonly annulerTentative: AnnulerTentative
  readonly horloge: Horloge
}

/** Espace garagiste : jamais indexé, jamais gardé en cache (D5). */
function prive(reponse: FastifyReply): FastifyReply {
  return reponse.header('cache-control', 'no-store').header('x-robots-tag', 'noindex')
}

interface ParametresFiche {
  readonly Params: { readonly id: string }
}

/**
 * Compte rendu demandé par l'adresse de la liste (`?fait=traitee&demande=...`) :
 * un code fermé et une demande de la liste, sinon rien. Aucun texte de
 * l'adresse n'est jamais affiché.
 */
function compteRenduDe(requete: FastifyRequest, tableau: TableauDemandes): CompteRendu | null {
  const action = ACTIONS_FAITES.find(
    (connue) => connue === parametreDeRequete(requete, PARAMETRES_COMPTE_RENDU.action),
  )
  const id = parametreDeRequete(requete, PARAMETRES_COMPTE_RENDU.demande)
  const demande = tableau.demandes.find((candidate) => candidate.id === id)
  return action === undefined || demande === undefined ? null : { action, demande }
}

export function enregistrerRoutesGaragiste(
  app: FastifyInstance,
  outils: OutilsPage,
  cas: CasUsageGaragiste,
): void {
  const protection = { preHandler: outils.exigerGaragiste }
  const envoiProtege = { preHandler: [outils.exigerGaragiste, outils.exigerFormulaireGaragiste] }

  app.get(CHEMIN_DEMANDES_GARAGISTE, protection, async (requete, reponse) => {
    prive(reponse)
    const tableau = await cas.listerDemandes()
    return outils.envoyerPage(
      reponse,
      vueListeDemandes({
        tableau,
        jetonFormulaire: outils.jetonFormulaireGaragiste(requete),
        compteRendu: compteRenduDe(requete, tableau),
      }),
    )
  })

  app.get<ParametresFiche>(
    `${CHEMIN_DEMANDES_GARAGISTE}/:id`,
    protection,
    async (requete, reponse) => {
      prive(reponse)
      const { id } = requete.params
      if (!FORMAT_IDENTIFIANT.test(id)) return reponse.callNotFound()
      const lecture = await cas.consulterFiche(id)
      switch (lecture.etat) {
        case 'absente':
          return reponse.callNotFound()
        case 'illisible':
          return outils.envoyerPage(reponse, vueFicheIllisible(id))
        case 'trouvee':
          return outils.envoyerPage(
            reponse,
            vueFicheDemande({
              compteRendu:
                ACTIONS_FICHE.find(
                  (connue) =>
                    connue === parametreDeRequete(requete, PARAMETRES_COMPTE_RENDU.action),
                ) ?? null,
              demande: lecture.demande,
              suivi: lecture.suivi,
              doublons: lecture.doublons,
              maintenant: cas.horloge.maintenant(),
              jetonFormulaire: outils.jetonFormulaireGaragiste(requete),
            }),
          )
      }
    },
  )

  app.post<ParametresFiche>(
    `${CHEMIN_DEMANDES_GARAGISTE}/:id/statut`,
    envoiProtege,
    async (requete, reponse) => {
      prive(reponse)
      const { id } = requete.params
      if (!FORMAT_IDENTIFIANT.test(id)) return reponse.callNotFound()
      const statut = STATUTS_DEMANDE.find(
        (connu) => connu === champDuCorps(requete, CHAMPS_HTML.statut),
      )
      if (statut === undefined) {
        return outils.envoyerPage(reponse, vueActionRefusee(id, STATUT_REQUETE_INVALIDE))
      }
      const issue = await cas.changerStatut(id, statut)
      if (issue === 'absente') return reponse.callNotFound()
      // Retour à la liste dans les deux sens, avec ce qui vient d'être fait (J4).
      return reponse.redirect(cheminListeApres(statut, id), STATUT_VOIR_AILLEURS)
    },
  )

  app.post<ParametresFiche>(
    `${CHEMIN_DEMANDES_GARAGISTE}/:id/tentative`,
    envoiProtege,
    async (requete, reponse) => {
      prive(reponse)
      const { id } = requete.params
      if (!FORMAT_IDENTIFIANT.test(id)) return reponse.callNotFound()
      const issue = await cas.noterTentative(id)
      if (issue === 'absente') return reponse.callNotFound()
      // Depuis la fiche, on y reste (J4, passe 2 du jury) : appeler de nouveau ou ranger.
      const adresse =
        champDuCorps(requete, CHAMP_DEPUIS) === DEPUIS_FICHE
          ? cheminFicheApres('sans-reponse', id)
          : cheminListeApres('sans-reponse', id)
      return reponse.redirect(adresse, STATUT_VOIR_AILLEURS)
    },
  )

  app.post<ParametresFiche>(
    `${CHEMIN_DEMANDES_GARAGISTE}/:id/tentative/annuler`,
    envoiProtege,
    async (requete, reponse) => {
      prive(reponse)
      const { id } = requete.params
      if (!FORMAT_IDENTIFIANT.test(id)) return reponse.callNotFound()
      const issue = await cas.annulerTentative(id)
      if (issue === 'absente') return reponse.callNotFound()
      const adresse =
        champDuCorps(requete, CHAMP_DEPUIS) === DEPUIS_FICHE
          ? cheminFicheApres('tentative-annulee', id)
          : cheminListeApres('tentative-annulee', id)
      return reponse.redirect(adresse, STATUT_VOIR_AILLEURS)
    },
  )
}
