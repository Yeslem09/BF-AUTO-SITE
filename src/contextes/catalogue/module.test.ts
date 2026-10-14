import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { MODES_SITE, type ModeSite } from '../../contrats/index.js'
import { CADRE_ESSAI, creerServeurEssai } from '../../web/essai.js'
import { LONGUEUR_MAX_AIDE } from './adaptateurs/web/vues/commun.js'
import { LONGUEUR_MAX_DESCRIPTION } from './adaptateurs/web/vues/description.js'
import { expressionsInterditesDans } from './domaine/mots-interdits.js'
import {
  creerDossierEssai,
  documentCatalogue,
  familleEssai,
  forfaitEssai,
  prixPropose,
  prixValide,
  SOURCE_PROPOSITION,
  type Document,
  type DossierEssai,
} from './essai.js'
import { assemblerCatalogue } from './module.js'

const DONNEES_DU_SITE = resolve(import.meta.dirname, '../../../donnees')
/** Familles du vrai fichier qui sont des prestations : ni pièce seule, ni vérification, ni gamme. */
const PRESTATIONS = ['climatisation', 'diagnostic-electronique', 'carrosserie', 'peinture']
/** Familles du vrai fichier rattachées à un organe que la loi exclut du réemploi. */
const ORGANES_EXCLUS = ['freinage', 'pneus', 'amortisseurs-et-suspension']
const RACINE_PUBLIC = resolve(import.meta.dirname, '../../../public')
/** Identité du garage telle que la composition la transmet. */
const GARAGE = CADRE_ESSAI.identite
const INSECABLE = '\u00a0'
const TIRETS_INTERDITS = /[\u2013\u2014]/

const aFermer: { close(): Promise<unknown> }[] = []
const aSupprimer: DossierEssai[] = []
afterEach(async () => {
  await Promise.all(aFermer.splice(0).map((app) => app.close()))
  await Promise.all(aSupprimer.splice(0).map((dossier) => dossier.supprimer()))
})

/** Serveur complet (mise en page, erreurs) monté avec le seul catalogue, sur des données choisies. */
async function servir(
  mode: ModeSite,
  document: Document | 'donnees-du-site' = documentCatalogue(),
  preDiagnosticPublie = true,
): Promise<FastifyInstance> {
  const cheminDonnees =
    document === 'donnees-du-site' ? DONNEES_DU_SITE : (await dossierAvec(document)).chemin
  const { module } = await assemblerCatalogue({
    mode,
    cheminDonnees,
    garage: GARAGE,
    preDiagnosticPublie,
  })
  const app = await creerServeurEssai([module], { mode })
  aFermer.push(app)
  return app
}

async function dossierAvec(document: Document): Promise<DossierEssai> {
  const dossier = await creerDossierEssai(document)
  aSupprimer.push(dossier)
  return dossier
}

async function page(app: FastifyInstance, url: string): Promise<{ statut: number; html: string }> {
  const reponse = await app.inject(url)
  return { statut: reponse.statusCode, html: reponse.body }
}

/** La moitié « pièces » de la bande d'ouverture de l'accueil, raccourcis exclus. */
function bandeDe(html: string): string {
  return html.slice(
    html.indexOf('accueil__zone--recherche-pieces'),
    html.indexOf('<nav class="raccourcis"'),
  )
}

/** Texte lisible d'une page : balises retirées. */
function texteDe(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
}

/**
 * « À partir de 69,00 € TTC » : le seul « à partir de » admis, produit par le
 * format unique des prix à côté d'un véhicule de référence ; tout autre reste
 * une expression interdite.
 */
const PRIX_A_PARTIR_DE = /À partir de\s\d[\d\s]*,\d{2}\s€\sTTC/g

/** Nombre d'apparitions d'un texte dans une page. */
function occurrences(html: string, texte: string): number {
  return html.split(texte).length - 1
}

/** Montant de la ligne du tableau de tarifs qui suit le repère, morceaux insécables rejoints. */
function montantTarif(html: string, repere: string): string | undefined {
  const debut = html.indexOf(repere)
  if (debut < 0) return undefined
  const cellule = /<td class="tableau-tarifs__prix[^"]*"[^>]*>([\s\S]*?)<\/td>/.exec(
    html.slice(debut),
  )?.[1]
  return cellule
    ?.replace(/<[^>]+>/g, '')
    .replace(/ +/g, ' ')
    .trim()
}

/** Montant affiché dans la carte de prix qui suit le repère. */
function montantApres(html: string, repere: string): string | undefined {
  const debut = html.indexOf(repere)
  if (debut < 0) return undefined
  return /<p class="catalogue-prix__montant">([^<]*)<\/p>/.exec(html.slice(debut))?.[1]
}

describe('catalogue : liste des familles (US-26, US-44)', () => {
  it('en production, liste les seules familles validées en cartes, chacune avec sa figure et ses mots courants', async () => {
    const { statut, html } = await page(await servir('production'), '/pieces-et-reparations')
    expect(statut).toBe(200)
    expect(html).toContain('<title>Pièces détachées à Choisy-le-Roi | BF Auto</title>')
    expect(html).toContain('<h1>Pièces détachées</h1>')
    expect(html).toContain(
      '<a class="navigation__lien" href="/pieces-et-reparations" aria-current="page">',
    )
    expect(html).toContain(
      '<li><a class="carte-famille" href="/pieces-et-reparations/freinage"><span class="carte-famille__planche"><svg class="carte-famille__dessin" viewBox="0 0 80 56" aria-hidden="true" focusable="false"><use href="/img/familles/freinage.svg#dessin"></use></svg></span><span class="carte-famille__nom">Freinage</span><span class="carte-famille__aide">Plaquettes, disques, liquide de frein</span></a></li>',
    )
    expect(html).toContain('href="/pieces-et-reparations/batterie"')
    expect(html).not.toContain('Climatisation')
    expect(html).not.toContain('noindex')
  })

  it('porte le fil d’Ariane et la recherche par mot, en GET, sans JavaScript', async () => {
    const { html } = await page(await servir('production'), '/pieces-et-reparations')
    expect(html).toContain(
      '<nav class="fil-ariane" aria-label="Fil d’Ariane"><ol><li><a href="/">Accueil</a></li><li><a href="/pieces-et-reparations" aria-current="page">Pièces détachées</a></li></ol></nav>',
    )
    expect(html).toContain(
      '<form class="recherche" role="search" method="get" action="/pieces-et-reparations#recherche">',
    )
    expect(html).toContain('<label class="champ__libelle" for="recherche-pieces">')
    expect(html).toMatch(
      /<input class="champ__saisie" id="recherche-pieces" name="q" type="search" value=""/,
    )
    const principal = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
    expect(principal).not.toContain('<script')
  })

  it('porte le bloc « Ce que nous ne faisons pas » lu dans la configuration, sans l’élément à valider', async () => {
    const { html } = await page(await servir('production'), '/pieces-et-reparations')
    expect(html).toContain(
      '<h2 id="catalogue-titre-exclusions" class="titre-carte">Ce que nous ne faisons pas</h2>',
    )
    expect(html).toContain('<li>Carrosserie et peinture</li>')
    expect(html).not.toContain('Poids lourds')
  })

  it('masque « Ce que nous ne faisons pas » quand rien n’est exclu', async () => {
    const { html } = await page(
      await servir('production', documentCatalogue({ ce_que_nous_ne_faisons_pas: [] })),
      '/pieces-et-reparations',
    )
    expect(html).not.toContain('Ce que nous ne faisons pas')
  })

  it('en démonstration, montre les propositions, le retrait ou la pose, et toutes les exclusions', async () => {
    const { html } = await page(await servir('demonstration'), '/pieces-et-reparations')
    expect(html).toContain('href="/pieces-et-reparations/climatisation"')
    expect(html).toContain('<li>Poids lourds</li>')
    expect(html).toContain('Retrait au garage ou pose à l’atelier</h2>')
    expect(html).toContain('Nous vérifions la pièce avant de la commander, puis nous la posons.')
    expect(html).not.toContain('À valider')
  })

  it('en production sur les vraies données, dit que la liste attend le garage et propose une demande de prix', async () => {
    const { statut, html } = await page(
      await servir('production', 'donnees-du-site'),
      '/pieces-et-reparations',
    )
    expect(statut).toBe(200)
    expect(html).toContain(
      'La liste des pièces et réparations est en cours de confirmation avec le garage.',
    )
    expect(html).toContain(
      '<a class="bouton bouton--principal" href="/demande?type=devis">Demander un prix</a>',
    )
    expect(html).not.toContain('carte-famille')
    expect(html).not.toContain('role="search"')
    expect(html).not.toContain('Ce que nous ne faisons pas')
  })

  it('sur les vraies données en démonstration, montre les 18 familles, carrosserie comprise, et n’exclut rien', async () => {
    const { html } = await page(
      await servir('demonstration', 'donnees-du-site'),
      '/pieces-et-reparations',
    )
    expect(html.match(/<a class="carte-famille"/g)).toHaveLength(18)
    expect(html).toContain('<span class="carte-famille__nom">Carrosserie</span>')
    expect(html).toContain('<span class="carte-famille__aide">Chocs, bosses, rayures</span>')
    expect(html).not.toContain('Ce que nous ne faisons pas')
  })
})

