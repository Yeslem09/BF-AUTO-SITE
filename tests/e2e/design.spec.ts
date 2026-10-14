/**
 * Parcours navigateur du système de design : premier écran du téléphone,
 * barre fixe masquée pendant la saisie, menu au clavier, aucun défilement
 * horizontal à 320 px, boutons de choix bordés et leur état courant, légende
 * d'un groupe de champs, cibles du fil d'Ariane, figure signature, espace
 * garagiste sans appel poussé.
 *
 * L'accueil complet est rendu par un serveur d'essai (design-factice.ts) qui
 * monte la vraie couche web avec des blocs factices ; les pages réelles du
 * site sont aussi vérifiées à 320 px.
 */
import { expect, test, type Page } from '@playwright/test'
import {
  ACTIVITES_FACTICES,
  demarrerServeurFactice,
  LIEN_RAPPEL_FACTICE,
  STATUT_FERMETURE_EXCEPTIONNELLE,
  type ServeurFactice,
} from './design-factice.js'

const NUMERO = '06 05 92 28 38'
const LARGEUR_MINIMALE = 320
const HAUTEUR_PETIT_TELEPHONE = 640
/** Greffe du jury : le numéro doit se lire au bureau, pas dans un bouton de 14 px. */
const CORPS_NUMERO_BUREAU_MIN = 18
const CIBLE_TACTILE_MIN = 44
/** Écart de la grille `.champ` (--espace-2, 8 px), arrondis de mise en page compris. */
const ECART_CHAMP_MIN = 7.5

const LARGEURS_TELEPHONE = [320, 360, 375, 390, 414, 480, 600, 767] as const
const LARGEURS_BUREAU = [1024, 1100, 1200, 1280, 1440] as const
/** Public âgé : texte courant à 18 px au bureau, rien d'utile sous 16 px, capitales à 14 px. */
const TEXTE_BUREAU = 18
const TEXTE_MINIMUM = 16
const CAPITALES_MINIMUM = 14
/** WCAG 2.2 : 4,5:1, ou 3:1 pour un grand texte (24 px et plus). */
const CONTRASTE_TEXTE = 4.5
const CONTRASTE_GRAND_TEXTE = 3
const GRAND_TEXTE = 24
/**
 * Premier texte d'une pastille : sur la ligne du point. Un point resté seul sur
 * sa ligne repousse le texte de 8 px au moins (sa propre hauteur).
 */
const DECALAGE_PREMIERE_LIGNE_MAX = 5
/** Un vide sous une colonne de l'accueil au bureau : un tiers d'écran au plus. */
const VIDE_COLONNE_MAX = 300
/**
 * Bande d'ouverture au bureau : le pied de la colonne des pièces et celui de
 * la plaque du pré-diagnostic, à 40 px l'un de l'autre au plus (retour
 * d'Anthony, correction 2 : « la partie basse est un peu vide »).
 */
const ECART_BANDE_MAX = 40
const LARGEURS_BANDE = [1280, 1440, 1920] as const

let factice: ServeurFactice
/** Même site, statut long d'une fermeture exceptionnelle. */
let fermeture: ServeurFactice

async function arreter(serveur: ServeurFactice): Promise<void> {
  // Les connexions gardées par le navigateur ne doivent pas retenir l'arrêt.
  const arret = serveur.app.close()
  serveur.app.server.closeAllConnections()
  await arret
}

test.beforeAll(async () => {
  factice = await demarrerServeurFactice('ouvert')
  fermeture = await demarrerServeurFactice(STATUT_FERMETURE_EXCEPTIONNELLE)
})

test.afterAll(async () => {
  await Promise.all([arreter(factice), arreter(fermeture)])
})

const adresse = (chemin: string): string => new URL(chemin, factice.origine).href

async function estDansLePremierEcran(page: Page, selecteur: string): Promise<boolean> {
  return page
    .locator(selecteur)
    .first()
    .evaluate((element) => {
      const boite = element.getBoundingClientRect()
      return boite.height > 0 && boite.top >= 0 && boite.bottom <= window.innerHeight
    })
}

