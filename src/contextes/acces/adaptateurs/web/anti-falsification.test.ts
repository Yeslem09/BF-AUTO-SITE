import { describe, expect, it } from 'vitest'
import { nouvelleSession } from '../../domaine/session.js'
import {
  creerProtectionFormulaires,
  VALIDITE_FORMULAIRE_CONNEXION_MS,
  verifierProvenance,
} from './anti-falsification.js'
import { optionsCookieSession, optionsEffacementCookie } from './cookie-session.js'

const ORIGINE = 'https://garage.exemple'
const MAINTENANT = new Date('2026-09-23T08:00:00Z')

describe('provenance d’un formulaire de l’espace', () => {
  const provenance = (origine?: string, referent?: string, hote = 'garage.exemple') =>
    verifierProvenance({ origine, referent, hote, originePublique: ORIGINE })

  it('admet l’origine publique, ou le même hôte que la requête', () => {
    expect(provenance('https://garage.exemple')).toBeNull()
    expect(provenance('http://127.0.0.1:4315', undefined, '127.0.0.1:4315')).toBeNull()
    expect(provenance('http://LOCALHOST:4315', undefined, 'localhost:4315')).toBeNull()
  })

  it('se rabat sur le référent quand un navigateur ancien n’envoie pas Origin', () => {
    expect(provenance(undefined, 'https://garage.exemple/garagiste')).toBeNull()
    expect(provenance(undefined, 'https://pirate.exemple/page')).toBe('origine-etrangere')
  })

  it('refuse un autre site, une origine opaque ou illisible, et l’absence de toute indication', () => {
    expect(provenance('https://pirate.exemple')).toBe('origine-etrangere')
    expect(provenance('https://garage.exemple.pirate.exemple')).toBe('origine-etrangere')
    expect(provenance('null')).toBe('origine-etrangere')
    expect(provenance('n’importe quoi')).toBe('origine-etrangere')
    expect(provenance(undefined, undefined)).toBe('origine-absente')
    expect(provenance('', undefined)).toBe('origine-absente')
    expect(
      verifierProvenance({
        origine: 'https://pirate.exemple',
        referent: undefined,
        hote: undefined,
        originePublique: ORIGINE,
      }),
    ).toBe('origine-etrangere')
  })
})

describe('jetons anti-falsification', () => {
  const protection = creerProtectionFormulaires(Buffer.alloc(32, 7))

  it('un jeton de connexion vaut une journée, pas une milliseconde de plus', () => {
    const jeton = protection.jetonConnexion(MAINTENANT)
    expect(protection.verifierJetonConnexion(jeton, MAINTENANT)).toBe(true)
    const fin = new Date(MAINTENANT.getTime() + VALIDITE_FORMULAIRE_CONNEXION_MS)
    expect(protection.verifierJetonConnexion(jeton, new Date(fin.getTime() - 1))).toBe(true)
    expect(protection.verifierJetonConnexion(jeton, fin)).toBe(false)
  })

  it('un jeton de connexion retouché ou fabriqué est refusé', () => {
    const jeton = protection.jetonConnexion(MAINTENANT)
    const [echeance = '', signature = ''] = jeton.split('.')
    expect(
      protection.verifierJetonConnexion(`${Number(echeance) + 1000}.${signature}`, MAINTENANT),
    ).toBe(false)
    expect(protection.verifierJetonConnexion(`${echeance}.${signature}x`, MAINTENANT)).toBe(false)
    expect(protection.verifierJetonConnexion(`${jeton}.extra`, MAINTENANT)).toBe(false)
    for (const faux of [undefined, '', 'abc', ['tableau'], 42]) {
      expect(protection.verifierJetonConnexion(faux, MAINTENANT)).toBe(false)
    }
    const autreSecret = creerProtectionFormulaires(Buffer.alloc(32, 8))
    expect(autreSecret.verifierJetonConnexion(jeton, MAINTENANT)).toBe(false)
  })

  it('un jeton de session ne vaut que pour sa session', () => {
    const session = nouvelleSession('empreinte-a', MAINTENANT)
    const autre = nouvelleSession('empreinte-b', MAINTENANT)
    const jeton = protection.jetonSession(session)
    expect(protection.verifierJetonSession(jeton, session)).toBe(true)
    expect(protection.verifierJetonSession(jeton, autre)).toBe(false)
    expect(protection.verifierJetonSession(undefined, session)).toBe(false)
    expect(protection.verifierJetonSession(protection.jetonConnexion(MAINTENANT), session)).toBe(
      false,
    )
  })
})

describe('attributs du cookie de session (US-33)', () => {
  const session = nouvelleSession('empreinte', MAINTENANT)

  it('HttpOnly, SameSite=Lax, Path=/garagiste, Secure en https, durée de la session', () => {
    expect(optionsCookieSession(ORIGINE, session, MAINTENANT)).toEqual({
      path: '/garagiste',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 90 * 24 * 60 * 60,
    })
  })

  it('sans Secure en local http, où le navigateur refuserait de le garder', () => {
    expect(optionsCookieSession('http://127.0.0.1:4315', session, MAINTENANT).secure).toBe(false)
  })

  it('s’efface avec les mêmes attributs', () => {
    expect(optionsEffacementCookie(ORIGINE)).toEqual({
      path: '/garagiste',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    })
  })
})
