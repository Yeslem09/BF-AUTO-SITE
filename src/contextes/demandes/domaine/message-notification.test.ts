import { describe, expect, it } from 'vitest'
import { FAMILLE_ESSAI, resumeEssai } from '../essai.js'
import { creerDemande, type ContenuDemande } from './demande.js'
import { redigerNotification } from './message-notification.js'

const RECUE = new Date('2026-09-16T08:05:00.000Z')
const LIEN = 'https://garage.exemple/garagiste/demandes/abc'

const CONTACT = {
  prenom: 'Julie',
  telephone: { affichable: '06 12 34 56 78', lien: 'tel:+33612345678' },
  moment: 'fin-de-journee',
} as const

function demande(contenu: Partial<ContenuDemande>) {
  return creerDemande(
    {
      type: 'rappel',
      sujet: { nature: 'motif', motif: 'souci' },
      creneaux: [],
      vehicule: null,
      pieces: [],
      gamme: null,
      modalite: null,
      contact: CONTACT,
      precisions: null,
      ...contenu,
    },
    { id: 'abc', recueLe: RECUE },
  )
}

describe('message au garagiste, lisible sans se connecter (D5, US-50)', () => {
  it('un rappel « Ne roulez pas » commence par « Ne roulez pas », sujet et texte', () => {
    const message = redigerNotification(
      demande({
        sujet: { nature: 'pre-diagnostic', resume: resumeEssai('ne-pas-rouler') },
        vehicule: { plaque: null, marque: 'peugeot', modele: null, annee: null, energie: null },
      }),
      LIEN,
    )
    expect(message.sujet.startsWith('Ne roulez pas')).toBe(true)
    expect(message.texte.startsWith('Ne roulez pas')).toBe(true)
    for (const attendu of [
      'Rappel après pré-diagnostic',
      'Reçue le mercredi 16 septembre à 10 h 05',
      'Prénom : Julie',
      'Téléphone : 06 12 34 56 78 (tel:+33612345678)',
      'Joignable : En fin de journée',
      'Pré-diagnostic : Un bruit ou une sensation au freinage',
      '- La pédale de frein est-elle molle ? : Oui, elle s’enfonce',
      'Conduite à tenir : Ne roulez pas : appelez-nous',
      'Véhicule : Peugeot',
      `Fiche : ${LIEN}`,
    ]) {
      expect(message.texte).toContain(attendu)
    }
  })

  it('un devis dit si la pièce se retire au garage ou se pose à l’atelier (arbitrage 4)', () => {
    const message = redigerNotification(
      demande({ type: 'devis', gamme: 'occasion', modalite: 'retrait-garage' }),
      LIEN,
    )
    expect(message.texte).toContain('Retrait ou pose : Retrait au garage')
    expect(redigerNotification(demande({}), LIEN).texte).not.toContain('Retrait ou pose')
  })

  it('une demande sans urgence ne crie pas', () => {
    const message = redigerNotification(
      demande({
        type: 'rendez-vous',
        sujet: { nature: 'famille', famille: FAMILLE_ESSAI },
        creneaux: [{ code: 'le-plus-tot', libelle: 'Le plus tôt possible' }],
        precisions: 'Bruit à froid',
      }),
      LIEN,
    )
    expect(message.sujet).toBe('Demande de rendez-vous de Julie, 06 12 34 56 78')
    expect(message.texte).not.toContain('Ne roulez pas')
    expect(message.texte).toContain('Objet : Freinage')
    expect(message.texte).toContain('Possibilités : Le plus tôt possible')
    expect(message.texte).toContain('Précisions : Bruit à froid')
  })

  it('le sujet du courriel ne peut pas contenir de retour à la ligne', () => {
    const message = redigerNotification(
      demande({ contact: { ...CONTACT, prenom: 'Julie\r\nBcc: autre@exemple.fr' } }),
      LIEN,
    )
    expect(message.sujet).not.toMatch(/[\r\n]/)
  })
})
