import { describe, expect, it } from 'vitest'
import { CADRE_ESSAI } from '../essai.js'
import { html } from '../html.js'
import type { EmplacementAccueil } from '../module-contexte.js'
import {
  COLONNES_ACCUEIL,
  decouperAccroche,
  ORDRE_ZONES_ACCUEIL,
  vueAccueil,
  type BlocsAccueilRendus,
} from './accueil.js'

const TOUS: readonly EmplacementAccueil[] = [
  'information',
  'statut',
  'pre-diagnostic',
  'recherche-pieces',
  'catalogue',
  'questions',
  'garage',
  'rappel',
  'encart',
]

function blocs(emplacements: readonly EmplacementAccueil[]): BlocsAccueilRendus {
  return Object.fromEntries(emplacements.map((e) => [e, html`<p>bloc ${e}</p>`]))
}

const rendu = (
  emplacements: readonly EmplacementAccueil[],
  accroche = CADRE_ESSAI.identite.accroche,
): string =>
  vueAccueil({ ...CADRE_ESSAI.identite, accroche }, blocs(emplacements)).contenu.toString()

const ordreDesZones = (texte: string): string[] =>
  [...texte.matchAll(/class="accueil__zone accueil__zone--([a-z-]+)"/g)].map(
    ([, zone]) => zone ?? '',
  )

describe('accueil : ordre du document', () => {
  it('suit l’ordre du téléphone : statut, question 1, pièces, familles, puis le reste', () => {
    expect(ORDRE_ZONES_ACCUEIL).toEqual([
      'statut',
      'pre-diagnostic',
      'recherche-pieces',
      'catalogue',
      'information',
      'questions',
      'garage',
      'rappel',
      'encart',
    ])
    expect(ordreDesZones(rendu(TOUS))).toEqual(ORDRE_ZONES_ACCUEIL)
  })

  it('couvre chaque emplacement exactement une fois', () => {
    expect([...ORDRE_ZONES_ACCUEIL].sort()).toEqual([...TOUS].sort())
  })

  it('bande d’ouverture : statut, accroche, question 1, pièces détachées, raccourcis', () => {
    const texte = rendu(TOUS)
    const positions = [
      'accueil__zone--statut',
      'class="accroche"',
      'accueil__zone--pre-diagnostic',
      'accueil__zone--recherche-pieces',
      'class="raccourcis"',
      '</section>',
      'accueil__zone--catalogue',
    ].map((repere) => texte.indexOf(repere))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('pose la grille des familles en pleine largeur, entre la bande et les colonnes', () => {
    const texte = rendu(TOUS)
    expect(texte).toContain(
      '<div class="accueil__pleine-largeur">\n  <div class="conteneur"><div class="accueil__zone accueil__zone--catalogue">',
    )
    expect(texte.indexOf('accueil__pleine-largeur')).toBeLessThan(texte.indexOf('accueil__jour'))
  })

  it('groupe les zones en deux colonnes : l’atelier et les questions, le garage et le rappel', () => {
    expect(COLONNES_ACCUEIL).toEqual([
      { colonne: 'gauche', zones: ['information', 'questions'] },
      { colonne: 'droite', zones: ['garage', 'rappel'] },
    ])
    const texte = rendu(TOUS)
    for (const { colonne, zones } of COLONNES_ACCUEIL) {
      const debut = texte.indexOf(`accueil__colonne--${colonne}`)
      expect(debut).toBeGreaterThanOrEqual(0)
      for (const zone of zones) {
        expect(texte.indexOf(`accueil__zone--${zone}`)).toBeGreaterThan(debut)
      }
    }
  })

  it('pose le pré-diagnostic dans une plaque, sur la bande d’ouverture', () => {
    const texte = rendu(TOUS)
    expect(texte).toContain(
      '<div class="accueil__zone accueil__zone--pre-diagnostic"><div class="plaque"><div class="plaque__filet"><p>bloc pre-diagnostic</p></div></div></div>',
    )
    expect(texte).toContain('class="ouverture ouverture--avec-plaque"')
  })
})

describe('accueil : emplacements absents', () => {
  it('sans pré-diagnostic, l’ouverture garde l’accroche et les raccourcis, sans plaque vide', () => {
    const texte = rendu(['information'])
    expect(texte).toContain('class="ouverture"')
    expect(texte).not.toContain('class="plaque')
    expect(texte).toContain('class="raccourcis"')
  })

  it('omet une colonne dont aucune zone n’est fournie', () => {
    const texte = rendu(['information', 'questions'])
    expect(texte).toContain('accueil__colonne--gauche')
    expect(texte).not.toContain('accueil__colonne--droite')
    expect(ordreDesZones(texte)).toEqual(['information', 'questions'])
    expect(rendu(['rappel'])).not.toContain('accueil__colonne--gauche')
  })

  it('sans aucun bloc, rend l’ouverture seule, sans partie claire ni texte d’attente', () => {
    const texte = rendu([])
    expect(texte).not.toContain('accueil__jour')
    expect(texte).not.toContain('accueil__zone')
    expect(texte).not.toMatch(/en construction|bientôt|à venir/i)
  })

  it('l’encart seul suffit à ouvrir la partie claire', () => {
    const texte = rendu(['encart'])
    expect(texte).toContain('accueil__jour')
    expect(ordreDesZones(texte)).toEqual(['encart'])
  })

  it('sans grille des familles, aucune bande pleine largeur vide', () => {
    expect(rendu(['information'])).not.toContain('accueil__pleine-largeur')
  })
})

describe('accueil : figure signature', () => {
  it('pose la Fig. 1 en grand dans le bloc atelier, après son contenu', () => {
    const texte = rendu(['information', 'garage'])
    expect(texte).toContain(
      '<div class="accueil__zone accueil__zone--information"><p>bloc information</p><div class="accueil__figure"><figure class="figure-technique" id="figure-1">',
    )
    expect(texte.indexOf('figure-1')).toBeLessThan(texte.indexOf('accueil__colonne--droite'))
    expect(texte).toContain('<span class="figure-technique__numero">Fig. 1</span> Frein à disque')
  })

  it('n’apparaît pas sans bloc d’information', () => {
    expect(rendu(['garage'])).not.toContain('figure-technique')
  })
})

describe('accueil : titre et raccourcis', () => {
  it('garde le titre de page en h1, pour les moteurs et les lecteurs d’écran', () => {
    const vue = vueAccueil(CADRE_ESSAI.identite, {})
    expect(vue.titre).toBe('BF Auto, garage automobile à Choisy-le-Roi')
    expect(vue.contenu.toString()).toContain(
      '<h1 class="ouverture__titre surtitre" id="titre-accueil">BF Auto, garage automobile à Choisy-le-Roi</h1>',
    )
  })

  it('sans bloc des pièces, propose pièces, rendez-vous et tarifs en boutons bordés', () => {
    const liens = [...rendu([]).matchAll(/<a class="bouton-choix" href="([^"]+)">/g)].map(
      ([, l]) => l,
    )
    expect(liens).toEqual(['/pieces-et-reparations', '/demande?type=rendez-vous', '/tarifs'])
  })

  it('avec le bloc des pièces, ne répète pas le raccourci vers elles', () => {
    const liens = [
      ...rendu(['recherche-pieces']).matchAll(/<a class="bouton-choix" href="([^"]+)">/g),
    ].map(([, l]) => l)
    expect(liens).toEqual(['/demande?type=rendez-vous', '/tarifs'])
  })
})

