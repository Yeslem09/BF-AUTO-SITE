import { describe, expect, it } from 'vitest'
import { DEMI_JOURNEES_ESSAI, FAMILLE_ESSAI, resumeEssai, saisieEssai } from '../essai.js'
import { MESSAGES, validerDemande, type ContexteValidation } from './validation.js'

const CONTEXTE: ContexteValidation = {
  demiJournees: DEMI_JOURNEES_ESSAI,
  anneeCourante: 2026,
  famille: null,
  resume: null,
  venteAuComptoir: false,
}

describe('validation d’une demande de rendez-vous (D4, US-11)', () => {
  it('accepte famille, demi-journée, marque, prénom, téléphone et moment', () => {
    const resultat = validerDemande(
      saisieEssai('rendez-vous', { objet: '', creneaux: ['2026-09-17-matin'] }),
      { ...CONTEXTE, famille: FAMILLE_ESSAI },
    )
    expect(resultat).toMatchObject({
      ok: true,
      contenu: {
        type: 'rendez-vous',
        sujet: { nature: 'famille', famille: FAMILLE_ESSAI },
        creneaux: [{ code: '2026-09-17-matin', libelle: 'Jeudi 17 septembre, matin' }],
        vehicule: { marque: 'peugeot' },
        contact: {
          prenom: 'Julie',
          telephone: { affichable: '06 12 34 56 78', lien: 'tel:+33612345678' },
          moment: 'fin-de-journee',
        },
        gamme: null,
        precisions: null,
      },
    })
  })

  it('propose toujours « Le plus tôt possible » et « Une autre date », même sans demi-journée', () => {
    const resultat = validerDemande(
      saisieEssai('rendez-vous', { creneaux: ['le-plus-tot', 'autre-date'] }),
      { ...CONTEXTE, demiJournees: [] },
    )
    expect(resultat.ok && resultat.contenu.creneaux.map((creneau) => creneau.libelle)).toEqual([
      'Le plus tôt possible',
      'Une autre date (nous en parlons au téléphone)',
    ])
  })

  it('exige une à trois possibilités, dans l’ordre du calendrier', () => {
    expect(validerDemande(saisieEssai('rendez-vous', { creneaux: [] }), CONTEXTE)).toEqual({
      ok: false,
      erreurs: { creneaux: MESSAGES.creneauxAucun },
    })
    const quatre = ['2026-09-17-matin', '2026-09-17-apres-midi', '2026-09-18-matin', 'le-plus-tot']
    expect(validerDemande(saisieEssai('rendez-vous', { creneaux: quatre }), CONTEXTE)).toEqual({
      ok: false,
      erreurs: { creneaux: MESSAGES.creneauxTrop },
    })
    const desordre = validerDemande(
      saisieEssai('rendez-vous', {
        creneaux: ['le-plus-tot', '2026-09-18-matin', '2026-09-18-matin'],
      }),
      CONTEXTE,
    )
    expect(desordre.ok && desordre.contenu.creneaux.map((creneau) => creneau.code)).toEqual([
      '2026-09-18-matin',
      'le-plus-tot',
    ])
  })

  it('refuse une demi-journée qui n’est plus proposée', () => {
    expect(
      validerDemande(saisieEssai('rendez-vous', { creneaux: ['2026-09-01-matin'] }), CONTEXTE),
    ).toEqual({ ok: false, erreurs: { creneaux: MESSAGES.creneauxPerime } })
  })

  it('sans famille, demande l’intervention dans une liste', () => {
    expect(validerDemande(saisieEssai('rendez-vous', { objet: '' }), CONTEXTE)).toEqual({
      ok: false,
      erreurs: { objet: MESSAGES.objet },
    })
  })
})

describe('validation d’une demande de devis (US-28)', () => {
  it('accepte la plaque seule et la normalise', () => {
    const resultat = validerDemande(saisieEssai('devis', { plaque: 'ab123cd' }), CONTEXTE)
    expect(resultat).toMatchObject({
      ok: true,
      contenu: { vehicule: { plaque: 'AB-123-CD' }, gamme: 'sans-preference' },
    })
  })

  it('accepte marque, modèle, année et énergie à la place de la plaque', () => {
    const resultat = validerDemande(
      saisieEssai('devis', {
        plaque: '',
        marque: 'renault',
        modele: 'Clio',
        annee: '2015',
        energie: 'diesel',
        gamme: 'occasion',
      }),
      CONTEXTE,
    )
    expect(resultat).toMatchObject({ ok: true, contenu: { gamme: 'occasion' } })
  })

  it('sans plaque ni les quatre éléments, dit pourquoi il les faut', () => {
    const resultat = validerDemande(
      saisieEssai('devis', { plaque: '', marque: 'renault', modele: 'Clio' }),
      CONTEXTE,
    )
    expect(resultat).toEqual({ ok: false, erreurs: { vehicule: MESSAGES.vehicule } })
    expect(MESSAGES.vehicule).toBe(
      'Indiquez la plaque, ou la marque, le modèle, l’année et l’énergie : sans cela, nous devrons vous rappeler pour le demander.',
    )
  })

  it('refuse une plaque mal formée avec les deux formats en exemple', () => {
    const resultat = validerDemande(saisieEssai('devis', { plaque: '12-AB' }), CONTEXTE)
    expect(resultat.ok).toBe(false)
    expect(!resultat.ok && resultat.erreurs.plaque).toContain('AB-123-CD')
  })

  it('refuse une gamme hors liste', () => {
    expect(validerDemande(saisieEssai('devis', { gamme: 'contrefacon' }), CONTEXTE)).toEqual({
      ok: false,
      erreurs: { gamme: MESSAGES.gamme },
    })
  })
})

