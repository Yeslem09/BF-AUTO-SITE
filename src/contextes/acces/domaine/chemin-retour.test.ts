import { describe, expect, it } from 'vitest'
import { cheminRetourSur } from './chemin-retour.js'

describe('page de retour après la connexion', () => {
  it('garde un chemin de l’espace garagiste, paramètres compris', () => {
    expect(cheminRetourSur('/garagiste')).toBe('/garagiste')
    expect(cheminRetourSur('/garagiste/demandes')).toBe('/garagiste/demandes')
    expect(cheminRetourSur('/garagiste/demandes/abc?vue=courte')).toBe(
      '/garagiste/demandes/abc?vue=courte',
    )
  })

  it('ramène à l’accueil de l’espace pour toute autre valeur : aucune redirection ouverte', () => {
    for (const valeur of [
      undefined,
      null,
      42,
      ['/garagiste/demandes'],
      '',
      'garagiste',
      'https://pirate.exemple/garagiste',
      '//pirate.exemple/garagiste',
      // Chemin de l'espace porté par une autre origine : il ne doit pas survivre.
      'https://pirate.exemple/garagiste/demandes',
      '//pirate.exemple/garagiste/demandes',
      'http:/garagiste/demandes',
      '/\\pirate.exemple',
      '/garagiste\\..\\..\\pirate',
      '/garagiste/\t/demandes',
      '/garagiste/\n',
      '/',
      '/demande',
      '/garagisteX',
      '/garagiste/../demande',
      '/garagiste/%2e%2e/demande',
      `/garagiste/${'a'.repeat(600)}`,
    ]) {
      expect(cheminRetourSur(valeur), String(valeur)).toBe('/garagiste')
    }
  })

  it('ne renvoie jamais vers la connexion elle-même', () => {
    expect(cheminRetourSur('/garagiste/connexion')).toBe('/garagiste')
    expect(cheminRetourSur('/garagiste/connexion/lien?jeton=abc')).toBe('/garagiste')
  })
})
