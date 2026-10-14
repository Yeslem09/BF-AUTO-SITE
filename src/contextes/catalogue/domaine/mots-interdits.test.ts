import { describe, expect, it } from 'vitest'
import { expressionsInterditesDans, normaliser } from './mots-interdits.js'

describe('expressions interdites du catalogue', () => {
  it.each([
    ['Pièce en stock', 'stock'],
    ['Ajouter au panier', 'panier'],
    ['Compatible avec votre véhicule', 'compatible'],
    ['Compatibilité garantie', 'compatible'],
    ['Payer en ligne', 'payer'],
    ['Paiement en ligne sécurisé', 'paiement en ligne'],
    ['Vérification gratuite de la pièce', 'vérification gratuite'],
    ['À partir de 49 €', 'à partir de'],
    ['Livrée sous 24 h', 'sous 24 h'],
    ['Le meilleur prix du quartier', 'meilleur prix'],
    ['Un entretien écologique', 'écologique'],
    ['Un moteur non polluant', 'non polluant'],
  ])('refuse « %s » (%s)', (texte, expression) => {
    expect(expressionsInterditesDans(texte)).toContain(expression)
  })

  it('ignore la casse, les accents et la forme de l’apostrophe', () => {
    expect(expressionsInterditesDans('VERIFICATION GRATUITE')).toEqual(['vérification gratuite'])
    expect(expressionsInterditesDans('a PARTIR de')).toEqual(['à partir de'])
    expect(normaliser('L’Économie')).toBe("l'economie")
  })

  it('laisse passer les mots voisins qui ne promettent rien', () => {
    expect(
      expressionsInterditesDans(
        'Nous vérifions qu’elle convient à votre véhicule, gaz polluants traités, stockage',
      ),
    ).toEqual([])
  })
})