describe('catalogue : recherche par mot', () => {
  it('trouve une famille par son mot courant et le met en tête de la carte', async () => {
    const { statut, html } = await page(
      await servir('production'),
      '/pieces-et-reparations?q=disques',
    )
    expect(statut).toBe(200)
    expect(html).toContain('<h2 class="titre-carte">Résultat de votre recherche</h2>')
    expect(html).toContain('<p>Une famille correspond à votre recherche.</p>')
    const resultats = html.slice(
      html.indexOf('catalogue-resultats'),
      html.indexOf('catalogue-titre-familles'),
    )
    expect(resultats).toContain(
      '<p class="catalogue-resultat__aide">Disques, plaquettes, liquide de frein</p>',
    )
    // J2 : le résultat mène au prix, et à la demande de prix préremplie.
    expect(resultats).toContain(
      `<p class="catalogue-resultat__prix">Plaquettes avant\u00a0: 89,00${INSECABLE}€${INSECABLE}TTC</p>`,
    )
    expect(resultats).toContain(
      'href="/demande?type=devis&amp;famille=freinage&amp;modalite=pose&amp;piece=Plaquettes+avant">Demander un prix</a>',
    )
    expect(resultats).not.toContain('batterie')
  })

  it('trouve par synonyme, pluriel, majuscules et faute de frappe', async () => {
    const app = await servir('production')
    for (const requete of [
      'frein',
      'Tambours',
      'PLAQUETTES',
      'plaquete',
      'les plaquettes de frein',
    ]) {
      const { html } = await page(app, `/pieces-et-reparations?q=${encodeURIComponent(requete)}`)
      const resultats = html.slice(
        html.indexOf('catalogue-resultats'),
        html.indexOf('catalogue-titre-familles'),
      )
      expect(resultats, requete).toContain('href="/pieces-et-reparations/freinage"')
      expect(resultats, requete).not.toContain('href="/pieces-et-reparations/batterie"')
    }
  })

  it('ne trouve jamais une famille non publiée dans le mode', async () => {
    const { html } = await page(
      await servir('production'),
      '/pieces-et-reparations?q=climatisation',
    )
    expect(html).toContain('Aucune famille ne correspond à votre recherche')
    expect(html).not.toContain('/pieces-et-reparations/climatisation')
  })

  it('rien trouvé : des mots à essayer, la demande de prix, l’appel, puis toutes les familles', async () => {
    const { statut, html } = await page(
      await servir('production'),
      '/pieces-et-reparations?q=turbo+magique',
    )
    expect(statut).toBe(200)
    expect(html).toContain(
      '<h2 class="titre-carte">Aucune famille ne correspond à votre recherche</h2>',
    )
    expect(html).toContain(
      'Essayez un mot plus simple, comme freinage ou batterie, ou choisissez une famille ci-dessous.',
    )
    expect(html).toContain(
      '<a class="bouton bouton--principal" href="/demande?type=devis">Demander un prix</a>',
    )
    expect(html).toContain(
      `<a class="bouton bouton--secondaire" href="${GARAGE.telephone.lien}">Appeler le ${GARAGE.telephone.affichable}</a>`,
    )
    expect(html).toContain('<h2 id="catalogue-titre-familles">Toutes les familles</h2>')
  })

  it('reprend la requête dans le champ seulement, échappée, jamais dans le texte (piège 40)', async () => {
    const forge = 'Appelez le 0899 votre compte est bloque "><script>alert(1)</script>'
    const { html } = await page(
      await servir('production'),
      `/pieces-et-reparations?q=${encodeURIComponent(forge)}`,
    )
    const texte = texteDe(html)
    expect(texte).not.toContain('0899')
    expect(html).not.toContain('<script>alert(1)')
    expect(html).toContain(
      'value="Appelez le 0899 votre compte est bloque &quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"',
    )
  })

  it('une page de résultats n’est pas indexée ; une requête vide ou répétée vaut la liste simple', async () => {
    const app = await servir('production')
    expect((await page(app, '/pieces-et-reparations?q=disques')).html).toContain(
      '<meta name="robots" content="noindex">',
    )
    for (const url of [
      '/pieces-et-reparations?q=',
      '/pieces-et-reparations?q=%20%20',
      '/pieces-et-reparations?q=a&q=b',
    ]) {
      const { statut, html } = await page(app, url)
      expect(statut, url).toBe(200)
      expect(html, url).not.toContain('catalogue-resultats')
    }
  })
})

