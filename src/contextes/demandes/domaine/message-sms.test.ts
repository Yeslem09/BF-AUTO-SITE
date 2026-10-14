import { describe, expect, it } from 'vitest'
import { resumeEssai } from '../essai.js'
import { creerDemande, type ContenuDemande } from './demande.js'
import { LONGUEUR_MAX_SMS, redigerSms } from './message-sms.js'
import { referenceDeDemande } from './reference.js'

const ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7'

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
      contact: {
        prenom: 'Julie',
        telephone: { affichable: '06 12 34 56 78', lien: 'tel:+33612345678' },
        moment: 'fin-de-journee',
      },
      precisions: null,
      ...contenu,
    },
    { id: ID, recueLe: new Date('2026-09-24T08:00:00Z') },
  )
}

describe('SMS au garagiste (Kano connecteurs, C6)', () => {
  it('une demande « Ne roulez pas » donne un SMS court, avec le téléphone et la référence', () => {
    const texte = redigerSms(
      demande({ sujet: { nature: 'pre-diagnostic', resume: resumeEssai('ne-pas-rouler') } }),
    )
    expect(texte).toBe(
      `BF Auto : NE ROULEZ PAS. Rappelez Julie au 06 12 34 56 78, en fin de journée. Détail par courriel [${referenceDeDemande(ID)}].`,
    )
    expect(texte?.length).toBeLessThanOrEqual(LONGUEUR_MAX_SMS)
  })

  it('aucun SMS pour les autres demandes', () => {
    expect(redigerSms(demande({}))).toBeNull()
    expect(
      redigerSms(
        demande({ sujet: { nature: 'pre-diagnostic', resume: resumeEssai('a-controler') } }),
      ),
    ).toBeNull()
  })

  it('un prénom très long ne fait jamais dépasser un SMS', () => {
    const texte = redigerSms(
      demande({
        sujet: { nature: 'pre-diagnostic', resume: resumeEssai('ne-pas-rouler') },
        contact: {
          prenom: 'Marie-Christine-Alexandrine-Josephine-Bernadette',
          telephone: { affichable: '06 12 34 56 78', lien: 'tel:+33612345678' },
          moment: 'des-que-possible',
        },
      }),
    )
    expect(texte?.length).toBeLessThanOrEqual(LONGUEUR_MAX_SMS)
  })
})
