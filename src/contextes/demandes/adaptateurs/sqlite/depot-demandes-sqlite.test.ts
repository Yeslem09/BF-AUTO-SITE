import { mkdirSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { creerDemande, type ContenuDemande, type Demande } from '../../domaine/demande.js'
import { FAMILLE_ESSAI, resumeEssai } from '../../essai.js'
import Database from 'better-sqlite3'
import { BASE_EN_MEMOIRE, ouvrirBaseDemandes, type Base } from './base.js'
import { creerDepotDemandesSqlite } from './depot-demandes-sqlite.js'

const RECUE = new Date('2026-09-16T08:00:00.000Z')
const CONTACT = {
  prenom: 'Julie',
  telephone: { affichable: '06 12 34 56 78', lien: 'tel:+33612345678' },
  moment: 'fin-de-journee',
} as const

const CONTENUS: readonly ContenuDemande[] = [
  {
    type: 'rendez-vous',
    sujet: { nature: 'famille', famille: FAMILLE_ESSAI },
    creneaux: [
      { code: '2026-09-17-matin', libelle: 'Jeudi 17 septembre, matin' },
      { code: 'le-plus-tot', libelle: 'Le plus tôt possible' },
    ],
    vehicule: { plaque: null, marque: 'peugeot', modele: '208', annee: 2019, energie: 'essence' },
    pieces: [],
    gamme: null,
    modalite: null,
    contact: CONTACT,
    precisions: 'Bruit « à froid » <script>',
  },
  {
    type: 'devis',
    sujet: { nature: 'objet', objet: 'reparation' },
    creneaux: [],
    vehicule: {
      plaque: 'AB-123-CD',
      marque: null,
      modele: null,
      annee: 'avant-1990',
      energie: null,
    },
    pieces: [],
    gamme: 'occasion',
    modalite: null,
    contact: CONTACT,
    precisions: null,
  },
  {
    type: 'rappel',
    sujet: { nature: 'pre-diagnostic', resume: resumeEssai('ne-pas-rouler') },
    creneaux: [],
    vehicule: null,
    pieces: [],
    gamme: null,
    modalite: null,
    contact: CONTACT,
    precisions: null,
  },
  {
    type: 'rappel',
    sujet: { nature: 'motif', motif: 'autre' },
    creneaux: [],
    vehicule: null,
    pieces: [],
    gamme: null,
    modalite: null,
    contact: CONTACT,
    precisions: null,
  },
]

let base: Base

beforeEach(() => {
  base = ouvrirBaseDemandes(BASE_EN_MEMOIRE)
})
afterEach(() => {
  if (base.open) base.close()
})

function demande(contenu: ContenuDemande, rang: number): Demande {
  return creerDemande(contenu, {
    id: `00000000-0000-4000-8000-${String(rang).padStart(12, '0')}`,
    recueLe: RECUE,
  })
}

describe('dépôt SQLite des demandes (vrai moteur, piège 8)', () => {
  it.each(CONTENUS.map((contenu, rang) => [contenu.type, contenu.sujet.nature, rang] as const))(
    'relit à l’identique une demande %s (%s)',
    async (_type, _nature, rang) => {
      const depot = creerDepotDemandesSqlite(base)
      const originale = demande(CONTENUS[rang] as ContenuDemande, rang)
      expect(
        await depot.enregistrer(originale, { formulaire: `f${rang}`, confirmation: `c${rang}` }),
      ).toBe('enregistree')
      expect(await depot.trouver(originale.id)).toEqual({ etat: 'trouvee', demande: originale })
      expect(await depot.trouverParConfirmation(`c${rang}`)).toEqual({
        etat: 'trouvee',
        demande: originale,
      })
      expect(await depot.confirmationDuFormulaire(`f${rang}`)).toBe(`c${rang}`)
    },
  )

  it('un second enregistrement avec le même jeton de formulaire est refusé', async () => {
    const depot = creerDepotDemandesSqlite(base)
    await depot.enregistrer(demande(CONTENUS[0] as ContenuDemande, 1), {
      formulaire: 'f',
      confirmation: 'c1',
    })
    expect(
      await depot.enregistrer(demande(CONTENUS[0] as ContenuDemande, 2), {
        formulaire: 'f',
        confirmation: 'c2',
      }),
    ).toBe('jeton-deja-utilise')
  })

  it('une ligne altérée est signalée illisible sans faire tomber la liste', async () => {
    const depot = creerDepotDemandesSqlite(base)
    const saine = demande(CONTENUS[3] as ContenuDemande, 1)
    const abimee = demande(CONTENUS[3] as ContenuDemande, 2)
    await depot.enregistrer(saine, { formulaire: 'f1', confirmation: 'c1' })
    await depot.enregistrer(abimee, { formulaire: 'f2', confirmation: 'c2' })
    base
      .prepare('UPDATE demandes_recues SET contenu = ? WHERE id = ?')
      .run('{"sujet":42}', abimee.id)
    expect(await depot.listerPourLeGaragiste(new Date(0))).toEqual({
      demandes: [saine],
      illisibles: [abimee.id],
    })
    expect(await depot.trouver(abimee.id)).toEqual({ etat: 'illisible' })
  })

  it('une demande enregistrée avant la vente au comptoir se relit, sans choix de retrait', async () => {
    const depot = creerDepotDemandesSqlite(base)
    const ancienne = demande(CONTENUS[1] as ContenuDemande, 1)
    await depot.enregistrer(ancienne, { formulaire: 'f1', confirmation: 'c1' })
    const { modalite: _absente, ...sansModalite } = JSON.parse(
      base.prepare('SELECT contenu FROM demandes_recues').pluck().get() as string,
    ) as Record<string, unknown>
    base.prepare('UPDATE demandes_recues SET contenu = ?').run(JSON.stringify(sansModalite))
    expect(await depot.trouver(ancienne.id)).toEqual({ etat: 'trouvee', demande: ancienne })
  })

  it('un choix de retrait altéré rend la ligne illisible', async () => {
    const depot = creerDepotDemandesSqlite(base)
    const originale = demande(CONTENUS[1] as ContenuDemande, 1)
    await depot.enregistrer(originale, { formulaire: 'f1', confirmation: 'c1' })
    const json = JSON.stringify({
      ...JSON.parse(base.prepare('SELECT contenu FROM demandes_recues').pluck().get() as string),
      modalite: 'livraison',
    })
    base.prepare('UPDATE demandes_recues SET contenu = ?').run(json)
    expect(await depot.trouver(originale.id)).toEqual({ etat: 'illisible' })
  })

  it('un lien d’appel altéré en autre chose qu’un « tel: » rend la ligne illisible', async () => {
    const depot = creerDepotDemandesSqlite(base)
    const originale = demande(CONTENUS[3] as ContenuDemande, 1)
    await depot.enregistrer(originale, { formulaire: 'f1', confirmation: 'c1' })
    const json = JSON.stringify({
      ...JSON.parse(base.prepare('SELECT contenu FROM demandes_recues').pluck().get() as string),
      contact: { ...CONTACT, telephone: { affichable: 'x', lien: 'javascript:alert(1)' } },
    })
    base.prepare('UPDATE demandes_recues SET contenu = ?').run(json)
    expect(await depot.trouver(originale.id)).toEqual({ etat: 'illisible' })
  })

  it('les tables sont STRICT : un type inattendu est refusé à l’écriture', async () => {
    const depot = creerDepotDemandesSqlite(base)
    await depot.enregistrer(demande(CONTENUS[3] as ContenuDemande, 1), {
      formulaire: 'f',
      confirmation: 'c',
    })
    expect(() =>
      base.prepare("UPDATE demandes_recues SET notification_essais = 'beaucoup'").run(),
    ).toThrow(/cannot store TEXT value in INTEGER column/)
  })

  it('suit l’état de notification et purge sur la dernière activité', async () => {
    const depot = creerDepotDemandesSqlite(base)
    const originale = demande(CONTENUS[3] as ContenuDemande, 1)
    await depot.enregistrer(originale, { formulaire: 'f1', confirmation: 'c1' })
    const echec = {
      etat: 'en-echec' as const,
      premierEchecLe: RECUE,
      essais: 2,
      prochainEssaiLe: new Date('2026-09-16T08:10:00.000Z'),
      derniereErreur: 'refus',
    }
    await depot.enregistrerNotification(originale.id, echec)
    expect(await depot.trouver(originale.id)).toMatchObject({ demande: { notification: echec } })
    expect(
      await depot.notificationsARenvoyer(new Date('2026-09-16T08:09:59.999Z'), new Date(0)),
    ).toEqual([])
    expect(
      await depot.notificationsARenvoyer(new Date('2026-09-16T08:10:00.000Z'), new Date(0)),
    ).toEqual([originale.id])
    expect(await depot.compterEchecsDepuis(new Date('2026-09-16T08:00:00.001Z'))).toBe(1)
    expect(await depot.purger(RECUE)).toBe(0)
    expect(await depot.purger(new Date('2026-09-16T08:00:00.001Z'))).toBe(1)
  })
})

describe('persistance sur disque (US-46)', () => {
  let dossier: string

  beforeEach(async () => {
    dossier = await mkdtemp(join(tmpdir(), 'bf-auto-demandes-'))
  })
  afterEach(async () => rm(dossier, { recursive: true, force: true }))

  it('une demande enregistrée survit à la fermeture et à la réouverture de la base', async () => {
    const chemin = join(dossier, 'sous-dossier', 'demandes.sqlite')
    const premiere = ouvrirBaseDemandes(chemin)
    const originale = demande(CONTENUS[0] as ContenuDemande, 1)
    await creerDepotDemandesSqlite(premiere).enregistrer(originale, {
      formulaire: 'f',
      confirmation: 'c',
    })
    premiere.close()

    const seconde = ouvrirBaseDemandes(chemin)
    const liste = await creerDepotDemandesSqlite(seconde).listerPourLeGaragiste(new Date(0))
    seconde.close()
    expect(liste.demandes).toEqual([originale])
  })
})

describe('promesse et appels sans réponse en base (J4, item 7)', () => {
  const PROMESSE = {
    phrase: 'Nous vous rappelons jeudi, en fin de journée.',
    date: '2026-09-17',
    demiJournee: 'apres-midi',
  } as const

  it('relit la promesse et les appels sans réponse notés', async () => {
    const depot = creerDepotDemandesSqlite(base)
    const originale = creerDemande(CONTENUS[0] as ContenuDemande, {
      id: '00000000-0000-4000-8000-000000000071',
      recueLe: RECUE,
      promesse: PROMESSE,
    })
    await depot.enregistrer(originale, { formulaire: 'f', confirmation: 'c' })
    const appels = [new Date('2026-09-17T07:05:00.000Z'), new Date('2026-09-17T09:40:00.000Z')]
    await depot.noterTentativesAppel(originale.id, appels)
    expect(await depot.trouver(originale.id)).toEqual({
      etat: 'trouvee',
      demande: { ...originale, tentativesAppel: appels },
    })
    expect((await depot.listerARappeler()).demandes).toHaveLength(1)
    expect((await depot.listerRecuesEntre(RECUE, RECUE)).demandes).toHaveLength(1)
    expect(
      (
        await depot.listerRecuesEntre(
          new Date(RECUE.getTime() + 1),
          new Date(RECUE.getTime() + 60_000),
        )
      ).demandes,
    ).toEqual([])
  })

  it('une promesse incomplète ou des appels altérés rendent la ligne illisible, sans faire tomber la liste', async () => {
    const depot = creerDepotDemandesSqlite(base)
    const saine = demande(CONTENUS[0] as ContenuDemande, 72)
    const tronquee = demande(CONTENUS[0] as ContenuDemande, 73)
    const alteree = demande(CONTENUS[0] as ContenuDemande, 74)
    for (const [rang, une] of [saine, tronquee, alteree].entries()) {
      await depot.enregistrer(une, { formulaire: `f${rang}`, confirmation: `c${rang}` })
    }
    base
      .prepare("UPDATE demandes_recues SET promesse_phrase = 'Nous vous rappelons.' WHERE id = ?")
      .run(tronquee.id)
    base
      .prepare('UPDATE demandes_recues SET tentatives_appel = \'["hier"]\' WHERE id = ?')
      .run(alteree.id)
    const liste = await depot.listerARappeler()
    expect(liste.demandes.map((une) => une.id)).toEqual([saine.id])
    expect([...liste.illisibles].sort()).toEqual([tronquee.id, alteree.id].sort())
  })
})

describe('base ouverte avant la promesse et les appels sans réponse', () => {
  let dossier: string

  beforeEach(async () => {
    dossier = await mkdtemp(join(tmpdir(), 'bf-auto-demandes-migration-'))
  })
  afterEach(async () => rm(dossier, { recursive: true, force: true }))

  it('reçoit les colonnes à l’ouverture ; ses demandes se relisent sans promesse ni appel', async () => {
    const chemin = join(dossier, 'ancienne.sqlite')
    mkdirSync(dossier, { recursive: true })
    const ancienne = new Database(chemin)
    ancienne.exec(`CREATE TABLE demandes_recues (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, contenu TEXT NOT NULL, statut TEXT NOT NULL,
      recue_le TEXT NOT NULL, statut_change_le TEXT, premiere_consultation_le TEXT,
      jeton_formulaire TEXT NOT NULL UNIQUE, jeton_confirmation TEXT NOT NULL UNIQUE,
      notification_etat TEXT NOT NULL, notification_envoyee_le TEXT,
      notification_premier_echec_le TEXT, notification_essais INTEGER NOT NULL DEFAULT 0,
      notification_prochain_essai_le TEXT, notification_derniere_erreur TEXT
    ) STRICT`)
    const contenu = JSON.stringify({
      sujet: { nature: 'motif', motif: 'autre' },
      creneaux: [],
      vehicule: null,
      gamme: null,
      contact: CONTACT,
      precisions: null,
    })
    ancienne
      .prepare(
        `INSERT INTO demandes_recues (id, type, contenu, statut, recue_le, jeton_formulaire,
          jeton_confirmation, notification_etat) VALUES (?, 'rappel', ?, 'a-rappeler', ?, 'f', 'c', 'en-attente')`,
      )
      .run('00000000-0000-4000-8000-000000000081', contenu, RECUE.toISOString())
    ancienne.close()

    const ouverte = ouvrirBaseDemandes(chemin)
    const depot = creerDepotDemandesSqlite(ouverte)
    const lecture = await depot.trouver('00000000-0000-4000-8000-000000000081')
    expect(lecture.etat === 'trouvee' && lecture.demande.promesse).toBeNull()
    expect(lecture.etat === 'trouvee' && lecture.demande.tentativesAppel).toEqual([])
    expect(lecture.etat === 'trouvee' && lecture.demande.pieces).toEqual([])
    await depot.noterTentativesAppel('00000000-0000-4000-8000-000000000081', [RECUE])
    ouverte.close()
    // Une seconde ouverture ne rajoute rien : la mise à niveau est idempotente.
    const rouverte = ouvrirBaseDemandes(chemin)
    const relue = await creerDepotDemandesSqlite(rouverte).trouver(
      '00000000-0000-4000-8000-000000000081',
    )
    rouverte.close()
    expect(relue.etat === 'trouvee' && relue.demande.tentativesAppel).toEqual([RECUE])
  })
})