test.describe('design : premier écran du téléphone', () => {
  test.beforeEach(({}, infos) => {
    test.skip(infos.project.name !== 'mobile', 'Parcours propre au téléphone (iPhone 13).')
  })

  test('montre le numéro en chiffres, le statut du jour et le début du pré-diagnostic', async ({
    page,
  }) => {
    await page.goto(adresse('/'))
    const appel = page.locator('header .bouton-appel')
    await expect(appel).toBeVisible()
    await expect(appel.locator('.bouton-appel__numero')).toHaveText(NUMERO)
    expect(await estDansLePremierEcran(page, 'header .bouton-appel__numero')).toBe(true)
    expect(await estDansLePremierEcran(page, '.entete__statut .statut')).toBe(true)
    await expect(page.locator('.entete__statut .statut')).toHaveText('Ouvert, ferme à 19 h 00')
    expect(await estDansLePremierEcran(page, '.plaque h2')).toBe(true)
    expect(await estDansLePremierEcran(page, '.plaque .bouton-choix')).toBe(true)
    // Le numéro se lit aussi dans la barre basse, avec l'action utile du moment.
    const barre = page.getByRole('navigation', { name: 'Contact rapide' })
    await expect(barre).toBeVisible()
    // Une virgule masquée sépare le verbe du numéro pour les lecteurs d'écran.
    await expect(barre.getByRole('link', { name: /^Appeler ?, 06 05 92 28 38$/ })).toHaveAttribute(
      'href',
      'tel:+33605922838',
    )
    // Les activités du garage se lisent sous l'accroche, sans masquer la question 1.
    await expect(page.locator('.accroche__activites')).toHaveText(ACTIVITES_FACTICES)
    expect(await estDansLePremierEcran(page, '.accroche__activites')).toBe(true)
  })

  test('masque la barre basse pendant la saisie, pas pendant un choix', async ({ page }) => {
    await page.goto(adresse('/champ'))
    const barre = page.locator('.barre-fixe')
    await expect(barre).toBeVisible()
    const telephone = page.getByRole('textbox', { name: 'Téléphone' })
    await page.getByRole('textbox', { name: 'Prénom' }).focus()
    await expect(barre).toBeHidden()
    await page.getByRole('radio', { name: 'Le matin' }).focus()
    await expect(barre).toBeVisible()
    await telephone.focus()
    await expect(barre).toBeHidden()
    await telephone.blur()
    await expect(barre).toBeVisible()
  })

  test('ouvre et ferme le menu au clavier, sans script', async ({ page }) => {
    await page.goto(adresse('/'))
    const menu = page.locator('details.menu')
    const bouton = page.locator('.menu__bouton')
    await bouton.focus()
    await expect(bouton).toHaveAccessibleName('Menu')
    await page.keyboard.press('Enter')
    await expect(menu).toHaveAttribute('open', '')
    // « Fermer » à l'écran, « Fermer le menu » au lecteur d'écran (J5, passe 2 du jury).
    await expect(bouton).toHaveAccessibleName('Fermer le menu')
    const navigation = page.getByRole('navigation', { name: 'Navigation principale' })
    await expect(navigation.getByRole('link')).toHaveCount(5)
    await page.keyboard.press('Tab')
    await expect(navigation.getByRole('link', { name: 'Pièces détachées' })).toBeFocused()
    await bouton.focus()
    await page.keyboard.press('Space')
    await expect(menu).not.toHaveAttribute('open')
  })

  test('Échap ferme le menu ouvert et rend le focus au bouton', async ({ page }) => {
    await page.goto(adresse('/'))
    const menu = page.locator('details.menu')
    const bouton = page.locator('.menu__bouton')
    await bouton.click()
    await expect(menu).toHaveAttribute('open', '')
    await page.keyboard.press('Tab')
    await expect(page.locator('.menu__lien').first()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu).not.toHaveAttribute('open')
    await expect(bouton).toBeFocused()
    await expect(bouton).toHaveAccessibleName('Menu')
  })

  test('pas de reflet bleu au toucher sur Chrome Android', async ({ page }) => {
    await page.goto(adresse('/'))
    const reflets = await page
      .locator('a, button, summary')
      .evaluateAll((elements) => [
        ...new Set(
          elements.map((element) =>
            getComputedStyle(element).getPropertyValue('-webkit-tap-highlight-color'),
          ),
        ),
      ])
    expect(reflets).toEqual(['rgba(0, 0, 0, 0)'])
  })
})

test.describe('design : appui aux couleurs de la charte', () => {
  // Le bouton de la souris tenu enfoncé déclenche :active ; l'émulation tactile ne le tient pas.
  test.beforeEach(({}, infos) => {
    test.skip(infos.project.name !== 'bureau', 'Appui mesuré à la souris.')
  })

  test('le bouton principal de la barre change de couleur tant qu’on appuie', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(adresse('/'))
    const principal = page.locator('.barre-fixe__action--principale')
    const fond = () => principal.evaluate((element) => getComputedStyle(element).backgroundColor)
    const repos = await fond()
    const boite = await principal.boundingBox()
    if (boite === null) throw new Error('barre fixe absente')
    await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2)
    await page.mouse.down()
    await expect.poll(fond).not.toBe(repos)
    // Relâché hors du bouton : aucun appel n'est lancé.
    await page.mouse.move(1, 1)
    await page.mouse.up()
    await expect.poll(fond).toBe(repos)
  })
})