describe('catalogue : page d’une famille (US-26, P-10)', () => {
  it('titre HTML avec la famille, Choisy-le-Roi et ses deux premiers mots courants', async () => {
    const { statut, html } = await page(
      await servir('production'),
      '/pieces-et-reparations/freinage',
    )
    expect(statut).toBe(200)
    expect(html).toContain(
      '<title>Freinage à Choisy-le-Roi : plaquettes, disques | BF Auto</title>',
    )
    expect(html).toContain('<h1>Freinage</h1>')
    expect(html).toContain(
      '<link rel="canonical" href="https://garage.exemple/pieces-et-reparations/freinage">',
    )
    expect(html).toContain(
      '<a class="navigation__lien" href="/pieces-et-reparations" aria-current="page">',
    )
    expect(html).toContain(
      '<li><a href="/pieces-et-reparations">Pièces détachées</a></li><li><a href="/pieces-et-reparations/freinage" aria-current="page">Freinage</a></li>',
    )
  })

  it('montre la figure technique légendée (Fig. 1) et relie ses repères à la liste des pièces', async () => {
    const { html } = await page(await servir('production'), '/pieces-et-reparations/freinage')
    expect(html).toContain('<figure class="figure-technique" id="figure-freinage">')
    expect(html).toContain('<use href="/img/familles/freinage.svg#dessin"/>')
    expect(html).toContain('<span class="figure-technique__numero">Fig. 1</span> Frein à disque')
    const numerosDuDessin = [
      ...html.matchAll(/<text class="figure-technique__chiffre"[^>]*>(\d)<\/text>/g),
    ].map((c) => c[1])
    expect(numerosDuDessin).toEqual(['1', '2', '3'])
    const nomenclature = [
      ...html.matchAll(
        /<li value="(\d)"><span class="catalogue-nomenclature__repere" aria-hidden="true">\1<\/span><span class="catalogue-nomenclature__piece">([^<]+)/g,
      ),
    ].map((c) => `${c[1]} ${c[2]}`)
    expect(nomenclature).toEqual(['1 Disque', '2 Étrier', '3 Plaquettes '])
    expect(html).toContain('(partie cachée, en tirets sur la figure)')
  })

  it('dit « partie cachée » quel que soit le genre de la pièce : « Élément filtrant », jamais « (cachée »', async () => {
    const { html } = await page(
      await servir('demonstration', 'donnees-du-site'),
      '/pieces-et-reparations/vidange-et-filtres',
    )
    expect(html).toContain(
      'Élément filtrant <span class="catalogue-nomenclature__cachee">(partie cachée, en tirets sur la figure)</span>',
    )
    expect(html).not.toContain('(cachée')
  })

  it('dit à quoi ça sert, les signes d’usure avec le lien vers le pré-diagnostic, et ce que fait le garage', async () => {
    const { html } = await page(await servir('production'), '/pieces-et-reparations/freinage')
    expect(html).toContain('À quoi ça sert</h2>')
    expect(html).toContain('<p class="texte-intro">Le freinage ralentit et arrête la voiture.</p>')
    expect(html).toContain('<li>Grincement quand vous freinez</li><li>Pédale molle</li>')
    expect(html).toContain('<a href="/pre-diagnostic">Faites le pré-diagnostic</a>')
    expect(html).toContain('<p>Nous remplaçons les plaquettes usées.</p>')
  })

  it('pré-diagnostic non publié : ni la liste ni la famille ne le lient, elles invitent à appeler (Kano D3)', async () => {
    const app = await servir('production', documentCatalogue(), false)
    const appel = `Appelez-nous au <a href="${GARAGE.telephone.lien}">${GARAGE.telephone.affichable}</a>.`
    for (const url of ['/pieces-et-reparations', '/pieces-et-reparations/freinage']) {
      const { html } = await page(app, url)
      const principal = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
      expect(principal, url).not.toContain('href="/pre-diagnostic"')
      expect(principal, url).toContain(appel)
    }
  })

  it('affiche le forfait validé avec son véhicule de référence, son contenu et sa date', async () => {
    const { html } = await page(await servir('production'), '/pieces-et-reparations/freinage')
    expect(html).toContain(
      `<p class="catalogue-prix__montant">89,00${INSECABLE}€${INSECABLE}TTC</p>`,
    )
    expect(html).toContain('<li>Comprend : plaquettes avant et main-d’œuvre</li>')
    expect(html).toContain('<li>Exemple\u00a0: citadine essence, prix au 1er octobre 2026</li>')
    expect(html).toContain(
      '<p class="catalogue-prix__exact">Votre prix exact au devis, avant travaux.</p>',
    )
  })

  it('replie un forfait non validé sur « Prix sur devis », avec la même phrase', async () => {
    const { html } = await page(await servir('production'), '/pieces-et-reparations/batterie')
    expect(html).toContain('<p class="catalogue-prix__montant">Prix sur devis</p>')
    expect(html).toContain('Votre prix exact au devis, avant travaux.')
    expect(html).not.toContain('Forfait à obtenir.')
    expect(texteDe(html)).not.toMatch(/\d+,\d{2}\s?€/)
  })

  it('propose « Demander un prix » et « Demander un rendez-vous », type et famille préremplis', async () => {
    const { html } = await page(await servir('production'), '/pieces-et-reparations/freinage')
    expect(html).toContain(
      '<a class="bouton bouton--principal" href="/demande?type=devis&amp;famille=freinage">Demander un prix</a>',
    )
    expect(html).toContain(
      '<a class="bouton bouton--secondaire" href="/demande?type=rendez-vous&amp;famille=freinage">Demander un rendez-vous</a>',
    )
  })

  it('reprend la ville fournie par la composition', async () => {
    const dossier = await dossierAvec(documentCatalogue())
    const { module } = await assemblerCatalogue({
      mode: 'production',
      cheminDonnees: dossier.chemin,
      garage: { ...GARAGE, adresse: { ...GARAGE.adresse, ville: 'Vitry-sur-Seine' } },
      preDiagnosticPublie: true,
    })
    const app = await creerServeurEssai([module])
    aFermer.push(app)
    const { html } = await page(app, '/pieces-et-reparations/freinage')
    expect(html).toContain(
      '<title>Freinage à Vitry-sur-Seine : plaquettes, disques | BF Auto</title>',
    )
  })

  it('une famille sans figure dessinée garde sa page, sans figure ni nomenclature', async () => {
    const { statut, html } = await page(
      await servir(
        'production',
        documentCatalogue({
          familles: [familleEssai('vitres-teintees', { libelle: 'Vitres teintées' })],
        }),
      ),
      '/pieces-et-reparations/vitres-teintees',
    )
    expect(statut).toBe(200)
    expect(html).toContain('catalogue-fiche--sans-figure')
    expect(html).not.toContain('figure-technique')
    expect(html).not.toContain('catalogue-nomenclature')
    expect(html).toContain('Demander un prix</a>')
  })

  it('sur les vraies données en démonstration, chaque famille a sa figure et son issue : rôle, signes, pré-diagnostic, deux actions', async () => {
    const app = await servir('demonstration', 'donnees-du-site')
    const liste = await page(app, '/pieces-et-reparations')
    const identifiants = [
      ...liste.html.matchAll(
        /<a class="carte-famille" href="\/pieces-et-reparations\/([a-z0-9-]+)"/g,
      ),
    ].map((correspondance) => correspondance[1] ?? '')
    expect(identifiants).toHaveLength(18)
    for (const identifiant of identifiants) {
      const { statut, html } = await page(app, `/pieces-et-reparations/${identifiant}`)
      expect(statut, identifiant).toBe(200)
      expect(html, identifiant).toMatch(/<title>[^<]+ à Choisy-le-Roi : [^<]+ \| BF Auto<\/title>/)
      expect(html, identifiant).toContain(
        `<figure class="figure-technique" id="figure-${identifiant}">`,
      )
      expect(html, identifiant).toMatch(/<ol class="catalogue-nomenclature">\s*<li value="1">/)
      expect(html, identifiant).toContain('<ul class="catalogue-signes">')
      expect(html, identifiant).toContain('href="/pre-diagnostic"')
      expect(html, identifiant).toContain(`href="/demande?type=devis&amp;famille=${identifiant}"`)
      expect(html, identifiant).toContain(
        `href="/demande?type=rendez-vous&amp;famille=${identifiant}"`,
      )
      expect(html, identifiant).toMatch(
        /<p class="catalogue-prix__montant">(Prix sur devis|Sur devis après examen|À partir de \d+,\d{2}\u00a0€\u00a0TTC)<\/p>/,
      )
      if (PRESTATIONS.includes(identifiant)) {
        expect(html, identifiant).toContain(
          '<h2 id="catalogue-titre-offres" class="titre-carte">Ce que fait l’atelier</h2>',
        )
        expect(html, identifiant).not.toContain('Retrait au garage')
        expect(html, identifiant).not.toContain('pièce seule')
        expect(html, identifiant).not.toContain('Vérifiée avant commande.')
        expect(html, identifiant).not.toContain('d’occasion')
      } else {
        expect(html, identifiant).toContain(
          '<h3 class="catalogue-offre__titre">Retrait au garage</h3>',
        )
        expect(html, identifiant).toContain(
          '<h3 class="catalogue-offre__titre">Pose à l’atelier</h3>',
        )
        expect(html, identifiant).toContain('<strong>Vérifiée avant commande.</strong>')
      }
      expect(occurrences(html, 'Avant de commander une pièce'), identifiant).toBeLessThanOrEqual(1)
      expect(occurrences(html, 'convient à votre véhicule'), identifiant).toBeLessThanOrEqual(1)
    }
    const carrosserie = await page(app, '/pieces-et-reparations/carrosserie')
    expect(carrosserie.html).toContain(
      '<title>Carrosserie à Choisy-le-Roi : chocs, bosses | BF Auto</title>',
    )
    // J3 : une prestation se demande en décrivant le dégât, photo par SMS, jamais en commandant une pièce.
    expect(carrosserie.html).toContain('Décrivez le dégât')
    expect(carrosserie.html).toContain(
      `Envoyez une photo du dégât par SMS au <a class="catalogue-consigne__sms" href="${GARAGE.telephone.lien.replace('tel:', 'sms:')}">${GARAGE.telephone.affichable}</a> pour un devis plus rapide.`,
    )
    expect(carrosserie.html).not.toContain('Retrait au garage')
    expect(carrosserie.html).not.toContain('Avant de commander une pièce')
    // Une pièce vendue ne reçoit ni consigne de dégât ni photo par SMS.
    const freinage = await page(app, '/pieces-et-reparations/freinage')
    expect(freinage.html).not.toContain('catalogue-consigne')
  })

  it('chaque dessin cité par une figure existe dans public/, avec son groupe #dessin et sans couleur', async () => {
    const app = await servir('demonstration', 'donnees-du-site')
    const liste = await page(app, '/pieces-et-reparations')
    const dessins = new Set(
      [...liste.html.matchAll(/<use href="(\/img\/[a-z-]+\/[a-z-]+\.svg)#dessin">/g)].map(
        (c) => c[1] ?? '',
      ),
    )
    expect(dessins.size).toBe(18)
    for (const dessin of dessins) {
      const contenu = await readFile(resolve(RACINE_PUBLIC, `.${dessin}`), 'utf8')
      expect(contenu, dessin).toContain('<g id="dessin"')
      expect(contenu, dessin).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(/i)
      expect(contenu, dessin).toContain('stroke="currentColor"')
    }
  })
})

