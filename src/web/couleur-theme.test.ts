import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { lireCouleurTheme, lireCouleurThemeDuFichier } from './couleur-theme.js'

describe('couleur de thème lue dans la feuille de style', () => {
  it('suit les var() jusqu’à la couleur de la palette', () => {
    const feuille =
      ':root{--couleur-marque-profond: #233f35;--couleur-theme: var(--couleur-marque-profond)}'
    expect(lireCouleurTheme(feuille)).toBe('#233f35')
  })

  it('ne retient que la première déclaration (celle de :root), pas celle d’une zone', () => {
    const feuille = ':root{--a:#111111;--couleur-theme:var(--a)}.zone{--a:#222222}'
    expect(lireCouleurTheme(feuille)).toBe('#111111')
  })

  it('renvoie null pour un jeton absent, une boucle ou une valeur qui n’est pas hexadécimale', () => {
    expect(lireCouleurTheme(':root{--autre:#fff}')).toBeNull()
    expect(lireCouleurTheme(':root{--couleur-theme:var(--b);--b:var(--couleur-theme)}')).toBeNull()
    expect(lireCouleurTheme(':root{--couleur-theme:rgb(0 0 0)}')).toBeNull()
  })

  it('lit le fichier, et renvoie null s’il manque', async () => {
    const dossier = await mkdtemp(join(tmpdir(), 'bf-auto-theme-'))
    const fichier = join(dossier, 'bf-auto.css')
    await writeFile(fichier, ':root{--couleur-theme:#233f35}')
    expect(lireCouleurThemeDuFichier(fichier)).toBe('#233f35')
    expect(lireCouleurThemeDuFichier(join(dossier, 'absent.css'))).toBeNull()
    await rm(dossier, { recursive: true, force: true })
  })
})
