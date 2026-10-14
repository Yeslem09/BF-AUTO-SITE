import { describe, expect, it } from 'vitest'
import {
  creerConnecteurs,
  verificationReussie,
  verifierConnecteurs,
  type Connecteurs,
} from './connecteurs.js'
import type { ExpediteurCourriel } from './courriel/envoi/ports.js'
import { creerBoiteMemoire } from './courriel/lecture/boite-memoire.js'
import { ErreurConnecteur } from './erreurs.js'
import { lireReglagesConnecteurs } from './reglages-connecteurs.js'
import type { EnvoiSms } from './sms/ports.js'

const expediteurEnPanne: ExpediteurCourriel = {
  canal: 'smtp',
  envoyer: async () => {
    throw new Error('jamais appelé')
  },
  verifier: async () => {
    throw new ErreurConnecteur(
      'Envoi de courriel (SMTP)',
      'identifiants',
      '535',
      'Mot de passe d’application',
    )
  },
}
const smsQuiRepond: EnvoiSms = {
  fournisseur: 'ovh',
  envoyer: async () => ({ identifiant: '1', segments: 1 }),
  verifier: async () => ({ creditsRestants: 97 }),
}

describe('fabrique des connecteurs', () => {
  it('crée l’envoi, la lecture et le SMS d’après les réglages', () => {
    const { reglages } = lireReglagesConnecteurs(
      {
        SMTP_UTILISATEUR: 'garage@gmail.com',
        SMTP_MOT_DE_PASSE: 'abcdefghijklmnop',
        SMS_FOURNISSEUR: 'console',
      },
      { telephoneGarage: '06 05 92 28 38' },
    )
    const connecteurs = creerConnecteurs(reglages, { ecrireConsole: () => undefined })
    expect(connecteurs.expediteur?.canal).toBe('smtp')
    expect(connecteurs.boite).not.toBeNull()
    expect(connecteurs.sms?.fournisseur).toBe('console')
  })

  it('rien de configuré : aucun connecteur, l’appelant choisit la console ou l’échec visible', () => {
    expect(
      creerConnecteurs({ courriel: null, sms: null }, { ecrireConsole: () => undefined }),
    ).toEqual({ expediteur: null, boite: null, sms: null })
  })

  it('SMS console : écrit le SMS tel qu’il partirait, sans rien envoyer', async () => {
    const ecrits: string[] = []
    const { sms } = creerConnecteurs(
      { courriel: null, sms: { fournisseur: 'console', destinataire: '+33605922838' } },
      { ecrireConsole: (texte) => ecrits.push(texte) },
    )
    expect(await sms?.envoyer({ destinataire: '+33605922838', texte: 'Ne roulez pas' })).toEqual({
      identifiant: null,
      segments: 1,
    })
    expect(ecrits[0]).toContain('aucun envoi réel')
    expect(await sms?.verifier()).toEqual({ creditsRestants: null })
  })
})

describe('vérification des connecteurs (C4)', () => {
  it('rapporte chaque connecteur : réussi, en échec avec sa nature, ou inactif', async () => {
    const connecteurs: Connecteurs = {
      expediteur: expediteurEnPanne,
      boite: creerBoiteMemoire(),
      sms: smsQuiRepond,
    }
    const rapport = await verifierConnecteurs(connecteurs)
    expect(rapport.envoi).toMatchObject({ etat: 'echec', erreur: { nature: 'identifiants' } })
    expect(rapport.lecture).toEqual({
      etat: 'reussi',
      detail: 'dossier INBOX ouvert en lecture seule, 0 message(s)',
    })
    expect(rapport.sms).toEqual({
      etat: 'reussi',
      detail: 'identifiants acceptés, crédits restants : 97',
    })
    expect(verificationReussie(rapport)).toBe(false)
  })

  it('une erreur quelconque devient un échec nommé ; rien de configuré, rien à reprocher', async () => {
    const rapport = await verifierConnecteurs({
      expediteur: null,
      boite: null,
      sms: { ...smsQuiRepond, verifier: async () => Promise.reject(new Error('boum')) },
    })
    expect(rapport.envoi).toEqual({ etat: 'inactif' })
    expect(rapport.sms).toMatchObject({
      etat: 'echec',
      erreur: { nature: 'autre', detail: 'boum' },
    })
    expect(
      verificationReussie(await verifierConnecteurs({ expediteur: null, boite: null, sms: null })),
    ).toBe(true)
  })
})