/** Rapport de contraste WCAG entre deux couleurs calculées `rgb(r, g, b)`. */
function contraste(premiere: string, seconde: string): number {
  const luminance = (couleur: string): number => {
    const [r = 0, v = 0, b = 0] = (couleur.match(/[\d.]+/g) ?? []).map(Number).map((canal) => {
      const c = canal / 255
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * v + 0.0722 * b
  }
  const [claire = 0, sombre = 0] = [luminance(premiere), luminance(seconde)].sort((a, b) => b - a)
  return (claire + 0.05) / (sombre + 0.05)
}

/** Vrai si chaque occurrence du texte (espaces ordinaires ou insécables) tient sur une ligne. */
async function occurrencesSurUneLigne(
  page: Page,
  selecteur: string,
  texte: string,
): Promise<{ trouvees: number; coupees: string[]; insecables: boolean }> {
  return page.locator(selecteur).evaluateAll((elements, cherche) => {
    const coupees: string[] = []
    let trouvees = 0
    let insecables = true
    for (const element of elements) {
      const marcheur = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      for (let noeud = marcheur.nextNode(); noeud !== null; noeud = marcheur.nextNode()) {
        const contenu = noeud.textContent ?? ''
        const debut = contenu.replace(/\u00a0/g, ' ').indexOf(cherche)
        if (debut < 0) continue
        trouvees += 1
        if (contenu.slice(debut, debut + cherche.length).includes(' ')) insecables = false
        const plage = document.createRange()
        plage.setStart(noeud, debut)
        plage.setEnd(noeud, debut + cherche.length)
        const hauts = [...plage.getClientRects()]
          .filter((boite) => boite.width > 0)
          .map((boite) => Math.round(boite.top))
        if (new Set(hauts).size > 1) coupees.push(`${element.className} : ${contenu}`)
      }
    }
    return { trouvees, coupees, insecables }
  }, texte)
}

/** Textes visibles sous le seuil : 16 px, ou 14 px pour des capitales espacées. */
async function textesTropPetits(page: Page): Promise<string[]> {
  return page.evaluate(
    ({ minimum, capitales }) => {
      const fautes: string[] = []
      for (const element of document.body.querySelectorAll<HTMLElement>('*')) {
        if (element.closest('svg') !== null) continue
        const texteDirect = [...element.childNodes].some(
          (noeud) => noeud.nodeType === Node.TEXT_NODE && (noeud.textContent ?? '').trim() !== '',
        )
        if (!texteDirect) continue
        const boite = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        if (boite.width <= 1 || boite.height <= 1 || style.visibility === 'hidden') continue
        const taille = Number.parseFloat(style.fontSize)
        const seuil = style.textTransform === 'uppercase' ? capitales : minimum
        if (taille < seuil - 0.01) {
          const texte = (element.textContent ?? '').trim().slice(0, 40)
          fautes.push(
            `${element.tagName.toLowerCase()}.${element.className} « ${texte} » ${taille} px`,
          )
        }
      }
      return fautes
    },
    { minimum: TEXTE_MINIMUM, capitales: CAPITALES_MINIMUM },
  )
}

test.describe('design : barre fixe du téléphone', () => {
  test.beforeEach(({}, infos) => {
    test.skip(infos.project.name !== 'mobile', 'Barre propre au téléphone.')
  })

  test('une ligne par libellé, même hauteur quel que soit le statut, jamais hors de l’écran', async ({
    page,
  }) => {
    const hauteurs = new Set<number>()
    for (const serveur of [factice, fermeture]) {
      for (const largeur of LARGEURS_TELEPHONE) {
        await page.setViewportSize({ width: largeur, height: HAUTEUR_PETIT_TELEPHONE })
        await page.goto(new URL('/', serveur.origine).href)
        const mesure = await page.locator('.barre-fixe').evaluate((barre) => {
          const boite = barre.getBoundingClientRect()
          const lignes = [
            ...barre.querySelectorAll<HTMLElement>('.barre-fixe__libelle, .barre-fixe__precision'),
          ].map((ligne) => ({
            texte: ligne.textContent ?? '',
            hauteur: ligne.getBoundingClientRect().height,
            interligne: Number.parseFloat(getComputedStyle(ligne).lineHeight),
            coupee: ligne.scrollWidth > ligne.clientWidth + 1,
          }))
          const liens = [...barre.querySelectorAll('a')].map((lien) => lien.getBoundingClientRect())
          return {
            haut: boite.top,
            bas: boite.bottom,
            hauteur: boite.height,
            lignes,
            liens: liens.map((lien) => ({
              haut: lien.top,
              bas: lien.bottom,
              gauche: lien.left,
              droite: lien.right,
            })),
            fenetre: { largeur: innerWidth, hauteur: innerHeight },
          }
        })
        const cas = `${serveur === fermeture ? 'statut long' : 'statut court'}, ${largeur} px`
        expect(mesure.bas, cas).toBeLessThanOrEqual(mesure.fenetre.hauteur + 0.5)
        for (const lien of mesure.liens) {
          expect(lien.haut, cas).toBeGreaterThanOrEqual(mesure.haut - 0.5)
          expect(lien.bas, cas).toBeLessThanOrEqual(mesure.bas + 0.5)
          expect(lien.gauche, cas).toBeGreaterThanOrEqual(0)
          expect(lien.droite, cas).toBeLessThanOrEqual(mesure.fenetre.largeur + 0.5)
        }
        for (const ligne of mesure.lignes) {
          expect(ligne.hauteur, `${cas} : ${ligne.texte}`).toBeLessThan(1.5 * ligne.interligne)
          expect(ligne.coupee, `${cas} : ${ligne.texte} coupé`).toBe(false)
        }
        hauteurs.add(Math.round(mesure.hauteur))
      }
    }
    expect([...hauteurs]).toHaveLength(1)
  })

  test('fermeture exceptionnelle : le rappel dit quand, en une ligne courte', async ({ page }) => {
    await page.setViewportSize({ width: LARGEUR_MINIMALE, height: HAUTEUR_PETIT_TELEPHONE })
    await page.goto(new URL('/', fermeture.origine).href)
    const rappel = page.getByRole('navigation', { name: 'Contact rapide' }).getByRole('link', {
      name: /^Être rappelé ?, demain 8 h 30$/,
    })
    await expect(rappel).toHaveAttribute('href', '/demande?type=rappel')
    await expect(rappel.locator('.barre-fixe__precision')).toHaveText('demain 8 h 30')
  })

  test('sert la page : masquée sur un formulaire, rappel de la page ailleurs', async ({ page }) => {
    await page.goto(adresse('/barre-masquee'))
    await expect(page.locator('.barre-fixe')).toHaveCount(0)
    // Sans barre, la page ne réserve plus sa place en bas.
    expect(await page.evaluate(() => getComputedStyle(document.body).paddingBottom)).toBe('0px')
    await page.goto(adresse('/barre-rappel'))
    const barre = page.getByRole('navigation', { name: 'Contact rapide' })
    await expect(barre.getByRole('link', { name: /^Être rappelé/ })).toHaveAttribute(
      'href',
      LIEN_RAPPEL_FACTICE,
    )
    await expect(barre.getByRole('link', { name: /^Itinéraire/ })).toHaveCount(0)
  })
})

test.describe('design : statut, heures et numéros', () => {
  test('la pastille garde son point sur la ligne du texte, même quand le statut s’allonge', async ({
    page,
  }) => {
    for (const largeur of [LARGEUR_MINIMALE, 390, 1440]) {
      await page.setViewportSize({ width: largeur, height: 900 })
      await page.goto(new URL('/composants', fermeture.origine).href)
      for (const selecteur of ['.entete__statut .statut', '.pied .statut']) {
        const ecart = await page.locator(selecteur).evaluate((statut) => {
          const style = getComputedStyle(statut)
          const debutContenu =
            statut.getBoundingClientRect().top +
            Number.parseFloat(style.borderTopWidth) +
            Number.parseFloat(style.paddingTop)
          const plage = document.createRange()
          plage.selectNodeContents(statut)
          const premiereLigne = [...plage.getClientRects()].find((boite) => boite.width > 0)
          return (premiereLigne?.top ?? Infinity) - debutContenu
        })
        expect(ecart, `${selecteur} à ${largeur} px`).toBeLessThan(DECALAGE_PREMIERE_LIGNE_MAX)
      }
    }
  })

  test('le statut s’annonce à part de l’adresse qui le suit', async ({ page }) => {
    await page.goto(new URL('/composants', fermeture.origine).href)
    // Un point masqué clôt le statut : le lecteur marque la pause avant l'adresse.
    const ligne = await page.locator('.entete__statut-ligne').ariaSnapshot()
    expect(ligne).toMatch(/ouvre demain à 8 h 30 ?\. 7 rue Demanieux/)
  })

  test('heures et numéro insécables : pastille, barre fixe, bouton d’appel et pied', async ({
    page,
  }, infos) => {
    const largeur = infos.project.name === 'mobile' ? LARGEUR_MINIMALE : 1024
    await page.setViewportSize({ width: largeur, height: HAUTEUR_PETIT_TELEPHONE })
    await page.goto(new URL('/composants', fermeture.origine).href)
    // L'heure : liée par la typographie commune (espaces insécables).
    const heure = await occurrencesSurUneLigne(page, '.statut', '8 h 30')
    expect(heure.trouvees).toBeGreaterThanOrEqual(2)
    expect(heure.insecables).toBe(true)
    expect(heure.coupees).toEqual([])
    // Le numéro : sur une ligne ici, et à toute largeur, son conteneur interdisant le retour.
    const numero = await occurrencesSurUneLigne(
      page,
      '.bouton-appel, .barre-fixe__action, .pied__telephone',
      NUMERO,
    )
    expect(numero.trouvees).toBe(3)
    expect(numero.coupees).toEqual([])
    const blancs = await page
      .locator(
        '.bouton-appel__numero, .barre-fixe__action--appel .barre-fixe__precision, .pied__telephone',
      )
      .evaluateAll((elements) => [
        ...new Set(elements.map((element) => getComputedStyle(element).whiteSpace)),
      ])
    expect(blancs).toEqual(['nowrap'])
  })
})

test.describe('design : lisibilité pour un public âgé', () => {
  test('texte courant à 18 px au bureau, 16 px sur téléphone', async ({ page }, infos) => {
    await page.goto(adresse('/'))
    const corps = await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.body).fontSize),
    )
    expect(corps).toBe(infos.project.name === 'mobile' ? TEXTE_MINIMUM : TEXTE_BUREAU)
  })

  for (const chemin of ['/', '/composants', '/champ']) {
    test(`rien d’utile sous 16 px, capitales à 14 px : page d’essai ${chemin}`, async ({
      page,
    }) => {
      await page.goto(new URL(chemin, fermeture.origine).href)
      expect(await textesTropPetits(page)).toEqual([])
    })
  }

  for (const chemin of ['/', '/acces-et-horaires', '/tarifs', '/pieces-et-reparations/freinage']) {
    test(`rien d’utile sous 16 px, capitales à 14 px : page réelle ${chemin}`, async ({ page }) => {
      await page.goto(chemin)
      expect(await textesTropPetits(page)).toEqual([])
    })
  }

  test('« vous décidez. » se lit à 4,5:1 sur le graphite, ou en grand texte', async ({ page }) => {
    await page.goto(adresse('/'))
    const mesure = await page.locator('.accroche__chute').evaluate((chute) => {
      const ouverture = chute.closest('.ouverture')
      return {
        couleur: getComputedStyle(chute).color,
        fond: ouverture === null ? '' : getComputedStyle(ouverture).backgroundColor,
        taille: Number.parseFloat(getComputedStyle(chute).fontSize),
      }
    })
    const minimum = mesure.taille >= GRAND_TEXTE ? CONTRASTE_GRAND_TEXTE : CONTRASTE_TEXTE
    expect(contraste(mesure.couleur, mesure.fond)).toBeGreaterThanOrEqual(minimum)
  })
})

