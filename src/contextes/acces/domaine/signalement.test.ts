import { describe, expect, it } from 'vitest'
import { redigerAlerteDemandesLien, redigerMessageLien, redigerSignalement } from './messages.js'
import {
  libelleNature,
  lireSignalement,
  NATURES_CHANGEMENT,
  TEXTE_SIGNALEMENT_MAX,
} from './signalement.js'

describe('signalement d’un changement (US-49)', () => {
  it('propose exactement la liste du Kano : horaires habituels, prix, prestation, autre', () => {
    expect(NATURES_CHANGEMENT.map((nature) => nature.libelle)).toEqual([
      'Horaires habituels',
      'Prix',
      'Prestation',
      'Autre',
    ])
  })

  it('accepte une nature de la liste et un texte court, espaces de bord retirés', () => {
    expect(lireSignalement({ nature: 'prix', texte: '  Vidange à revoir  ' })).toEqual({
      valide: true,
      signalement: { nature: 'prix', texte: 'Vidange à revoir' },
    })
  })

  it('refuse une nature absente ou inventée, en disant quoi faire', () => {
    for (const nature of [undefined, '', 'tarif', ['prix']]) {
      const lecture = lireSignalement({ nature, texte: 'Un texte' })
      expect(lecture.valide).toBe(false)
      if (!lecture.valide) expect(lecture.erreurs.nature).toBe('Choisissez ce qui change.')
    }
  })

  it('refuse un texte vide ou fait d’espaces', () => {
    for (const texte of [undefined, '', '   \n ']) {
      const lecture = lireSignalement({ nature: 'autre', texte })
      expect(lecture.valide).toBe(false)
      if (!lecture.valide) {
        expect(lecture.erreurs).toEqual({ texte: 'Décrivez le changement en quelques mots.' })
      }
    }
  })

  it('refuse un texte trop long et rend la saisie pour qu’elle ne soit pas perdue', () => {
    const texte = 'x'.repeat(TEXTE_SIGNALEMENT_MAX + 1)
    const lecture = lireSignalement({ nature: 'horaires', texte })
    expect(lecture).toEqual({
      valide: false,
      saisie: { nature: 'horaires', texte },
      erreurs: { texte: `Votre texte fait 501 caractères : 500 au plus.` },
    })
    expect(
      lireSignalement({ nature: 'horaires', texte: 'x'.repeat(TEXTE_SIGNALEMENT_MAX) }).valide,
    ).toBe(true)
  })

  it('compte un retour à la ligne pour un caractère, comme le champ du navigateur (CRLF envoyé)', () => {
    const texte = `${'x'.repeat(249)}\r\n${'y'.repeat(250)}`
    expect(texte.length).toBe(TEXTE_SIGNALEMENT_MAX + 1)
    expect(lireSignalement({ nature: 'autre', texte })).toEqual({
      valide: true,
      signalement: { nature: 'autre', texte: `${'x'.repeat(249)}\n${'y'.repeat(250)}` },
    })
    expect(lireSignalement({ nature: 'autre', texte: 'Avant\rAprès' })).toEqual({
      valide: true,
      signalement: { nature: 'autre', texte: 'Avant\nAprès' },
    })
  })

  it('signale les deux champs d’un coup', () => {
    const lecture = lireSignalement({})
    expect(lecture.valide).toBe(false)
    if (!lecture.valide) expect(Object.keys(lecture.erreurs).sort()).toEqual(['nature', 'texte'])
  })

  it('donne le libellé lisible d’une nature', () => {
    expect(libelleNature('horaires')).toBe('Horaires habituels')
  })
})

describe('messages envoyés', () => {
  it('le lien de connexion se suffit à lui-même : adresse, durée, usage unique, session', () => {
    const message = redigerMessageLien('https://garage.exemple/garagiste/connexion/lien?jeton=abc')
    expect(message.objet).toBe('Votre lien de connexion à l’espace garagiste')
    expect(message.texte).toContain('https://garage.exemple/garagiste/connexion/lien?jeton=abc')
    expect(message.texte).toContain('valable 15 minutes et ne sert qu’une fois')
    expect(message.texte).toContain('la session y dure 90 jours')
    expect(message.texte).toContain('Si vous n’avez rien demandé, ignorez ce message')
  })

  it('l’alerte dit le nombre de demandes et que le compte n’est pas verrouillé', () => {
    const alerte = redigerAlerteDemandesLien(21)
    expect(alerte.texte).toContain('21 demandes de lien de connexion en moins d’une heure')
    expect(alerte.texte).toContain('Le compte n’est pas verrouillé')
  })

  it('le signalement est structuré et rappelle que rien n’a été modifié', () => {
    const message = redigerSignalement({ nature: 'horaires', texte: 'Fermé le samedi' })
    expect(message.objet).toBe('Signalement du garagiste : Horaires habituels')
    expect(message.texte).toContain('Ce qui change : Horaires habituels')
    expect(message.texte).toContain('Son message :\nFermé le samedi')
    expect(message.texte).toContain('Le fichier de données du site n’a pas été modifié')
  })
})
