/**
 * Boîte de réception lue par IMAP avec imapflow (Kano connecteurs, C5).
 *
 * Garanties, vérifiées par les tests de cet adaptateur :
 * - le dossier est ouvert en lecture seule (`EXAMINE`) ; aucune commande
 *   d'écriture n'est connue du client utilisé (ni drapeau, ni déplacement, ni
 *   suppression) ;
 * - le serveur trie d'abord (recherche), puis les en-têtes seuls sont lus ;
 *   le contenu n'est téléchargé que pour les messages retenus ;
 * - une connexion par relevé, fermée ensuite ; journal du client coupé.
 */
import {
  ImapFlow,
  type FetchMessageObject,
  type FetchQueryObject,
  type ImapFlowOptions,
  type MessageEnvelopeObject,
  type MessageStructureObject,
  type SearchObject,
} from 'imapflow'
import { estHoteLocal } from '../../reseau.js'
import { diagnostiquerCourriel, type ContexteDiagnostic } from '../diagnostic.js'
import type { ReglagesImap } from '../reglages.js'
import { analyserSource, lireEnTetesOriginal } from './analyse.js'
import { avancerFiligrane, planifierReleve, uidsNouveaux, type EtatDossier } from './filigrane.js'
import type { BoiteDeReception, MessageRecu, Releve } from './ports.js'
import { MOTIF_RECHERCHE, trierEnTetes, type EnTetesMessage, type OriginalRapport } from './tri.js'

/** Le sous-ensemble d'imapflow dont la lecture a besoin : aucune méthode d'écriture. */
export interface ClientImap {
  connect(): Promise<void>
  logout(): Promise<void>
  close(): void
  on(evenement: 'error', ecouteur: (erreur: Error) => void): unknown
  getMailboxLock(chemin: string, options: { readOnly: true }): Promise<{ release(): void }>
  readonly mailbox:
    { readonly uidValidity: bigint; readonly uidNext: number; readonly exists: number } | false
  search(requete: SearchObject, options: { uid: true }): Promise<number[] | false | undefined>
  fetchAll(
    plage: string,
    requete: FetchQueryObject,
    options: { uid: true },
  ): Promise<FetchMessageObject[]>
}

export type FabriqueClientImap = () => ClientImap

/** Délais bornés : un relevé ne reste jamais pendu à un serveur muet (BC-13). */
export const DELAIS_IMAP = { connexionMs: 10_000, inactiviteMs: 30_000 } as const
const VERSION_TLS_MINIMALE = 'TLSv1.2' as const

/** En-têtes lus pour trier, en plus de l'enveloppe et de la structure. */
const ENTETES_DE_TRI = [
  'references',
  'auto-submitted',
  'precedence',
  'x-autoreply',
  'x-autorespond',
  'content-type',
]
const TYPES_ORIGINAL_ENVELOPPE = new Set(['message/rfc822', 'message/global'])
const TYPE_ENTETES_ORIGINAL = 'text/rfc822-headers'

/**
 * Premier tri, par le serveur : objet ou en-têtes de fil qui citent une
 * référence, ou messages du système de messagerie (rapports de non-remise).
 */
const CRITERES_SERVEUR: readonly SearchObject[] = [
  { subject: MOTIF_RECHERCHE },
  { header: { 'in-reply-to': MOTIF_RECHERCHE } },
  { header: { references: MOTIF_RECHERCHE } },
  { from: 'mailer-daemon' },
  { from: 'postmaster' },
  { header: { 'content-type': 'multipart/report' } },
]

/** Options d'imapflow : TLS direct, ou STARTTLS exigé hors machine locale ; journal coupé, pas d'IDLE. */
export function optionsImapflow(reglages: ReglagesImap): ImapFlowOptions {
  const { hote, port, securise } = reglages.serveur
  return {
    host: hote,
    port,
    secure: securise,
    doSTARTTLS: securise ? undefined : !estHoteLocal(hote),
    tls: { servername: hote, minVersion: VERSION_TLS_MINIMALE },
    auth: { user: reglages.utilisateur, pass: reglages.motDePasse },
    logger: false,
    disableAutoIdle: true,
    connectionTimeout: DELAIS_IMAP.connexionMs,
    greetingTimeout: DELAIS_IMAP.connexionMs,
    socketTimeout: DELAIS_IMAP.inactiviteMs,
  }
}

