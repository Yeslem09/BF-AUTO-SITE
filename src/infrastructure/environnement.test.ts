import { describe, expect, it } from 'vitest'
import { creerLecteurEnvironnement, estAdresseCourriel } from './environnement.js'

describe('lecteur d’environnement', () => {
  it('traite une variable vide ou faite d’espaces comme absente', () => {
    const lecteur = creerLecteurEnvironnement({ A: '  ', B: ' valeur ' })
    expect(lecteur.texte('A')).toBeNull()
    expect(lecteur.definie('A')).toBe(false)
    expect(lecteur.texte('B')).toBe('valeur')
    expect(lecteur.problemes).toEqual([])
  })

  it('lit un entier borné et signale un hors bornes sans lever', () => {
    const lecteur = creerLecteurEnvironnement({ BON: '45', TROP: '5', TEXTE: 'deux' })
    const bornes = { defaut: 120, min: 30, max: 3600 }
    expect(lecteur.entier('BON', bornes)).toBe(45)
    expect(lecteur.entier('ABSENT', bornes)).toBe(120)
    expect(lecteur.entier('TROP', bornes)).toBe(120)
    expect(lecteur.entier('TEXTE', bornes)).toBe(120)
    expect(lecteur.problemes).toEqual([
      'TROP : « 5 », entier de 30 à 3600 attendu',
      'TEXTE : « deux », entier de 30 à 3600 attendu',
    ])
  })

  it('lit un booléen true ou false, sans tenir compte de la casse', () => {
    const lecteur = creerLecteurEnvironnement({ VRAI: 'TRUE', FAUX: 'false', AUTRE: 'oui' })
    expect(lecteur.booleen('VRAI', false)).toBe(true)
    expect(lecteur.booleen('FAUX', true)).toBe(false)
    expect(lecteur.booleen('ABSENT', true)).toBe(true)
    expect(lecteur.booleen('AUTRE', false)).toBe(false)
    expect(lecteur.problemes).toEqual(['AUTRE : « oui », true ou false attendu'])
  })

  it('valide une adresse de courriel et un choix dans une liste', () => {
    const lecteur = creerLecteurEnvironnement({
      BONNE: 'garage@gmail.com',
      MAUVAISE: 'garage@',
      CHOIX: 'GMAIL',
      INCONNU: 'yahoo',
    })
    expect(lecteur.courriel('BONNE')).toBe('garage@gmail.com')
    expect(lecteur.courriel('MAUVAISE')).toBeNull()
    expect(lecteur.choix('CHOIX', ['gmail', 'ovh'])).toBe('gmail')
    expect(lecteur.choix('INCONNU', ['gmail', 'ovh'])).toBeNull()
    expect(lecteur.problemes).toEqual([
      'MAUVAISE : « garage@ » n’est pas une adresse de courriel',
      'INCONNU : « yahoo » inconnu (gmail, ovh)',
    ])
  })

  it('exige https pour une adresse d’API, sauf vers la machine elle-même', () => {
    const lecteur = creerLecteurEnvironnement({
      DISTANTE: 'https://api.exemple.test/v3/',
      LOCALE: 'http://127.0.0.1:4100',
      EN_CLAIR: 'http://api.exemple.test',
      FAUSSE: 'pas une adresse',
    })
    expect(lecteur.url('DISTANTE', 'https://defaut.test')).toBe('https://api.exemple.test/v3')
    expect(lecteur.url('LOCALE', 'https://defaut.test')).toBe('http://127.0.0.1:4100')
    expect(lecteur.url('ABSENTE', 'https://defaut.test')).toBe('https://defaut.test')
    expect(lecteur.url('EN_CLAIR', 'https://defaut.test')).toBe('https://defaut.test')
    expect(lecteur.url('FAUSSE', 'https://defaut.test')).toBe('https://defaut.test')
    expect(lecteur.problemes).toHaveLength(2)
  })

  it('reconnaît une adresse de courriel', () => {
    expect(estAdresseCourriel('site@bf-auto.fr')).toBe(true)
    expect(estAdresseCourriel('BF Auto <site@bf-auto.fr>')).toBe(false)
    expect(estAdresseCourriel('site@local')).toBe(false)
  })
})