test.describe('design : sans défilement horizontal à 320 px', () => {
  for (const chemin of ['/', '/composants', '/champ']) {
    test(`page d’essai ${chemin}`, async ({ page }) => {
      await page.setViewportSize({ width: LARGEUR_MINIMALE, height: HAUTEUR_PETIT_TELEPHONE })
      await page.goto(adresse(chemin))
      const largeur = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(largeur).toBeLessThanOrEqual(LARGEUR_MINIMALE)
    })
  }

  for (const chemin of ['/', '/acces-et-horaires', '/mentions-legales', '/page-qui-n-existe-pas']) {
    test(`page réelle ${chemin}`, async ({ page }) => {
      await page.setViewportSize({ width: LARGEUR_MINIMALE, height: HAUTEUR_PETIT_TELEPHONE })
      await page.goto(chemin)
      const largeur = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(largeur).toBeLessThanOrEqual(LARGEUR_MINIMALE)
      // L'en-tête tient sur une ligne : logo, numéro, menu.
      await expect(page.locator('header .bouton-appel__numero')).toBeVisible()
    })
  }
})

test.describe('design : en-tête du téléphone', () => {
  // Logo sans chat, numéro et menu sur une ligne, dans les gouttières (charte du logo).
  for (const largeur of [320, 352, 360, 375, 384, 390, 414, 480, 600, 767]) {
    test(`à ${largeur} px, rien ne dépasse la gouttière, menu fermé ou ouvert`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largeur, height: HAUTEUR_PETIT_TELEPHONE })
      await page.goto('/mentions-legales')
      // Mesurer avec la police du site, pas avec la police de repli du système.
      await page.evaluate(() => document.fonts.ready)
      const mesurer = () =>
        page.evaluate(() => {
          const rangee = document.querySelector('.entete__rangee')
          const logo = document.querySelector('.entete__logo')
          const appel = document.querySelector('.bouton-appel')
          const menu = document.querySelector('.menu__bouton')
          if (rangee === null || logo === null || appel === null || menu === null) return null
          const limite =
            rangee.getBoundingClientRect().right -
            Number.parseFloat(getComputedStyle(rangee).paddingRight)
          return {
            fin: menu.getBoundingClientRect().right,
            limite,
            finLogo: logo.getBoundingClientRect().right,
            debutAppel: appel.getBoundingClientRect().left,
          }
        })
      for (const etat of ['fermé', 'ouvert']) {
        if (etat === 'ouvert') await page.locator('.menu__bouton').click()
        const mesure = await mesurer()
        expect(mesure, etat).not.toBeNull()
        expect(mesure?.fin ?? Infinity, etat).toBeLessThanOrEqual((mesure?.limite ?? 0) + 0.5)
        expect(mesure?.finLogo ?? Infinity, etat).toBeLessThanOrEqual(mesure?.debutAppel ?? 0)
      }
      // Le numéro garde 16 px au moins, même à 320 px.
      const numero = page.locator('header .bouton-appel__numero')
      await expect(numero).toHaveText(NUMERO)
      const corps = await numero.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      )
      expect(corps).toBeGreaterThanOrEqual(TEXTE_MINIMUM)
    })
  }
})

