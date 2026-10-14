import type { FastifyRequest } from 'fastify'
import { describe, expect, it } from 'vitest'
import { cleClient, lireEnvoi, origineAutorisee } from './requete.js'

function requete(parties: {
  origin?: string
  host?: string
  ip?: string
  body?: unknown
}): FastifyRequest {
  return {
    headers: parties.origin === undefined ? {} : { origin: parties.origin },
    host: parties.host ?? 'garage.exemple',
    ip: parties.ip ?? '203.0.113.7',
    body: parties.body,
  } as unknown as FastifyRequest
}

describe('vérification de l’en-tête Origin (D9)', () => {
  it.each([
    ['https://garage.exemple', 'garage.exemple', true],
    ['https://garage.exemple', 'garage.exemple:443', true],
    ['http://127.0.0.1:4314', '127.0.0.1:4314', true],
    ['https://pirate.exemple', 'garage.exemple', false],
    ['https://garage.exemple.pirate.exemple', 'garage.exemple', false],
    ['http://127.0.0.1:9999', '127.0.0.1:4314', false],
    ['null', 'garage.exemple', false],
  ])('Origin %s vers %s : %s', (origin, host, attendu) => {
    expect(origineAutorisee(requete({ origin, host }))).toBe(attendu)
  })

  it('sans en-tête Origin, aucune falsification intersites par ce biais : l’envoi passe', () => {
    expect(origineAutorisee(requete({}))).toBe(true)
  })
})

describe('clé de limitation de débit (US-47)', () => {
  it('est l’adresse établie par Fastify ; le poste lui-même n’est pas limité', () => {
    expect(cleClient(requete({ ip: '203.0.113.7' }))).toBe('203.0.113.7')
    expect(cleClient(requete({ ip: '127.0.0.1' }))).toBeNull()
    expect(cleClient(requete({ ip: '::1' }))).toBeNull()
  })
})

describe('lecture du corps d’un envoi', () => {
  it('garde des textes simples, les cases cochées en liste, et détecte le champ piège', () => {
    const envoi = lireEnvoi(
      requete({
        body: {
          type: 'rendez-vous',
          creneaux: ['a', 'b'],
          prenom: ['Julie', 'Autre'],
          telephone: { objet: 'inattendu' },
          jeton: 'j',
          reference_garage: ' x ',
          famille: 'freinage',
          prestation: 'Révision',
        },
      }),
    )
    expect(envoi.saisie).toMatchObject({
      type: 'rendez-vous',
      creneaux: ['a', 'b'],
      prenom: 'Julie',
      telephone: '',
    })
    expect(envoi.piegeRempli).toBe(true)
    expect(envoi.rattachements).toEqual({
      famille: 'freinage',
      prediagnostic: '',
      prestation: 'Révision',
    })
    expect(lireEnvoi(requete({ body: { creneaux: 'seule' } })).saisie.creneaux).toEqual(['seule'])
    expect(lireEnvoi(requete({ body: undefined })).piegeRempli).toBe(false)
  })
})
