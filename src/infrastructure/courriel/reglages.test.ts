import { describe, expect, it } from 'vitest'
import { creerLecteurEnvironnement, type Environnement } from '../environnement.js'
import { FOURNISSEURS_COURRIEL, PREREGLAGES, securiseParDefaut } from './fournisseurs.js'
import { lireReglagesCourriel } from './reglages.js'

const GMAIL: Environnement = {
  SMTP_UTILISATEUR: 'garage@gmail.com',
  SMTP_MOT_DE_PASSE: 'abcd efgh ijkl mnop',
}

function lire(env: Environnement) {
  const lecteur = creerLecteurEnvironnement(env)
  const lecture = lireReglagesCourriel(lecteur)
  return { ...lecture, problemes: lecteur.problemes }
}

describe('préréglages des fournisseurs', () => {
  it('chaque fournisseur a un libellé et un remède aux identifiants refusés', () => {
    for (const fournisseur of FOURNISSEURS_COURRIEL) {
      expect(PREREGLAGES[fournisseur].libelle).not.toBe('')
      expect(PREREGLAGES[fournisseur].remedeIdentifiants).not.toBe('')
    }
  })

  it('Gmail : envoi en TLS direct sur 465, lecture sur 993, mot de passe d’application', () => {
    expect(PREREGLAGES.gmail.smtp).toEqual({ hote: 'smtp.gmail.com', port: 465, securise: true })
    expect(PREREGLAGES.gmail.imap).toEqual({ hote: 'imap.gmail.com', port: 993, securise: true })
    expect(PREREGLAGES.gmail.motDePasseApplication).toBe(true)
  })

  it('Microsoft : Outlook.com refusé, Microsoft 365 sans lecture', () => {
    expect(PREREGLAGES.outlook.refus).toContain('16 septembre 2024')
    expect(PREREGLAGES['microsoft-365'].imap).toBeNull()
    expect(PREREGLAGES.brevo.imap).toBeNull()
  })

  it('déduit le chiffrement du port quand rien ne le précise', () => {
    expect(securiseParDefaut(465)).toBe(true)
    expect(securiseParDefaut(993)).toBe(true)
    expect(securiseParDefaut(587)).toBe(false)
    expect(securiseParDefaut(143)).toBe(false)
  })
})

