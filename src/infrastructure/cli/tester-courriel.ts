/**
 * `pnpm courriel:tester` (Kano connecteurs, C7 et US-C11) : configuration
 * sans secret, vérification SMTP et IMAP, courriel d'essai référencé si
 * demandé, messages référencés récents listés sans être marqués.
 */
import { creerConnecteurs, verifierConnecteurs, type Connecteurs } from '../connecteurs.js'
import { lireReglagesCourriel } from '../courriel/reglages.js'
import { genererReference } from '../courriel/reference.js'
import type { MessageRecu } from '../courriel/lecture/ports.js'
import {
  creerLecteurEnvironnement,
  estAdresseCourriel,
  type Environnement,
} from '../environnement.js'
import { enErreurConnecteur } from '../erreurs.js'
import { decrireReglagesCourriel, type ReglagesConnecteurs } from '../reglages-connecteurs.js'
import {
  argumentsUtiles,
  CODES_SORTIE,
  ecrireLignes,
  formaterDate,
  lignesEchec,
  lignesVerification,
  type CodeSortie,
  type Sorties,
} from './commun.js'

export const USAGE_COURRIEL = [
  'Usage : pnpm courriel:tester [--envoyer <adresse>] [--jours <n>]',
  '',
  '  sans option          affiche la configuration (sans secret), vérifie l’envoi (SMTP) et la',
  '                       lecture (IMAP), liste les messages référencés des 7 derniers jours',
  '  --envoyer <adresse>  envoie aussi un courriel d’essai référencé à cette adresse',
  '  --jours <n>          période de la liste, de 1 à 90 jours',
  '',
  'Rien n’est jamais marqué, déplacé ni supprimé dans la boîte.',
].join('\n')

const JOURS = { defaut: 7, min: 1, max: 90 } as const
const MILLISECONDES_PAR_JOUR = 86_400_000
const OBJET_ESSAI = 'Courriel d’essai du site BF Auto'

export interface ContexteTestCourriel {
  readonly env: Environnement
  readonly sorties: Sorties
  readonly maintenant: () => Date
  /** Fabrique des connecteurs ; remplacée par des doublures dans les tests. */
  readonly fabriquer?: (reglages: ReglagesConnecteurs) => Connecteurs
  readonly genererReference?: () => string
}

interface OptionsCourriel {
  readonly envoyerA: string | null
  readonly jours: number
}

export async function executerTestCourriel(
  argumentsRecus: readonly string[],
  contexte: ContexteTestCourriel,
): Promise<CodeSortie> {
  const { sorties } = contexte
  const options = lireOptions(argumentsUtiles(argumentsRecus))
  if (options === null) {
    sorties.ecrireErreur(USAGE_COURRIEL)
    return CODES_SORTIE.usage
  }
  const lecteur = creerLecteurEnvironnement(contexte.env)
  const lecture = lireReglagesCourriel(lecteur)
  if (lecteur.problemes.length > 0) {
    ecrireLignes(sorties, [
      'Configuration du courriel invalide :',
      ...lecteur.problemes.map((p) => `- ${p}`),
    ])
    return CODES_SORTIE.usage
  }
  ecrireLignes(sorties, decrireReglagesCourriel(lecture.reglages))
  ecrireLignes(
    sorties,
    lecture.avertissements.map((avertissement) => `Avertissement : ${avertissement}`),
  )
  if (lecture.reglages === null) {
    ecrireLignes(sorties, [
      'Rien à tester : renseignez au moins SMTP_UTILISATEUR (adresse Gmail) et SMTP_MOT_DE_PASSE (mot de passe d’application).',
    ])
    return CODES_SORTIE.usage
  }
  const fabriquer =
    contexte.fabriquer ??
    ((reglages: ReglagesConnecteurs) =>
      creerConnecteurs(reglages, { ecrireConsole: sorties.ecrire }))
  const connecteurs = fabriquer({ courriel: lecture.reglages, sms: null })
  const rapport = await verifierConnecteurs(connecteurs)
  ecrireLignes(sorties, [
    '',
    ...lignesVerification('Envoi (SMTP)', rapport.envoi),
    ...lignesVerification('Lecture (IMAP)', rapport.lecture),
  ])
  let reussi = rapport.envoi.etat !== 'echec' && rapport.lecture.etat !== 'echec'

  if (options.envoyerA !== null && connecteurs.expediteur !== null) {
    const reference = (contexte.genererReference ?? genererReference)()
    try {
      await connecteurs.expediteur.envoyer({
        destinataire: options.envoyerA,
        objet: OBJET_ESSAI,
        texte: texteEssai(contexte.maintenant()),
        fil: { reference, rang: 1 },
      })
      ecrireLignes(sorties, [
        '',
        `Courriel d’essai remis au serveur pour ${options.envoyerA} (référence ${reference}).`,
        'Pour tester la lecture : répondez « fait » à ce courriel depuis la boîte du garage, puis relancez',
        'pnpm courriel:tester ; la réponse doit apparaître ci-dessous comme « commande reconnue ».',
      ])
    } catch (erreur) {
      reussi = false
      ecrireLignes(sorties, [
        '',
        ...lignesEchec('Courriel d’essai', enErreurConnecteur(erreur, 'Courriel')),
      ])
    }
  }

  if (connecteurs.boite !== null && rapport.lecture.etat === 'reussi') {
    const depuis = new Date(
      contexte.maintenant().getTime() - options.jours * MILLISECONDES_PAR_JOUR,
    )
    try {
      const messages = await connecteurs.boite.listerRecents(depuis)
      ecrireLignes(sorties, [
        '',
        `Messages référencés des ${options.jours} derniers jours : ${messages.length} (aucun n’est marqué ni modifié)`,
        ...messages.map(decrireMessage),
      ])
    } catch (erreur) {
      reussi = false
      ecrireLignes(sorties, [
        '',
        ...lignesEchec('Liste des messages', enErreurConnecteur(erreur, 'Courriel')),
      ])
    }
  }
  return reussi ? CODES_SORTIE.succes : CODES_SORTIE.echec
}