test.describe('design : en-tête du bureau', () => {
  test.beforeEach(({}, infos) => {
    test.skip(infos.project.name !== 'bureau', 'Navigation propre au bureau.')
  })

  for (const largeur of LARGEURS_BUREAU) {
    test(`à ${largeur} px, navigation et appel tiennent sur une ligne`, async ({ page }) => {
      await page.setViewportSize({ width: largeur, height: 900 })
      await page.goto('/mentions-legales')
      const navigation = page.getByRole('navigation', { name: 'Navigation principale' })
      await expect(navigation.getByRole('link', { name: 'Accès et horaires' })).toBeVisible()
      const mesure = await page.evaluate(() => {
        const rangee = document.querySelector('.entete__rangee')
        const liste = document.querySelector('.navigation__liste')
        const appel = document.querySelector('.bouton-appel')
        if (rangee === null || liste === null || appel === null) return null
        const limite =
          rangee.getBoundingClientRect().right -
          Number.parseFloat(getComputedStyle(rangee).paddingRight)
        const liens = [...liste.querySelectorAll('a')].map((lien) => lien.getBoundingClientRect())
        return {
          finListe: liste.getBoundingClientRect().right,
          debutAppel: appel.getBoundingClientRect().left,
          finAppel: appel.getBoundingClientRect().right,
          limite,
          hauts: liens.map((lien) => Math.round(lien.top)),
          hauteurs: liens.map((lien) => lien.height),
        }
      })
      expect(mesure).not.toBeNull()
      if (mesure === null) return
      expect(mesure.finAppel).toBeLessThanOrEqual(mesure.limite + 0.5)
      expect(mesure.finListe).toBeLessThanOrEqual(mesure.debutAppel)
      expect(new Set(mesure.hauts).size).toBe(1)
      for (const hauteur of mesure.hauteurs)
        expect(hauteur).toBeLessThanOrEqual(CIBLE_TACTILE_MIN + 8)
    })
  }
})

