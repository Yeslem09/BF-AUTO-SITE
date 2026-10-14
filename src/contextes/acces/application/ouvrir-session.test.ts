import { beforeEach, describe, expect, it } from 'vitest'
import { creerBancAcces, DEBUT_ESSAI, type BancAcces } from '../adaptateurs/essai/banc.js'
import { DUREE_LIEN_MS } from '../domaine/regles.js'
import { creerEmettreLienDeSecours } from './emettre-lien-secours.js'
import { creerExaminerLien } from './examiner-lien.js'
import { creerIdentifierSession } from './identifier-session.js'
import { creerOuvrirSession } from './ouvrir-session.js'
import { preparerLien } from './preparer-lien.js'

let banc: BancAcces

beforeEach(() => {
  banc = creerBancAcces()
})

function lienEnAttente(retour = '/garagiste'): string {
  return preparerLien(banc, banc.horloge.maintenant(), retour).jeton
}

describe('examiner un lien sans le consommer', () => {
  it('dit l’état du lien, et une simple lecture ne le brûle pas', () => {
    const examiner = creerExaminerLien(banc)
    const jeton = lienEnAttente()
    expect(examiner(jeton)).toBe('valide')
    expect(examiner(jeton)).toBe('valide')
    banc.horloge.avancer(DUREE_LIEN_MS)
    expect(examiner(jeton)).toBe('expire')
  })

  it('répond « inconnu » à un jeton absent de la base ou mal formé', () => {
    const examiner = creerExaminerLien(banc)
    expect(examiner('x'.repeat(40))).toBe('inconnu')
    expect(examiner('court')).toBe('inconnu')
    expect(examiner(undefined)).toBe('inconnu')
  })
})

describe('ouvrir une session avec le lien (US-33)', () => {
  it('ouvre une session de 90 jours une fois, puis refuse le lien réutilisé', () => {
    const ouvrir = creerOuvrirSession(banc)
    const jeton = lienEnAttente('/garagiste/signaler')
    const ouverture = ouvrir(jeton)
    expect(ouverture.issue).toBe('ouverte')
    if (ouverture.issue !== 'ouverte') return
    expect(ouverture.retour).toBe('/garagiste/signaler')
    expect(ouverture.session.expireLe.toISOString()).toBe('2026-12-22T08:00:00.000Z')
    expect(creerIdentifierSession(banc)(ouverture.jetonSession)?.empreinte).toBe(
      banc.hachage.empreinte(ouverture.jetonSession),
    )
    expect(ouvrir(jeton)).toEqual({ issue: 'deja-utilise' })
    expect(creerExaminerLien(banc)(jeton)).toBe('deja-utilise')
  })

  it('refuse un lien de plus de 15 minutes sans ouvrir de session', () => {
    const jeton = lienEnAttente()
    banc.horloge.avancer(DUREE_LIEN_MS)
    expect(creerOuvrirSession(banc)(jeton)).toEqual({ issue: 'expire' })
    expect(banc.depot.trouverLien(banc.hachage.empreinte(jeton))?.utiliseLe).toBeNull()
  })

  it('refuse un lien inconnu ou mal formé', () => {
    const ouvrir = creerOuvrirSession(banc)
    expect(ouvrir('y'.repeat(40))).toEqual({ issue: 'inconnu' })
    expect(ouvrir(['tableau'])).toEqual({ issue: 'inconnu' })
  })

  it('le lien de secours de l’exploitant suit les mêmes règles', () => {
    const lienDeSecours = creerEmettreLienDeSecours({
      ...banc,
      adresseDuLien: (jeton) => `https://garage.exemple/garagiste/connexion/lien?jeton=${jeton}`,
    })()
    expect(lienDeSecours.expireLe.getTime() - DEBUT_ESSAI.getTime()).toBe(DUREE_LIEN_MS)
    const jeton = new URL(lienDeSecours.adresse).searchParams.get('jeton')
    const ouvrir = creerOuvrirSession(banc)
    expect(ouvrir(jeton).issue).toBe('ouverte')
    expect(ouvrir(jeton).issue).toBe('deja-utilise')
  })
})
