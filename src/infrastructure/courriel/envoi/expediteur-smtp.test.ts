/**
 * Envoi SMTP de bout en bout contre un vrai serveur SMTP local (smtp-server) :
 * connexion, authentification, en-têtes reçus, refus et pannes (US-C03).
 */
import type { AddressInfo } from 'node:net'
import { simpleParser } from 'mailparser'
import { SMTPServer } from 'smtp-server'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ErreurConnecteur } from '../../erreurs.js'
import type { ReglagesSmtp } from '../reglages.js'
import { creerExpediteurConsole } from './expediteur-console.js'
import { creerExpediteurSmtp, optionsTransportSmtp } from './expediteur-smtp.js'

const COMPTE = 'garage@gmail.com'
const MOT_DE_PASSE = 'abcdefghijklmnop'
const DOMAINE_INCONNU = '@inconnu.test'
const CODE_IDENTIFIANTS = 535
const CODE_BOITE_INCONNUE = 550

let serveur: SMTPServer
let port: number
let recus: string[]

beforeAll(async () => {
  serveur = new SMTPServer({
    disabledCommands: ['STARTTLS'],
    allowInsecureAuth: true,
    authMethods: ['PLAIN', 'LOGIN'],
    logger: false,
    onAuth(auth, _session, rappel) {
      if (auth.username === COMPTE && auth.password === MOT_DE_PASSE) {
        rappel(null, { user: auth.username })
        return
      }
      rappel(
        Object.assign(new Error('5.7.8 Username and Password not accepted'), {
          responseCode: CODE_IDENTIFIANTS,
        }),
      )
    },
    onRcptTo(adresse, _session, rappel) {
      if (adresse.address.endsWith(DOMAINE_INCONNU)) {
        rappel(
          Object.assign(new Error('5.1.1 User unknown'), { responseCode: CODE_BOITE_INCONNUE }),
        )
        return
      }
      rappel()
    },
    onData(flux, _session, rappel) {
      const morceaux: Buffer[] = []
      flux.on('data', (morceau: Buffer) => morceaux.push(morceau))
      flux.on('end', () => {
        recus.push(Buffer.concat(morceaux).toString('utf8'))
        rappel()
      })
    },
  })
  await new Promise<void>((resolu) => serveur.listen(0, '127.0.0.1', resolu))
  port = (serveur.server.address() as AddressInfo).port
})

afterAll(async () => {
  await new Promise<void>((resolu) => serveur.close(resolu))
})

beforeEach(() => {
  recus = []
})

const reglages = (surcharges: Partial<ReglagesSmtp> = {}): ReglagesSmtp => ({
  fournisseur: 'gmail',
  serveur: { hote: '127.0.0.1', port, securise: false },
  utilisateur: COMPTE,
  motDePasse: MOT_DE_PASSE,
  expediteur: COMPTE,
  nomExpediteur: 'BF Auto, site internet',
  repondreA: null,
  ...surcharges,
})