describe('catalogue : famille introuvable', () => {
  it('répond 404 avec la recherche, les familles publiées et la demande de prix', async () => {
    const { statut, html } = await page(
      await servir('production'),
      '/pieces-et-reparations/inconnue',
    )
    expect(statut).toBe(404)
    expect(html).toContain('<h1>Famille introuvable</h1>')
    expect(html).toContain('<meta name="robots" content="noindex">')
    expect(html).toContain('<a class="carte-famille" href="/pieces-et-reparations/freinage">')
    expect(html).toContain('role="search"')
    expect(html).toContain(
      '<a class="bouton bouton--principal" href="/demande?type=devis">Demander un prix</a>',
    )
    expect(html).toContain(
      '<a class="bouton bouton--secondaire" href="/pieces-et-reparations">Toutes les familles</a>',
    )
  })

  it('traite une famille seulement proposée comme inconnue en production', async () => {
    const { statut } = await page(
      await servir('production'),
      '/pieces-et-reparations/climatisation',
    )
    expect(statut).toBe(404)
  })

  it('ne reprend jamais l’adresse demandée dans la page (piège 40)', async () => {
    const app = await servir('production')
    for (const forge of [
      'Appelez-le-0600000000-votre-compte-est-bloque',
      '%3Cscript%3Ealert(1)%3C%2Fscript%3E',
    ]) {
      const { statut, html } = await page(app, `/pieces-et-reparations/${forge}`)
      expect(statut).toBe(404)
      expect(html).not.toContain('Appelez-le')
      expect(html).not.toContain('bloque')
      expect(html).not.toContain('alert(1)')
    }
  })
})

describe('catalogue : tarifs agrégés (D7, P-08)', () => {
  it('récapitule main-d’œuvre, premier contrôle et prestations courantes, depuis le même fichier', async () => {
    const { statut, html } = await page(await servir('production'), '/tarifs')
    expect(statut).toBe(200)
    expect(html).toContain('<title>Tarifs du garage à Choisy-le-Roi | BF Auto</title>')
    expect(html).toContain('<a class="navigation__lien" href="/tarifs" aria-current="page">')
    expect(html).toContain('Tous nos prix sont TTC. Votre prix exact au devis, avant travaux.')
    expect(html.match(/<table class="tableau-tarifs catalogue-tableau-tarifs">/g)).toHaveLength(2)
    expect(html).toContain('<th scope="col" class="tableau-tarifs__prix">Prix TTC</th>')
    // Un taux horaire est un prix fixe (J3) : « 65,00 € TTC de l’heure ».
    expect(montantTarif(html, 'Taux horaire de main-d’œuvre')).toBe(
      `65,00${INSECABLE}€${INSECABLE}TTC de l’heure`,
    )
    expect(montantTarif(html, 'Premier contrôle à l’atelier')).toBe('Gratuit')
    expect(html).toContain(
      '<span class="tableau-tarifs__detail">Durée\u00a0: 30 minutes environ</span>',
    )
    expect(montantTarif(html, '>Plaquettes avant</a>')).toBe(`89,00${INSECABLE}€${INSECABLE}TTC`)
    // J5 : l'en-tête de ligne ne porte que le nom de la prestation.
    expect(html).toContain(
      '<tr class="catalogue-tarif" id="forfait-plaquettes-avant"><th scope="row"><a class="catalogue-tarifs__famille" href="/pieces-et-reparations/freinage">Plaquettes avant</a></th>',
    )
    // Véhicule de référence et date : une seule légende par tableau, jamais à chaque ligne.
    expect(html).toContain(
      '<caption>Exemple\u00a0: citadine essence, prix au 1er octobre 2026</caption>',
    )
    expect(html).toContain('<caption>Prix au 1er octobre 2026</caption>')
    expect(html).not.toContain('<span class="tableau-tarifs__detail">Exemple')
    expect(html).not.toContain('<span class="tableau-tarifs__detail">Prix au')
    // J2 : la demande de prix d'une ligne pré-coche la pièce et la pose.
    expect(html).toContain(
      '<a class="catalogue-tarif__demande" href="/demande?type=devis&amp;famille=freinage&amp;modalite=pose&amp;piece=Plaquettes+avant">Demander un prix</a>',
    )
    expect(html).toContain(
      '<h2 id="catalogue-titre-sur-devis" class="titre-carte">Les autres interventions, sur devis</h2>',
    )
    expect(html).toContain('<li><a href="/pieces-et-reparations/batterie">Batterie</a></li>')
    expect(html).not.toContain('Climatisation')
  })

  it('affiche le même montant sur la page Freinage et sur les tarifs, avant et après une modification du fichier', async () => {
    const montants = async (montant: number): Promise<(string | undefined)[]> => {
      const familles = [
        familleEssai('freinage', {
          libelle: 'Freinage',
          forfaits: [forfaitEssai('plaquettes', prixValide({ montant_ttc_centimes: montant }))],
        }),
      ]
      const app = await servir('production', documentCatalogue({ familles }))
      const fiche = await page(app, '/pieces-et-reparations/freinage')
      const tarifs = await page(app, '/tarifs')
      return [
        montantApres(fiche.html, 'catalogue-titre-prix'),
        montantTarif(tarifs.html, '>Forfait plaquettes</a>'),
      ]
    }
    expect(await montants(8900)).toEqual([
      `89,00${INSECABLE}€${INSECABLE}TTC`,
      `89,00${INSECABLE}€${INSECABLE}TTC`,
    ])
    expect(await montants(9450)).toEqual([
      `94,50${INSECABLE}€${INSECABLE}TTC`,
      `94,50${INSECABLE}€${INSECABLE}TTC`,
    ])
  })

  it('sur les vraies données en production, n’affiche aucun montant et dit pourquoi', async () => {
    const { statut, html } = await page(await servir('production', 'donnees-du-site'), '/tarifs')
    expect(statut).toBe(200)
    expect(montantTarif(html, 'Taux horaire de main-d’œuvre')).toBe('Sur demande')
    expect(montantTarif(html, 'Premier contrôle à l’atelier')).toBe('Sur demande')
    expect(html).toContain(
      '« Sur demande »\u00a0: le garage vous donne ce prix au téléphone ou dans votre devis',
    )
    expect(html).toContain('Les forfaits seront publiés une fois confirmés par le garage.')
    expect(texteDe(html)).not.toMatch(/\d\s?€/)
    expect(html).not.toContain('démonstration')
  })

  it('sur les vraies données en démonstration : les prix proposés, « révision » comprise, et la note qui le dit', async () => {
    const { html } = await page(await servir('demonstration', 'donnees-du-site'), '/tarifs')
    const aPartirDe = (centimes: string) => `À partir de ${centimes}${INSECABLE}€${INSECABLE}TTC`
    const fixe = (centimes: string) => `${centimes}${INSECABLE}€${INSECABLE}TTC`
    expect(montantTarif(html, 'Taux horaire de main-d’œuvre')).toBe(`${fixe('60,00')} de l’heure`)
    expect(montantTarif(html, 'Premier contrôle à l’atelier')).toBe(fixe('29,00'))
    expect(html).toContain(
      '<span class="tableau-tarifs__detail">Durée\u00a0: 30 minutes environ</span>',
    )
    expect(html).toContain(
      '<span class="tableau-tarifs__detail">Déduit du prix de la réparation si vous la confiez au garage</span>',
    )
    expect(montantTarif(html, '>Vidange</a>')).toBe(aPartirDe('69,00'))
    expect(montantTarif(html, '>Révision</a>')).toBe(aPartirDe('129,00'))
    expect(montantTarif(html, '>Plaquettes avant posées</a>')).toBe(aPartirDe('89,00'))
    expect(montantTarif(html, '>Batterie posée</a>')).toBe(aPartirDe('99,00'))
    expect(montantTarif(html, '>Pneu monté et équilibré</a>')).toBe(aPartirDe('75,00'))
    expect(montantTarif(html, '>Géométrie (parallélisme)</a>')).toBe(aPartirDe('49,00'))
    expect(montantTarif(html, '>Recharge de climatisation</a>')).toBe(aPartirDe('69,00'))
    expect(montantTarif(html, '>Diagnostic électronique</a>')).toBe(aPartirDe('49,00'))
    expect(montantTarif(html, '>Réparation de carrosserie</a>')).toBe('Sur devis après examen')
    expect(occurrences(texteDe(html), 'Révision')).toBeGreaterThan(0)
    expect(html).toContain(
      '<p class="texte-note catalogue-prix__proposition">Prix de démonstration calés sur le marché local, à confirmer par le garage.</p>',
    )
    // Les « À partir de » partagent un véhicule de référence et une date, dits une fois,
    // jamais dans le futur (J1, J2, J5).
    expect(
      occurrences(
        html,
        '<caption>Exemple\u00a0: citadine essence, prix au 24 septembre 2026</caption>',
      ),
    ).toBe(1)
    expect(occurrences(html, 'citadine essence')).toBe(1)
    expect(html).not.toContain('1er octobre 2026')
    // Une prestation (révision, géométrie) se demande comme telle : ni pièce, ni retrait.
    expect(html).toContain(
      'href="/demande?type=devis&amp;famille=vidange-et-filtres&amp;prestation=R%C3%A9vision"',
    )
    expect(html).toContain(
      'href="/demande?type=devis&amp;famille=freinage&amp;modalite=pose&amp;piece=Plaquettes+avant"',
    )
    expect(html).toContain(
      '<li><a href="/pieces-et-reparations/distribution">Distribution</a></li>',
    )
  })

  it('en production, un prix de démonstration ne s’affiche jamais, ni aux tarifs ni sur la famille', async () => {
    const familles = [
      familleEssai('freinage', {
        libelle: 'Freinage',
        forfaits: [forfaitEssai('plaquettes', prixPropose({ montant_ttc_centimes: 8900 }))],
      }),
    ]
    const tarifs = documentCatalogue()['tarifs_transverses'] as Document
    const document = documentCatalogue({
      familles,
      tarifs_transverses: {
        ...tarifs,
        taux_horaire: prixPropose({ montant_ttc_centimes: 6000, comprend: 'une heure' }),
      },
    })
    const app = await servir('production', document)
    for (const url of ['/tarifs', '/pieces-et-reparations/freinage', '/']) {
      const { html } = await page(app, url)
      expect(html, url).not.toContain('89,00')
      expect(html, url).not.toContain('60,00')
      expect(html, url).not.toContain('À partir de')
      expect(html, url).not.toContain(SOURCE_PROPOSITION)
      expect(html, url).not.toContain('démonstration')
    }
    const { html } = await page(app, '/tarifs')
    expect(montantTarif(html, 'Taux horaire de main-d’œuvre')).toBe('Sur demande')
  })
})

