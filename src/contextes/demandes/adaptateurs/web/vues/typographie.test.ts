import { describe, expect, it } from 'vitest'
import { heureInsecable, insecables } from './typographie.js'

const INSECABLE = '\u00a0'

describe('typographie française à l’écran', () => {
  it('lie à leur mot « ? », « ! », « ; », « : » et les guillemets', () => {
    expect(insecables('Et ensuite ? Oui ! Bien ; alors : « Traitée »')).toBe(
      `Et ensuite${INSECABLE}? Oui${INSECABLE}! Bien${INSECABLE}; alors${INSECABLE}: «${INSECABLE}Traitée${INSECABLE}»`,
    )
  })

  it('un numéro de téléphone ne se coupe pas entre ses paires de chiffres', () => {
    expect(insecables('par exemple 06 12 34 56 78.')).toBe(
      `par exemple 06${INSECABLE}12${INSECABLE}34${INSECABLE}56${INSECABLE}78.`,
    )
    expect(insecables('1234 AB 56, 12 mois, 10 chiffres, le 24 septembre')).toBe(
      '1234 AB 56, 12 mois, 10 chiffres, le 24 septembre',
    )
  })

  it('ne touche ni aux adresses, ni aux heures, ni au texte déjà composé', () => {
    expect(insecables('https://garage.exemple/demande?type=rappel')).toBe(
      'https://garage.exemple/demande?type=rappel',
    )
    expect(insecables('mercredi 16 septembre à 10 h 10')).toBe('mercredi 16 septembre à 10 h 10')
    const compose = insecables('Pourquoi ?')
    expect(insecables(compose)).toBe(compose)
  })

  it('une heure se lit d’un bloc, avec son « à », sans toucher aux autres nombres', () => {
    expect(heureInsecable('jeudi 24 septembre à 1 h 25')).toBe(
      `jeudi 24 septembre à${INSECABLE}1${INSECABLE}h${INSECABLE}25`,
    )
    expect(heureInsecable('reçue à 10 h, rappel à 8 h 30.')).toBe(
      `reçue à${INSECABLE}10${INSECABLE}h, rappel à${INSECABLE}8${INSECABLE}h${INSECABLE}30.`,
    )
    expect(heureInsecable('12 mois, 1234 AB 56')).toBe('12 mois, 1234 AB 56')
    const compose = heureInsecable('à 9 h 05')
    expect(heureInsecable(compose)).toBe(compose)
  })
})