test.describe('design : accueil réel, blocs actuels des contextes', () => {
  test('au bureau, aucune colonne ne laisse de grand vide', async ({ page }, infos) => {
    test.skip(infos.project.name !== 'bureau', 'Grille propre au bureau.')
    for (const largeur of LARGEURS_BUREAU) {
      await page.setViewportSize({ width: largeur, height: 900 })
      await page.goto('/')
      // Pied de chaque colonne de la grille : le bas du dernier panneau posé dedans.
      const vides = await page.locator('.accueil__colonnes').evaluate((grille) => {
        const piedParColonne = new Map<number, number>()
        for (const enfant of grille.children) {
          const zones = enfant.matches('.accueil__zone')
            ? [enfant]
            : [...enfant.querySelectorAll(':scope > .accueil__zone')]
          for (const zone of zones) {
            const boite = zone.getBoundingClientRect()
            const colonne = Math.round(boite.left)
            piedParColonne.set(colonne, Math.max(piedParColonne.get(colonne) ?? 0, boite.bottom))
          }
        }
        const pieds = [...piedParColonne.values()]
        const plusBas = Math.max(...pieds)
        return pieds.map((pied) => Math.round(plusBas - pied))
      })
      expect(vides.length, `${largeur} px`).toBeGreaterThanOrEqual(2)
      for (const vide of vides) expect(vide, `${largeur} px`).toBeLessThanOrEqual(VIDE_COLONNE_MAX)
    }
  })

  test('dans la bande d’ouverture, la colonne des pièces descend jusqu’au pied de la plaque', async ({
    page,
  }, infos) => {
    test.skip(infos.project.name !== 'bureau', 'Deux colonnes au bureau seulement.')
    for (const largeur of LARGEURS_BANDE) {
      await page.setViewportSize({ width: largeur, height: 900 })
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready.then(() => true))
      const mesure = await page.locator('.ouverture__grille').evaluate((grille) => {
        const plaque = grille.querySelector('.plaque')
        const pieces = grille.querySelector('.ouverture__pieces')
        if (plaque === null || pieces === null) return null
        // Pied de la colonne : le bas de son dernier contenu visible, pas la
        // cellule de grille, étirée à la hauteur de la rangée.
        const bas = [...pieces.querySelectorAll('*')]
          .map((element) => element.getBoundingClientRect())
          .filter((boite) => boite.height > 0)
          .reduce((plusBas, boite) => Math.max(plusBas, boite.bottom), 0)
        const cotes = plaque.getBoundingClientRect().left > pieces.getBoundingClientRect().right
        return { ecart: Math.round(plaque.getBoundingClientRect().bottom - bas), cotes }
      })
      expect(mesure, `${largeur} px`).not.toBeNull()
      if (mesure === null) return
      expect(mesure.cotes, `${largeur} px : plaque à droite des pièces`).toBe(true)
      expect(Math.abs(mesure.ecart), `${largeur} px`).toBeLessThanOrEqual(ECART_BANDE_MAX)
    }
  })

  test('la bande d’ouverture n’empile jamais ses éléments les uns sur les autres', async ({
    page,
  }) => {
    await page.goto('/')
    const tete = await page.locator('.ouverture__tete').boundingBox()
    const pieces = await page.locator('.ouverture__pieces').boundingBox()
    expect(tete).not.toBeNull()
    expect(pieces).not.toBeNull()
    if (tete === null || pieces === null) return
    expect(pieces.y).toBeGreaterThanOrEqual(tete.y + tete.height - 1)
  })
})