describe('catalogue : blocs de l’accueil', () => {
  it('fournit les deux emplacements des pièces : la bande et la grille', async () => {
    const { module } = await assemblerCatalogue({
      mode: 'production',
      cheminDonnees: DONNEES_DU_SITE,
      garage: GARAGE,
      preDiagnosticPublie: true,
    })
    expect(Object.keys(module.blocsAccueil ?? {})).toEqual(['recherche-pieces', 'catalogue'])
  })

  it('dans la bande : « Pièces détachées », l’offre, la recherche, douze familles en puces dessinées et le lien vers toutes', async () => {
    const { html } = await page(await servir('demonstration', 'donnees-du-site'), '/')
    const bande = bandeDe(html)
    expect(bande).toContain(
      '<h2 id="titre-recherche-pieces" class="catalogue-bande__titre">Pièces détachées</h2>',
    )
    expect(bande).toContain(
      '<p class="catalogue-bande__offre">Vente au comptoir ou pose à l’atelier, pièce vérifiée avant commande.</p>',
    )
    expect(bande).toContain('action="/pieces-et-reparations#recherche"')
    expect(bande).toContain('placeholder="Ex. plaquettes"')
    const puces = [
      ...bande.matchAll(
        /<li(?: class="([a-z_-]+)")?><a class="puce-famille" href="\/pieces-et-reparations\/([a-z-]+)"><svg class="puce-famille__dessin"/g,
      ),
    ].map(([, classe, famille]) => `${famille ?? ''}${classe === undefined ? '' : ' (bureau)'}`)
    // Six sur téléphone, six de plus au bureau : la feuille masque les secondes sous 768 px.
    expect(puces).toEqual([
      'freinage',
      'batterie',
      'pneus',
      'vidange-et-filtres',
      'distribution',
      'embrayage',
      'amortisseurs-et-suspension (bureau)',
      'echappement (bureau)',
      'demarrage-et-charge (bureau)',
      'climatisation (bureau)',
      'eclairage (bureau)',
      'essuie-glaces (bureau)',
    ])
    expect(bande).toContain(
      '<p class="catalogue-bande__toutes"><a href="/pieces-et-reparations">Toutes les familles (18)</a></p>',
    )
  })

  it('l’offre de la bande ne dit que ce qui est publié : sans engagement confirmé, pas de pièce vérifiée', async () => {
    const production = bandeDe((await page(await servir('production'), '/')).html)
    expect(production).toContain(
      '<p class="catalogue-bande__offre">Vente au comptoir ou pose à l’atelier.</p>',
    )
    expect(production).not.toContain('vérifiée')

    const sansComptoir = documentCatalogue({
      vente_au_comptoir: { texte: 'Pièce seule.', statut: 'a_valider', source: 'proposition' },
    })
    expect(bandeDe((await page(await servir('production', sansComptoir), '/')).html)).toContain(
      '<p class="catalogue-bande__offre">Pose à l’atelier.</p>',
    )
  })

  it('en relecture, l’engagement encore à valider porte sa pastille dans la bande', async () => {
    const bande = bandeDe((await page(await servir('relecture'), '/')).html)
    expect(bande).toContain(
      '<p class="catalogue-bande__offre">Vente au comptoir ou pose à l’atelier, pièce vérifiée avant commande <span class="pastille catalogue-a-relire">À valider</span>.</p>',
    )
  })

  it('en pleine largeur : « Toutes les familles », les 18 cartes et leur figure', async () => {
    const { html } = await page(await servir('demonstration', 'donnees-du-site'), '/')
    const grille = html.slice(html.indexOf('accueil__zone--catalogue'))
    expect(grille).toContain('<p class="surtitre">Pièces détachées et réparations</p>')
    expect(grille).toContain('<h2 id="titre-catalogue-bloc">Toutes les familles</h2>')
    expect(
      grille.match(/<span class="carte-famille__planche"><svg class="carte-famille__dessin"/g),
    ).toHaveLength(18)
    const aides = [...grille.matchAll(/<span class="carte-famille__aide">([^<]+)<\/span>/g)].map(
      (c) => c[1] ?? '',
    )
    expect(aides).toHaveLength(18)
    for (const aide of aides) expect(aide.length, aide).toBeLessThanOrEqual(LONGUEUR_MAX_AIDE)
  })

  it('en production sans famille validée, la bande et la grille disent que la liste attend le garage', async () => {
    const { html } = await page(await servir('production', 'donnees-du-site'), '/')
    expect(html).toContain(
      '<h2 id="titre-recherche-pieces" class="catalogue-bande__titre">Pièces détachées</h2>',
    )
    expect(html).not.toContain('role="search"')
    expect(html).toContain(
      'La liste des pièces et réparations est en cours de confirmation avec le garage.',
    )
    expect(html.match(/href="\/demande\?type=devis">Demander un prix<\/a>/g)).toHaveLength(2)
  })
})

