/**
 * `pnpm sms:tester` (Kano connecteurs, C7, AT-C4) : configuration sans
 * secret, identifiants et crédits vérifiés auprès du fournisseur, SMS
 * d'essai si demandé.
 */
import { creerConnecteurs, type Connecteurs } from '../connecteurs.js'
import { creerLecteurEnvironnement, type Environnement } from '../environnement.js'
import { enErreurConnecteur } from '../erreurs.js'
import { decrireReglagesSms, type ReglagesConnecteurs } from '../reglages-connecteurs.js'
import { lireNumeroMobile } from '../sms/numero.js'
import { lireReglagesSms } from '../sms/reglages.js'
import {
  argumentsUtiles,
  CODES_SORTIE,
  ecrireLignes,
  lignesEchec,
  type CodeSortie,
  type Sorties,
} from './commun.js'

export const USAGE_SMS = [
  'Usage : pnpm sms:tester [--envoyer [numéro]]',
  '',
  '  sans option          affiche la configuration (sans secret), vérifie les identifiants',
  '                       et les crédits restants auprès du fournisseur',
  '  --envoyer [numéro]   envoie aussi un SMS d’essai, au destinataire configuré par défaut',
].join('\n')

const TEXTE_ESSAI =
  'BF Auto : SMS d’essai du site (pnpm sms:tester). Aucune demande n’est concernée.'

export interface ContexteTestSms {
  readonly env: Environnement
  readonly sorties: Sorties
  /** Téléphone de `garage.json`, destinataire par défaut. */
  readonly telephoneGarage: string | null
  readonly fabriquer?: (reglages: ReglagesConnecteurs) => Connecteurs
}

type OptionsSms =
  { readonly envoyer: false } | { readonly envoyer: true; readonly numero: string | null }

export async function executerTestSms(
  argumentsRecus: readonly string[],
  contexte: ContexteTestSms,
): Promise<CodeSortie> {
  const { sorties } = contexte
  const options = lireOptions(argumentsUtiles(argumentsRecus))
  if (options === null) {
    sorties.ecrireErreur(USAGE_SMS)
    return CODES_SORTIE.usage
  }
  const lecteur = creerLecteurEnvironnement(contexte.env)
  const lecture = lireReglagesSms(lecteur, contexte.telephoneGarage)
  if (lecteur.problemes.length > 0) {
    ecrireLignes(sorties, [
      'Configuration SMS invalide :',
      ...lecteur.problemes.map((p) => `- ${p}`),
    ])
    return CODES_SORTIE.usage
  }
  ecrireLignes(sorties, decrireReglagesSms(lecture.reglages))
  ecrireLignes(
    sorties,
    lecture.avertissements.map((avertissement) => `Avertissement : ${avertissement}`),
  )
  if (lecture.reglages === null) {
    return options.envoyer ? CODES_SORTIE.usage : CODES_SORTIE.succes
  }
  const fabriquer =
    contexte.fabriquer ??
    ((reglages: ReglagesConnecteurs) =>
      creerConnecteurs(reglages, { ecrireConsole: sorties.ecrire }))
  const { sms } = fabriquer({ courriel: null, sms: lecture.reglages })
  if (sms === null) return CODES_SORTIE.echec
  let reussi = true
  try {
    const { creditsRestants } = await sms.verifier()
    ecrireLignes(sorties, [
      '',
      'Compte SMS : réussi, identifiants acceptés',
      `Crédits restants : ${creditsRestants ?? 'inconnus (le fournisseur ne les donne pas)'}`,
    ])
  } catch (erreur) {
    reussi = false
    ecrireLignes(sorties, ['', ...lignesEchec('Compte SMS', enErreurConnecteur(erreur, 'SMS'))])
  }
  if (options.envoyer) {
    const numero = lireNumeroMobile(
      options.numero ?? lecture.reglages.destinataire ?? contexte.telephoneGarage ?? '',
    )
    if (!numero.valide) {
      ecrireLignes(sorties, [`Numéro refusé : ${numero.raison}`])
      return CODES_SORTIE.usage
    }
    try {
      const remise = await sms.envoyer({ destinataire: numero.international, texte: TEXTE_ESSAI })
      ecrireLignes(sorties, [
        '',
        `SMS d’essai remis au fournisseur pour ${numero.international} (${remise.segments} SMS facturé(s)).`,
      ])
    } catch (erreur) {
      reussi = false
      ecrireLignes(sorties, ['', ...lignesEchec('SMS d’essai', enErreurConnecteur(erreur, 'SMS'))])
    }
  }
  return reussi ? CODES_SORTIE.succes : CODES_SORTIE.echec
}

function lireOptions(argumentsRecus: readonly string[]): OptionsSms | null {
  if (argumentsRecus.length === 0) return { envoyer: false }
  const [option, numero, ...reste] = argumentsRecus
  if (option !== '--envoyer' || reste.length > 0) return null
  return { envoyer: true, numero: numero ?? null }
}
