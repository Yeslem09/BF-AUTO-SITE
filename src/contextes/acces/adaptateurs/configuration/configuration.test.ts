import { creerExpediteurConsole } from '../../../../infrastructure/courriel/envoi/expediteur-console.js'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { creerMessagerieRetenue } from '../essai/doublures.js'
import { ADRESSES_DEMONSTRATION, avertissementsDeDemarrage, choisirCanaux } from './canaux.js'
import { ErreurReglagesAcces, lireCheminBase, lireUrlPublique } from './reglages-environnement.js'
import type { ReglagesAcces } from './reglages.js'

describe('variables des commandes d’exploitation', () => {
  it('prend l’origine locale du port à défaut d’URL_PUBLIQUE, et la réduit à son origine', () => {
    expect(lireUrlPublique({})).toBe('http://localhost:3000')
    expect(lireUrlPublique({ PORT: '4315' })).toBe('http://localhost:4315')
    expect(lireUrlPublique({ URL_PUBLIQUE: 'https://www.bf-auto.fr/' })).toBe(
      'https://www.bf-auto.fr',
    )
  })

  it('refuse une origine qui n’est pas une adresse http ou https', () => {
    expect(() => lireUrlPublique({ URL_PUBLIQUE: 'ftp://garage.exemple' })).toThrow(
      ErreurReglagesAcces,
    )
    expect(() => lireUrlPublique({ URL_PUBLIQUE: 'pas une adresse' })).toThrow(/URL_PUBLIQUE/)
  })

  it('résout la base partagée comme la configuration du site', () => {
    expect(lireCheminBase({}, '/srv/site')).toBe(resolve('/srv/site/var/demandes.sqlite'))
    expect(lireCheminBase({ BASE_SQLITE: '/var/data/bf.sqlite' }, '/srv/site')).toBe(
      resolve('/var/data/bf.sqlite'),
    )
  })
})

const REGLAGES_VIDES: ReglagesAcces = {
  urlPublique: 'https://garage.exemple',
  courrielGaragiste: null,
  courrielResponsable: null,
  expediteur: null,
}
const REGLAGES_COMPLETS: ReglagesAcces = {
  ...REGLAGES_VIDES,
  courrielGaragiste: 'garagiste@exemple.fr',
  courrielResponsable: 'anthony@exemple.fr',
  expediteur: creerExpediteurConsole(() => undefined),
}

describe('choix des canaux selon le mode', () => {
  const console = creerMessagerieRetenue()
  const smtp = creerMessagerieRetenue()

  it('en production, envoie par le serveur configuré aux adresses configurées', () => {
    const canaux = choisirCanaux('production', REGLAGES_COMPLETS, { console, smtp })
    expect(canaux.canalGaragiste).toEqual({
      messagerie: smtp,
      destinataire: 'garagiste@exemple.fr',
      remise: 'courriel',
    })
    expect(canaux.canalResponsable).toEqual({
      messagerie: smtp,
      destinataire: 'anthony@exemple.fr',
      remise: 'courriel',
    })
  })

  it('en production sans adresse, ferme le canal au lieu d’écrire dans le vide', () => {
    const canaux = choisirCanaux('production', REGLAGES_VIDES, { console, smtp: null })
    expect(canaux).toEqual({ canalGaragiste: null, canalResponsable: null })
    expect(
      choisirCanaux('relecture', REGLAGES_VIDES, { console, smtp: null }).canalGaragiste,
    ).toBeNull()
  })

  it('sans serveur d’envoi, écrit en console (convention du site) et le dit : remise « journal »', () => {
    const canaux = choisirCanaux(
      'production',
      { ...REGLAGES_COMPLETS, expediteur: null },
      { console, smtp: null },
    )
    expect(canaux.canalGaragiste).toEqual({
      messagerie: console,
      destinataire: 'garagiste@exemple.fr',
      remise: 'journal',
    })
    expect(canaux.canalResponsable?.remise).toBe('journal')
  })

  it('en démonstration, n’envoie jamais rien de réel et montre le lien dans la page', () => {
    const canaux = choisirCanaux('demonstration', REGLAGES_COMPLETS, { console, smtp })
    expect(canaux.canalGaragiste).toEqual({
      messagerie: console,
      destinataire: 'garagiste@exemple.fr',
      remise: 'demonstration',
    })
    expect(canaux.canalResponsable?.remise).toBe('demonstration')
    const sansAdresse = choisirCanaux('demonstration', REGLAGES_VIDES, { console, smtp: null })
    expect(sansAdresse.canalGaragiste?.destinataire).toBe(ADRESSES_DEMONSTRATION.garagiste)
    expect(sansAdresse.canalResponsable?.destinataire).toBe(ADRESSES_DEMONSTRATION.responsable)
  })

  it('dit au démarrage chaque réglage manquant et sa conséquence', () => {
    expect(avertissementsDeDemarrage('production', REGLAGES_VIDES)).toHaveLength(3)
    expect(avertissementsDeDemarrage('production', REGLAGES_COMPLETS)).toEqual([])
    expect(avertissementsDeDemarrage('demonstration', REGLAGES_VIDES)).toEqual([])
  })
})
