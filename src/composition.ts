/**
 * Racine de composition UNIQUE : seul endroit qui connaît tous les contextes.
 * Elle assemble chacun d'eux avec sa configuration, branche les capacités
 * qu'ils s'offrent (via les contrats), tient la porte de démarrage en
 * production, puis fabrique le serveur.
 *
 * Chaque contexte expose `assembler<Contexte>(dépendances)` dans son
 * `module.ts` : il y instancie lui-même ses adaptateurs et ses cas d'usage,
 * si bien qu'on le fait évoluer sans toucher à ce fichier.
 */
import { join } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ModeSite, SurveillerNotifications } from './contrats/index.js'
import type { Configuration } from './configuration.js'
import { assemblerAcces } from './contextes/acces/module.js'
import { assemblerCatalogue } from './contextes/catalogue/module.js'
import { assemblerDemandes, type ConnecteursDemandes } from './contextes/demandes/module.js'
import { horlogeSysteme } from './contextes/garage/adaptateurs/horloge/horloge-systeme.js'
import type { Horloge } from './contextes/garage/application/ports.js'
import { assemblerGarage } from './contextes/garage/module.js'
import { assemblerPreDiagnostic } from './contextes/pre-diagnostic/module.js'
import {
  creerConnecteurs,
  verifierConnecteurs,
  type Connecteurs,
  type RapportVerification,
  type ResultatVerification,
} from './infrastructure/connecteurs.js'
import { estAdresseCourriel } from './infrastructure/environnement.js'
import { decrireEchec } from './infrastructure/erreurs.js'
import type { ReglagesConnecteurs } from './infrastructure/reglages-connecteurs.js'
import { resoudreDestinataireSms } from './infrastructure/sms/reglages.js'
import { creerServeur } from './web/serveur.js'

export const FICHIER_GARAGE = 'garage.json'

export interface Surcharges {
  /** Horloge imposée (captures d'écran, tests) ; l'horloge système par défaut. */
  readonly horloge?: Horloge
}

/** Données bloquantes encore manquantes d'une partie du site (Kano D8). */
export interface ManquesDUnePartie {
  readonly partie: string
  readonly manques: readonly string[]
}

/**
 * Démarrage refusé en production : le message liste, partie par partie, chaque
 * donnée bloquante qui manque, pour que tout se corrige d'un coup.
 */
export class ErreurDemarrageProduction extends Error {
  override readonly name = 'ErreurDemarrageProduction'

  constructor(readonly parties: readonly ManquesDUnePartie[]) {
    super(
      [
        'Démarrage refusé en production : données bloquantes à valider (Kano D8).',
        ...parties.flatMap(({ partie, manques }) => [
          `${partie} :`,
          ...manques.map((manque) => `- ${manque}`),
        ]),
      ].join('\n'),
    )
  }
}

/**
 * Canal de notification des demandes (Kano D5 et D8) : sans serveur d'envoi ni
 * destinataire, chaque demande serait écrite sans jamais être lue.
 */
export function manquesDuCanalDeNotification(configuration: Configuration): readonly string[] {
  const manques: string[] = []
  if (configuration.connecteurs.courriel === null) {
    manques.push(
      'SMTP_UTILISATEUR et SMTP_MOT_DE_PASSE : aucun envoi de courriel configuré (Gmail : adresse et mot de passe d’application)',
    )
  }
  if (configuration.courrielGarage === null) {
    manques.push('COURRIEL_GARAGE : destinataire des notifications de demande absent')
  }
  return manques
}

/**
 * Porte de démarrage unique : en production, une seule donnée bloquante
 * manquante, quelle que soit la partie qui la porte, arrête le site. Le
 * pré-diagnostic non relu n'y figure pas : il n'est simplement pas publié.
 * Relecture et démonstration ne sont jamais en ligne : rien ne les bloque.
 */
export function verifierPorteDeProduction(
  mode: ModeSite,
  parties: readonly ManquesDUnePartie[],
): void {
  if (mode !== 'production') return
  const bloquees = parties.filter(({ manques }) => manques.length > 0)
  if (bloquees.length > 0) throw new ErreurDemarrageProduction(bloquees)
}

/** Vérification de la connexion d'envoi, refaite chaque jour (Kano connecteurs, C4). */
export const INTERVALLE_VERIFICATION_ENVOI_MS = 24 * 60 * 60 * 1_000
/** Nom du connecteur d'envoi signalé à la sonde quand sa vérification échoue. */
export const CONNECTEUR_ENVOI = 'Envoi de courriel'

