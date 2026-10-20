import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { creerExaminerLien } from '../../application/examiner-lien.js'
import { creerIdentifierSession } from '../../application/identifier-session.js'
import { creerOuvrirSession } from '../../application/ouvrir-session.js'
import { hachageSha256 } from '../crypto/jetons.js'
import { creerGenerateurSequentiel, creerHorlogeReglable } from '../essai/doublures.js'
import { creerDepotAccesSqlite } from '../sqlite/depot-acces-sqlite.js'
import { CODES_SORTIE, executerCommande, USAGE } from './commandes.js'

const MAINTENANT = new Date('2026-09-23T08:00:00Z')
let dossier: string
let sortie: string[]
let erreurs: string[]

beforeEach(async () => {
  dossier = await mkdtemp(join(tmpdir(), 'bf-auto-cli-'))
  sortie = []
  erreurs = []
})
afterEach(async () => {
  await rm(dossier, { recursive: true, force: true })
})

function lancer(...argumentsRecus: string[]): number {
  return executerCommande(argumentsRecus, {
    env: { BASE_SQLITE: 'base.sqlite', URL_PUBLIQUE: 'https://garage.exemple' },
    repertoireCourant: dossier,
    sorties: {
      ecrire: (texte) => sortie.push(texte),
      ecrireErreur: (texte) => erreurs.push(texte),
    },
    horloge: creerHorlogeReglable(MAINTENANT),
  })
}

describe('commande d’exploitation garagiste', () => {
  it('rappelle l’usage sur une commande absente ou inconnue', () => {
    expect(lancer()).toBe(CODES_SORTIE.usage)
    expect(lancer('supprimer')).toBe(CODES_SORTIE.usage)
    expect(lancer('reinitialiser', 'en-trop')).toBe(CODES_SORTIE.usage)
    expect(erreurs).toEqual([USAGE, USAGE, USAGE])
  })

  it('reinitialiser : l’ancienne session est ensuite rejetée (US-33)', () => {
    const fichier = join(dossier, 'base.sqlite')
    const depot = creerDepotAccesSqlite(fichier)
    const horloge = creerHorlogeReglable(MAINTENANT)
    const banc = { depot, hachage: hachageSha256, horloge, generateur: creerGenerateurSequentiel() }
    expect(lancer('lien')).toBe(CODES_SORTIE.succes)
    const jetonLien = new URL(sortie.join('').split('\n')[1] ?? '').searchParams.get('jeton')
    const ouverture = creerOuvrirSession(banc)(jetonLien)
    if (ouverture.issue !== 'ouverte') throw new Error(`session attendue : ${ouverture.issue}`)
    const identifier = creerIdentifierSession(banc)
    expect(identifier(ouverture.jetonSession)).not.toBeNull()

    sortie = []
    expect(lancer('reinitialiser')).toBe(CODES_SORTIE.succes)
    expect(sortie.join('')).toContain('Accès réinitialisé : 1 session(s) révoquée(s)')
    expect(identifier(ouverture.jetonSession)).toBeNull()
    depot.fermer()
  })

  it('lien : affiche un lien de secours valable 15 minutes, sur l’origine publique', () => {
    expect(lancer('lien')).toBe(CODES_SORTIE.succes)
    const [entete = '', adresse = ''] = sortie.join('').split('\n')
    expect(entete).toContain('valable jusqu’à 2026-09-23T08:15:00.000Z')
    expect(adresse).toMatch(
      /^https:\/\/garage\.exemple\/garagiste\/connexion\/lien\?jeton=[\w-]{43}$/,
    )
    const depot = creerDepotAccesSqlite(join(dossier, 'base.sqlite'))
    const examiner = creerExaminerLien({
      depot,
      hachage: hachageSha256,
      horloge: creerHorlogeReglable(MAINTENANT),
    })
    expect(examiner(new URL(adresse).searchParams.get('jeton'))).toBe('valide')
    depot.fermer()
  })

  it('échoue proprement, avec un code non nul, si la base est inaccessible', async () => {
    // Un fichier ordinaire pris pour dossier : inaccessible sur tout système
    // (sous Windows, « /dev/null/... » serait créé sous C:\dev).
    const fichier = join(dossier, 'pas-un-dossier')
    await writeFile(fichier, '')
    const code = executerCommande(['reinitialiser'], {
      env: { BASE_SQLITE: join(fichier, 'base.sqlite') },
      repertoireCourant: dossier,
      sorties: {
        ecrire: (texte) => sortie.push(texte),
        ecrireErreur: (texte) => erreurs.push(texte),
      },
    })
    expect(code).toBe(CODES_SORTIE.echec)
    expect(erreurs).toHaveLength(1)
  })
})
