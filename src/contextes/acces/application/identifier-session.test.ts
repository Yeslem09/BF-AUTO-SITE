import { beforeEach, describe, expect, it } from 'vitest'
import { creerBancAcces, type BancAcces } from '../adaptateurs/essai/banc.js'
import { creerFermerSession } from './fermer-session.js'
import { creerIdentifierSession } from './identifier-session.js'
import { creerOuvrirSession } from './ouvrir-session.js'
import { preparerLien } from './preparer-lien.js'
import { creerReinitialiserAcces } from './reinitialiser-acces.js'

const JOUR = 24 * 60 * 60 * 1000
let banc: BancAcces

beforeEach(() => {
  banc = creerBancAcces()
})

function ouvrirUneSession(): string {
  const { jeton } = preparerLien(banc, banc.horloge.maintenant(), '/garagiste')
  const ouverture = creerOuvrirSession(banc)(jeton)
  if (ouverture.issue !== 'ouverte') throw new Error(`Session non ouverte : ${ouverture.issue}`)
  return ouverture.jetonSession
}

describe('reconnaître la session du cookie', () => {
  it('ne reconnaît ni un cookie absent, ni un jeton inconnu', () => {
    const identifier = creerIdentifierSession(banc)
    expect(identifier(undefined)).toBeNull()
    expect(identifier('z'.repeat(43))).toBeNull()
  })

  it('glisse sur 90 jours : utilisée au 60e jour, elle vit encore au 140e', () => {
    const identifier = creerIdentifierSession(banc)
    const jeton = ouvrirUneSession()
    banc.horloge.avancer(60 * JOUR)
    expect(identifier(jeton)?.expireLe.toISOString()).toBe('2027-02-20T08:00:00.000Z')
    banc.horloge.avancer(80 * JOUR)
    expect(identifier(jeton)).not.toBeNull()
  })

  it('expire après 90 jours sans visite', () => {
    const jeton = ouvrirUneSession()
    banc.horloge.avancer(90 * JOUR)
    expect(creerIdentifierSession(banc)(jeton)).toBeNull()
  })

  it('n’écrit la prolongation en base qu’une fois par jour', () => {
    const identifier = creerIdentifierSession(banc)
    const jeton = ouvrirUneSession()
    const empreinte = banc.hachage.empreinte(jeton)
    const initiale = banc.depot.trouverSession(empreinte)?.expireLe.toISOString()
    banc.horloge.avancer(JOUR / 2)
    identifier(jeton)
    expect(banc.depot.trouverSession(empreinte)?.expireLe.toISOString()).toBe(initiale)
  })
})

describe('fermer et révoquer', () => {
  it('la déconnexion oublie la session', () => {
    const identifier = creerIdentifierSession(banc)
    const jeton = ouvrirUneSession()
    const session = identifier(jeton)
    if (session === null) throw new Error('session attendue')
    creerFermerSession(banc)(session)
    expect(identifier(jeton)).toBeNull()
  })

  it('la réinitialisation révoque toutes les sessions et les liens en attente', () => {
    const identifier = creerIdentifierSession(banc)
    const telephone = ouvrirUneSession()
    const ordinateur = ouvrirUneSession()
    const enAttente = preparerLien(banc, banc.horloge.maintenant(), '/garagiste').jeton
    expect(creerReinitialiserAcces(banc)()).toEqual({ sessions: 2, liens: 1 })
    expect(identifier(telephone)).toBeNull()
    expect(identifier(ordinateur)).toBeNull()
    expect(creerOuvrirSession(banc)(enAttente)).toEqual({ issue: 'inconnu' })
  })
})