function lireOptions(argumentsRecus: readonly string[]): OptionsCourriel | null {
  let envoyerA: string | null = null
  let jours: number = JOURS.defaut
  for (let index = 0; index < argumentsRecus.length; index += 1) {
    const argument = argumentsRecus[index]
    const valeur = argumentsRecus[index + 1]
    if (argument === '--envoyer' && valeur !== undefined && estAdresseCourriel(valeur)) {
      envoyerA = valeur
      index += 1
    } else if (argument === '--jours' && valeur !== undefined) {
      const nombre = Number(valeur)
      if (!Number.isInteger(nombre) || nombre < JOURS.min || nombre > JOURS.max) return null
      jours = nombre
      index += 1
    } else {
      return null
    }
  }
  return { envoyerA, jours }
}

function texteEssai(maintenant: Date): string {
  return [
    'Bonjour,',
    '',
    `Ceci est un courriel d’essai envoyé par le site BF Auto (pnpm courriel:tester) le ${formaterDate(maintenant)}.`,
    'Il vérifie que les notifications de demande arrivent bien dans cette boîte.',
    '',
    'Pour vérifier aussi la lecture des réponses, répondez simplement « fait » à ce courriel,',
    'puis relancez pnpm courriel:tester : votre réponse doit apparaître comme « commande reconnue ».',
    'Aucune demande n’est concernée par cet essai.',
    '',
  ].join('\n')
}

const LIBELLES_AUTHENTIFICATION = {
  reussie: 'authentification réussie',
  echouee: 'authentification EN ÉCHEC',
  inconnue: 'authentification non indiquée',
} as const

/** Une ligne par message, sans son texte : date, référence, nature, verdict. */
function decrireMessage(message: MessageRecu): string {
  const tete = `  ${formaterDate(message.recuLe)}  ${message.references.join(', ')}`
  if (message.nature === 'reponse') {
    const commande =
      message.commande === null ? 'réponse non reconnue' : 'commande reconnue (ranger « Traitée »)'
    return `${tete}  réponse de ${message.expediteur ?? 'expéditeur inconnu'} : ${commande}, ${LIBELLES_AUTHENTIFICATION[message.authentification]}`
  }
  const action = message.action === 'echec' ? 'non remis' : 'remise retardée'
  const details = [message.statut, message.motif].filter((valeur) => valeur !== null).join(', ')
  return `${tete}  ${action} à ${message.destinataire ?? 'destinataire inconnu'}${details === '' ? '' : ` : ${details}`}`
}
