import { describe, expect, it } from 'vitest'
import { resumeEssai } from '../essai.js'
import {
  changerStatut,
  creerDemande,
  estUrgente,
  libelleTypeDemande,
  memeContenu,
  noterConsultation,
  noterTentativeAppel,
  type ContenuDemande,
} from './demande.js'

const CONTENU: ContenuDemande = {
  type: 'rappel',
  sujet: { nature: 'motif', motif: 'devis' },
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
const RECUE = new Date('2026-09-16T08:00:00.000Z')
const PLUS_TARD = new Date('2026-09-16T09:00:00.000Z')

describe('agrégat Demande', () => {
  it('naît « À rappeler », jamais consultée, notification en attente', () => {
    expect(creerDemande(CONTENU, { id: 'x', recueLe: RECUE })).toMatchObject({
      id: 'x',
      recueLe: RECUE,
      statut: 'a-rappeler',
      statutChangeLe: null,
      premiereConsultationLe: null,
      notification: { etat: 'en-attente' },
    })
  })

  it('deux statuts ; remettre le même ne change pas la date', () => {
    const demande = creerDemande(CONTENU, { id: 'x', recueLe: RECUE })
    const traitee = changerStatut(demande, 'traitee', PLUS_TARD)
    expect(traitee).toMatchObject({ statut: 'traitee', statutChangeLe: PLUS_TARD })
    expect(changerStatut(traitee, 'traitee', new Date())).toBe(traitee)
  })

  it('la première consultation se note une fois', () => {
    const demande = creerDemande(CONTENU, { id: 'x', recueLe: RECUE })
    const vue = noterConsultation(demande, PLUS_TARD)
    expect(vue.premiereConsultationLe).toBe(PLUS_TARD)
    expect(noterConsultation(vue, new Date())).toBe(vue)
  })

  it('nomme le rappel après pré-diagnostic et reconnaît l’urgence', () => {
    const contenu: ContenuDemande = {
      ...CONTENU,
      sujet: { nature: 'pre-diagnostic', resume: resumeEssai('ne-pas-rouler') },
    }
    expect(libelleTypeDemande(contenu)).toBe('Rappel après pré-diagnostic')
    expect(estUrgente(contenu)).toBe(true)
    expect(libelleTypeDemande(CONTENU)).toBe('Demande de rappel')
    expect(estUrgente(CONTENU)).toBe(false)
  })
})

describe('même demande ou autre demande (envoi unique, AE-35)', () => {
  it('deux envois identiques disent la même demande, quel que soit l’ordre des clés', () => {
    const relue: ContenuDemande = {
      precisions: null,
      contact: {
        moment: 'matin',
        telephone: { lien: 'tel:+33612345678', affichable: '06 12 34 56 78' },
        prenom: 'Julie',
      },
      pieces: [],
      gamme: null,
      modalite: null,
      vehicule: null,
      creneaux: [],
      sujet: { motif: 'devis', nature: 'motif' },
      type: 'rappel',
    }
    expect(memeContenu(CONTENU, relue)).toBe(true)
  })

  it('un seul choix ou une seule saisie qui diffère en fait une autre demande', () => {
    const variantes: readonly ContenuDemande[] = [
      { ...CONTENU, contact: { ...CONTENU.contact, prenom: 'Karim' } },
      {
        ...CONTENU,
        contact: {
          ...CONTENU.contact,
          telephone: { affichable: '07 11 22 33 44', lien: 'tel:+33711223344' },
        },
      },
      { ...CONTENU, contact: { ...CONTENU.contact, moment: 'midi' } },
      { ...CONTENU, sujet: { nature: 'motif', motif: 'souci' } },
      { ...CONTENU, precisions: 'Bruit à froid' },
      {
        ...CONTENU,
        vehicule: { plaque: 'AB-123-CD', marque: null, modele: null, annee: null, energie: null },
      },
      { ...CONTENU, sujet: { nature: 'pre-diagnostic', resume: resumeEssai('a-controler') } },
    ]
    for (const variante of variantes) expect(memeContenu(CONTENU, variante)).toBe(false)
  })
})

describe('« Pas de réponse » : appels sans réponse datés (J4, passe 1 du jury)', () => {
  it('chaque appel manqué est noté, la demande reste « À rappeler »', () => {
    const demande = creerDemande(CONTENU, { id: 'x', recueLe: RECUE })
    expect(demande.tentativesAppel).toEqual([])
    const une = noterTentativeAppel(demande, PLUS_TARD)
    const deux = noterTentativeAppel(une, new Date(PLUS_TARD.getTime() + 20 * 60_000))
    expect(deux.statut).toBe('a-rappeler')
    expect(deux.tentativesAppel).toEqual([PLUS_TARD, new Date(PLUS_TARD.getTime() + 20 * 60_000)])
  })

  it('un second appui dans la minute ne compte pas deux appels ; une demande traitée ne bouge pas', () => {
    const une = noterTentativeAppel(creerDemande(CONTENU, { id: 'x', recueLe: RECUE }), PLUS_TARD)
    expect(noterTentativeAppel(une, new Date(PLUS_TARD.getTime() + 59_000))).toBe(une)
    const traitee = changerStatut(une, 'traitee', PLUS_TARD)
    expect(noterTentativeAppel(traitee, new Date(PLUS_TARD.getTime() + 3_600_000))).toBe(traitee)
  })

  it('la promesse faite au client naît avec la demande, absente si rien n’a été promis', () => {
    const promesse = {
      phrase: 'Nous vous rappelons ce matin.',
      date: '2026-09-16',
      demiJournee: 'matin',
    } as const
    expect(creerDemande(CONTENU, { id: 'x', recueLe: RECUE, promesse }).promesse).toEqual(promesse)
    expect(creerDemande(CONTENU, { id: 'y', recueLe: RECUE }).promesse).toBeNull()
  })
})
