import type { FastifyInstance, FastifyReply } from 'fastify'
import { CHEMINS } from '../../../../contrats/index.js'
import type { OutilsPage } from '../../../../web/index.js'
import type { ChangerType } from '../../application/changer-type.js'
import type { ConsulterConfirmation } from '../../application/consulter-confirmation.js'
import type { EnvoyerDemande } from '../../application/envoyer-demande.js'
import type { PreparerFormulaire } from '../../application/preparer-formulaire.js'
import type { NumeroRappelAffiche } from '../../domaine/numero-rappel.js'
import { lireType } from '../../domaine/validation.js'
import { CHAMPS_HTML, PARAMETRE_JETON_CONFIRMATION, cheminConfirmation } from './adresses.js'
import { champDuCorps, lireEnvoi, lireParametres, origineAutorisee } from './requete.js'
import type { GarageAffiche } from './vues/communs.js'
import { vueConfirmation, vueConfirmationNeutre } from './vues/confirmation.js'
import { saisieInitiale, vueFormulaireDemande } from './vues/formulaire.js'
import { vueLimiteAtteinte, vueOrigineRefusee } from './vues/refus.js'

const STATUT_VOIR_AILLEURS = 303
/** Pages qui portent des données personnelles : jamais gardées en cache (US-48). */
const CACHE_AUCUN = 'no-store'
/** La confirmation ne transmet pas son adresse, jeton compris, à un site suivant (US-12). */
const REFERENT_AUCUN = 'no-referrer'

export interface CasUsagePublics {
  readonly preparerFormulaire: PreparerFormulaire
  readonly envoyerDemande: EnvoyerDemande
  readonly consulterConfirmation: ConsulterConfirmation
  readonly changerType: ChangerType
  readonly garage: () => Promise<GarageAffiche>
  readonly numeroRappel: NumeroRappelAffiche | null
}

function sansCache(reponse: FastifyReply): FastifyReply {
  return reponse.header('cache-control', CACHE_AUCUN)
}

export function enregistrerRoutesPubliques(
  app: FastifyInstance,
  outils: OutilsPage,
  cas: CasUsagePublics,
): void {
  app.get(CHEMINS.demande, async (requete, reponse) => {
    const [formulaire, garage] = await Promise.all([
      cas.preparerFormulaire(lireParametres(requete)),
      cas.garage(),
    ])
    return outils.envoyerPage(
      reponse,
      vueFormulaireDemande({
        formulaire,
        valeurs: saisieInitiale(formulaire),
        erreurs: {},
        etape: 'saisie',
        formulaireDejaEnvoye: false,
        garage,
      }),
    )
  })

  app.post(CHEMINS.demande, async (requete, reponse) => {
    sansCache(reponse)
    const garage = await cas.garage()
    if (!origineAutorisee(requete)) {
      requete.log.warn('Demande refusée : en-tête Origin d’un autre site')
      return outils.envoyerPage(reponse, vueOrigineRefusee(garage))
    }
    const envoi = lireEnvoi(requete)
    // Un bouton de type : le formulaire revient à ce type, saisie gardée ;
    // rien n'est validé, compté ni enregistré (J2).
    const typeVoulu = lireType(champDuCorps(requete, CHAMPS_HTML.changerType))
    if (typeVoulu !== null) {
      const { formulaire, valeurs } = await cas.changerType(envoi, typeVoulu)
      return outils.envoyerPage(
        reponse,
        vueFormulaireDemande({
          formulaire,
          valeurs,
          erreurs: {},
          etape: 'saisie',
          formulaireDejaEnvoye: false,
          garage,
          typeChange: true,
        }),
      )
    }
    const issue = await cas.envoyerDemande(envoi)
    switch (issue.issue) {
      case 'enregistree':
      case 'deja-enregistree':
        return reponse.redirect(cheminConfirmation(issue.jetonConfirmation), STATUT_VOIR_AILLEURS)
      case 'invalide':
      case 'a-confirmer':
        return outils.envoyerPage(
          reponse,
          vueFormulaireDemande({
            formulaire: issue.formulaire,
            valeurs: { ...envoi.saisie, type: issue.formulaire.type },
            erreurs: issue.issue === 'invalide' ? issue.erreurs : {},
            etape: issue.issue === 'invalide' ? 'saisie' : 'confirmation',
            formulaireDejaEnvoye:
              issue.issue === 'a-confirmer' && issue.motif === 'formulaire-deja-envoye',
            garage,
            contenuAConfirmer: issue.issue === 'a-confirmer' ? issue.contenu : null,
          }),
        )
      case 'limite-atteinte':
        return outils.envoyerPage(reponse, vueLimiteAtteinte(garage))
    }
  })

  app.get(CHEMINS.demandeEnvoyee, async (requete, reponse) => {
    sansCache(reponse).header('referrer-policy', REFERENT_AUCUN)
    const parametres = new URLSearchParams(requete.url.split('?')[1] ?? '')
    const confirmation = await cas.consulterConfirmation(
      parametres.get(PARAMETRE_JETON_CONFIRMATION) ?? '',
    )
    const garage = await cas.garage()
    switch (confirmation.etat) {
      case 'introuvable':
        return reponse.callNotFound()
      case 'neutre':
        return outils.envoyerPage(reponse, vueConfirmationNeutre(garage))
      case 'disponible':
        return outils.envoyerPage(
          reponse,
          vueConfirmation({
            demande: confirmation.demande,
            suite: confirmation.suite,
            numeroRappel: cas.numeroRappel,
            garage,
          }),
        )
    }
  })
}
