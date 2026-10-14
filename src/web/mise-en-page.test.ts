import { describe, expect, it } from 'vitest'
import { CADRE_ESSAI } from './essai.js'
import { html } from './html.js'
import {
  rendreBandeauMode,
  rendrePage,
  titreDocument,
  type CadrePage,
  type VuePage,
} from './mise-en-page.js'

const PARAMETRES = {
  urlPublique: 'https://garage.exemple',
  versionner: (chemin: string) => `${chemin}?v=empreinte`,
  couleurTheme: '#233f35',
}

const VUE: VuePage = {
  titre: 'Pièces et réparations',
  description: 'Toutes les pièces du garage.',
  chemin: '/pieces-et-reparations',
  rubrique: 'catalogue',
  contenu: html`<div class="conteneur"><h1>Pièces et réparations</h1></div>`,
}

const CADRE_OUVERT: CadrePage = {
  ...CADRE_ESSAI,
  statut: { etat: 'ouvert', libelle: 'Ouvert, ferme à 19 h' },
}

const page = (vue: VuePage = VUE, cadre: CadrePage = CADRE_ESSAI): string =>
  rendrePage(vue, cadre, PARAMETRES).toString()

/** Le fragment compris entre la première occurrence de `debut` et la suivante de `fin`. */
function extraire(rendu: string, debut: string, fin: string): string {
  const depart = rendu.indexOf(debut)
  expect(depart, `« ${debut} » introuvable`).toBeGreaterThanOrEqual(0)
  return rendu.slice(depart, rendu.indexOf(fin, depart) + fin.length)
}