describe('accueil : activités sous l’accroche', () => {
  const ACTIVITES = 'Mécanique, entretien, carrosserie et peinture, toutes marques.'

  it('dit ce que fait le garage juste sous l’accroche, dès le premier écran', () => {
    const texte = vueAccueil(
      { ...CADRE_ESSAI.identite, activites: ACTIVITES },
      blocs(TOUS),
    ).contenu.toString()
    expect(texte).toContain(`<p class="accroche__activites">${ACTIVITES}</p>`)
    const accroche = texte.indexOf('class="accroche"')
    const activites = texte.indexOf('class="accroche__activites"')
    expect(activites).toBeGreaterThan(accroche)
    expect(activites).toBeLessThan(texte.indexOf('accueil__zone--pre-diagnostic'))
  })

  it('n’affiche rien tant que l’identité ne les fournit pas', () => {
    expect(rendu(TOUS)).not.toContain('accroche__activites')
    const vide = vueAccueil({ ...CADRE_ESSAI.identite, activites: '  ' }, {}).contenu.toString()
    expect(vide).not.toContain('accroche__activites')
  })

  it('échappe le texte fourni', () => {
    const texte = vueAccueil(
      { ...CADRE_ESSAI.identite, activites: 'Pneus <b>' },
      {},
    ).contenu.toString()
    expect(texte).toContain('<p class="accroche__activites">Pneus &lt;b&gt;</p>')
  })
})

describe('accueil : découpe de l’accroche', () => {
  it('sépare le lieu, la promesse et la chute', () => {
    expect(
      decouperAccroche('Votre garage à Choisy-le-Roi : on explique, on chiffre, vous décidez.'),
    ).toEqual({
      lieu: 'Votre garage à Choisy-le-Roi :',
      promesse: 'on explique, on chiffre,',
      chute: 'vous décidez.',
    })
  })

  it('garde une accroche sans deux-points entière, sans chute', () => {
    expect(decouperAccroche('Votre garage automobile de proximité à Choisy-le-Roi')).toEqual({
      lieu: null,
      promesse: 'Votre garage automobile de proximité à Choisy-le-Roi',
      chute: null,
    })
    expect(decouperAccroche('Garage, mécanique et entretien')).toEqual({
      lieu: null,
      promesse: 'Garage, mécanique et entretien',
      chute: null,
    })
  })

  it('ne coupe pas sur des deux-points en tête ou en fin', () => {
    expect(decouperAccroche(': texte').lieu).toBeNull()
    expect(decouperAccroche('Texte :')).toEqual({ lieu: null, promesse: 'Texte :', chute: null })
  })

  it('sans virgule après le lieu, la promesse est entière', () => {
    expect(decouperAccroche('À Choisy-le-Roi : un garage qui explique')).toEqual({
      lieu: 'À Choisy-le-Roi :',
      promesse: 'un garage qui explique',
      chute: null,
    })
  })

  it('garde d’un tenant le nom composé du lieu : « Choisy- » ne finit plus une ligne', () => {
    const texte = rendu([], 'Votre garage à Choisy-le-Roi : on explique, on chiffre, vous décidez.')
    expect(texte).toContain(
      '<span class="accroche__lieu">Votre garage à <span class="accroche__insecable">Choisy-le-Roi</span> :</span>',
    )
  })

  it('rend la chute à l’accent et échappe le texte', () => {
    const texte = rendu([], 'Lieu <b> : un, deux')
    expect(texte).toContain(
      '<p class="accroche"><span class="accroche__lieu">Lieu &lt;b&gt; :</span> <span class="accroche__promesse">un, <em class="accroche__chute">deux</em></span></p>',
    )
  })
})