describe('validation d’une demande de rappel', () => {
  it('rappel simple : motif en liste obligatoire', () => {
    expect(validerDemande(saisieEssai('rappel', { motif: 'autre' }), CONTEXTE)).toMatchObject({
      ok: true,
      contenu: { sujet: { nature: 'motif', motif: 'autre' }, vehicule: null, creneaux: [] },
    })
    expect(validerDemande(saisieEssai('rappel', { motif: 'inconnu' }), CONTEXTE)).toEqual({
      ok: false,
      erreurs: { motif: MESSAGES.motif },
    })
  })

  it('rappel après pré-diagnostic : le résumé retrouvé par le serveur fait le sujet, le motif est ignoré', () => {
    const resume = resumeEssai('ne-pas-rouler')
    const resultat = validerDemande(saisieEssai('rappel', { motif: '' }), { ...CONTEXTE, resume })
    expect(resultat).toMatchObject({
      ok: true,
      contenu: { sujet: { nature: 'pre-diagnostic', resume } },
    })
  })

  it('une famille ne s’attache jamais à un rappel, un résumé jamais à un devis', () => {
    const rappel = validerDemande(saisieEssai('rappel'), { ...CONTEXTE, famille: FAMILLE_ESSAI })
    expect(rappel.ok && rappel.contenu.sujet.nature).toBe('motif')
    const devis = validerDemande(saisieEssai('devis'), { ...CONTEXTE, resume: resumeEssai() })
    expect(devis.ok && devis.contenu.sujet.nature).toBe('objet')
  })
})

describe('coordonnées et champs communs', () => {
  it('chaque champ obligatoire vide a son message', () => {
    const resultat = validerDemande(
      saisieEssai('rappel', { motif: '', prenom: '  ', telephone: '', moment: '' }),
      CONTEXTE,
    )
    expect(resultat).toEqual({
      ok: false,
      erreurs: {
        motif: MESSAGES.motif,
        prenom: MESSAGES.prenom,
        telephone: MESSAGES.telephone,
        moment: MESSAGES.moment,
      },
    })
  })

  it('un téléphone non français est refusé avec un exemple', () => {
    const resultat = validerDemande(saisieEssai('rappel', { telephone: '12345' }), CONTEXTE)
    expect(resultat).toEqual({ ok: false, erreurs: { telephone: MESSAGES.telephoneInvalide } })
  })

  it('le moment de rappel vient de la liste fermée (D4)', () => {
    expect(validerDemande(saisieEssai('rappel', { moment: 'a-minuit' }), CONTEXTE)).toEqual({
      ok: false,
      erreurs: { moment: MESSAGES.moment },
    })
  })

  it('nettoie le prénom et les précisions, refuse les textes trop longs', () => {
    const resultat = validerDemande(
      saisieEssai('rappel', {
        prenom: ' Jean\u0000\n  Pierre ',
        precisions: 'Ligne 1\r\n\r\n\r\n\r\nLigne 2\u0007',
      }),
      CONTEXTE,
    )
    expect(resultat).toMatchObject({
      ok: true,
      contenu: { contact: { prenom: 'Jean Pierre' }, precisions: 'Ligne 1\n\nLigne 2' },
    })
    expect(
      validerDemande(
        saisieEssai('rappel', { prenom: 'a'.repeat(61), precisions: 'b'.repeat(501) }),
        CONTEXTE,
      ),
    ).toEqual({
      ok: false,
      erreurs: { prenom: MESSAGES.prenomLong, precisions: MESSAGES.precisions },
    })
  })

  it('un type inconnu est refusé', () => {
    expect(validerDemande(saisieEssai('rappel', { type: 'reservation' }), CONTEXTE)).toEqual({
      ok: false,
      erreurs: { type: MESSAGES.type },
    })
  })
})

describe('pièces de la famille dans une demande de prix (J6, passe 1 du jury)', () => {
  const FREINAGE = {
    ...FAMILLE_ESSAI,
    pieces: ['Plaquettes avant', 'Plaquettes arrière', 'Disques avant'],
  }
  const devis = (pieces: readonly string[]) =>
    validerDemande(saisieEssai('devis', { objet: '', pieces }), { ...CONTEXTE, famille: FREINAGE })

  it('garde les pièces cochées dans l’ordre du catalogue, « Je ne sais pas » en toutes lettres', () => {
    const resultat = devis(['je-ne-sais-pas', 'Disques avant', 'Plaquettes avant'])
    expect(resultat.ok && resultat.contenu.pieces).toEqual([
      'Plaquettes avant',
      'Disques avant',
      'Je ne sais pas',
    ])
    const aucune = devis([])
    expect(aucune.ok && aucune.contenu.pieces).toEqual([])
  })

  it('refuse une pièce que le catalogue ne propose pas, ou des pièces sans liste publiée', () => {
    expect(devis(['Pot d’échappement'])).toEqual({
      ok: false,
      erreurs: { pieces: MESSAGES.pieces },
    })
    expect(
      validerDemande(saisieEssai('devis', { objet: '', pieces: ['Plaquettes avant'] }), {
        ...CONTEXTE,
        famille: FAMILLE_ESSAI,
      }),
    ).toEqual({ ok: false, erreurs: { pieces: MESSAGES.pieces } })
  })

  it('ignore les pièces hors d’un devis', () => {
    const resultat = validerDemande(
      saisieEssai('rendez-vous', { objet: '', pieces: ['Plaquettes avant'] }),
      { ...CONTEXTE, famille: FREINAGE },
    )
    expect(resultat.ok && resultat.contenu.pieces).toEqual([])
  })
})
