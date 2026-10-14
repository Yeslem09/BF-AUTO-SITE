import { simpleParser } from 'mailparser'
import { describe, expect, it } from 'vitest'
import { reponseAppleMail, reponseGmail, reponseOutlook } from './essai/echantillons.js'
import {
  extraireReponse,
  LONGUEUR_MAX_REPONSE,
  reconnaitreCommande,
  texteDepuisHtml,
} from './reponse.js'

async function corpsDe(source: string) {
  const analyse = await simpleParser(source)
  return {
    texte: analyse.text ?? null,
    html: typeof analyse.html === 'string' ? analyse.html : null,
  }
}

describe('texte de la réponse sans la citation (US-C05)', () => {
  const clients = [
    ['Gmail', reponseGmail],
    ['Outlook', reponseOutlook],
    ['Apple Mail', reponseAppleMail],
  ] as const

  for (const [client, fabriquer] of clients) {
    it(`${client}, texte et HTML : seule la réponse reste`, async () => {
      expect(extraireReponse(await corpsDe(fabriquer('Fait')))).toBe('Fait')
    })

    it(`${client}, HTML seul : la citation est coupée avant conversion`, async () => {
      const corps = await corpsDe(fabriquer('Rappelé', 'html'))
      expect(corps.html).toContain('Rappelé')
      expect(extraireReponse(corps)).toBe('Rappelé')
      expect(extraireReponse({ texte: null, html: corps.html })).toBe('Rappelé')
    })
  }

  it('attribution Gmail coupée sur deux lignes', () => {
    const texte = [
      'Traité',
      '',
      'Le mer. 23 sept. 2026 à 10:12, BF Auto <',
      'garage@gmail.com> a écrit :',
      '',
      '> Ne roulez pas',
    ].join('\n')
    expect(extraireReponse({ texte, html: null })).toBe('Traité')
  })

  it('attribution anglaise et signature de téléphone retirées', () => {
    const texte = [
      'Rappelé',
      '',
      'Sent from my iPhone',
      '',
      'On 23 Sep 2026, at 10:12, BF Auto <garage@gmail.com> wrote:',
      '> Ne roulez pas',
    ].join('\n')
    expect(extraireReponse({ texte, html: null })).toBe('Rappelé')
  })

  it('bloc d’en-têtes d’Outlook sans séparateur, et message d’origine', () => {
    const outlook = [
      'fait',
      '',
      'De : BF Auto <garage@gmail.com>',
      'Envoyé : mercredi 23 septembre 2026 10:12',
      'Objet : Rappel',
    ].join('\n')
    expect(extraireReponse({ texte: outlook, html: null })).toBe('fait')
    const origine = ['Fait', '-----Message d’origine-----', 'De : BF Auto'].join('\n')
    expect(extraireReponse({ texte: origine, html: null })).toBe('Fait')
  })

  it('réponse sans citation, signature « -- » retirée', () => {
    expect(extraireReponse({ texte: 'Fait\r\n-- \r\nGarage BF Auto\r\n', html: null })).toBe('Fait')
    expect(extraireReponse({ texte: '  traité  ', html: null })).toBe('traité')
  })

  it('une phrase qui commence par « Le » n’est pas prise pour l’attribution', () => {
    const texte = [
      'Le client est prévenu',
      '',
      'Le mer. 23 sept. 2026 à 10:12, BF Auto <garage@gmail.com> a écrit :',
      '> Ne roulez pas',
    ].join('\n')
    expect(extraireReponse({ texte, html: null })).toBe('Le client est prévenu')
  })

  it('borne la longueur gardée', () => {
    expect(extraireReponse({ texte: 'x'.repeat(2_000), html: null })).toHaveLength(
      LONGUEUR_MAX_REPONSE,
    )
  })

  it('convertit le HTML simple et décode les entités', () => {
    expect(texteDepuisHtml('<p>Fait&nbsp;!</p><div>&#233;t&#xE9; &amp; &lt;ok&gt;</div>')).toBe(
      'Fait !\nété & <ok>\n',
    )
    expect(texteDepuisHtml('<style>p{}</style><p>Fait</p><hr><p>Citation</p>')).toBe('Fait\n')
    expect(texteDepuisHtml('&#99999999; &inconnue;')).toBe('&#99999999; &inconnue;')
  })
})

describe('commandes reconnues (US-C06)', () => {
  it.each([
    'fait',
    'Fait',
    'FAIT',
    'Fait.',
    'FAIT !',
    ' fait ',
    'Faite',
    'rappelé',
    'Rappelé',
    'rappele',
    'RAPPELEE',
    'Rappelée !',
    'traité',
    'Traitée',
    'TRAITE',
    '« fait »',
  ])('« %s » range la demande « Traitée »', (texte) => {
    expect(reconnaitreCommande(texte)).toBe('marquer-traitee')
  })

  it.each([
    'pas fait',
    'fait ?',
    'Fait?',
    'fait demain',
    'à rappeler',
    'rappeler',
    'traiter',
    'c’est pas fait',
    'Je rappelle ce soir',
    'ok',
    '',
    'fait fait',
  ])('« %s » n’est pas une commande', (texte) => {
    expect(reconnaitreCommande(texte)).toBeNull()
  })
})
