import { describe, expect, it } from 'vitest'
import { vueErreurServeur, vueIntrouvable } from './erreurs.js'

const liens = (contenu: string): string[] =>
  [...contenu.matchAll(/<a class="bouton-choix" href="([^"]+)">/g)].map(([, lien]) => lien ?? '')

describe('pages d’erreur : où aller ensuite', () => {
  it('404 : les trois intentions, pré-diagnostic compris quand il est publié', () => {
    expect(liens(vueIntrouvable('/nulle-part').contenu.toString())).toEqual([
      '/pre-diagnostic',
      '/pieces-et-reparations',
      '/demande?type=rendez-vous',
    ])
  })

  it('sans pré-diagnostic publié, aucune suggestion ne mène à une page absente', () => {
    for (const vue of [
      vueIntrouvable('/nulle-part', { preDiagnosticPublie: false }),
      vueErreurServeur('/panne', { preDiagnosticPublie: false }),
    ]) {
      const contenu = vue.contenu.toString()
      expect(contenu).not.toContain('/pre-diagnostic')
      expect(liens(contenu)).toEqual([
        '/pieces-et-reparations',
        '/demande?type=rendez-vous',
        '/tarifs',
      ])
    }
  })
})
