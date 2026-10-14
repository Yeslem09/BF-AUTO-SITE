import { describe, expect, it } from 'vitest'
import { composerCourriel } from './composer.js'

const IDENTITE = { adresse: 'garage@gmail.com', nom: null, repondreA: null }

describe('composition d’un courriel (C3)', () => {
  it('sans demande : texte brut, Auto-Submitted, aucun identifiant imposé', () => {
    const options = composerCourriel(
      { destinataire: 'anthony@exemple.test', objet: 'Votre lien\r\nBcc: x@y', texte: 'Bonjour' },
      IDENTITE,
    )
    expect(options).toEqual({
      from: 'garage@gmail.com',
      to: 'anthony@exemple.test',
      subject: 'Votre lien Bcc: x@y',
      text: 'Bonjour',
      headers: { 'Auto-Submitted': 'auto-generated' },
    })
  })

  it('rattaché à une demande : référence en fin d’objet et identifiant stable', () => {
    const options = composerCourriel(
      {
        destinataire: 'garage@gmail.com',
        objet: 'Ne roulez pas : rappel de Julie',
        texte: 'Texte',
        fil: { reference: 'BF-7K3Q9D', rang: 1 },
      },
      { adresse: 'Garage@Gmail.com', nom: 'BF Auto, site', repondreA: 'atelier@exemple.test' },
    )
    expect(options.subject).toBe('Ne roulez pas : rappel de Julie [BF-7K3Q9D]')
    expect(options.messageId).toBe('<BF-7K3Q9D.1@gmail.com>')
    expect(options.from).toEqual({ name: 'BF Auto, site', address: 'Garage@Gmail.com' })
    expect(options.replyTo).toBe('atelier@exemple.test')
    expect(options.inReplyTo).toBeUndefined()
  })

  it('la relance se rattache au premier message du fil', () => {
    const options = composerCourriel(
      {
        destinataire: 'garage@gmail.com',
        objet: 'Relance',
        texte: 'Texte',
        fil: { reference: 'BF-7K3Q9D', rang: 2 },
      },
      IDENTITE,
    )
    expect(options.messageId).toBe('<BF-7K3Q9D.2@gmail.com>')
    expect(options.inReplyTo).toBe('<BF-7K3Q9D.1@gmail.com>')
    expect(options.references).toBe('<BF-7K3Q9D.1@gmail.com>')
  })

  it('n’ajoute pas d’adresse de réponse égale à l’expéditeur', () => {
    const options = composerCourriel(
      { destinataire: 'x@exemple.test', objet: 'Objet', texte: 'Texte' },
      { ...IDENTITE, repondreA: 'garage@gmail.com' },
    )
    expect(options.replyTo).toBeUndefined()
  })
})