describe('catalogue : mode relecture', () => {
  it('marque les valeurs à valider et montre ce qu’il reste à obtenir', async () => {
    const app = await servir('relecture')
    const liste = await page(app, '/pieces-et-reparations')
    expect(liste.html).toContain(
      '<span class="carte-famille__nom">Climatisation <span class="pastille catalogue-a-relire">À valider</span></span>',
    )
    expect(liste.html).toContain('<span class="carte-famille__nom">Freinage</span>')
    expect(liste.html).toContain(
      '<li>Poids lourds <span class="pastille catalogue-a-relire">À valider</span></li>',
    )
    const batterie = await page(app, '/pieces-et-reparations/batterie')
    expect(batterie.html).toContain(
      '<p class="catalogue-a-relire-note"><span class="pastille catalogue-a-relire">À valider</span> Forfait à obtenir.</p>',
    )
  })

  it('sur les tarifs aussi, marque la famille encore à valider, pas celle que le garage a confirmée', async () => {
    const { html } = await page(await servir('relecture'), '/tarifs')
    expect(html).toContain(
      '<li><a href="/pieces-et-reparations/climatisation">Climatisation</a> <span class="pastille catalogue-a-relire">À valider</span></li>',
    )
    expect(html).toContain(
      '<th scope="row"><a class="catalogue-tarifs__famille" href="/pieces-et-reparations/freinage">Plaquettes avant</a></th>',
    )
  })

  it('un prix de démonstration porte en relecture sa pastille, sa note et sa source', async () => {
    const familles = [
      familleEssai('freinage', {
        libelle: 'Freinage',
        forfaits: [forfaitEssai('plaquettes', prixPropose())],
      }),
    ]
    const { html } = await page(
      await servir('relecture', documentCatalogue({ familles })),
      '/pieces-et-reparations/freinage',
    )
    expect(html).toContain(
      `<p class="catalogue-a-relire-note"><span class="pastille catalogue-a-relire">À valider</span> Montant proposé, à confirmer par le garagiste. Source\u00a0: ${SOURCE_PROPOSITION}.</p>`,
    )
    expect(html).not.toContain('catalogue-prix__proposition')
  })

  it('en production, aucune trace de relecture ni de statut ne parvient au public (piège 7)', async () => {
    const app = await servir('production')
    for (const url of [
      '/',
      '/pieces-et-reparations',
      '/pieces-et-reparations/batterie',
      '/tarifs',
    ]) {
      const { html } = await page(app, url)
      expect(html, url).not.toContain('À valider')
      expect(html, url).not.toContain('a_valider')
      expect(html, url).not.toContain('proposition')
      expect(html, url).not.toContain('Forfait à obtenir.')
    }
  })
})

describe('catalogue : ni stock, ni compatibilité, ni panier (US-28, US-29, AE-21 à AE-24)', () => {
  it.each(MODES_SITE)(
    'en %s, aucune page du catalogue ne porte une expression interdite ni un tiret long',
    async (mode) => {
      const app = await servir(mode, 'donnees-du-site')
      const liste = await page(app, '/pieces-et-reparations')
      const familles = [
        ...liste.html.matchAll(/href="(\/pieces-et-reparations\/[a-z0-9-]+)"/g),
      ].map((correspondance) => correspondance[1] ?? '')
      for (const url of [
        '/',
        '/pieces-et-reparations',
        '/tarifs',
        '/pieces-et-reparations/inconnue',
        ...familles,
      ]) {
        const { html } = await page(app, url)
        const texte = texteDe(html)
        expect(expressionsInterditesDans(texte.replace(PRIX_A_PARTIR_DE, '')), url).toEqual([])
        expect(texte, url).not.toMatch(/en stock|panier|compatible|payer/i)
        expect(html, url).not.toMatch(TIRETS_INTERDITS)
        expect(html, url).not.toMatch(/<input[^>]+type="file"/)
        const description = /<meta name="description" content="([^"]*)">/.exec(html)?.[1] ?? ''
        expect(description.length, url).toBeGreaterThan(0)
        expect(description.length, url).toBeLessThanOrEqual(LONGUEUR_MAX_DESCRIPTION)
      }
    },
  )
})

describe('catalogue : textes du fichier rendus comme du texte, jamais comme du HTML', () => {
  const INJECTION = '<script>alert(1)</script>'
  const ATTRIBUT = '" autofocus onfocus="alert(1)'

  it('échappe chaque texte d’une famille sur la liste, la page de famille, les tarifs et l’accueil', async () => {
    const familles = [
      familleEssai('freinage', {
        libelle: `Frein ${INJECTION}`,
        mots_courants: [`plaquettes ${INJECTION}`, 'disques'],
        role: `Le freinage arrête la voiture ${ATTRIBUT}.`,
        signes_usure: [`Grincement ${INJECTION}`],
        ce_que_fait_le_garage: `Nous remplaçons ${INJECTION}`,
        forfaits: [
          {
            identifiant: 'plaquettes',
            intitule: `Plaquettes ${INJECTION}`,
            prix: prixValide({
              vehicule_reference: `citadine ${INJECTION}`,
              comprend: `plaquettes ${INJECTION}`,
            }),
          },
        ],
      }),
    ]
    const app = await servir(
      'demonstration',
      documentCatalogue({
        familles,
        ce_que_nous_ne_faisons_pas: [
          { libelle: `Carrosserie ${INJECTION}`, statut: 'a_valider', source: 'proposition' },
        ],
      }),
    )
    for (const url of [
      '/',
      '/pieces-et-reparations',
      '/pieces-et-reparations/freinage',
      '/tarifs',
    ]) {
      const { statut, html } = await page(app, url)
      expect(statut, url).toBe(200)
      expect(html, url).not.toContain('<script>alert(1)')
      expect(html, url).not.toContain(' onfocus="alert(1)')
      expect(html, url).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    }
    const { html: fiche } = await page(app, '/pieces-et-reparations/freinage')
    expect(fiche).toContain('&quot; autofocus onfocus=&quot;alert(1)')
  })
})

