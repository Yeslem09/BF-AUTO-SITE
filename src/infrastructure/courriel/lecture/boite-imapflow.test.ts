/**
 * Adaptateur imapflow contre un faux client IMAP qui renvoie TOUS les
 * messages à chaque recherche (le pire surensemble possible) : le second tri
 * sur les en-têtes doit suffire à ne télécharger que les messages du site
 * (US-C04, PC-03), en lecture seule, sans aucune commande d'écriture.
 */
import type {
  FetchMessageObject,
  FetchQueryObject,
  MessageStructureObject,
  SearchObject,
} from 'imapflow'
import { simpleParser } from 'mailparser'
import { describe, expect, it } from 'vitest'
import { ErreurConnecteur } from '../../erreurs.js'
import type { ReglagesImap } from '../reglages.js'
import {
  creerBoiteImap,
  lireEnTetesBruts,
  optionsImapflow,
  originalDansStructure,
  type ClientImap,
} from './boite-imapflow.js'
import {
  courrielClient,
  IDENTIFIANT_NOTIFICATION,
  nonRemiseEtrangere,
  nonRemiseExchange,
  nonRemiseGmail,
  nonRemisePostfix,
  notificationDuSite,
  OBJET_NOTIFICATION,
  REFERENCE_ESSAI,
  reponseAutomatique,
  reponseGmail,
  reponseOutlook,
} from './essai/echantillons.js'

const REGLAGES: ReglagesImap = {
  fournisseur: 'gmail',
  serveur: { hote: 'imap.gmail.com', port: 993, securise: true },
  utilisateur: 'garage@gmail.com',
  motDePasse: 'abcdefghijklmnop',
  dossier: 'INBOX',
  intervalleSecondes: 120,
}
const VALIDITE = 1_700_000_000n
const RECU_LE = new Date('2026-09-23T08:14:00Z')
const METHODES_ADMISES = new Set([
  'connect',
  'logout',
  'close',
  'on',
  'getMailboxLock',
  'mailbox',
  'search',
  'fetchAll',
])
const PARTIE_ENTETES_ORIGINAL = '3'

const structureRapport = (original: MessageStructureObject): MessageStructureObject => ({
  type: 'multipart/report',
  childNodes: [
    { part: '1', type: 'text/plain' },
    { part: '2', type: 'message/delivery-status' },
    { ...original, part: PARTIE_ENTETES_ORIGINAL },
  ],
})

interface MessageFaux {
  readonly uid: number
  readonly source: string
  readonly structure: MessageStructureObject
}

async function versImap(message: MessageFaux): Promise<FetchMessageObject> {
  const analyse = await simpleParser(message.source)
  const entetes = message.source.split('\r\n\r\n')[0] ?? ''
  const origine = analyse.attachments.find((jointe) => jointe.contentType === 'text/rfc822-headers')
  return {
    seq: message.uid,
    uid: message.uid,
    envelope: {
      subject: analyse.subject,
      messageId: analyse.messageId,
      inReplyTo: analyse.inReplyTo,
      from: analyse.from?.value.map((adresse) => ({
        address: adresse.address,
        name: adresse.name,
      })),
    },
    headers: Buffer.from(entetes),
    bodyStructure: message.structure,
    source: Buffer.from(message.source),
    internalDate: RECU_LE,
    bodyParts: new Map(origine === undefined ? [] : [[PARTIE_ENTETES_ORIGINAL, origine.content]]),
  }
}

interface FauxClient {
  readonly client: ClientImap
  readonly recherches: SearchObject[]
  readonly sourcesLues: number[]
  readonly partiesLues: number[]
  readonly accesInterdits: string[]
  readonly verrous: { chemin: string; lectureSeule: boolean }[]
  readonly fermetures: string[]
}