describe('mise en page : document', () => {
  it('pose le doctype, la langue française et la fenêtre mobile', () => {
    const rendu = page()
    expect(rendu.startsWith('<!doctype html>\n<html lang="fr">')).toBe(true)
    expect(rendu).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">')
    expect(rendu).toContain('<meta charset="utf-8">')
  })

  it('compose le titre, la description, le lien canonique et Open Graph', () => {
    const rendu = page()
    expect(rendu).toContain('<title>Pièces et réparations | BF Auto</title>')
    expect(rendu).toContain('<meta name="description" content="Toutes les pièces du garage.">')
    expect(rendu).toContain(
      '<link rel="canonical" href="https://garage.exemple/pieces-et-reparations">',
    )
    expect(rendu).toContain(
      '<meta property="og:url" content="https://garage.exemple/pieces-et-reparations">',
    )
    expect(rendu).toContain('<meta property="og:title" content="Pièces et réparations | BF Auto">')
    expect(rendu).toContain('<meta property="og:locale" content="fr_FR">')
    expect(rendu).toContain('<meta property="og:site_name" content="BF Auto">')
  })

  it('donne une image de partage absolue, dimensionnée, et les icônes du logo final', () => {
    const rendu = page()
    expect(rendu).toContain(
      '<meta property="og:image" content="https://garage.exemple/og-image.png">',
    )
    expect(rendu).toContain('<meta property="og:image:width" content="1200">')
    expect(rendu).toContain('<meta property="og:image:height" content="630">')
    expect(rendu).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml">')
    expect(rendu).toContain(
      '<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">',
    )
    expect(rendu).toContain(
      '<link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png">',
    )
    expect(rendu).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png">')
    expect(rendu).toContain('<meta name="theme-color" content="#233f35">')
  })

  it('n’écrit aucune couleur de thème quand les jetons n’en donnent pas', () => {
    const rendu = rendrePage(VUE, CADRE_ESSAI, { ...PARAMETRES, couleurTheme: null }).toString()
    expect(rendu).not.toContain('theme-color')
  })

  it('n’exclut des moteurs que les pages marquées non indexables', () => {
    expect(page()).not.toContain('noindex')
    expect(page({ ...VUE, indexable: false })).toContain('<meta name="robots" content="noindex">')
  })

  it('charge une feuille de style unique, versionnée, et précharge exactement deux polices', () => {
    const rendu = page()
    expect(rendu.match(/rel="stylesheet"/g)).toHaveLength(1)
    expect(rendu).toContain('<link rel="stylesheet" href="/css/bf-auto.css?v=empreinte">')
    const prechargees = [...rendu.matchAll(/<link rel="preload" href="([^"]+)" as="font"/g)]
    expect(prechargees.map(([, police]) => police)).toEqual([
      '/fonts/hanken-grotesk-400.woff2',
      '/fonts/hanken-grotesk-600.woff2',
    ])
    expect(rendu).toContain('type="font/woff2" crossorigin>')
  })

  it('charge le script commun puis les scripts propres à la page, différés et versionnés', () => {
    const rendu = page({ ...VUE, scripts: ['/js/catalogue/filtres.js'] })
    expect(rendu).toContain('<script src="/js/commun.js?v=empreinte" defer></script>')
    expect(rendu).toContain('<script src="/js/catalogue/filtres.js?v=empreinte" defer></script>')
    expect(rendu.indexOf('/js/commun.js')).toBeLessThan(rendu.indexOf('/js/catalogue/filtres.js'))
  })

  it('respecte la politique de contenu : aucun script, style ni gestionnaire en ligne', () => {
    const rendu = page({ ...VUE, scripts: ['/js/catalogue/filtres.js'] })
    expect(rendu).not.toMatch(/<script(?![^>]*\ssrc=)[^>]*>/)
    expect(rendu).not.toMatch(/<style[\s>]/)
    expect(rendu).not.toMatch(/\sstyle=/)
    expect(rendu).not.toMatch(/\son[a-z]+=/)
  })

  it('ne charge aucune ressource d’un autre domaine', () => {
    const rendu = page()
    const ressources = [...rendu.matchAll(/<(?:link|script)[^>]+(?:href|src)="([^"]+)"/g)]
      .map(([, adresse]) => adresse ?? '')
      .filter((adresse) => !adresse.startsWith('https://garage.exemple/'))
    expect(ressources.every((adresse) => adresse.startsWith('/'))).toBe(true)
  })

  it('titre de l’onglet : le nom du garage n’est jamais répété', () => {
    expect(titreDocument('Contact', 'BF Auto')).toBe('Contact | BF Auto')
    expect(titreDocument('BF Auto, garage à Choisy-le-Roi', 'BF Auto')).toBe(
      'BF Auto, garage à Choisy-le-Roi',
    )
  })
})

describe('mise en page : logo', () => {
  it('déclare les tracés une seule fois, puis les réutilise sans aucun texte SVG', () => {
    const rendu = page()
    expect(rendu.match(/<path id="logo-lettres"/g)).toHaveLength(1)
    expect(rendu).toContain('<svg class="sprite" width="0" height="0" aria-hidden="true"')
    // En-tête et pied, chacun avec et sans chat : un seul jeu de tracés.
    expect(rendu.match(/<use href="#logo-lettres"/g)).toHaveLength(4)
    expect(rendu.match(/<use href="#logo-ecrou"/g)).toHaveLength(4)
    expect(rendu.match(/<use href="#logo-chat"/g)).toHaveLength(2)
    expect(rendu).not.toMatch(/<text[\s>]/)
  })

  it('fait du logo un lien vers l’accueil, avec un nom accessible', () => {
    const entete = extraire(page(), '<a class="entete__logo"', '</a>')
    expect(entete).toContain('href="/"')
    expect(entete).toContain('<svg class="logo logo--avec-chat"')
    expect(entete).toContain('<svg class="logo logo--sans-chat"')
    expect(entete).toContain('<span class="visuellement-masque">BF Auto, retour à l’accueil</span>')
    expect(entete.match(/aria-hidden="true"/g)).toHaveLength(2)
  })

  it('pose dans le pied de page le même logo que l’en-tête, avec et sans chat selon la largeur', () => {
    const marque = extraire(page(), '<div class="pied__marque">', '</div>')
    expect(marque).toContain('<svg class="logo logo--avec-chat"')
    expect(marque).toContain('<svg class="logo logo--sans-chat"')
  })
})