test.describe('design : composants', () => {
  test('les réponses sont de vrais boutons bordés, cibles de 44 px au moins', async ({ page }) => {
    await page.goto(adresse('/'))
    const choix = page.locator('.plaque .bouton-choix')
    await expect(choix).toHaveCount(7)
    for (const bouton of await choix.all()) {
      const { bordure, hauteur, largeur } = await bouton.evaluate((element) => {
        const style = getComputedStyle(element)
        const boite = element.getBoundingClientRect()
        return { bordure: style.borderTopWidth, hauteur: boite.height, largeur: boite.width }
      })
      expect(bordure).toBe('1px')
      expect(hauteur).toBeGreaterThanOrEqual(CIBLE_TACTILE_MIN)
      expect(largeur).toBeGreaterThanOrEqual(CIBLE_TACTILE_MIN)
    }
  })

  test('au bureau, le numéro de l’en-tête se lit en grand', async ({ page }, infos) => {
    test.skip(infos.project.name !== 'bureau', 'Mesure propre au bureau.')
    await page.goto(adresse('/'))
    const corps = await page
      .locator('header .bouton-appel__numero')
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
    expect(corps).toBeGreaterThanOrEqual(CORPS_NUMERO_BUREAU_MIN)
    await expect(page.locator('header .bouton-appel__verbe')).toBeVisible()
  })

  test('la figure signature charge son dessin et se légende « Fig. 1 »', async ({ page }) => {
    await page.goto(adresse('/'))
    const figure = page.locator('#figure-1')
    await expect(figure.locator('figcaption')).toContainText(
      'Fig. 1 Frein à disque, vue de face : 1 disque, 2 étrier, 3 plaquettes',
    )
    // La figure est nommée par sa légende ; le dessin n'est pas annoncé une seconde fois (J5).
    await expect(figure).toHaveAccessibleName(/Frein à disque/)
    await expect(figure.getByRole('img')).toHaveCount(0)
    // Le dessin vient d'un fichier public par <use> : sa boîte est vide s'il n'a pas chargé.
    await expect
      .poll(() =>
        figure
          .locator('use')
          .evaluate((element) => (element as SVGGraphicsElement).getBBox().width),
      )
      .toBeGreaterThan(0)
  })

  test('le fil d’Ariane offre des cibles de 44 px sans épaissir sa ligne', async ({ page }) => {
    for (const chemin of [adresse('/composants'), '/pieces-et-reparations/freinage']) {
      await page.goto(chemin)
      const mesure = await page.locator('.fil-ariane ol').evaluate((liste) => ({
        ligne: Number.parseFloat(getComputedStyle(liste).lineHeight),
        hauteur: liste.getBoundingClientRect().height,
        liens: [...liste.querySelectorAll('a[href]')].map((lien) => {
          const boite = lien.getBoundingClientRect()
          return { hauteur: boite.height, centre: boite.top + boite.height / 2 }
        }),
      }))
      expect(mesure.liens.length, chemin).toBeGreaterThanOrEqual(2)
      for (const lien of mesure.liens) {
        expect(lien.hauteur, chemin).toBeGreaterThanOrEqual(CIBLE_TACTILE_MIN)
        expect(Math.abs(lien.centre - (mesure.liens[0]?.centre ?? 0)), chemin).toBeLessThan(1)
      }
      // Une seule ligne de texte : les cibles débordent, la ligne ne grandit pas.
      expect(mesure.hauteur, chemin).toBeLessThanOrEqual(mesure.ligne + 1)
    }
  })

  test('un choix courant (aria-current, aria-pressed) a l’aspect d’une tuile cochée', async ({
    page,
  }) => {
    await page.goto(adresse('/composants'))
    const aspect = (selecteur: string) =>
      page.locator(`#factice-choix-courant ${selecteur}`).evaluate((element) => {
        const style = getComputedStyle(element)
        return { contour: style.outlineStyle, bord: style.borderColor, fond: style.backgroundColor }
      })
    const courant = await aspect('[aria-current="page"]')
    const ordinaire = await aspect('a:not([aria-current])')
    expect(courant.contour).toBe('solid')
    expect(await aspect('[aria-pressed="true"]')).toEqual(courant)
    expect(await aspect('[aria-pressed="false"]')).toEqual(ordinaire)
    expect(ordinaire.contour).toBe('none')
    expect(ordinaire.fond).not.toBe(courant.fond)
  })

  test('la légende d’un groupe de champs a l’aspect d’un libellé, et l’écart de la grille', async ({
    page,
  }) => {
    await page.goto(adresse('/composants'))
    const mesure = await page.locator('#factice-groupe').evaluate((groupe) => {
      const legende = groupe.querySelector('legend')
      const suite = groupe.querySelector('.liste-choix')
      if (legende === null || suite === null) return null
      return {
        graisse: getComputedStyle(legende).fontWeight,
        ecart: suite.getBoundingClientRect().top - legende.getBoundingClientRect().bottom,
      }
    })
    expect(mesure?.graisse).toBe('600')
    expect(mesure?.ecart ?? 0).toBeGreaterThanOrEqual(ECART_CHAMP_MIN)
  })

  test('l’espace garagiste ne pousse pas l’appel : ni bouton d’appel, ni barre fixe', async ({
    page,
  }) => {
    await page.goto('/garagiste/connexion')
    await expect(page.locator('header .entete__logo')).toBeVisible()
    await expect(page.locator('header .bouton-appel')).toHaveCount(0)
    await expect(page.locator('.barre-fixe')).toHaveCount(0)
  })

  test('aucune ressource ne vient d’un autre domaine', async ({ page }) => {
    const origines = new Set<string>()
    page.on('request', (requete) => origines.add(new URL(requete.url()).origin))
    await page.goto(adresse('/'), { waitUntil: 'networkidle' })
    expect([...origines]).toEqual([new URL(factice.origine).origin])
  })
})
