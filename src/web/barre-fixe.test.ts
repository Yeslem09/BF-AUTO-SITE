import { describe, expect, it } from 'vitest'
import type { EtatOuverture } from '../contrats/index.js'
import { actionsBarreFixe, momentDuRappel, rendreBarreFixe } from './barre-fixe.js'
import { CADRE_ESSAI } from './essai.js'
import type { CadrePage } from './page.js'

const ITINERAIRE =
  'https://www.google.com/maps/dir/?api=1&destination=7%20rue%20Demanieux%2C%2094600%20Choisy-le-Roi'
/** Lien de rappel qu'une page fournit (résultat du pré-diagnostic, par exemple). */
const RAPPEL_DE_LA_PAGE = '/demande?type=rappel&prediagnostic=K7PQ2'

function cadre(etat: EtatOuverture, libelle: string): CadrePage {
  return { ...CADRE_ESSAI, statut: { etat, libelle } }
}

describe('barre fixe : l’action utile du moment, calculée depuis le statut', () => {
  it('ouvert : appeler (numéro en chiffres), puis l’itinéraire', () => {
    const { principale, secondaire } = actionsBarreFixe(cadre('ouvert', 'Ouvert, ferme à 19 h'))
    expect(principale).toEqual({
      libelle: 'Appeler',
      precision: '06 05 92 28 38',
      lien: 'tel:+33605922838',
      appel: true,
    })
    expect(secondaire).toEqual({
      libelle: 'Itinéraire',
      precision: '7 rue Demanieux',
      lien: ITINERAIRE,
      appel: false,
    })
  })

  it('fermé : être rappelé en principal, avec le moment du rappel ; appeler en secondaire', () => {
    const { principale, secondaire } = actionsBarreFixe(cadre('ferme', 'Fermé, ouvre demain à 9 h'))
    expect(principale).toEqual({
      libelle: 'Être rappelé',
      precision: 'demain 9 h',
      lien: '/demande?type=rappel',
      appel: false,
    })
    expect(secondaire.lien).toBe('tel:+33605922838')
    expect(secondaire.precision).toBe('06 05 92 28 38')
  })

  it('horaires à confirmer : appeler d’abord, être rappelé sinon, jamais d’itinéraire', () => {
    const { principale, secondaire } = actionsBarreFixe(
      cadre('a-confirmer', 'Horaires à confirmer'),
    )
    expect(principale.lien).toBe('tel:+33605922838')
    expect(secondaire).toEqual({
      libelle: 'Être rappelé',
      precision: null,
      lien: '/demande?type=rappel',
      appel: false,
    })
  })
})

describe('barre fixe : un moment de rappel qui tient sur une ligne de 320 px', () => {
  it('dit quand le rappel devient possible, sans répéter « Fermé »', () => {
    const cas: readonly [string, string][] = [
      ['Fermé, ouvre à 8 h 30', 'dès 8 h 30'],
      ['Fermé, rouvre à 14 h', 'dès 14 h'],
      ['Fermé, ouvre demain à 8 h 30', 'demain 8 h 30'],
      ['Fermé exceptionnellement, ouvre demain à 8 h 30', 'demain 8 h 30'],
      ['Fermé, ouvre lundi à 9 h', 'lundi 9 h'],
      ['Fermé exceptionnellement, ouvre vendredi à 14 h 30', 'vendredi 14 h 30'],
      ['Fermé, ouvre demain vendredi à 8 h 30', 'vendredi 8 h 30'],
      ['Fermé, ouvre le lundi 24 août à 8 h 30', 'le 24 août'],
    ]
    for (const [libelle, attendu] of cas) expect(momentDuRappel(libelle), libelle).toBe(attendu)
  })

  it('lit aussi un libellé déjà composé (espaces insécables)', () => {
    expect(momentDuRappel('Fermé, ouvre demain à 8 h 30')).toBe('demain 8 h 30')
  })

  it('reprend tel quel un libellé d’une autre forme : la barre le coupe proprement', () => {
    for (const libelle of [
      'Fermé exceptionnellement aujourd’hui',
      'Fermé',
      'Fermé jusqu’à lundi',
    ]) {
      expect(momentDuRappel(libelle), libelle).toBe(libelle)
    }
  })

  it('le statut long d’une fermeture exceptionnelle ne passe plus dans le bouton', () => {
    const rendu = rendreBarreFixe(
      cadre('ferme', 'Fermé exceptionnellement, ouvre demain à 8 h 30'),
    ).toString()
    expect(rendu).not.toContain('exceptionnellement')
    expect(rendu).toContain('<span class="barre-fixe__precision">demain 8 h 30</span>')
  })
})