describe('mise en page : en-tête', () => {
  it('commence le corps par le lien d’évitement vers le contenu principal', () => {
    const rendu = page()
    const corps = rendu.slice(rendu.indexOf('<body>') + '<body>'.length).trimStart()
    expect(corps.startsWith('<a class="evitement" href="#contenu">Aller au contenu</a>')).toBe(true)
    expect(rendu).toContain('<main id="contenu" class="principal" tabindex="-1">')
  })

  it('montre le numéro en chiffres dans le bouton d’appel, précédé du verbe', () => {
    expect(page()).toContain(
      '<a class="bouton-appel" href="tel:+33605922838"><span class="bouton-appel__verbe">Appeler</span> <span class="bouton-appel__numero">06 05 92 28 38</span></a>',
    )
  })

  it('liste cinq entrées dans la navigation et dans le menu, et marque la rubrique courante', () => {
    const rendu = page()
    for (const classe of ['navigation__lien', 'menu__lien']) {
      const entrees = [
        ...rendu.matchAll(new RegExp(`<a class="${classe}" href="([^"]*)"[^>]*>([^<]*)</a>`, 'g')),
      ]
      expect(entrees.map(([, chemin, libelle]) => [chemin, libelle])).toEqual([
        ['/pieces-et-reparations', 'Pièces détachées'],
        ['/pre-diagnostic', 'Pré-diagnostic'],
        ['/demande?type=rendez-vous', 'Rendez-vous'],
        ['/tarifs', 'Tarifs'],
        ['/acces-et-horaires', 'Accès et horaires'],
      ])
      expect(rendu).toContain(
        `<a class="${classe}" href="/pieces-et-reparations" aria-current="page">`,
      )
    }
    expect(rendu.match(/aria-current="page"/g)).toHaveLength(2)
  })

  it('ne lie pas le pré-diagnostic tant qu’il n’est pas publié (Kano D3)', () => {
    const rendu = page(VUE, { ...CADRE_ESSAI, preDiagnosticPublie: false })
    expect(rendu).not.toContain('/pre-diagnostic')
    expect(rendu.match(/class="navigation__lien"/g)).toHaveLength(4)
    expect(rendu.match(/class="menu__lien"/g)).toHaveLength(4)
    expect(page(VUE, { ...CADRE_ESSAI, preDiagnosticPublie: true })).toContain(
      '<a class="navigation__lien" href="/pre-diagnostic">Pré-diagnostic</a>',
    )
  })

  it('n’indique aucune rubrique courante sur l’accueil ni sur une page hors navigation', () => {
    expect(page({ ...VUE, rubrique: 'accueil' })).not.toContain('aria-current')
    const { rubrique: _ignoree, ...sansRubrique } = VUE
    expect(page(sansRubrique)).not.toContain('aria-current')
  })

  it('ouvre le menu téléphone sans script : un <details> dont le résumé dit Menu ou Fermer', () => {
    const menu = extraire(page(), '<details class="menu">', '</details>')
    expect(menu).toContain(
      '<summary class="menu__bouton"><span class="menu__ouvrir">Menu</span><span class="menu__fermer">Fermer<span class="visuellement-masque"> le menu</span></span></summary>',
    )
    expect(menu).toContain('<nav class="menu__panneau" aria-label="Navigation principale">')
  })

  it('porte la ligne de statut : pastille, adresse courte et itinéraire', () => {
    const statut = extraire(page(VUE, CADRE_OUVERT), '<div class="entete__statut">', '</a>')
    expect(statut).toContain(
      '<span class="statut statut--pastille statut--ouvert">Ouvert, ferme à 19 h</span><span class="visuellement-masque">.</span>',
    )
    expect(statut).toContain(
      '<span class="entete__adresse">7 rue Demanieux<span class="entete__ville">, 94600 Choisy-le-Roi</span></span>',
    )
    expect(statut).toContain(
      'href="https://www.google.com/maps/dir/?api=1&amp;destination=7%20rue%20Demanieux%2C%2094600%20Choisy-le-Roi">Itinéraire</a>',
    )
  })

  it('n’affiche plus de bandeau d’accroche sur chaque page : l’accroche vit sur l’accueil', () => {
    expect(page()).not.toContain('Accroche d’essai')
  })
})