function creerFauxClient(
  messages: readonly FetchMessageObject[],
  options: { prochainUid?: number; echecConnexion?: Error; sansContenu?: number } = {},
): FauxClient {
  const trace: FauxClient = {
    client: undefined as unknown as ClientImap,
    recherches: [],
    sourcesLues: [],
    partiesLues: [],
    accesInterdits: [],
    verrous: [],
    fermetures: [],
  }
  const plusGrand = Math.max(0, ...messages.map((message) => message.uid))
  const selection = (plage: string) => {
    const uids = new Set(plage.split(',').map(Number))
    return messages.filter((message) => uids.has(message.uid))
  }
  const brut: ClientImap = {
    async connect() {
      if (options.echecConnexion !== undefined) throw options.echecConnexion
    },
    async logout() {
      trace.fermetures.push('logout')
      if (options.echecConnexion !== undefined) throw new Error('non connecté')
    },
    close() {
      trace.fermetures.push('close')
    },
    on() {
      return undefined
    },
    async getMailboxLock(chemin, verrou) {
      trace.verrous.push({ chemin, lectureSeule: verrou.readOnly })
      return { release: () => undefined }
    },
    mailbox: {
      uidValidity: VALIDITE,
      uidNext: options.prochainUid ?? plusGrand + 1,
      exists: messages.length,
    },
    async search(requete) {
      trace.recherches.push(requete)
      const debut = Number(String(requete.uid ?? '1:*').split(':')[0])
      const trouves = messages.map((message) => message.uid).filter((uid) => uid >= debut)
      // « N:* » renvoie au moins le dernier message, même avant N.
      return trouves.length > 0 ? trouves : [plusGrand]
    },
    async fetchAll(plage: string, requete: FetchQueryObject) {
      const choisis = selection(plage)
      if (requete.source === true) {
        trace.sourcesLues.push(...choisis.map((message) => message.uid))
        return choisis.map((message) =>
          message.uid === options.sansContenu ? { ...message, source: undefined } : message,
        )
      }
      if (requete.bodyParts !== undefined) trace.partiesLues.push(...choisis.map((m) => m.uid))
      return choisis
    },
  }
  const client = new Proxy(brut, {
    get(cible, propriete, recepteur) {
      if (typeof propriete === 'string' && !METHODES_ADMISES.has(propriete)) {
        trace.accesInterdits.push(propriete)
      }
      return Reflect.get(cible, propriete, recepteur)
    },
  })
  return { ...trace, client }
}

async function boiteDeDix() {
  const fabriques: [() => string, MessageStructureObject][] = [
    [() => reponseGmail('Fait'), { type: 'multipart/alternative' }],
    [() => reponseOutlook('Je le rappelle demain'), { type: 'multipart/alternative' }],
    [courrielClient, { type: 'text/plain' }],
    [notificationDuSite, { type: 'text/plain' }],
    [reponseAutomatique, { type: 'text/plain' }],
    [nonRemiseGmail, structureRapport({ type: 'text/rfc822-headers' })],
    [
      () => nonRemisePostfix(),
      structureRapport({
        type: 'message/rfc822',
        envelope: { messageId: `<${REFERENCE_ESSAI}.2@gmail.com>`, subject: OBJET_NOTIFICATION },
      }),
    ],
    [nonRemiseEtrangere, structureRapport({ type: 'text/rfc822-headers' })],
    [
      nonRemiseExchange,
      structureRapport({
        type: 'message/rfc822',
        envelope: { messageId: '<AM0PR-sans-reference@outlook.com>', subject: OBJET_NOTIFICATION },
      }),
    ],
    [courrielClient, { type: 'text/plain' }],
  ]
  return Promise.all(
    fabriques.map(([fabriquer, structure], rang) =>
      versImap({ uid: rang + 1, source: fabriquer(), structure }),
    ),
  )
}

