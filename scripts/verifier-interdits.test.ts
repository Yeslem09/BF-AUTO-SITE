import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { analyserContenu, verifier } from './verifier-interdits.mjs'

// Construits par point de code : ce fichier de test ne doit pas lui-même échouer à la porte.
const CADRATIN = String.fromCodePoint(0x2014)
const DEMI_CADRATIN = String.fromCodePoint(0x2013)
const VOITURE = String.fromCodePoint(0x1f697)
const COCHE = String.fromCodePoint(0x2705)
const DRAPEAU_FRANCE = String.fromCodePoint(0x1f1eb, 0x1f1f7)

const motifs = (chemin: string, contenu: string) =>
  analyserContenu(chemin, contenu).map((faute) => `${faute.ligne} ${faute.motif}`)

describe('porte des interdits : tirets', () => {
  it('signale le cadratin et le demi-cadratin avec la ligne', () => {
    expect(motifs('docs/note.md', `ok\nun ${CADRATIN} deux\n3 ${DEMI_CADRATIN} 4`)).toEqual([
      '2 tiret cadratin (U+2014) interdit',
      '3 tiret demi-cadratin (U+2013) interdit',
    ])
  })

  it('accepte le trait d’union ordinaire', () => {
    expect(motifs('src/a.ts', 'const code-postal = "Choisy-le-Roi"')).toEqual([])
  })
})

describe('porte des interdits : emoji', () => {
  it.each([VOITURE, COCHE, DRAPEAU_FRANCE])('signale %s dans le code du site', (emoji) => {
    expect(analyserContenu('src/web/vue.ts', `const titre = "Garage ${emoji}"`)).not.toHaveLength(0)
  })

  it('signale un emoji dans les données et les fichiers publics', () => {
    expect(motifs('donnees/garage.json', `{"nom": "BF ${VOITURE}"}`)).toEqual([
      '1 emoji ou pictogramme (U+1F697) interdit',
    ])
    expect(analyserContenu('public/css/site.css', `/* ${COCHE} */`)).toHaveLength(1)
  })

  it('tolère les signes typographiques ©, ® et ™', () => {
    const signes = [0xa9, 0xae, 0x2122].map((code) => String.fromCodePoint(code)).join(' ')
    expect(analyserContenu('src/a.ts', signes)).toEqual([])
  })

  it('ne cherche pas d’emoji hors du code, des données et des fichiers publics', () => {
    expect(analyserContenu('docs/recherche/notes.md', VOITURE)).toEqual([])
  })
})

describe('porte des interdits : ombres et halos', () => {
  it('signale une ombre portée et accepte box-shadow: none', () => {
    const css = '.carte { box-shadow: 0 2px 8px rgb(0 0 0 / 20%); }\n.a { box-shadow: none; }'
    expect(motifs('public/css/site.css', css)).toEqual([
      '1 box-shadow « 0 2px 8px rgb(0 0 0 / 20%) » interdit (ni ombre ni halo, seul none est admis)',
    ])
  })

  it('signale une ombre passée par une variable', () => {
    expect(
      analyserContenu('src/contextes/x/adaptateurs/web/styles.css', 'a{box-shadow:var(--ombre)}'),
    ).toHaveLength(1)
  })

  it('signale text-shadow et drop-shadow', () => {
    expect(
      motifs(
        'public/css/site.css',
        'h1 { text-shadow: 0 0 2px red; }\nimg { filter: drop-shadow(0 0 4px); }',
      ),
    ).toEqual(['1 text-shadow interdit', '2 filtre drop-shadow interdit (halo)'])
  })

  it('ne contrôle les styles que dans les feuilles du site', () => {
    expect(analyserContenu('docs/logo/planche.css', 'a{box-shadow:0 0 1px red}')).toEqual([])
    expect(analyserContenu('src/a.ts', 'const css = "box-shadow: 0 0 1px"')).toEqual([])
  })
})

describe('porte des interdits : SVG publics', () => {
  it('refuse un élément texte dans un SVG public', () => {
    expect(motifs('public/img/logo.svg', '<svg><text x="0">BF</text></svg>')).toEqual([
      '1 élément <text> interdit dans un SVG public (tracer les lettres en chemins)',
    ])
  })

  it('accepte un SVG en chemins et un élément texte hors du dossier public', () => {
    expect(analyserContenu('public/favicon.svg', '<svg><path d="M0 0h4"/></svg>')).toEqual([])
    expect(analyserContenu('docs/logo/essai.svg', '<svg><text>BF</text></svg>')).toEqual([])
  })
})

describe('porte des interdits : parcours du dépôt', () => {
  it('contrôle les fichiers suivis et nouveaux, ignore les binaires et les exclusions', async () => {
    const depot = await mkdtemp(join(tmpdir(), 'bf-auto-interdits-'))
    execFileSync('git', ['init', '-q'], { cwd: depot })
    await writeFile(join(depot, '.gitignore'), 'ignore/\n')
    await writeFile(join(depot, 'propre.md'), 'rien à redire')
    await writeFile(join(depot, 'fautif.md'), `a ${CADRATIN} b`)
    await writeFile(join(depot, 'image.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0]))
    execFileSync('mkdir', [
      '-p',
      join(depot, 'ignore'),
      join(depot, 'docs/recherche/captures'),
      join(depot, 'docs/jury/passe-1'),
    ])
    await writeFile(join(depot, 'ignore/cache.md'), CADRATIN)
    await writeFile(join(depot, 'docs/recherche/captures/page.html'), CADRATIN)
    // Pièces du jury : textes relevés sur d'autres sites, scripts jetables.
    await writeFile(join(depot, 'docs/jury/passe-1/releve.txt'), DEMI_CADRATIN)

    const { fautes, controles } = verifier(depot)
    await rm(depot, { recursive: true, force: true })
    expect(controles).toBe(3)
    expect(fautes).toEqual([
      { fichier: 'fautif.md', ligne: 1, motif: 'tiret cadratin (U+2014) interdit' },
    ])
  })
})
