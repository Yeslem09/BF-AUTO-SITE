import { describe, expect, it } from 'vitest'
import { resumeEssai } from '../essai.js'
import { changerStatut, creerDemande, type ContenuDemande } from './demande.js'
import { ordonnerPourLeGaragiste } from './ordre.js'

const BASE: ContenuDemande = {
  type: 'rappel',
  sujet: { nature: 'motif', motif: 'souci' },
  creneaux: [],
  vehicule: null,
  pieces: [],
  gamme: null,
  modalite: null,
  contact: {
    prenom: 'Julie',
    telephone: { affichable: '06 12 34 56 78', lien: 'tel:+33612345678' },
    moment: 'matin',
  },
  precisions: null,
}

const le = (heure: string) => new Date(`2026-09-16T${heure}:00.000Z`)

describe('ordre de la liste du garagiste (US-22, US-30)', () => {
  it('à rappeler d’abord, « Ne roulez pas » en tête, puis les plus récentes ; traitées ensuite', () => {
    const ancienne = creerDemande(BASE, { id: 'ancienne', recueLe: le('07:00') })
    const recente = creerDemande(BASE, { id: 'recente', recueLe: le('09:00') })
    const urgente = creerDemande(
      { ...BASE, sujet: { nature: 'pre-diagnostic', resume: resumeEssai('ne-pas-rouler') } },
      { id: 'urgente', recueLe: le('06:00') },
    )
    const aControler = creerDemande(
      { ...BASE, sujet: { nature: 'pre-diagnostic', resume: resumeEssai('a-controler') } },
      { id: 'a-controler', recueLe: le('08:00') },
    )
    const traitee = changerStatut(
      creerDemande(BASE, { id: 'traitee', recueLe: le('10:00') }),
      'traitee',
      le('10:30'),
    )
    const urgenteTraitee = changerStatut(
      creerDemande(
        { ...BASE, sujet: { nature: 'pre-diagnostic', resume: resumeEssai('ne-pas-rouler') } },
        { id: 'urgente-traitee', recueLe: le('05:00') },
      ),
      'traitee',
      le('05:30'),
    )
    const ordre = ordonnerPourLeGaragiste([
      traitee,
      ancienne,
      urgenteTraitee,
      recente,
      aControler,
      urgente,
    ]).map((demande) => demande.id)
    expect(ordre).toEqual([
      'urgente',
      'recente',
      'a-controler',
      'ancienne',
      'traitee',
      'urgente-traitee',
    ])
  })

  it('traitées : la plus récemment traitée d’abord, comme le dit la légende du tableau (J4)', () => {
    // Karim, reçu le premier, traité le dernier ; Lina, reçue après lui, traitée avant.
    const karim = changerStatut(
      creerDemande(BASE, { id: 'karim', recueLe: le('01:40') }),
      'traitee',
      le('01:56'),
    )
    const lina = changerStatut(
      creerDemande(BASE, { id: 'lina', recueLe: le('01:50') }),
      'traitee',
      le('01:52'),
    )
    expect(ordonnerPourLeGaragiste([lina, karim]).map((demande) => demande.id)).toEqual([
      'karim',
      'lina',
    ])
  })
})
