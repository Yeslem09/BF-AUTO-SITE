import { describe, expect, it } from 'vitest'
import { ErreurConnecteur } from '../erreurs.js'
import { diagnostiquerCourriel, type ContexteDiagnostic } from './diagnostic.js'

const SMTP_GMAIL: ContexteDiagnostic = {
  protocole: 'SMTP',
  fournisseur: 'gmail',
  serveur: { hote: 'smtp.gmail.com', port: 465, securise: true },
}
const IMAP_GMAIL: ContexteDiagnostic = {
  protocole: 'IMAP',
  fournisseur: 'gmail',
  serveur: { hote: 'imap.gmail.com', port: 993, securise: true },
  dossier: 'Demandes',
}

const erreur = (message: string, champs: Record<string, unknown>): Error =>
  Object.assign(new Error(message), champs)

describe('diagnostic d’un échec de courriel (PC-05)', () => {
  it('identifiants refusés par Gmail : le remède cite le mot de passe d’application', () => {
    const resultat = diagnostiquerCourriel(
      erreur('Invalid login: 535-5.7.8 Username and Password not accepted', {
        code: 'EAUTH',
        responseCode: 535,
      }),
      SMTP_GMAIL,
    )
    expect(resultat).toBeInstanceOf(ErreurConnecteur)
    expect(resultat.nature).toBe('identifiants')
    expect(resultat.remede).toContain('mot de passe d’application')
    expect(resultat.detail).toContain('535-5.7.8')
    expect(resultat.connecteur).toBe('Envoi de courriel (SMTP)')
  })

  it('reconnaît chaque nature d’échec de nodemailer', () => {
    const nature = (champs: Record<string, unknown>, message = 'échec') =>
      diagnostiquerCourriel(erreur(message, champs), SMTP_GMAIL).nature
    expect(nature({ code: 'ESOCKET' }, 'connect ECONNREFUSED 127.0.0.1:1')).toBe('injoignable')
    expect(nature({ code: 'EDNS' }, 'getaddrinfo ENOTFOUND smtp.exemple.test')).toBe('injoignable')
    expect(nature({ code: 'ETIMEDOUT' }, 'Connection timeout')).toBe('delai')
    expect(nature({ code: 'ESOCKET' }, 'self-signed certificate in certificate chain')).toBe(
      'certificat',
    )
    expect(nature({ code: 'ETLS' })).toBe('certificat')
    expect(nature({ code: 'EENVELOPE', responseCode: 550 })).toBe('refus')
    expect(nature({ responseCode: 552 })).toBe('refus')
    expect(nature({})).toBe('autre')
  })

  it('reconnaît les échecs d’imapflow, dossier absent compris', () => {
    const identifiants = diagnostiquerCourriel(
      erreur('Command failed', {
        authenticationFailed: true,
        serverResponseCode: 'AUTHENTICATIONFAILED',
      }),
      IMAP_GMAIL,
    )
    expect(identifiants.nature).toBe('identifiants')
    expect(identifiants.connecteur).toBe('Lecture de la boîte (IMAP)')
    expect(identifiants.remede).toContain('IMAP_UTILISATEUR')
    const dossier = diagnostiquerCourriel(
      erreur('Mailbox missing', { mailboxMissing: true }),
      IMAP_GMAIL,
    )
    expect(dossier.nature).toBe('configuration')
    expect(dossier.remede).toContain('« Demandes »')
    expect(diagnostiquerCourriel(erreur('TLS', { tlsFailed: true }), IMAP_GMAIL).nature).toBe(
      'certificat',
    )
    expect(diagnostiquerCourriel(erreur('x', { code: 'CONNECT_TIMEOUT' }), IMAP_GMAIL).nature).toBe(
      'delai',
    )
  })

  it('un serveur injoignable rappelle que l’offre gratuite de Render ferme les ports SMTP', () => {
    const resultat = diagnostiquerCourriel(erreur('x', { code: 'ECONNREFUSED' }), SMTP_GMAIL)
    expect(resultat.remede).toContain('smtp.gmail.com:465')
    expect(resultat.remede).toContain('Render')
  })

  it('garde telle quelle une erreur déjà nommée', () => {
    const nommee = new ErreurConnecteur('Envoi', 'refus', 'détail', 'remède')
    expect(diagnostiquerCourriel(nommee, SMTP_GMAIL)).toBe(nommee)
  })
})