/**
 * Destinataire SMS à défaut de SMS_DESTINATAIRE : le téléphone du garage
 * (source unique, garage.json). Renvoie les réglages résolus et le manque
 * éventuel, bloquant en production.
 */
function resoudreConnecteurs(
  reglages: ReglagesConnecteurs,
  telephoneGarage: string,
): { readonly reglages: ReglagesConnecteurs; readonly manques: readonly string[] } {
  if (reglages.sms === null) return { reglages, manques: [] }
  const resolu = resoudreDestinataireSms(reglages.sms, telephoneGarage)
  return 'probleme' in resolu
    ? { reglages: { ...reglages, sms: null }, manques: [resolu.probleme] }
    : { reglages: { ...reglages, sms: resolu.reglages }, manques: [] }
}

/** Ce que les demandes reçoivent des connecteurs du site. */
function connecteursDesDemandes(
  connecteurs: Connecteurs,
  reglages: ReglagesConnecteurs,
  courrielGarage: string | null,
): ConnecteursDemandes {
  const imap = reglages.courriel?.imap ?? null
  const destinataireSms = reglages.sms?.destinataire ?? null
  return {
    expediteur: connecteurs.expediteur,
    lecture:
      connecteurs.boite === null || imap === null
        ? null
        : {
            boite: connecteurs.boite,
            dossier: imap.dossier,
            intervalleSecondes: imap.intervalleSecondes,
            expediteursAdmis: [courrielGarage, imap.utilisateur].filter(
              (adresse): adresse is string => adresse !== null && estAdresseCourriel(adresse),
            ),
          },
    sms:
      connecteurs.sms === null || destinataireSms === null
        ? null
        : { envoi: connecteurs.sms, destinataire: destinataireSms },
  }
}

const TITRES_VERIFICATION: Readonly<Record<keyof RapportVerification, string>> = {
  envoi: 'Envoi de courriel',
  lecture: 'Lecture de la boîte',
  sms: 'SMS au garagiste',
}

/**
 * Au démarrage en production, puis chaque jour pour l'envoi : vérifie les
 * connecteurs sans jamais bloquer le démarrage ; un échec s'écrit au journal
 * avec sa cause et son remède, et l'envoi en échec dégrade `/sante` (Kano
 * connecteurs, C4). Renvoie ce que la sonde doit ajouter.
 */
function surveillerConnecteurs(
  app: FastifyInstance,
  connecteurs: Connecteurs,
  avertissements: readonly string[],
): () => readonly string[] {
  let envoiEnEchec = false
  const journaliser = (titre: string, resultat: ResultatVerification) => {
    if (resultat.etat === 'echec') app.log.error(decrireEchec(resultat.erreur).join('\n'))
    if (resultat.etat === 'reussi') app.log.info(`${titre} : ${resultat.detail}`)
  }
  const verifier = async (tout: boolean) => {
    const rapport = await verifierConnecteurs(
      tout ? connecteurs : { expediteur: connecteurs.expediteur, boite: null, sms: null },
    )
    envoiEnEchec = rapport.envoi.etat === 'echec'
    for (const cle of Object.keys(TITRES_VERIFICATION) as (keyof RapportVerification)[]) {
      journaliser(TITRES_VERIFICATION[cle], rapport[cle])
    }
  }
  const quotidien = setInterval(() => void verifier(false), INTERVALLE_VERIFICATION_ENVOI_MS)
  quotidien.unref()
  app.addHook('onReady', async () => {
    for (const avertissement of avertissements) app.log.warn(avertissement)
    void verifier(true)
  })
  app.addHook('onClose', async () => clearInterval(quotidien))
  return () => (envoiEnEchec ? [CONNECTEUR_ENVOI] : [])
}

