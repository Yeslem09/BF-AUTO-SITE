import { describe, expect, it } from 'vitest'
import { brut, echapper, ErreurGabarit, estHtml, html, type Interpolable } from './html.js'

const rendu = (fragment: { toString(): string }): string => fragment.toString()

describe('gabarit html : échappement du texte', () => {
  it('neutralise une balise injectée dans le contenu', () => {
    const saisie = '<script>alert("x")</script>'
    expect(rendu(html`<p>${saisie}</p>`)).toBe(
      '<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>',
    )
  })

  it("échappe l'esperluette sans toucher au reste", () => {
    expect(rendu(html`<p>${'Pneus & freins'}</p>`)).toBe('<p>Pneus &amp; freins</p>')
  })

  it('rend les nombres, y compris zéro', () => {
    expect(rendu(html`<p>${0} ${42.5}</p>`)).toBe('<p>0 42.5</p>')
  })

  it('ne rend rien pour null, undefined et false', () => {
    const absent: string | null = null
    const inconnu: string | undefined = undefined
    const condition = false as boolean
    expect(rendu(html`<p>${absent}${inconnu}${condition && html`<b>oui</b>`}</p>`)).toBe('<p></p>')
  })

  it('refuse une valeur qui ne se rend pas en texte', () => {
    const objet = { cle: 'valeur' } as unknown as Interpolable
    expect(() => html`<p>${objet}</p>`).toThrow(ErreurGabarit)
  })
})

describe('gabarit html : attributs', () => {
  it('neutralise un guillemet double qui tenterait de fermer un attribut', () => {
    const saisie = '" onmouseover="alert(1)'
    expect(rendu(html`<a title="${saisie}">x</a>`)).toBe(
      '<a title="&quot; onmouseover=&quot;alert(1)">x</a>',
    )
  })

  it('neutralise un guillemet simple dans un attribut entre apostrophes', () => {
    expect(rendu(html`<a title='${"' onfocus='x"}'>x</a>`)).toBe(
      "<a title='&#39; onfocus=&#39;x'>x</a>",
    )
  })

  it('refuse une valeur d’attribut sans guillemets', () => {
    expect(() => html`<a title=${'x onmouseover=alert(1)'}>x</a>`).toThrow(/sans guillemets/)
  })

  it('accepte un signe égal dans le texte hors balise', () => {
    expect(rendu(html`<p>Total = ${12}</p>`)).toBe('<p>Total = 12</p>')
  })
})

describe('gabarit html : adresses', () => {
  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
  ])('refuse le schéma dangereux %j au début d’un href', (adresse) => {
    expect(() => html`<a href="${adresse}">x</a>`).toThrow(ErreurGabarit)
  })

  it('contrôle aussi src et action', () => {
    expect(() => html`<img src="${'javascript:x'}" alt="">`).toThrow(ErreurGabarit)
    expect(() => html`<form action="${'javascript:x'}"></form>`).toThrow(ErreurGabarit)
  })

  it.each([
    '/pieces-et-reparations',
    '#contenu',
    '?piece=12',
    'https://www.google.com/maps/dir/?api=1&destination=Choisy',
    'http://exemple.fr',
    'mailto:contact@exemple.fr',
    'tel:+33605922838',
    'sms:+33605922838?body=Bonjour, voici mon voyant.',
    'catalogue/freins',
  ])('accepte l’adresse %j', (adresse) => {
    expect(rendu(html`<a href="${adresse}">x</a>`)).toContain(`href="${echapper(adresse)}"`)
  })

  it('ne contrôle pas le schéma quand le début de l’adresse est déjà écrit', () => {
    expect(rendu(html`<a href="/demande?famille=${'javascript:1'}">x</a>`)).toBe(
      '<a href="/demande?famille=javascript:1">x</a>',
    )
  })

  it('contrôle chaque élément d’un tableau placé en début d’adresse', () => {
    expect(() => html`<a href="${['', 'javascript:x']}">x</a>`).toThrow(ErreurGabarit)
  })
})

describe('gabarit html : éléments script et style', () => {
  it('refuse toute interpolation dans un élément script', () => {
    expect(() => html`<script>const x = "${'a'}"</script>`).toThrow(/script ou style/)
  })

  it('refuse toute interpolation dans un élément style', () => {
    expect(() => html`<style>p { color: ${'red'} }</style>`).toThrow(ErreurGabarit)
  })

  it('accepte une interpolation après un élément script refermé', () => {
    expect(rendu(html`<script src="/js/a.js"></script><p>${'ok'}</p>`)).toBe(
      '<script src="/js/a.js"></script><p>ok</p>',
    )
  })
})

describe('gabarit html : lecture du HTML statique', () => {
  it('ignore une apostrophe dans un commentaire', () => {
    expect(rendu(html`<!-- bandeau d'accroche --><p>${'<b>'}</p>`)).toBe(
      "<!-- bandeau d'accroche --><p>&lt;b&gt;</p>",
    )
  })

  it('ignore un chevron fermant écrit dans une valeur d’attribut', () => {
    expect(() => html`<a title="a > b" href="${'javascript:x'}">x</a>`).toThrow(ErreurGabarit)
  })

  it('accepte un attribut interpolé en position de nom, échappé', () => {
    expect(rendu(html`<input ${'required'}>`)).toBe('<input required>')
  })

  it('traite le texte après une balise fermante comme du texte', () => {
    expect(rendu(html`<p>a</p>${'<i>'}`)).toBe('<p>a</p>&lt;i&gt;')
  })
})

describe('gabarit html : fragments et tableaux', () => {
  it('insère un fragment Html sans le rééchapper', () => {
    const interieur = html`<em>${'a < b'}</em>`
    expect(rendu(html`<p>${interieur}</p>`)).toBe('<p><em>a &lt; b</em></p>')
  })

  it('rend un tableau de fragments dans l’ordre', () => {
    const elements = ['un', 'deux', '<trois>'].map((texte) => html`<li>${texte}</li>`)
    expect(rendu(html`<ul>${elements}</ul>`)).toBe(
      '<ul><li>un</li><li>deux</li><li>&lt;trois&gt;</li></ul>',
    )
  })

  it('aplatit les tableaux imbriqués en échappant chaque chaîne', () => {
    const imbrique: Interpolable = [['<a>', [html`<b>gras</b>`, null]], 3, false]
    expect(rendu(html`<p>${imbrique}</p>`)).toBe('<p>&lt;a&gt;<b>gras</b>3</p>')
  })

  it('rend un tableau vide comme une chaîne vide', () => {
    expect(rendu(html`<ul>${[]}</ul>`)).toBe('<ul></ul>')
  })

  it('brut insère le HTML de confiance tel quel', () => {
    const logo = brut('<svg aria-hidden="true"><path d="M0 0h1"/></svg>')
    expect(estHtml(logo)).toBe(true)
    expect(rendu(html`<a href="/">${logo}</a>`)).toBe(
      '<a href="/"><svg aria-hidden="true"><path d="M0 0h1"/></svg></a>',
    )
  })

  it('distingue une chaîne d’un fragment Html', () => {
    expect(estHtml('<b>x</b>')).toBe(false)
    expect(estHtml(html`<b>x</b>`)).toBe(true)
  })

  it('rend le même gabarit appelé plusieurs fois avec des valeurs différentes', () => {
    const ligne = (texte: string) => html`<li title="${texte}">${texte}</li>`
    expect(rendu(ligne('a'))).toBe('<li title="a">a</li>')
    expect(rendu(ligne('"b"'))).toBe('<li title="&quot;b&quot;">&quot;b&quot;</li>')
  })
})