export function creerFabriqueImapflow(reglages: ReglagesImap): FabriqueClientImap {
  const options = optionsImapflow(reglages)
  return () => new ImapFlow(options)
}

export function creerBoiteImap(
  reglages: ReglagesImap,
  fabrique: FabriqueClientImap = creerFabriqueImapflow(reglages),
): BoiteDeReception {
  const contexte: ContexteDiagnostic = {
    protocole: 'IMAP',
    fournisseur: reglages.fournisseur,
    serveur: reglages.serveur,
    dossier: reglages.dossier,
  }

  /** Ouvre, verrouille le dossier en lecture seule, exécute, puis ferme quoi qu'il arrive. */
  async function avecDossier<T>(
    travail: (client: ClientImap, dossier: EtatDossier & { messages: number }) => Promise<T>,
  ): Promise<T> {
    const client = fabrique()
    // Sans écouteur, une erreur de socket émise hors commande arrêterait le processus.
    client.on('error', () => {})
    try {
      await client.connect()
      const verrou = await client.getMailboxLock(reglages.dossier, { readOnly: true })
      try {
        const { mailbox } = client
        if (mailbox === false) throw new Error(`Dossier ${reglages.dossier} non ouvert`)
        return await travail(client, {
          validiteUid: String(mailbox.uidValidity),
          prochainUid: mailbox.uidNext,
          messages: mailbox.exists,
        })
      } finally {
        verrou.release()
      }
    } catch (erreur) {
      throw diagnostiquerCourriel(erreur, contexte)
    } finally {
      await client.logout().catch(() => client.close())
    }
  }

  return {
    relever: (filigrane) =>
      avecDossier(async (client, dossier): Promise<Releve> => {
        const plan = planifierReleve(filigrane, dossier)
        if (!plan.nouveautes) {
          return {
            messages: [],
            filigrane: avancerFiligrane(plan.depart, dossier, []),
            ecartes: 0,
            illisibles: 0,
            reinitialise: plan.reinitialise,
          }
        }
        const trouves = await client.search(
          { uid: `${plan.premierUid}:*`, or: [...CRITERES_SERVEUR] },
          { uid: true },
        )
        const uids = uidsNouveaux(
          trouves === false || trouves === undefined ? [] : trouves,
          plan.depart,
        )
        const lecture = await lireMessages(client, uids)
        return {
          ...lecture,
          filigrane: avancerFiligrane(plan.depart, dossier, uids),
          reinitialise: plan.reinitialise,
        }
      }),
    listerRecents: (depuis) =>
      avecDossier(async (client) => {
        const trouves = await client.search(
          { since: depuis, or: [...CRITERES_SERVEUR] },
          { uid: true },
        )
        const uids = [...new Set(trouves === false || trouves === undefined ? [] : trouves)]
        return (await lireMessages(client, uids)).messages
      }),
    verifier: () =>
      avecDossier(async (_client, dossier) => ({
        dossier: reglages.dossier,
        messages: dossier.messages,
      })),
  }
}

interface Lecture {
  readonly messages: readonly MessageRecu[]
  readonly ecartes: number
  readonly illisibles: number
}

/** Second tri sur les en-têtes, puis contenu des seuls messages retenus. */
async function lireMessages(client: ClientImap, uids: readonly number[]): Promise<Lecture> {
  if (uids.length === 0) return { messages: [], ecartes: 0, illisibles: 0 }
  const entetes = await client.fetchAll(
    uids.join(','),
    { uid: true, envelope: true, bodyStructure: true, headers: ENTETES_DE_TRI },
    { uid: true },
  )
  const retenus: number[] = []
  let ecartes = 0
  for (const message of entetes) {
    let enTetes = enTetesDepuisImap(message)
    let tri = trierEnTetes(enTetes)
    if (tri.decision === 'lire-original') {
      enTetes = { ...enTetes, original: await lireOriginal(client, message.uid, tri.partie) }
      tri = trierEnTetes(enTetes)
    }
    if (tri.decision === 'reponse' || tri.decision === 'non-remise') retenus.push(message.uid)
    else ecartes += 1
  }
  if (retenus.length === 0) return { messages: [], ecartes, illisibles: 0 }
  const contenus = await client.fetchAll(
    retenus.join(','),
    { uid: true, source: true, internalDate: true },
    { uid: true },
  )
  const messages: MessageRecu[] = []
  let illisibles = 0
  for (const contenu of contenus) {
    try {
      if (contenu.source === undefined) throw new Error(`UID ${contenu.uid} sans contenu`)
      const { message } = await analyserSource(contenu.uid, contenu.source, dateDe(contenu))
      if (message === null) ecartes += 1
      else messages.push(message)
    } catch {
      // Compté, jamais relu en boucle : le filigrane avance quand même.
      illisibles += 1
    }
  }
  return { messages, ecartes, illisibles }
}