describe('mise en page : pied de page', () => {
  it('donne l’adresse, l’itinéraire et le téléphone cliquable', () => {
    const pied = extraire(page(), '<footer class="pied">', '</footer>')
    expect(pied).toContain(
      '<address class="pied__adresse">7 rue Demanieux<br>94600 Choisy-le-Roi</address>',
    )
    expect(pied).toContain('<a class="pied__telephone" href="tel:+33605922838">06 05 92 28 38</a>')
    expect(pied).toContain('>Itinéraire</a>')
    expect(pied).toContain('<a href="/acces-et-horaires">Accès et horaires détaillés</a>')
  })

  it('invite à appeler tant que les horaires ne sont pas confirmés', () => {
    expect(page()).toContain(
      '<p class="statut statut--a-confirmer">Horaires à confirmer, <a href="tel:+33605922838">appelez-nous</a></p>',
    )
  })

  it('affiche le statut calculé quand les horaires sont confirmés', () => {
    expect(page(VUE, CADRE_OUVERT)).toContain(
      '<p class="statut statut--ouvert">Ouvert, ferme à 19 h</p>',
    )
  })

  it('montre le courriel seulement s’il est connu', () => {
    expect(page()).not.toContain('mailto:')
    const cadre: CadrePage = {
      ...CADRE_ESSAI,
      identite: { ...CADRE_ESSAI.identite, courriel: 'garage@exemple.fr' },
    }
    // Classe propre : l'adresse se coupe plutôt que d'élargir la page à 320 px.
    expect(page(VUE, cadre)).toContain(
      '<a class="pied__courriel" href="mailto:garage@exemple.fr">garage@exemple.fr</a>',
    )
  })

  it('pointe vers vos droits, les mentions légales et la confidentialité', () => {
    const rendu = page()
    expect(rendu).toContain('<a href="/vos-droits">Vos droits chez nous</a>')
    expect(rendu).toContain('<a href="/mentions-legales">Mentions légales</a>')
    expect(rendu).toContain('<a href="/confidentialite">Confidentialité</a>')
    expect(rendu).toContain('Ce site ne dépose aucun cookie de suivi.')
  })

  it('échappe les données d’identité, même venues du fichier de configuration', () => {
    const cadre: CadrePage = {
      ...CADRE_ESSAI,
      identite: {
        ...CADRE_ESSAI.identite,
        nom: 'BF <Auto>',
        adresse: { ...CADRE_ESSAI.identite.adresse, voie: '7 rue "Demanieux"' },
      },
    }
    const rendu = page(VUE, cadre)
    expect(rendu).toContain('BF &lt;Auto&gt;')
    expect(rendu).toContain('7 rue &quot;Demanieux&quot;')
    expect(rendu).not.toContain('BF <Auto>')
  })
})

