import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  onRequestAsyncHookHandler,
} from 'fastify'
import {
  CHAMP_JETON_FORMULAIRE,
  CHEMINS,
  NOM_COOKIE_SESSION,
  PARAMETRES_CONNEXION,
  type CompterDemandesARappeler,
  type DemandesARappeler,
} from '../../../../contrats/index.js'
import type { OutilsPage } from '../../../../web/index.js'
import type { DemanderLienConnexion } from '../../application/demander-lien-connexion.js'
import type { ExaminerLien } from '../../application/examiner-lien.js'
import type { FermerSession } from '../../application/fermer-session.js'
import type { IdentifierSession } from '../../application/identifier-session.js'
import type { OuvrirSession } from '../../application/ouvrir-session.js'
import type { Horloge } from '../../application/ports.js'
import type { SignalerChangement } from '../../application/signaler-changement.js'
import { cheminRetourSur } from '../../domaine/chemin-retour.js'
import { minutesAttente } from '../../domaine/limitation.js'
import { SAISIE_VIDE } from '../../domaine/signalement.js'
import type { Session } from '../../domaine/session.js'
import { verifierProvenance, type ProtectionFormulaires } from './anti-falsification.js'
import { CHEMINS_ACCES, ETAT_DECONNEXION, PARAMETRES_ACCES } from './chemins-acces.js'
import { optionsCookieSession, optionsEffacementCookie } from './cookie-session.js'
import {
  vueConnexion,
  vueEnvoiImpossible,
  vueLienEnvoye,
  vueTropDeDemandes,
} from './vues/connexion.js'
import { vueLien } from './vues/lien.js'
import { vueEnvoiRefuse } from './vues/refus.js'
import { vueSignalement, vueSignalementEnvoye } from './vues/signalement.js'
import { vueTableauDeBord } from './vues/tableau-de-bord.js'

const STATUT_VOIR_AILLEURS = 303
const MS_PAR_SECONDE = 1000
/** Valeur exacte exigée par US-33 sur toute réponse de l'espace. */
export const EN_TETE_ROBOTS = 'noindex'
/** Kano D5 et D11 : aucune page de l'espace ne se garde en cache. */
export const EN_TETE_CACHE = 'no-store'

export interface CasUsageAcces {
  readonly demanderLien: DemanderLienConnexion
  readonly examinerLien: ExaminerLien
  readonly ouvrirSession: OuvrirSession
  readonly identifierSession: IdentifierSession
  readonly fermerSession: FermerSession
  readonly signalerChangement: SignalerChangement
}

export interface ReglagesWebAcces {
  /** Origine publique configurée : liens, provenance admise, attribut `Secure`. */
  readonly urlPublique: string
  readonly canalGaragisteDisponible: boolean
  readonly canalResponsableDisponible: boolean
  readonly protection: ProtectionFormulaires
  readonly horloge: Horloge
  /** Compteur des demandes à rappeler, offert par les demandes ; absent : rien n'est dit. */
  readonly compterDemandesARappeler?: CompterDemandesARappeler
}

/** Lit un champ d'un objet non typé (requête, corps de formulaire). */
function lireChamp(source: unknown, nom: string): unknown {
  if (typeof source !== 'object' || source === null) return undefined
  return (source as Readonly<Record<string, unknown>>)[nom]
}

function enTete(valeur: string | string[] | undefined): string | undefined {
  return Array.isArray(valeur) ? valeur[0] : valeur
}

/** Vrai pour `/garagiste` et tout ce qui est dessous, paramètres compris. */
function estDansLEspace(url: string): boolean {
  const chemin = url.split('?', 1)[0] ?? url
  return chemin === CHEMINS.garagiste || chemin.startsWith(`${CHEMINS.garagiste}/`)
}

/**
 * Posé en `onRequest` sur toute requête adressée sous `/garagiste`, donc avant
 * la garde de session et quel que soit le contexte qui répond : la redirection
 * vers la connexion, le refus 401, une adresse inconnue (404) et les pages que
 * d'autres contextes publient dans l'espace (demandes, fermetures) portent
 * toutes `noindex` et `no-store`.
 */
const enTetesEspace: onRequestAsyncHookHandler = async (requete, reponse) => {
  if (!estDansLEspace(requete.url)) return
  reponse.header('x-robots-tag', EN_TETE_ROBOTS)
  reponse.header('cache-control', EN_TETE_CACHE)
}

/**
 * La page du lien porte le jeton dans son adresse : son journal d'accès
 * (« incoming request », qui écrit l'adresse complète) est coupé, pour qu'aucun
 * lien encore valable ne se lise dans les journaux (Kano D9). Les avertissements
 * et les erreurs restent écrits.
 */