describe('réglages du courriel (US-C01)', () => {
  it('sans aucune variable, le courriel n’est pas configuré', () => {
    expect(lire({})).toEqual({ reglages: null, avertissements: [], problemes: [] })
  })

  it('Gmail en deux variables : tout le reste vient du préréglage', () => {
    const { reglages, avertissements, problemes } = lire(GMAIL)
    expect(problemes).toEqual([])
    expect(avertissements).toEqual([])
    expect(reglages).toEqual({
      smtp: {
        fournisseur: 'gmail',
        serveur: { hote: 'smtp.gmail.com', port: 465, securise: true },
        utilisateur: 'garage@gmail.com',
        motDePasse: 'abcdefghijklmnop',
        expediteur: 'garage@gmail.com',
        nomExpediteur: null,
        repondreA: null,
      },
      imap: {
        fournisseur: 'gmail',
        serveur: { hote: 'imap.gmail.com', port: 993, securise: true },
        utilisateur: 'garage@gmail.com',
        motDePasse: 'abcdefghijklmnop',
        dossier: 'INBOX',
        intervalleSecondes: 120,
      },
    })
  })

  it('Gmail en STARTTLS : le port 587 donné seul désactive le TLS direct', () => {
    const { reglages } = lire({ ...GMAIL, SMTP_PORT: '587' })
    expect(reglages?.smtp.serveur).toEqual({ hote: 'smtp.gmail.com', port: 587, securise: false })
  })

  it('refuse le mot de passe habituel du compte Gmail sans le recopier', () => {
    const { reglages, problemes } = lire({ ...GMAIL, SMTP_MOT_DE_PASSE: 'MonMotDePasse2026' })
    expect(reglages).not.toBeNull()
    expect(problemes).toHaveLength(1)
    expect(problemes[0]).toContain('SMTP_MOT_DE_PASSE')
    expect(problemes[0]).toContain('mot de passe d’application')
    expect(problemes[0]).toContain('16 lettres')
    expect(problemes[0]).not.toContain('MonMotDePasse2026')
  })

  it('avertit qu’un expéditeur autre que le compte Gmail sera réécrit, sauf alias vérifié', () => {
    const { reglages, avertissements, problemes } = lire({
      ...GMAIL,
      SMTP_EXPEDITEUR: 'contact@bfauto.fr',
    })
    expect(problemes).toEqual([])
    expect(reglages?.smtp.expediteur).toBe('contact@bfauto.fr')
    expect(avertissements).toHaveLength(1)
    expect(avertissements[0]).toContain('alias vérifié')
  })

  it('Gmail exige l’adresse complète comme identifiant', () => {
    const { problemes } = lire({ ...GMAIL, SMTP_UTILISATEUR: 'garage' })
    expect(problemes).toContain(
      'SMTP_UTILISATEUR : « garage », adresse complète attendue pour Gmail',
    )
  })

  it('lit un nom d’expéditeur et une adresse de réponse, et refuse un nom qui injecterait un en-tête', () => {
    const { reglages } = lire({
      ...GMAIL,
      SMTP_NOM_EXPEDITEUR: 'BF Auto, site internet',
      SMTP_REPONDRE_A: 'atelier@gmail.com',
    })
    expect(reglages?.smtp.nomExpediteur).toBe('BF Auto, site internet')
    expect(reglages?.smtp.repondreA).toBe('atelier@gmail.com')
    expect(lire({ ...GMAIL, SMTP_NOM_EXPEDITEUR: 'BF <Auto>' }).problemes).toHaveLength(1)
  })

  it('désactive la lecture sur demande, et borne l’intervalle des relevés', () => {
    expect(lire({ ...GMAIL, IMAP_ACTIF: 'false' }).reglages?.imap).toBeNull()
    expect(
      lire({ ...GMAIL, IMAP_INTERVALLE_SECONDES: '300' }).reglages?.imap?.intervalleSecondes,
    ).toBe(300)
    expect(lire({ ...GMAIL, IMAP_INTERVALLE_SECONDES: '5' }).problemes).toEqual([
      'IMAP_INTERVALLE_SECONDES : « 5 », entier de 30 à 3600 attendu',
    ])
  })

  it('Microsoft 365 : envoi en STARTTLS, lecture désactivée avec un avertissement', () => {
    const { reglages, avertissements, problemes } = lire({
      COURRIEL_FOURNISSEUR: 'microsoft-365',
      SMTP_UTILISATEUR: 'atelier@garage.test',
      SMTP_MOT_DE_PASSE: 'secret',
    })
    expect(problemes).toEqual([])
    expect(reglages?.smtp.serveur).toEqual({
      hote: 'smtp.office365.com',
      port: 587,
      securise: false,
    })
    expect(reglages?.imap).toBeNull()
    expect(avertissements[0]).toContain('Microsoft 365')
  })

  it('Outlook.com est refusé avec son motif (US-C02)', () => {
    const { reglages, problemes } = lire({ ...GMAIL, COURRIEL_FOURNISSEUR: 'outlook' })
    expect(reglages).toBeNull()
    expect(problemes[0]).toContain('16 septembre 2024')
    expect(problemes[0]).toContain('gmail')
  })

  it('Brevo : lecture d’une autre boîte seulement avec ses propres identifiants', () => {
    const brevo = {
      COURRIEL_FOURNISSEUR: 'brevo',
      SMTP_UTILISATEUR: '8f1a2b001@smtp-brevo.com',
      SMTP_MOT_DE_PASSE: 'cle-smtp',
      SMTP_EXPEDITEUR: 'site@bfauto.fr',
    }
    const sansLecture = lire(brevo)
    expect(sansLecture.reglages?.imap).toBeNull()
    expect(sansLecture.avertissements[0]).toContain('IMAP_HOTE')
    expect(lire({ ...brevo, IMAP_HOTE: 'ssl0.ovh.net' }).problemes[0]).toContain('IMAP_UTILISATEUR')
    const avecLecture = lire({
      ...brevo,
      IMAP_HOTE: 'ssl0.ovh.net',
      IMAP_UTILISATEUR: 'site@bfauto.fr',
      IMAP_MOT_DE_PASSE: 'secret-boite',
    })
    expect(avecLecture.reglages?.imap?.serveur).toEqual({
      hote: 'ssl0.ovh.net',
      port: 993,
      securise: true,
    })
    expect(avecLecture.reglages?.smtp.repondreA).toBeNull()
  })

  it('répond à la boîte lue quand elle diffère de l’expéditeur', () => {
    const { reglages } = lire({
      COURRIEL_FOURNISSEUR: 'brevo',
      SMTP_UTILISATEUR: '8f1a2b001@smtp-brevo.com',
      SMTP_MOT_DE_PASSE: 'cle-smtp',
      SMTP_EXPEDITEUR: 'notifications@bfauto.fr',
      IMAP_HOTE: 'ssl0.ovh.net',
      IMAP_UTILISATEUR: 'atelier@bfauto.fr',
      IMAP_MOT_DE_PASSE: 'secret-boite',
    })
    expect(reglages?.smtp.repondreA).toBe('atelier@bfauto.fr')
  })

  it('garde valable la configuration actuelle du site : SMTP_HOTE seul vaut serveur personnalisé', () => {
    const { reglages, problemes } = lire({
      SMTP_HOTE: 'smtp.exemple.fr',
      SMTP_PORT: '465',
      SMTP_EXPEDITEUR: 'site@exemple.fr',
    })
    expect(problemes).toEqual([])
    expect(reglages?.smtp).toMatchObject({
      fournisseur: 'personnalise',
      serveur: { hote: 'smtp.exemple.fr', port: 465, securise: true },
      utilisateur: null,
      motDePasse: null,
    })
    expect(reglages?.imap).toBeNull()
  })

  it('déduit Gmail de SMTP_HOTE=smtp.gmail.com : lecture comprise, mot de passe d’application exigé', () => {
    const { reglages, problemes } = lire({
      ...GMAIL,
      SMTP_HOTE: 'smtp.gmail.com',
      SMTP_PORT: '465',
      SMTP_SECURISE: 'true',
      SMTP_EXPEDITEUR: 'garage@gmail.com',
    })
    expect(problemes).toEqual([])
    expect(reglages?.smtp.fournisseur).toBe('gmail')
    expect(reglages?.imap?.serveur.hote).toBe('imap.gmail.com')
    expect(lire({ SMTP_HOTE: 'smtp-mail.outlook.com' }).problemes[0]).toContain('16 septembre 2024')
  })

  it('serveur personnalisé : hôte, expéditeur et identifiants appariés sont exigés, fautes rassemblées', () => {
    const { reglages, problemes } = lire({
      COURRIEL_FOURNISSEUR: 'personnalise',
      SMTP_UTILISATEUR: 'site',
      SMTP_PORT: '99999',
    })
    expect(reglages).toBeNull()
    expect(problemes).toEqual([
      'SMTP_PORT : « 99999 », entier de 1 à 65535 attendu',
      'SMTP_HOTE : obligatoire pour un serveur personnalisé',
      'SMTP_UTILISATEUR et SMTP_MOT_DE_PASSE : les deux ou aucun',
      'SMTP_EXPEDITEUR : obligatoire (adresse d’expédition)',
    ])
  })

  it('refuse un fournisseur inconnu en listant les valeurs admises', () => {
    const { problemes } = lire({ ...GMAIL, COURRIEL_FOURNISSEUR: 'yahoo' })
    expect(problemes[0]).toContain('COURRIEL_FOURNISSEUR : « yahoo » inconnu')
    expect(problemes[0]).toContain('gmail')
  })
})