describe('mise en page : barre fixe basse', () => {
  it('suit chaque page publique, après le pied de page', () => {
    const rendu = page()
    expect(rendu).toContain(
      '<nav class="barre-fixe barre-fixe--a-confirmer" aria-label="Contact rapide">',
    )
    expect(rendu.indexOf('class="barre-fixe')).toBeGreaterThan(rendu.indexOf('</footer>'))
  })

  it('n’apparaît pas dans l’espace garagiste', () => {
    expect(page({ ...VUE, rubrique: 'garagiste' })).not.toContain('barre-fixe')
  })

  it('disparaît quand la page la masque : formulaire, confirmation d’envoi', () => {
    const rendu = page({ ...VUE, barreFixe: 'masquee' })
    expect(rendu).not.toContain('barre-fixe')
    // L'en-tête garde son bouton d'appel : seul le raccourci du bas se retire.
    expect(rendu).toContain('<a class="bouton-appel" href="tel:+33605922838">')
  })

  it('mène au lien de rappel de la page, qui emporte son pré-diagnostic', () => {
    const lienRappel = '/demande?type=rappel&prediagnostic=K7PQ2'
    const ferme: CadrePage = {
      ...CADRE_ESSAI,
      statut: { etat: 'ferme', libelle: 'Fermé, ouvre demain à 8 h 30' },
    }
    const barre = extraire(
      page({ ...VUE, barreFixe: { lienRappel } }, ferme),
      '<nav class="barre-fixe',
      '</nav>',
    )
    expect(barre).toContain(
      '<a class="barre-fixe__action barre-fixe__action--principale" href="/demande?type=rappel&amp;prediagnostic=K7PQ2">',
    )
    expect(barre).not.toContain('href="/demande?type=rappel"')
    const ouvert = extraire(
      page({ ...VUE, barreFixe: { lienRappel } }, CADRE_OUVERT),
      '<nav class="barre-fixe',
      '</nav>',
    )
    expect(ouvert).toContain('href="/demande?type=rappel&amp;prediagnostic=K7PQ2"')
    expect(ouvert).not.toContain('google.com/maps')
  })
})

describe('mise en page : espace garagiste, sans appel poussé (D5)', () => {
  it('garde le logo, le menu et le statut, mais retire le bouton d’appel orange de l’en-tête', () => {
    const entete = extraire(page({ ...VUE, rubrique: 'garagiste' }), '<header', '</header>')
    expect(entete).not.toContain('bouton-appel')
    expect(entete).not.toContain('tel:')
    expect(entete).toContain('<a class="entete__logo" href="/">')
    expect(entete).toContain('<details class="menu">')
    expect(entete).toContain('<div class="entete__statut">')
  })

  it('toute page publique, rubrique ou non, garde le bouton d’appel et la barre fixe', () => {
    const { rubrique: _ignoree, ...sansRubrique } = VUE
    for (const vue of [VUE, sansRubrique, { ...VUE, rubrique: 'accueil' as const }]) {
      const rendu = page(vue)
      expect(rendu.match(/<a class="bouton-appel" href="tel:\+33605922838">/g)).toHaveLength(1)
      expect(rendu).toContain('class="barre-fixe')
    }
  })
})

describe('bandeau de mode', () => {
  it("n'affiche rien en production, et dit la vérité en démonstration comme en relecture", () => {
    expect(rendreBandeauMode('production')).toBeNull()
    expect(rendreBandeauMode(undefined)).toBeNull()
    expect(String(rendreBandeauMode('demonstration'))).toContain('Version de démonstration')
    expect(String(rendreBandeauMode('relecture'))).toContain('Mode relecture')
  })

  it('se place en tête de l’en-tête, dans son repère, avant le logo', () => {
    const rendu = rendrePage(VUE, CADRE_ESSAI, { ...PARAMETRES, mode: 'demonstration' }).toString()
    const entete = extraire(rendu, '<header', '</header>')
    expect(entete).toContain(
      '<header class="entete"><p class="bandeau-mode" role="note">Version de démonstration',
    )
    expect(entete.indexOf('class="bandeau-mode"')).toBeLessThan(entete.indexOf('entete__logo'))
    expect(rendu.match(/class="bandeau-mode"/g)).toHaveLength(1)
  })

  it('rien en production, pas même un emplacement vide dans l’en-tête', () => {
    expect(page()).toContain('<header class="entete">\n  <div class="conteneur entete__rangee">')
  })
})