describe('catalogue : vente au comptoir (arbitrage 4 du Kano)', () => {
  it('la page de famille présente deux offres claires, retrait au garage et pose à l’atelier', async () => {
    const { html } = await page(await servir('production'), '/pieces-et-reparations/freinage')
    expect(html).toContain(
      '<h2 id="catalogue-titre-offres" class="titre-carte">Retrait ou pose\u00a0: à vous de choisir</h2>',
    )
    expect(html).toMatch(
      /<h3 class="catalogue-offre__titre">Retrait au garage<\/h3>\s*<p>Vous pouvez aussi acheter la pièce seule et la retirer au garage.<\/p>/,
    )
    expect(html).toMatch(
      /<h3 class="catalogue-offre__titre">Pose à l’atelier<\/h3>\s*<p>Nous remplaçons les plaquettes usées.<\/p>/,
    )
    expect(html).toContain(
      'choisissez «\u00a0<a href="/demande?type=devis&amp;famille=freinage&amp;modalite=retrait">Retrait au garage</a>\u00a0» ou «\u00a0<a href="/demande?type=devis&amp;famille=freinage&amp;modalite=pose">Pose à l’atelier</a>\u00a0»',
    )
  })

  it('la vérification avant commande s’affiche dès que l’engagement est publié', async () => {
    const production = await page(await servir('production'), '/pieces-et-reparations/freinage')
    expect(production.html).not.toContain('Vérifiée avant commande.')
    const demonstration = await page(
      await servir('demonstration'),
      '/pieces-et-reparations/freinage',
    )
    expect(demonstration.html).toContain(
      '<p class="catalogue-verification"><strong>Vérifiée avant commande.</strong> Nous vérifions la pièce avant de la commander, puis nous la posons.</p>',
    )
  })

  it('la liste des familles le dit aussi, sous « Retrait au garage ou pose à l’atelier »', async () => {
    const { html } = await page(await servir('production'), '/pieces-et-reparations')
    expect(html).toContain(
      '<h2 id="catalogue-titre-retrait" class="titre-carte">Retrait au garage ou pose à l’atelier</h2>',
    )
    expect(html).toContain(
      '<p>Vous pouvez aussi acheter la pièce seule et la retirer au garage.</p>',
    )
  })

  it('une vente au comptoir à valider n’apparaît nulle part en production', async () => {
    const document = documentCatalogue({
      vente_au_comptoir: {
        texte: 'Vous pouvez aussi acheter la pièce seule et la retirer au garage.',
        statut: 'a_valider',
        source: 'proposition',
      },
    })
    const app = await servir('production', document)
    for (const url of ['/', '/pieces-et-reparations', '/pieces-et-reparations/freinage']) {
      const { html } = await page(app, url)
      expect(html, url).not.toContain('retirer au garage')
      expect(html, url).not.toContain('Retrait au garage')
    }
    expect((await page(app, '/pieces-et-reparations/freinage')).html).toContain(
      '<h2 id="catalogue-titre-offres" class="titre-carte">Pose à l’atelier</h2>',
    )
  })

  it('sur les vraies données, la vente au comptoir est publiée, décision d’Anthony du 2026-09-23', async () => {
    const { html } = await page(
      await servir('demonstration', 'donnees-du-site'),
      '/pieces-et-reparations/freinage',
    )
    expect(html).toContain('<h3 class="catalogue-offre__titre">Retrait au garage</h3>')
    expect(html).toContain('Vous pouvez aussi acheter la pièce seule et la retirer au garage.')
    expect(html).toContain('nous vérifions qu’elle convient à votre véhicule')
  })

  it('une prestation n’offre pas la pièce seule : ni retrait, ni vérification, ni gamme', async () => {
    const { html } = await page(
      await servir('demonstration'),
      '/pieces-et-reparations/climatisation',
    )
    expect(html).toContain(
      '<h2 id="catalogue-titre-offres" class="titre-carte">Ce que fait l’atelier</h2>',
    )
    expect(html).not.toContain('Retrait au garage')
    expect(html).not.toContain('acheter la pièce seule')
    expect(html).not.toContain('Vérifiée avant commande.')
    expect(html).not.toContain('d’occasion')
    expect(html).not.toContain('modalite=')
  })
})

describe('catalogue : capacités offertes aux autres contextes', () => {
  it('trouverFamille suit le mode : rien en production tant que le garage n’a rien confirmé', async () => {
    const production = await assemblerCatalogue({
      mode: 'production',
      cheminDonnees: DONNEES_DU_SITE,
      garage: GARAGE,
      preDiagnosticPublie: true,
    })
    expect(await production.trouverFamille('freinage')).toBeNull()
    const demonstration = await assemblerCatalogue({
      mode: 'demonstration',
      cheminDonnees: DONNEES_DU_SITE,
      garage: GARAGE,
      preDiagnosticPublie: true,
    })
    // Pièces à cocher au pluriel et côté (données du catalogue, pas les repères de la figure),
    // prix indicatif prêt à afficher (J6).
    expect(await demonstration.trouverFamille('freinage')).toEqual({
      identifiant: 'freinage',
      libelle: 'Freinage',
      ventePieceSeule: true,
      piecesDOccasion: false,
      pieces: [
        'Plaquettes avant',
        'Plaquettes arrière',
        'Disques avant',
        'Disques arrière',
        'Étriers',
      ],
      prixIndicatif: `dès 89,00${INSECABLE}€${INSECABLE}TTC`,
    })
    expect(await demonstration.trouverFamille('diagnostic-electronique')).toEqual({
      identifiant: 'diagnostic-electronique',
      libelle: 'Diagnostic électronique',
      ventePieceSeule: false,
      piecesDOccasion: false,
      prestations: ['Diagnostic électronique'],
      prixDesPrestations: {
        'Diagnostic électronique': `dès 49,00${INSECABLE}€${INSECABLE}TTC`,
      },
      prixIndicatif: `dès 49,00${INSECABLE}€${INSECABLE}TTC`,
    })
    // Deux prestations d'une même famille : chacune son prix, jamais celui de la famille.
    expect(
      (await demonstration.trouverFamille('vidange-et-filtres'))?.prixDesPrestations,
    ).toMatchObject({
      Vidange: `dès 69,00${INSECABLE}€${INSECABLE}TTC`,
      Révision: `dès 129,00${INSECABLE}€${INSECABLE}TTC`,
    })
    expect(await demonstration.trouverFamille('carrosserie')).toMatchObject({
      prixIndicatif: 'sur devis après examen',
    })
    expect(await demonstration.trouverFamille('batterie')).toMatchObject({
      piecesDOccasion: true,
      pieces: ['Batterie', 'Cosses'],
    })
    expect(await demonstration.trouverFamille('vidange-et-filtres')).toMatchObject({
      prestations: ['Vidange', 'Révision'],
    })
    expect(await demonstration.trouverFamille('inconnue')).toBeNull()
  })

  it('liste « Ce que nous ne faisons pas » selon le mode, pour le formulaire de demande', async () => {
    const dossier = await dossierAvec(documentCatalogue())
    const production = await assemblerCatalogue({
      mode: 'production',
      cheminDonnees: dossier.chemin,
      garage: GARAGE,
      preDiagnosticPublie: true,
    })
    expect(await production.listerCeQueNousNeFaisonsPas()).toEqual(['Carrosserie et peinture'])
    const demonstration = await assemblerCatalogue({
      mode: 'demonstration',
      cheminDonnees: dossier.chemin,
      garage: GARAGE,
      preDiagnosticPublie: true,
    })
    expect(await demonstration.listerCeQueNousNeFaisonsPas()).toEqual([
      'Carrosserie et peinture',
      'Poids lourds',
    ])
  })

  it('offre au garage les prix du socle depuis la seule source des prix (AE-05)', async () => {
    const dossier = await dossierAvec(documentCatalogue())
    const catalogue = await assemblerCatalogue({
      mode: 'production',
      cheminDonnees: dossier.chemin,
      garage: GARAGE,
      preDiagnosticPublie: true,
    })
    const tarifs = await catalogue.consulterTarifsDuSocle()
    expect(tarifs).toEqual({
      tauxHoraire: {
        montant: `65,00${INSECABLE}€${INSECABLE}TTC`,
        gratuit: false,
        comprend: 'une heure de main-d’œuvre, pièces en sus',
        dateEffet: '1er octobre 2026',
        duree: null,
        deduitDeLaReparation: null,
        aValider: false,
      },
      premierControle: {
        montant: 'Gratuit',
        gratuit: true,
        comprend: 'écoute du bruit et essai sur place',
        dateEffet: '1er octobre 2026',
        duree: '30 minutes environ',
        deduitDeLaReparation: false,
        aValider: false,
      },
      exemples: [],
    })
    const app = await creerServeurEssai([catalogue.module])
    aFermer.push(app)
    expect((await page(app, '/tarifs')).html).toContain(tarifs.tauxHoraire?.montant ?? 'absent')
  })

  it('sur les vraies données : aucun prix du socle en production, les prix de démonstration ailleurs', async () => {
    const monterEn = (mode: ModeSite) =>
      assemblerCatalogue({
        mode,
        cheminDonnees: DONNEES_DU_SITE,
        garage: GARAGE,
        preDiagnosticPublie: true,
      })
    expect(await (await monterEn('production')).consulterTarifsDuSocle()).toEqual({
      tauxHoraire: null,
      premierControle: null,
      exemples: [],
    })
    const demonstration = await (await monterEn('demonstration')).consulterTarifsDuSocle()
    expect(demonstration.premierControle).toMatchObject({
      montant: `29,00${INSECABLE}€${INSECABLE}TTC`,
      duree: '30 minutes environ',
      deduitDeLaReparation: true,
      aValider: true,
    })
    expect(demonstration.exemples.map((exemple) => [exemple.intitule, exemple.montant])).toEqual([
      ['Vidange', `À partir de 69,00${INSECABLE}€${INSECABLE}TTC`],
      ['Révision', `À partir de 129,00${INSECABLE}€${INSECABLE}TTC`],
      ['Plaquettes avant posées', `À partir de 89,00${INSECABLE}€${INSECABLE}TTC`],
    ])
  })

  it('offre aux demandes l’engagement de vérification des pièces, selon le mode (US-28)', async () => {
    const dossier = await dossierAvec(documentCatalogue())
    const monterEn = (mode: ModeSite) =>
      assemblerCatalogue({
        mode,
        cheminDonnees: dossier.chemin,
        garage: GARAGE,
        preDiagnosticPublie: true,
      })
    expect(await (await monterEn('production')).consulterOffrePieces()).toEqual({
      engagementVerification: null,
      venteAuComptoir: true,
    })
    expect(await (await monterEn('demonstration')).consulterOffrePieces()).toEqual({
      engagementVerification: 'Nous vérifions la pièce avant de la commander, puis nous la posons.',
      venteAuComptoir: true,
    })
  })

  it('recense les données bloquantes encore à valider des vraies données', async () => {
    const { donneesBloquantesAValider } = await assemblerCatalogue({
      mode: 'production',
      cheminDonnees: DONNEES_DU_SITE,
      garage: GARAGE,
      preDiagnosticPublie: true,
    })
    expect(donneesBloquantesAValider).toEqual([
      expect.stringMatching(
        /^Familles d’intervention à confirmer par le garage : Freinage, Batterie, Pneus, /,
      ),
      'Prix de démonstration à confirmer par le garage ou à retirer avant la mise en ligne : Taux horaire de main-d’œuvre, Premier contrôle à l’atelier, Plaquettes avant posées, Batterie posée, Pneu monté et équilibré, Géométrie (parallélisme), Vidange, Révision, Recharge de climatisation, Diagnostic électronique, Réparation de carrosserie',
    ])
  })

  it('refuse de s’assembler sur un fichier invalide : le serveur ne démarre pas', async () => {
    const dossier = await dossierAvec(documentCatalogue({ familles: 'aucune' }))
    await expect(
      assemblerCatalogue({
        mode: 'production',
        cheminDonnees: dossier.chemin,
        garage: GARAGE,
        preDiagnosticPublie: true,
      }),
    ).rejects.toThrow(/familles : liste attendue/)
  })
})

