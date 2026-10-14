import { describe, expect, it } from 'vitest'
import { composerTexte, composerTypographie, lierLesNombres, lierLesSignes } from './typographie.js'

const INSECABLE = ' '
/** Écrit un texte attendu : chaque « _ » y devient une espace insécable. */
const insecable = (texte: string): string => texte.replaceAll('_', INSECABLE)

describe('typographie française de chaque page', () => {
  it('lie « : », « ? » et « ! » au mot qui les précède', () => {
    expect(lierLesSignes('Un souci ? Appelez : vite !')).toBe(
      `Un souci${INSECABLE}? Appelez${INSECABLE}: vite${INSECABLE}!`,
    )
  })

  it('ne touche ni aux heures, ni aux adresses, ni au texte déjà composé', () => {
    expect(lierLesSignes('à 10:30, https://garage.exemple/?a=1')).toBe(
      'à 10:30, https://garage.exemple/?a=1',
    )
    const compose = lierLesSignes('Pourquoi ?')
    expect(lierLesSignes(compose)).toBe(compose)
  })

  it('ne compose que les nœuds de texte : balises, attributs, scripts et champs restent intacts', () => {
    const page = [
      '<title>Tarifs ? | BF Auto</title>',
      '<meta name="description" content="Voyant : oui ?">',
      '<a href="/demande?type=rappel" title="Rappel : oui">Être rappelé ?</a> : suite',
      '<script type="application/ld+json">{"a" : "b ?"}</script>',
      '<textarea name="precisions">Bruit : grave ?</textarea>',
      '<!-- note : garder -->',
    ].join('')
    expect(composerTypographie(page)).toBe(
      [
        `<title>Tarifs${INSECABLE}? | BF Auto</title>`,
        '<meta name="description" content="Voyant : oui ?">',
        `<a href="/demande?type=rappel" title="Rappel : oui">Être rappelé${INSECABLE}?</a>${INSECABLE}: suite`,
        '<script type="application/ld+json">{"a" : "b ?"}</script>',
        '<textarea name="precisions">Bruit : grave ?</textarea>',
        '<!-- note : garder -->',
      ].join(''),
    )
  })
})

describe('typographie française : heures insécables', () => {
  it('lie l’heure à son « h », et les minutes à l’heure', () => {
    expect(lierLesNombres('Ouvert, ferme à 19 h')).toBe(insecable('Ouvert, ferme à 19_h'))
    expect(lierLesNombres('reçue à 10 h 05')).toBe(insecable('reçue à 10_h_05'))
    expect(lierLesNombres('8 h 30 à 12 h, 14 h à 19 h 00')).toBe(
      insecable('8_h_30 à 12_h, 14_h à 19_h_00'),
    )
    expect(lierLesNombres('ouvert 24 h/24')).toBe(insecable('ouvert 24_h/24'))
  })

  it('laisse ce qui n’est pas une heure : mot qui commence par h, format 10:30, chiffre isolé', () => {
    for (const texte of ['5 hommes', 'à 10:30', '3 heures', 'à 19 h2', 'Question 4 sur 5']) {
      expect(lierLesNombres(texte), texte).toBe(texte)
    }
    // Des minutes à un chiffre ne sont pas des minutes : seule l'heure est liée.
    expect(lierLesNombres('à 19 h 5 min')).toBe(insecable('à 19_h 5_min'))
  })
})

describe('typographie française : nombres et unités', () => {
  it('lie un nombre à son unité, décimales et milliers compris', () => {
    const cas: readonly [string, string][] = [
      ['12 €', '12_€'],
      ['49,90 € TTC', '49,90_€ TTC'],
      ['5 km', '5_km'],
      ['1 200 km', '1_200_km'],
      ['1 234,56 €', '1_234,56_€'],
      ['2,5 bar', '2,5_bar'],
      ['80 %', '80_%'],
      ['12 V', '12_V'],
      ['70 Ah', '70_Ah'],
      ['110 km/h', '110_km/h'],
      ['30 min', '30_min'],
      ['5 l', '5_l'],
      ['4 L', '4_L'],
      ['20 °C', '20_°C'],
      ['90 ch', '90_ch'],
      ['1,5 h', '1,5_h'],
    ]
    for (const [texte, attendu] of cas) {
      expect(lierLesNombres(`soit ${texte}.`), texte).toBe(insecable(`soit ${attendu}.`))
    }
  })

  it('laisse les numéros, plaques, codes postaux et mots qui commencent comme une unité', () => {
    for (const texte of [
      '06 05 92 28 38',
      '7 A 972',
      '94600 Choisy-le-Roi',
      '3 litres',
      '2 mois',
      '5 grammes',
      'A4 m',
      'de 2 à 5',
      'le 24 septembre 2026',
    ]) {
      expect(lierLesNombres(texte), texte).toBe(texte)
    }
  })

  it('est idempotente : un texte composé ne change plus, même relu par toutes les règles', () => {
    const texte = 'Fermé : ouvre à 8 h 30. Forfait 1 200 € ? Oui, 5 km !'
    const compose = composerTexte(texte)
    expect(compose).toBe(insecable('Fermé_: ouvre à 8_h_30. Forfait 1_200_€_? Oui, 5_km_!'))
    expect(composerTexte(compose)).toBe(compose)
    expect(composerTypographie(`<p>${compose}</p>`)).toBe(`<p>${compose}</p>`)
  })

  it('compose les heures et les prix des nœuds de texte, jamais des attributs ni des champs', () => {
    const page = [
      '<meta name="description" content="Ouvert à 19 h, forfait 49 €">',
      '<p class="statut">Ouvert, ferme à 19 h</p>',
      '<td>49 €</td>',
      '<input name="heure" value="10 h 05">',
      '<textarea name="precisions">vers 10 h 05, 5 km</textarea>',
      '<script type="application/ld+json">{"opens":"9 h"}</script>',
    ].join('')
    expect(composerTypographie(page)).toBe(
      [
        '<meta name="description" content="Ouvert à 19 h, forfait 49 €">',
        insecable('<p class="statut">Ouvert, ferme à 19_h</p>'),
        insecable('<td>49_€</td>'),
        '<input name="heure" value="10 h 05">',
        '<textarea name="precisions">vers 10 h 05, 5 km</textarea>',
        '<script type="application/ld+json">{"opens":"9 h"}</script>',
      ].join(''),
    )
  })
})