describe('lecture IMAP (US-C04, US-C08)', () => {
  it('premier relevé : dossier ouvert en lecture seule, aucune recherche, filigrane à la fin', async () => {
    const faux = creerFauxClient(await boiteDeDix())
    const releve = await creerBoiteImap(REGLAGES, () => faux.client).relever(null)
    expect(releve).toEqual({
      messages: [],
      filigrane: { validiteUid: String(VALIDITE), dernierUid: 10 },
      ecartes: 0,
      illisibles: 0,
      reinitialise: false,
    })
    expect(faux.verrous).toEqual([{ chemin: 'INBOX', lectureSeule: true }])
    expect(faux.recherches).toEqual([])
    expect(faux.fermetures).toEqual(['logout'])
  })

  it('ne télécharge que les réponses et les rapports du site, et n’écrit rien', async () => {
    const faux = creerFauxClient(await boiteDeDix())
    const releve = await creerBoiteImap(REGLAGES, () => faux.client).relever({
      validiteUid: String(VALIDITE),
      dernierUid: 0,
    })
    expect(releve.messages.map((message) => [message.uid, message.nature])).toEqual([
      [1, 'reponse'],
      [2, 'reponse'],
      [6, 'non-remise'],
      [7, 'non-remise'],
      [9, 'non-remise'],
    ])
    expect(releve.messages[0]).toMatchObject({ commande: 'marquer-traitee' })
    expect(releve.messages[1]).toMatchObject({ commande: null })
    expect(faux.sourcesLues).toEqual([1, 2, 6, 7, 9])
    expect(faux.partiesLues).toEqual([6, 8])
    expect(releve.ecartes).toBe(5)
    expect(releve.filigrane.dernierUid).toBe(10)
    expect(faux.accesInterdits).toEqual([])
    expect(faux.verrous.every((verrou) => verrou.lectureSeule)).toBe(true)
    const [recherche] = faux.recherches
    expect(recherche?.uid).toBe('1:*')
    expect(recherche?.or).toContainEqual({ subject: 'BF-' })
    expect(recherche?.or).toContainEqual({ from: 'mailer-daemon' })
  })

  it('ne relit jamais le dernier message que la plage « N:* » renvoie', async () => {
    const faux = creerFauxClient(await boiteDeDix(), { prochainUid: 12 })
    const releve = await creerBoiteImap(REGLAGES, () => faux.client).relever({
      validiteUid: String(VALIDITE),
      dernierUid: 10,
    })
    expect(releve.messages).toEqual([])
    expect(faux.sourcesLues).toEqual([])
    expect(releve.filigrane.dernierUid).toBe(11)
  })

  it('un UIDVALIDITY changé fait repartir de la fin', async () => {
    const faux = creerFauxClient(await boiteDeDix())
    const releve = await creerBoiteImap(REGLAGES, () => faux.client).relever({
      validiteUid: '42',
      dernierUid: 3,
    })
    expect(releve.reinitialise).toBe(true)
    expect(releve.filigrane).toEqual({ validiteUid: String(VALIDITE), dernierUid: 10 })
    expect(faux.recherches).toEqual([])
  })

  it('un message sans contenu est compté illisible, et le filigrane avance quand même', async () => {
    const faux = creerFauxClient(await boiteDeDix(), { sansContenu: 1 })
    const releve = await creerBoiteImap(REGLAGES, () => faux.client).relever({
      validiteUid: String(VALIDITE),
      dernierUid: 0,
    })
    expect(releve.illisibles).toBe(1)
    expect(releve.messages.map((message) => message.uid)).toEqual([2, 6, 7, 9])
    expect(releve.filigrane.dernierUid).toBe(10)
  })

  it('identifiants refusés : échec nommé, connexion refermée', async () => {
    const refus = Object.assign(new Error('Command failed'), { authenticationFailed: true })
    const faux = creerFauxClient([], { echecConnexion: refus })
    const echec = await creerBoiteImap(REGLAGES, () => faux.client)
      .verifier()
      .then(
        () => null,
        (erreur: unknown) => erreur,
      )
    expect(echec).toBeInstanceOf(ErreurConnecteur)
    expect((echec as ErreurConnecteur).nature).toBe('identifiants')
    expect(faux.fermetures).toEqual(['logout', 'close'])
  })

  it('vérifie et liste les messages récents sans filigrane', async () => {
    const messages = await boiteDeDix()
    const faux = creerFauxClient(messages)
    const boite = creerBoiteImap(REGLAGES, () => faux.client)
    expect(await boite.verifier()).toEqual({ dossier: 'INBOX', messages: 10 })
    const depuis = new Date('2026-09-16T00:00:00Z')
    const recents = await boite.listerRecents(depuis)
    expect(recents).toHaveLength(5)
    expect(faux.recherches.at(-1)?.since).toEqual(depuis)
    expect(faux.accesInterdits).toEqual([])
  })
})

describe('outils de l’adaptateur IMAP', () => {
  it('options : TLS direct, STARTTLS exigé hors machine locale, journal coupé, sans IDLE', () => {
    expect(optionsImapflow(REGLAGES)).toMatchObject({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      logger: false,
      disableAutoIdle: true,
      tls: { servername: 'imap.gmail.com', minVersion: 'TLSv1.2' },
    })
    const starttls = {
      ...REGLAGES,
      serveur: { hote: 'imap.exemple.test', port: 143, securise: false },
    }
    expect(optionsImapflow(starttls).doSTARTTLS).toBe(true)
    const local = { ...REGLAGES, serveur: { hote: '127.0.0.1', port: 1143, securise: false } }
    expect(optionsImapflow(local).doSTARTTLS).toBe(false)
  })

  it('trouve le message d’origine d’un rapport dans la structure, sans téléchargement', () => {
    expect(
      originalDansStructure(
        structureRapport({
          type: 'message/rfc822',
          envelope: { messageId: IDENTIFIANT_NOTIFICATION },
        }),
      ),
    ).toEqual({ etat: 'connu', identifiant: IDENTIFIANT_NOTIFICATION, objet: null })
    expect(originalDansStructure(structureRapport({ type: 'text/rfc822-headers' }))).toEqual({
      etat: 'a-lire',
      partie: PARTIE_ENTETES_ORIGINAL,
    })
    expect(originalDansStructure({ type: 'text/plain' })).toEqual({ etat: 'absent' })
    expect(originalDansStructure(undefined)).toEqual({ etat: 'absent' })
  })

  it('lit les en-têtes bruts, repliés et en double', () => {
    const bruts = lireEnTetesBruts(
      Buffer.from(
        'References: <a@x>\r\n <b@y>\r\nAuto-Submitted: auto-replied\r\nreferences: <c@z>\r\n',
      ),
    )
    expect(bruts.get('references')).toBe('<a@x> <b@y>')
    expect(bruts.get('auto-submitted')).toBe('auto-replied')
    expect(lireEnTetesBruts(undefined).size).toBe(0)
  })
})