describe('envoi SMTP de bout en bout (US-C03)', () => {
  it('vérifie la connexion et l’authentification sans rien envoyer', async () => {
    await creerExpediteurSmtp(reglages()).verifier()
    expect(recus).toEqual([])
  })

  it('remet un courriel relié à sa demande : objet, identifiant, en-têtes et accents intacts', async () => {
    const remise = await creerExpediteurSmtp(
      reglages({ repondreA: 'atelier@exemple.test' }),
    ).envoyer({
      destinataire: COMPTE,
      objet: 'Rappel de Julie',
      texte: 'Ne roulez pas : appelez-nous.\nVéhicule : Clio, freinage à contrôler.\n',
      fil: { reference: 'BF-7K3Q9D', rang: 1 },
    })
    expect(remise.identifiantMessage).toBe('<BF-7K3Q9D.1@gmail.com>')
    expect(recus).toHaveLength(1)
    const recu = await simpleParser(recus[0] ?? '')
    expect(recu.subject).toBe('Rappel de Julie [BF-7K3Q9D]')
    expect(recu.messageId).toBe('<BF-7K3Q9D.1@gmail.com>')
    expect(recu.headers.get('auto-submitted')).toBe('auto-generated')
    expect(recu.from?.value).toEqual([{ address: COMPTE, name: 'BF Auto, site internet' }])
    expect(recu.replyTo?.value).toEqual([{ address: 'atelier@exemple.test', name: '' }])
    expect(recu.text).toBe(
      'Ne roulez pas : appelez-nous.\nVéhicule : Clio, freinage à contrôler.\n',
    )
    expect(recu.html).toBe(false)
  })

  it('un renvoi garde le même identifiant ; la relance se range dans le même fil', async () => {
    const expediteur = creerExpediteurSmtp(reglages())
    const courriel = { destinataire: COMPTE, objet: 'Rappel', texte: 'Texte' }
    await expediteur.envoyer({ ...courriel, fil: { reference: 'BF-7K3Q9D', rang: 1 } })
    await expediteur.envoyer({ ...courriel, fil: { reference: 'BF-7K3Q9D', rang: 1 } })
    await expediteur.envoyer({ ...courriel, fil: { reference: 'BF-7K3Q9D', rang: 2 } })
    const [premier, renvoi, relance] = await Promise.all(recus.map((brut) => simpleParser(brut)))
    expect(renvoi?.messageId).toBe(premier?.messageId)
    expect(relance?.messageId).toBe('<BF-7K3Q9D.2@gmail.com>')
    expect(relance?.inReplyTo).toBe('<BF-7K3Q9D.1@gmail.com>')
    expect(relance?.references).toBe('<BF-7K3Q9D.1@gmail.com>')
  })

  it('un mot de passe refusé devient un échec « identifiants » avec le remède Gmail', async () => {
    const expediteur = creerExpediteurSmtp(reglages({ motDePasse: 'mauvaismotdepass' }))
    const echec = await expediteur.verifier().then(
      () => null,
      (erreur: unknown) => erreur,
    )
    expect(echec).toBeInstanceOf(ErreurConnecteur)
    expect((echec as ErreurConnecteur).nature).toBe('identifiants')
    expect((echec as ErreurConnecteur).remede).toContain('mot de passe d’application')
    expect((echec as ErreurConnecteur).message).not.toContain('mauvaismotdepass')
  })

  it('un destinataire refusé par le serveur est un échec « refus », jamais une réussite', async () => {
    await expect(
      creerExpediteurSmtp(reglages()).envoyer({
        destinataire: `atelier${DOMAINE_INCONNU}`,
        objet: 'Objet',
        texte: 'Texte',
      }),
    ).rejects.toMatchObject({ nature: 'refus' })
    expect(recus).toEqual([])
  })

  it('un serveur arrêté est « injoignable », vite', async () => {
    const debut = Date.now()
    await expect(
      creerExpediteurSmtp(
        reglages({ serveur: { hote: '127.0.0.1', port: 1, securise: false } }),
      ).verifier(),
    ).rejects.toMatchObject({ nature: 'injoignable' })
    expect(Date.now() - debut).toBeLessThan(5_000)
  })
})

describe('chiffrement exigé (BC-02)', () => {
  it('STARTTLS exigé vers un serveur distant, TLS direct sur 465, rien pour la machine elle-même', () => {
    const distant = optionsTransportSmtp(
      reglages({ serveur: { hote: 'smtp.gmail.com', port: 587, securise: false } }),
    )
    expect(distant).toMatchObject({ secure: false, requireTLS: true })
    expect(distant.tls).toEqual({ servername: 'smtp.gmail.com', minVersion: 'TLSv1.2' })
    const direct = optionsTransportSmtp(
      reglages({ serveur: { hote: 'smtp.gmail.com', port: 465, securise: true } }),
    )
    expect(direct).toMatchObject({ secure: true, requireTLS: false })
    expect(optionsTransportSmtp(reglages())).toMatchObject({ requireTLS: false })
  })

  it('sans identifiants (relais local), aucune authentification n’est tentée', () => {
    const options = optionsTransportSmtp(reglages({ utilisateur: null, motDePasse: null }))
    expect(options).not.toHaveProperty('auth')
  })
})

describe('expéditeur console', () => {
  it('écrit l’objet et l’identifiant réels, et n’envoie rien', async () => {
    const ecrits: string[] = []
    const remise = await creerExpediteurConsole((texte) => ecrits.push(texte)).envoyer({
      destinataire: 'garage@gmail.com',
      objet: 'Rappel de Julie',
      texte: 'Texte',
      fil: { reference: 'BF-7K3Q9D', rang: 1 },
    })
    expect(remise.identifiantMessage).toBe('<BF-7K3Q9D.1@demonstration.invalid>')
    expect(ecrits).toHaveLength(1)
    expect(ecrits[0]).toContain('aucun envoi réel')
    expect(ecrits[0]).toContain('Objet : Rappel de Julie [BF-7K3Q9D]')
    expect(recus).toEqual([])
  })
})