describe('barre fixe : au service de la page (VuePage.barreFixe)', () => {
  it('fermé : le rappel mène au lien de la page, qui emporte son pré-diagnostic', () => {
    const { principale } = actionsBarreFixe(
      cadre('ferme', 'Fermé, ouvre à 8 h 30'),
      RAPPEL_DE_LA_PAGE,
    )
    expect(principale).toMatchObject({ libelle: 'Être rappelé', lien: RAPPEL_DE_LA_PAGE })
  })

  it('horaires à confirmer : le rappel secondaire mène au lien de la page', () => {
    const { secondaire } = actionsBarreFixe(
      cadre('a-confirmer', 'Horaires à confirmer'),
      RAPPEL_DE_LA_PAGE,
    )
    expect(secondaire).toMatchObject({ libelle: 'Être rappelé', lien: RAPPEL_DE_LA_PAGE })
  })

  it('ouvert : la page qui fournit un rappel l’obtient à la place de l’itinéraire', () => {
    const { principale, secondaire } = actionsBarreFixe(
      cadre('ouvert', 'Ouvert, ferme à 19 h'),
      RAPPEL_DE_LA_PAGE,
    )
    expect(principale.lien).toBe('tel:+33605922838')
    expect(secondaire).toEqual({
      libelle: 'Être rappelé',
      precision: null,
      lien: RAPPEL_DE_LA_PAGE,
      appel: false,
    })
  })

  it('échappe le lien fourni par la page', () => {
    const rendu = rendreBarreFixe(
      cadre('ferme', 'Fermé, ouvre à 8 h 30'),
      '/demande?type=rappel&prediagnostic=K7PQ2',
    ).toString()
    expect(rendu).toContain('href="/demande?type=rappel&amp;prediagnostic=K7PQ2"')
  })
})

describe('barre fixe : rendu', () => {
  it('rend deux liens, le principal en premier, le numéro en seconde ligne du bouton d’appel', () => {
    const rendu = rendreBarreFixe(cadre('ouvert', 'Ouvert, ferme à 19 h')).toString()
    expect(rendu).toContain(
      '<nav class="barre-fixe barre-fixe--ouvert" aria-label="Contact rapide">',
    )
    expect(rendu).toContain(
      '<a class="barre-fixe__action barre-fixe__action--principale barre-fixe__action--appel" href="tel:+33605922838"><span class="barre-fixe__libelle">Appeler<span class="visuellement-masque">,</span></span><span class="barre-fixe__precision">06 05 92 28 38</span></a>',
    )
    expect(rendu.match(/<a /g)).toHaveLength(2)
    expect(rendu.indexOf('tel:')).toBeLessThan(rendu.indexOf('maps'))
  })

  it('sépare le libellé de sa précision pour les lecteurs d’écran, sans seconde ligne vide', () => {
    const rendu = rendreBarreFixe(cadre('ferme', 'Fermé, ouvre lundi à 9 h')).toString()
    expect(rendu).toContain(
      '<a class="barre-fixe__action barre-fixe__action--principale" href="/demande?type=rappel"><span class="barre-fixe__libelle">Être rappelé<span class="visuellement-masque">,</span></span><span class="barre-fixe__precision">lundi 9 h</span></a>',
    )
    const aConfirmer = rendreBarreFixe(cadre('a-confirmer', 'Horaires à confirmer')).toString()
    expect(aConfirmer).toContain(
      '<a class="barre-fixe__action" href="/demande?type=rappel"><span class="barre-fixe__libelle">Être rappelé</span></a>',
    )
  })
})