const JOURNAL_SANS_ADRESSE = 'warn'

export function enregistrerRoutesAcces(
  app: FastifyInstance,
  outils: OutilsPage,
  casUsage: CasUsageAcces,
  reglages: ReglagesWebAcces,
): void {
  const { protection, horloge, urlPublique } = reglages
  app.addHook('onRequest', enTetesEspace)
  const garagiste = { preHandler: outils.exigerGaragiste }

  const sessionDe = (requete: FastifyRequest): Session | null =>
    casUsage.identifierSession(requete.cookies[NOM_COOKIE_SESSION])

  /** Provenance d'abord, puis jeton : aucun formulaire de l'espace ne passe sans les deux. */
  const formulaireAdmis = (
    requete: FastifyRequest,
    jetonValide: (jeton: unknown) => boolean,
  ): boolean =>
    verifierProvenance({
      origine: enTete(requete.headers.origin),
      referent: enTete(requete.headers.referer),
      hote: enTete(requete.headers.host),
      originePublique: urlPublique,
    }) === null && jetonValide(lireChamp(requete.body, CHAMP_JETON_FORMULAIRE))

  const refuser = (requete: FastifyRequest, reponse: FastifyReply): Promise<FastifyReply> => {
    requete.log.warn({ chemin: requete.routeOptions.url }, 'Formulaire de l’espace refusé')
    return outils.envoyerPage(
      reponse,
      vueEnvoiRefuse(requete.routeOptions.url ?? CHEMINS.garagiste),
    )
  }

  /** Le compteur ne doit jamais empêcher d'ouvrir l'espace : en panne, l'accueil se tait. */
  const demandesARappeler = async (requete: FastifyRequest): Promise<DemandesARappeler | null> => {
    if (reglages.compterDemandesARappeler === undefined) return null
    try {
      return await reglages.compterDemandesARappeler()
    } catch (erreur) {
      requete.log.error({ err: erreur }, 'Compteur des demandes à rappeler indisponible')
      return null
    }
  }

  /** La garde a laissé passer, mais la session a pu disparaître entre-temps (réinitialisation). */
  const versConnexion = (reponse: FastifyReply): FastifyReply =>
    reponse.redirect(CHEMINS.garagisteConnexion, STATUT_VOIR_AILLEURS)

  app.get(CHEMINS.garagisteConnexion, async (requete, reponse) => {
    const retour = cheminRetourSur(lireChamp(requete.query, PARAMETRES_CONNEXION.retour))
    if (sessionDe(requete) !== null) return reponse.redirect(retour, STATUT_VOIR_AILLEURS)
    return outils.envoyerPage(
      reponse,
      vueConnexion({
        canalDisponible: reglages.canalGaragisteDisponible,
        jetonFormulaire: protection.jetonConnexion(horloge.maintenant()),
        retour,
        deconnecte: lireChamp(requete.query, PARAMETRES_ACCES.etat) === ETAT_DECONNEXION,
      }),
    )
  })

  app.post(CHEMINS.garagisteConnexion, async (requete, reponse) => {
    const maintenant = horloge.maintenant()
    if (
      !formulaireAdmis(requete, (jeton) => protection.verifierJetonConnexion(jeton, maintenant))
    ) {
      return refuser(requete, reponse)
    }
    const resultat = await casUsage.demanderLien({
      adresseClient: requete.ip,
      retour: lireChamp(requete.body, PARAMETRES_CONNEXION.retour),
    })
    switch (resultat.issue) {
      case 'envoye':
        return outils.envoyerPage(reponse, vueLienEnvoye(resultat.remise, resultat.lienVisible))
      case 'trop-de-demandes':
        reponse.header('retry-after', String(Math.ceil(resultat.attenteMs / MS_PAR_SECONDE)))
        return outils.envoyerPage(reponse, vueTropDeDemandes(minutesAttente(resultat.attenteMs)))
      case 'canal-absent':
        return outils.envoyerPage(reponse, vueEnvoiImpossible('canal-absent'))
      case 'echec-envoi':
        requete.log.error({ err: resultat.erreur }, 'Lien de connexion non envoyé')
        return outils.envoyerPage(reponse, vueEnvoiImpossible('echec-envoi'))
    }
  })

  app.get(CHEMINS_ACCES.lien, { logLevel: JOURNAL_SANS_ADRESSE }, async (requete, reponse) => {
    if (sessionDe(requete) !== null)
      return reponse.redirect(CHEMINS.garagiste, STATUT_VOIR_AILLEURS)
    const jetonLien = lireChamp(requete.query, PARAMETRES_ACCES.jeton)
    const etat = casUsage.examinerLien(jetonLien)
    const ecran =
      etat === 'valide' && typeof jetonLien === 'string'
        ? {
            etat,
            jetonLien,
            jetonFormulaire: protection.jetonConnexion(horloge.maintenant()),
          }
        : { etat: etat === 'valide' ? ('inconnu' as const) : etat }
    return outils.envoyerPage(reponse, vueLien(ecran))
  })

  app.post(CHEMINS_ACCES.lien, async (requete, reponse) => {
    const maintenant = horloge.maintenant()
    if (
      !formulaireAdmis(requete, (jeton) => protection.verifierJetonConnexion(jeton, maintenant))
    ) {
      return refuser(requete, reponse)
    }
    const resultat = casUsage.ouvrirSession(lireChamp(requete.body, PARAMETRES_ACCES.jeton))
    if (resultat.issue !== 'ouverte') {
      return outils.envoyerPage(reponse, vueLien({ etat: resultat.issue }))
    }
    reponse.setCookie(
      NOM_COOKIE_SESSION,
      resultat.jetonSession,
      optionsCookieSession(urlPublique, resultat.session, maintenant),
    )
    return reponse.redirect(resultat.retour, STATUT_VOIR_AILLEURS)
  })

  app.get(CHEMINS.garagiste, garagiste, async (requete, reponse) => {
    const session = sessionDe(requete)
    const jetonSession = requete.cookies[NOM_COOKIE_SESSION]
    if (session === null || jetonSession === undefined) return versConnexion(reponse)
    // L'accueil de l'espace est l'entrée habituelle du téléphone : on y renouvelle
    // l'échéance du cookie, alignée sur celle de la session prolongée.
    reponse.setCookie(
      NOM_COOKIE_SESSION,
      jetonSession,
      optionsCookieSession(urlPublique, session, horloge.maintenant()),
    )
    return outils.envoyerPage(
      reponse,
      vueTableauDeBord(protection.jetonSession(session), await demandesARappeler(requete)),
    )
  })

  app.post(CHEMINS_ACCES.deconnexion, garagiste, async (requete, reponse) => {
    const session = sessionDe(requete)
    if (session === null) return versConnexion(reponse)
    if (!formulaireAdmis(requete, (jeton) => protection.verifierJetonSession(jeton, session))) {
      return refuser(requete, reponse)
    }
    casUsage.fermerSession(session)
    reponse.clearCookie(NOM_COOKIE_SESSION, optionsEffacementCookie(urlPublique))
    const parametres = new URLSearchParams({ [PARAMETRES_ACCES.etat]: ETAT_DECONNEXION })
    return reponse.redirect(
      `${CHEMINS.garagisteConnexion}?${parametres.toString()}`,
      STATUT_VOIR_AILLEURS,
    )
  })

  app.get(CHEMINS_ACCES.signaler, garagiste, async (requete, reponse) => {
    const session = sessionDe(requete)
    if (session === null) return versConnexion(reponse)
    return outils.envoyerPage(
      reponse,
      vueSignalement({
        saisie: SAISIE_VIDE,
        erreurs: {},
        jetonFormulaire: protection.jetonSession(session),
        canalDisponible: reglages.canalResponsableDisponible,
        probleme: null,
      }),
    )
  })

  app.post(CHEMINS_ACCES.signaler, garagiste, async (requete, reponse) => {
    const session = sessionDe(requete)
    if (session === null) return versConnexion(reponse)
    if (!formulaireAdmis(requete, (jeton) => protection.verifierJetonSession(jeton, session))) {
      return refuser(requete, reponse)
    }
    const resultat = await casUsage.signalerChangement({
      nature: lireChamp(requete.body, 'nature'),
      texte: lireChamp(requete.body, 'texte'),
    })
    if (resultat.issue === 'envoye') {
      return outils.envoyerPage(
        reponse,
        vueSignalementEnvoye(resultat.signalement, resultat.remise),
      )
    }
    if (resultat.issue === 'echec-envoi') {
      requete.log.error({ err: resultat.erreur }, 'Signalement non envoyé')
    }
    return outils.envoyerPage(
      reponse,
      vueSignalement({
        saisie: resultat.saisie,
        erreurs: resultat.issue === 'invalide' ? resultat.erreurs : {},
        jetonFormulaire: protection.jetonSession(session),
        canalDisponible: reglages.canalResponsableDisponible,
        probleme: resultat.issue === 'invalide' ? null : resultat.issue,
      }),
    )
  })
}
