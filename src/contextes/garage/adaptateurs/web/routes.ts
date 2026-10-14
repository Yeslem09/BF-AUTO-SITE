import type { FastifyInstance } from 'fastify'
import { CHEMINS } from '../../../../contrats/index.js'
import type { OutilsPage } from '../../../../web/index.js'
import type { ConsulterGarage } from '../../application/consulter-garage.js'
import type { ConsulterInformationsLegales } from '../../application/consulter-informations-legales.js'
import type { Horloge } from '../../application/ports.js'
import { vueAccesEtHoraires } from './vues/acces-et-horaires.js'
import { vueConfidentialite } from './vues/confidentialite.js'
import { vueMentionsLegales } from './vues/mentions-legales.js'
import { vueVosDroits } from './vues/vos-droits.js'

export interface CasUsagePublics {
  readonly consulterGarage: ConsulterGarage
  readonly consulterInformationsLegales: ConsulterInformationsLegales
  readonly horloge: Horloge
}

/** Redirection temporaire : le lien d'avis de la fiche peut changer. */
const STATUT_REDIRECTION_AVIS = 302

export function enregistrerRoutesPubliques(
  app: FastifyInstance,
  outils: OutilsPage,
  casUsage: CasUsagePublics,
): void {
  const ficheActuelle = () => casUsage.consulterGarage(casUsage.horloge.maintenant())

  app.get(CHEMINS.acces, async (_requete, reponse) =>
    outils.envoyerPage(reponse, vueAccesEtHoraires(await ficheActuelle())),
  )
  app.get(CHEMINS.droits, async (_requete, reponse) => {
    const [fiche, legales] = await Promise.all([
      ficheActuelle(),
      casUsage.consulterInformationsLegales(),
    ])
    return outils.envoyerPage(reponse, vueVosDroits(fiche, legales))
  })
  app.get(CHEMINS.mentionsLegales, async (_requete, reponse) =>
    outils.envoyerPage(reponse, vueMentionsLegales(await casUsage.consulterInformationsLegales())),
  )
  app.get(CHEMINS.confidentialite, async (_requete, reponse) =>
    outils.envoyerPage(reponse, vueConfidentialite(await casUsage.consulterInformationsLegales())),
  )
  // Adresse courte de l'affichette et du SMS (Kano D6) : vers le formulaire
  // d'avis de la fiche Google s'il est validé, sinon 404. Aucun cookie, aucun traceur.
  app.get(CHEMINS.avis, async (_requete, reponse) => {
    const { lienAvis } = await ficheActuelle()
    if (lienAvis === null) return reponse.callNotFound()
    return reponse.redirect(lienAvis, STATUT_REDIRECTION_AVIS)
  })
}