describe('catalogue : une recherche qui décrit un symptôme', () => {
  it('propose d’abord le pré-diagnostic, puis la seule famille utile (les mots vides ne comptent pas)', async () => {
    const { html } = await page(
      await servir('demonstration', 'donnees-du-site'),
      `/pieces-et-reparations?q=${encodeURIComponent('freins qui grincent')}`,
    )
    const zone = html.slice(
      html.indexOf('id="recherche"'),
      html.indexOf('catalogue-titre-familles'),
    )
    const symptome = zone.indexOf('catalogue-symptome')
    expect(symptome).toBeGreaterThan(0)
    expect(zone).toContain(
      '<p><a class="bouton bouton--principal" href="/pre-diagnostic">Faire le pré-diagnostic</a></p>',
    )
    expect(symptome).toBeLessThan(zone.indexOf('catalogue-resultats'))
    const trouvees = [
      ...zone.matchAll(
        /<h3 class="catalogue-resultat__nom"><a href="\/pieces-et-reparations\/([a-z-]+)"/g,
      ),
    ].map((c) => c[1])
    expect(trouvees).toEqual(['freinage'])
  })

  it('sans pré-diagnostic publié, propose l’appel au garage', async () => {
    const { html } = await page(
      await servir('production', documentCatalogue(), false),
      '/pieces-et-reparations?q=voyant',
    )
    const principal = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
    expect(principal).toContain('catalogue-symptome')
    expect(principal).toContain(
      `<a class="bouton bouton--principal" href="${GARAGE.telephone.lien}">Appeler le ${GARAGE.telephone.affichable}</a>`,
    )
    expect(principal).not.toContain('href="/pre-diagnostic"')
  })

  it('une recherche de pièce ne montre pas l’encart du symptôme', async () => {
    const { html } = await page(await servir('production'), '/pieces-et-reparations?q=plaquettes')
    expect(html).not.toContain('catalogue-symptome')
  })
})

describe('catalogue : gamme de pièce et vérification, une seule fois par page', () => {
  it('« Avant de commander une pièce » ne paraît qu’une fois sur chaque page du catalogue', async () => {
    const app = await servir('demonstration', 'donnees-du-site')
    const liste = await page(app, '/pieces-et-reparations')
    const familles = [
      ...liste.html.matchAll(
        /<a class="carte-famille" href="(\/pieces-et-reparations\/[a-z0-9-]+)"/g,
      ),
    ].map((c) => c[1] ?? '')
    for (const url of [
      '/',
      '/pieces-et-reparations',
      '/pieces-et-reparations?q=plaquettes',
      '/tarifs',
      ...familles,
    ]) {
      const { html } = await page(app, url)
      expect(occurrences(html, 'Avant de commander une pièce'), url).toBeLessThanOrEqual(1)
      expect(occurrences(html, 'convient à votre véhicule'), url).toBeLessThanOrEqual(1)
    }
    expect(occurrences(liste.html, 'Avant de commander une pièce')).toBe(1)
  })

  it('jamais d’occasion pour un organe que la loi exclut du réemploi : pièces neuves uniquement', async () => {
    const app = await servir('demonstration', 'donnees-du-site')
    for (const identifiant of ORGANES_EXCLUS) {
      const { html } = await page(app, `/pieces-et-reparations/${identifiant}`)
      expect(html, identifiant).toContain('<strong>Pièces neuves uniquement.</strong>')
      expect(html, identifiant).toContain('<a href="/vos-droits">vos droits</a>')
      expect(html, identifiant).not.toContain('d’occasion ou reconditionnée')
    }
    const freinage = await page(app, '/pieces-et-reparations/freinage')
    expect(texteDe(freinage.html)).toContain(
      'La loi ne prévoit pas de pièces d’occasion pour le freinage',
    )
    const batterie = await page(app, '/pieces-et-reparations/batterie')
    expect(batterie.html).toContain(
      'neuve, d’occasion ou reconditionnée (pièce issue de l’économie circulaire), ou sans préférence.',
    )
  })
})

describe('catalogue : aucune image cassée', () => {
  it('chaque dessin et chaque image cités par une page du catalogue existent dans public/', async () => {
    const app = await servir('demonstration', 'donnees-du-site')
    const liste = await page(app, '/pieces-et-reparations')
    const familles = [
      ...liste.html.matchAll(
        /<a class="carte-famille" href="(\/pieces-et-reparations\/[a-z0-9-]+)"/g,
      ),
    ].map((c) => c[1] ?? '')
    const images = new Set<string>()
    for (const url of [
      '/',
      '/pieces-et-reparations',
      '/tarifs',
      '/pieces-et-reparations/inconnue',
      ...familles,
    ]) {
      const { html } = await page(app, url)
      for (const [, cible] of html.matchAll(/<use href="(\/[^"#]+)#[^"]*"/g))
        images.add(cible ?? '')
      for (const [, cible] of html.matchAll(/<img[^>]+src="(\/[^"?]+)/g)) images.add(cible ?? '')
    }
    expect(images.size).toBeGreaterThanOrEqual(18)
    for (const image of images) {
      await expect(readFile(resolve(RACINE_PUBLIC, `.${image}`)), image).resolves.toBeDefined()
    }
  })
})