export async function composer(
  configuration: Configuration,
  surcharges: Surcharges = {},
): Promise<FastifyInstance> {
  const horloge = surcharges.horloge ?? horlogeSysteme
  const { mode, cheminDonnees, baseSqlite, urlPublique } = configuration
  // Le pré-diagnostic interroge le garage et les familles du catalogue (prix
  // indicatif des demandes de prix du résultat), et le garage les prix du
  // catalogue et les rappels promis des demandes, à chaque page rendue, jamais
  // pendant l'assemblage : ces appels différés rompent les cycles entre
  // contextes (le catalogue lit l'identité du garage, les demandes ses
  // demi-journées).
  const preDiagnostic = await assemblerPreDiagnostic({
    mode,
    cheminDonnees,
    consulterGarage: () => garage.fournirCadre(),
    trouverFamille: (identifiant) => catalogue.trouverFamille(identifiant),
  })
  const { preDiagnosticPublie } = preDiagnostic
  const garage = await assemblerGarage({
    mode,
    cheminFichier: join(cheminDonnees, FICHIER_GARAGE),
    cheminBase: baseSqlite,
    horloge,
    preDiagnosticPublie,
    consulterTarifsDuSocle: () => catalogue.consulterTarifsDuSocle(),
    // L'écran de fermeture prévient des rappels déjà promis ces jours-là.
    listerRappelsPromis: (du, au) => demandes.listerRappelsPromis(du, au),
  })
  const { identite } = await garage.fournirCadre()
  const catalogue = await assemblerCatalogue({
    mode,
    cheminDonnees,
    garage: identite,
    preDiagnosticPublie,
  })
  const resolus = resoudreConnecteurs(configuration.connecteurs, identite.telephone.affichable)
  try {
    verifierPorteDeProduction(mode, [
      { partie: 'Garage', manques: garage.donneesBloquantesAValider },
      { partie: 'SMS au garagiste', manques: resolus.manques },
      { partie: 'Catalogue', manques: catalogue.donneesBloquantesAValider },
      {
        partie: 'Notification des demandes',
        manques: manquesDuCanalDeNotification(configuration),
      },
    ])
  } catch (erreur) {
    // Aucun serveur ne fermera la base du garage : la libérer ici.
    garage.fermer()
    throw erreur
  }

  const connecteurs = creerConnecteurs(resolus.reglages, {
    ecrireConsole: (texte) => console.info(texte),
  })
  const demandes = await assemblerDemandes({
    mode,
    cheminBase: baseSqlite,
    cheminDonnees,
    urlPublique,
    courrielGarage: configuration.courrielGarage,
    connecteurs: connecteursDesDemandes(
      connecteurs,
      resolus.reglages,
      configuration.courrielGarage,
    ),
    horloge,
    fournirIdentite: async () => (await garage.fournirCadre()).identite,
    trouverFamille: catalogue.trouverFamille,
    listerCeQueNousNeFaisonsPas: catalogue.listerCeQueNousNeFaisonsPas,
    consulterOffrePieces: catalogue.consulterOffrePieces,
    retrouverResumePreDiagnostic: preDiagnostic.retrouverResumePreDiagnostic,
    proposerDemiJournees: garage.proposerDemiJournees,
    annoncerRappel: garage.annoncerRappel,
    garageFermeAujourdhui: garage.fermeAujourdhui,
  })
  const acces = await assemblerAcces({
    mode,
    cheminBase: baseSqlite,
    horloge,
    compterDemandesARappeler: demandes.compterDemandesARappeler,
    reglages: {
      urlPublique,
      courrielGaragiste: configuration.courrielGaragiste,
      courrielResponsable: configuration.courrielResponsable,
      expediteur: connecteurs.expediteur,
    },
  })

  let connecteursEnEchec: () => readonly string[] = () => []
  const surveillerNotifications: SurveillerNotifications = async () => {
    const etat = await demandes.surveillerNotifications()
    const enEchec = [...(etat.connecteursEnEchec ?? []), ...connecteursEnEchec()]
    return {
      ...etat,
      connecteursEnEchec: enEchec,
      etat: etat.etat === 'degradee' || enEchec.length > 0 ? 'degradee' : 'ok',
    }
  }
  const app = await creerServeur({
    modules: [garage.module, catalogue.module, preDiagnostic.module, demandes.module, acces.module],
    fournirCadre: garage.fournirCadre,
    urlPublique,
    racinePublique: configuration.cheminPublic,
    niveauJournal: configuration.niveauJournal,
    verifierSessionGaragiste: acces.verifierSession,
    protectionFormulairesGaragiste: acces.protectionFormulairesGaragiste,
    maintenant: () => horloge.maintenant(),
    mode,
    preDiagnosticPublie,
    surveillerNotifications,
    mandatairesDeConfiance: configuration.mandatairesDeConfiance,
  })
  if (mode === 'production') {
    connecteursEnEchec = surveillerConnecteurs(
      app,
      connecteurs,
      configuration.avertissementsConnecteurs,
    )
  }
  return app
}
