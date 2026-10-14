import { describe, expect, it } from 'vitest'
import { creerDemande, type ContenuDemande } from './demande.js'
import { doublonsDe, doublonsPossibles, sontDoublons } from './doublons.js'

const CONTENU: ContenuDemande = {
  type: 'rappel',
  sujet: { nature: 'motif', motif: 'souci' },
  creneaux: [],
  vehicule: null,
  pieces: [],
  gamme: null,
  modalite: null,
  contact: {
    prenom: 'Jeanne',
    telephone: { affichable: '06 39 98 00 05', lien: 'tel:+33639980005' },
    moment: 'matin',
  },
  precisions: null,
}

const AUTRE_NUMERO = {
  ...CONTENU,
  contact: {
    ...CONTENU.contact,
    telephone: { affichable: '06 39 98 00 06', lien: 'tel:+33639980006' },
  },
}

const a = (id: string, heure: string, contenu: ContenuDemande = CONTENU) =>
  creerDemande(contenu, { id, recueLe: new Date(`2026-09-23T${heure}:00.000Z`) })

describe('doublons possibles (J4, passe 1 du jury)', () => {
  it('même numéro à 30 minutes d’écart au plus : doublon ; au-delà, ou autre numéro : non', () => {
    const premiere = a('1', '23:53')
    expect(sontDoublons(premiere, a('2', '23:53'))).toBe(true)
    expect(sontDoublons(premiere, a('3', '23:23'))).toBe(true)
    expect(sontDoublons(premiere, a('9', '23:22'))).toBe(false)
    expect(sontDoublons(a('4', '23:00'), a('5', '23:30'))).toBe(true)
    expect(sontDoublons(a('6', '23:00'), a('7', '23:31'))).toBe(false)
    expect(sontDoublons(premiere, a('8', '23:54', AUTRE_NUMERO))).toBe(false)
    expect(sontDoublons(premiere, premiere)).toBe(false)
  })

  it('chaque demande connaît les autres du même numéro, de la plus ancienne à la plus récente', () => {
    const demandes = [
      a('c', '23:10'),
      a('a', '23:00'),
      a('seule', '23:05', AUTRE_NUMERO),
      a('b', '23:05'),
    ]
    const doublons = doublonsPossibles(demandes)
    expect(doublons.get('a')?.map((demande) => demande.id)).toEqual(['b', 'c'])
    expect(doublons.get('c')?.map((demande) => demande.id)).toEqual(['a', 'b'])
    expect(doublons.has('seule')).toBe(false)
    expect(doublonsDe(a('x', '22:00'), demandes)).toEqual([])
  })
})