/** Lit les seuls en-têtes d'origine joints à un rapport (partie `text/rfc822-headers`). */
async function lireOriginal(
  client: ClientImap,
  uid: number,
  partie: string,
): Promise<OriginalRapport> {
  const [message] = await client.fetchAll(
    String(uid),
    { uid: true, bodyParts: [partie] },
    { uid: true },
  )
  const contenu = message?.bodyParts?.get(partie)
  return contenu === undefined ? { etat: 'absent' } : lireEnTetesOriginal(contenu.toString())
}

export function enTetesDepuisImap(message: FetchMessageObject): EnTetesMessage {
  const bruts = lireEnTetesBruts(message.headers)
  const enveloppe: MessageEnvelopeObject = message.envelope ?? {}
  const fil = [enveloppe.inReplyTo, bruts.get('references')].filter(Boolean).join(' ')
  return {
    objet: enveloppe.subject ?? null,
    identifiant: enveloppe.messageId ?? null,
    enTetesDeFil: fil === '' ? null : fil,
    expediteur: enveloppe.from?.[0]?.address?.toLowerCase() ?? null,
    autoSubmitted: bruts.get('auto-submitted') ?? null,
    precedence: bruts.get('precedence') ?? null,
    repondeurDeclare: bruts.has('x-autoreply') || bruts.has('x-autorespond'),
    typeContenu: bruts.get('content-type')?.toLowerCase() ?? null,
    original: originalDansStructure(message.bodyStructure),
  }
}

/** Message d'origine d'un rapport, trouvé dans la structure sans rien télécharger. */
export function originalDansStructure(
  structure: MessageStructureObject | undefined,
): OriginalRapport {
  if (structure === undefined) return { etat: 'absent' }
  const noeuds: MessageStructureObject[] = [structure]
  while (noeuds.length > 0) {
    const noeud = noeuds.shift()
    if (noeud === undefined) break
    const type = noeud.type.toLowerCase()
    if (TYPES_ORIGINAL_ENVELOPPE.has(type) && noeud.envelope !== undefined) {
      return {
        etat: 'connu',
        identifiant: noeud.envelope.messageId ?? null,
        objet: noeud.envelope.subject ?? null,
      }
    }
    if (type === TYPE_ENTETES_ORIGINAL && noeud.part !== undefined) {
      return { etat: 'a-lire', partie: noeud.part }
    }
    noeuds.push(...(noeud.childNodes ?? []))
  }
  return { etat: 'absent' }
}

const LIGNE_CONTINUEE = /\r?\n[ \t]+/g
const RETOURS = /\r?\n/
const ENTETE = /^([^:\s]+)\s*:\s*(.*)$/

/** En-têtes bruts renvoyés par IMAP, dépliés, noms en minuscules, premier exemplaire gardé. */
export function lireEnTetesBruts(brut: Buffer | undefined): Map<string, string> {
  const valeurs = new Map<string, string>()
  if (brut === undefined) return valeurs
  for (const ligne of brut.toString().replace(LIGNE_CONTINUEE, ' ').split(RETOURS)) {
    const trouve = ENTETE.exec(ligne)
    const nom = trouve?.[1]?.toLowerCase()
    if (nom !== undefined && !valeurs.has(nom)) valeurs.set(nom, (trouve?.[2] ?? '').trim())
  }
  return valeurs
}

function dateDe(message: FetchMessageObject): Date | null {
  const { internalDate } = message
  if (internalDate === undefined) return null
  const date = internalDate instanceof Date ? internalDate : new Date(internalDate)
  return Number.isNaN(date.getTime()) ? null : date
}
