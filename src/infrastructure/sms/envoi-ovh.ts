/**
 * SMS par l'API OVHcloud : `POST /sms/{service}/jobs`, requête signée
 * (`$1$` suivi du SHA-1 du secret, de la clé consommateur, de la méthode, de
 * l'adresse, du corps et de l'horodatage, joints par « + »). L'horodatage
 * vient de `/auth/time` : une horloge de serveur décalée ne fait pas refuser
 * la signature.
 */
import { createHash } from 'node:crypto'
import { ErreurConnecteur } from '../erreurs.js'
import {
  appelerJson,
  echecHttp,
  estSucces,
  lireChamp,
  messageDuCorps,
  type ReponseJson,
} from '../http.js'
import type { EnvoiSms } from './ports.js'
import type { ReglagesOvh } from './reglages.js'
import { preparerTexteSms } from './texte-sms.js'

const CONNECTEUR = 'SMS OVHcloud'
const PREFIXE_SIGNATURE = '$1$'
const REMEDE_IDENTIFIANTS =
  'Vérifiez SMS_OVH_CLE_APPLICATION, SMS_OVH_SECRET_APPLICATION et SMS_OVH_CLE_CONSOMMATEUR : la clé consommateur doit autoriser GET et POST sur /sms/* (création sur https://eu.api.ovh.com/createToken/).'

/** Signature d'une requête de l'API OVHcloud. */
export function signerRequeteOvh(
  reglages: Pick<ReglagesOvh, 'secretApplication' | 'cleConsommateur'>,
  methode: string,
  url: string,
  corps: string,
  horodatage: number,
): string {
  const aSigner = [
    reglages.secretApplication,
    reglages.cleConsommateur,
    methode,
    url,
    corps,
    String(horodatage),
  ].join('+')
  return `${PREFIXE_SIGNATURE}${createHash('sha1').update(aSigner).digest('hex')}`
}

export function creerEnvoiSmsOvh(reglages: ReglagesOvh): EnvoiSms {
  const adresseService = `${reglages.pointAcces}/sms/${encodeURIComponent(reglages.service)}`

  async function heureOvh(): Promise<number> {
    const reponse = await appelerJson(
      { methode: 'GET', url: `${reglages.pointAcces}/auth/time` },
      CONNECTEUR,
    )
    if (!estSucces(reponse) || typeof reponse.corps !== 'number') {
      throw echecHttp(reponse, CONNECTEUR, messageDuCorps(reponse.corps), REMEDE_IDENTIFIANTS)
    }
    return reponse.corps
  }

  async function appelerSigne(
    methode: 'GET' | 'POST',
    url: string,
    corps = '',
  ): Promise<ReponseJson> {
    const horodatage = await heureOvh()
    const reponse = await appelerJson(
      {
        methode,
        url,
        enTetes: {
          'X-Ovh-Application': reglages.cleApplication,
          'X-Ovh-Consumer': reglages.cleConsommateur,
          'X-Ovh-Timestamp': String(horodatage),
          'X-Ovh-Signature': signerRequeteOvh(reglages, methode, url, corps, horodatage),
        },
        ...(corps === '' ? {} : { corps }),
      },
      CONNECTEUR,
    )
    if (!estSucces(reponse)) {
      throw echecHttp(reponse, CONNECTEUR, messageDuCorps(reponse.corps), REMEDE_IDENTIFIANTS)
    }
    return reponse
  }

  return {
    fournisseur: 'ovh',
    async envoyer(sms) {
      const { texte, segments } = preparerTexteSms(sms.texte)
      const corps = JSON.stringify({
        message: texte,
        receivers: [sms.destinataire],
        charset: 'UTF-8',
        coding: '7bit',
        priority: 'high',
        // Message de service au garagiste, pas de prospection : pas de mention STOP.
        noStopClause: true,
        ...(reglages.expediteur === null
          ? { senderForResponse: true }
          : { sender: reglages.expediteur }),
      })
      const reponse = await appelerSigne('POST', `${adresseService}/jobs`, corps)
      const resultat = lireResultatEnvoi(reponse.corps)
      if (resultat.refuses.length > 0 || resultat.identifiants.length === 0) {
        throw new ErreurConnecteur(
          CONNECTEUR,
          'refus',
          `Numéro refusé par OVHcloud : ${resultat.refuses.join(', ') || sms.destinataire}`,
          'Vérifiez SMS_DESTINATAIRE (un mobile, au format 06 ou +33) et les crédits du compte SMS.',
        )
      }
      return { identifiant: resultat.identifiants.join(','), segments }
    },
    async verifier() {
      const reponse = await appelerSigne('GET', adresseService)
      const credits = lireChamp(reponse.corps, 'creditsLeft')
      return { creditsRestants: typeof credits === 'number' ? credits : null }
    },
  }
}

function lireResultatEnvoi(corps: unknown): {
  readonly identifiants: readonly string[]
  readonly refuses: readonly string[]
} {
  const liste = (nom: string): string[] => {
    const valeur = lireChamp(corps, nom)
    return Array.isArray(valeur) ? valeur.map(String) : []
  }
  return { identifiants: liste('ids'), refuses: liste('invalidReceivers') }
}
