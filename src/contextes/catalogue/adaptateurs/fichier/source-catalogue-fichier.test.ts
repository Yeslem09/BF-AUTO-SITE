import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { documentCatalogue } from '../../essai.js'
import { expressionsInterditesDans } from '../../domaine/mots-interdits.js'
import { recenserBloquantsAValider } from '../../domaine/publication.js'
import { creerSourceCatalogueFichier, ErreurFichierCatalogue } from './source-catalogue-fichier.js'

const FICHIER_DU_SITE = resolve(import.meta.dirname, '../../../../../donnees/catalogue.json')
const SOURCE_ETUDE_06 =
  'proposition calée sur le marché local (étude 06 : idGarages, Vroomly, Norauto Belle Épine, Speedy Thiais)'

let dossier: string | null = null
afterEach(async () => {
  if (dossier !== null) await rm(dossier, { recursive: true, force: true })
  dossier = null
})

async function fichierAvec(contenu: string): Promise<string> {
  dossier = await mkdtemp(join(tmpdir(), 'bf-auto-source-catalogue-'))
  const chemin = join(dossier, 'catalogue.json')
  await writeFile(chemin, contenu)
  return chemin
}

describe('source du catalogue en fichier', () => {
  it('lit et valide le fichier une seule fois', async () => {
    const chemin = await fichierAvec(JSON.stringify(documentCatalogue()))
    const source = creerSourceCatalogueFichier(chemin)
    const premier = await source.charger()
    await writeFile(chemin, 'modifié après le démarrage')
    expect(await source.charger()).toBe(premier)
  })

  it('refuse un fichier absent en le nommant', async () => {
    const source = creerSourceCatalogueFichier('/nulle-part/catalogue.json')
    await expect(source.charger()).rejects.toThrow(
      new ErreurFichierCatalogue('Fichier du catalogue illisible : /nulle-part/catalogue.json.'),
    )
  })

  it('refuse un JSON mal formé', async () => {
    const source = creerSourceCatalogueFichier(await fichierAvec('{ "familles": '))
    await expect(source.charger()).rejects.toThrow(/n’est pas un JSON valide/)
  })

  it('refuse un contenu invalide en listant chaque problème', async () => {
    const source = creerSourceCatalogueFichier(
      await fichierAvec(JSON.stringify(documentCatalogue({ familles: [] }))),
    )
    await expect(source.charger()).rejects.toThrow(/familles : 0 élément\(s\), de 1 à 24 attendus/)
  })
})

describe('fichier réel du catalogue (donnees/catalogue.json)', () => {
  it('est valide et couvre toute l’offre en 17 familles complètes, sans la carrosserie (2026-10-21)', async () => {
    const catalogue = await creerSourceCatalogueFichier(FICHIER_DU_SITE).charger()
    expect(catalogue.familles).toHaveLength(17)
    const libelles = catalogue.familles.map((famille) => famille.libelle)
    expect(libelles).toEqual(expect.arrayContaining(['Peinture', 'Diagnostic électronique']))
    expect(libelles).not.toContain('Carrosserie')
    for (const famille of catalogue.familles) {
      expect(famille.role, famille.identifiant).not.toBe('')
      expect(famille.signesUsure.length, famille.identifiant).toBeGreaterThan(0)
      expect(famille.motsCourants.length, famille.identifiant).toBeGreaterThanOrEqual(2)
      expect(famille.ceQueFaitLeGarage, famille.identifiant).not.toBe('')
    }
  })

  it('ne présente rien comme validé : tout reste une proposition, chaque prix chiffré cite sa source', async () => {
    const catalogue = await creerSourceCatalogueFichier(FICHIER_DU_SITE).charger()
    const provenances = [
      ...catalogue.familles.map((famille) => famille.provenance),
      catalogue.engagementPiecePosee.provenance,
      catalogue.gammeAuChoix.provenance,
    ]
    expect(
      provenances.every(({ statut, source }) => statut === 'a_valider' && source === 'proposition'),
    ).toBe(true)
    const prix = [
      ...catalogue.familles.flatMap((famille) => famille.forfaits.map((forfait) => forfait.prix)),
      catalogue.tarifsTransverses.tauxHoraire,
      catalogue.tarifsTransverses.premierControle,
    ]
    expect(prix.every((unPrix) => unPrix.statut === 'a_valider')).toBe(true)
    for (const unPrix of prix) {
      if (unPrix.nature === 'inconnu') continue
      expect(unPrix.source).toBe(SOURCE_ETUDE_06)
    }
    expect(recenserBloquantsAValider(catalogue)).toEqual([
      expect.stringMatching(/^Familles d’intervention à confirmer par le garage : /),
      expect.stringMatching(/^Prix de démonstration à confirmer par le garage ou à retirer/),
    ])
  })

  it('ne date aucun prix dans le futur (J1, J2 : « prix au 1er octobre » lu le 24 septembre)', async () => {
    const catalogue = await creerSourceCatalogueFichier(FICHIER_DU_SITE).charger()
    const aujourdhui = new Date().toISOString().slice(0, 10)
    const prix = [
      catalogue.tarifsTransverses.tauxHoraire,
      catalogue.tarifsTransverses.premierControle,
      ...catalogue.familles.flatMap((famille) => famille.forfaits.map((forfait) => forfait.prix)),
    ]
    for (const unPrix of prix) {
      if (unPrix.nature !== 'chiffre') continue
      const { annee, mois, jour } = unPrix.dateEffet
      const date = `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`
      expect(date <= aujourdhui, date).toBe(true)
    }
  })

  it('propose des pièces à cocher au pluriel et côté, et la pièce de chaque forfait posé', async () => {
    const catalogue = await creerSourceCatalogueFichier(FICHIER_DU_SITE).charger()
    const freinage = catalogue.familles.find((famille) => famille.identifiant === 'freinage')
    expect(freinage?.pieces).toEqual([
      'Plaquettes avant',
      'Plaquettes arrière',
      'Disques avant',
      'Disques arrière',
      'Étriers',
    ])
    expect(freinage?.forfaits[0]?.piece).toBe('Plaquettes avant')
    for (const famille of catalogue.familles) {
      // Toute famille qui vend des pièces en propose à cocher ; une prestation, aucune.
      expect(famille.pieces.length > 0, famille.identifiant).toBe(famille.ventePieceSeule)
    }
    const prestations = catalogue.familles.flatMap((famille) =>
      famille.forfaits.filter((forfait) => forfait.prestation).map((forfait) => forfait.intitule),
    )
    expect(prestations).toEqual(expect.arrayContaining(['Révision', 'Géométrie (parallélisme)']))
  })

  it('porte les prix de démonstration demandés : forfaits « à partir de » pour une citadine essence, taux horaire et premier contrôle fixes, datés du 24 septembre 2026', async () => {
    const catalogue = await creerSourceCatalogueFichier(FICHIER_DU_SITE).charger()
    const forfaits = new Map(
      catalogue.familles.flatMap((famille) =>
        famille.forfaits.map((forfait) => [forfait.intitule, forfait.prix] as const),
      ),
    )
    // Un taux horaire est un chiffre (J3) : « 60,00 € TTC de l’heure », jamais « à partir de ».
    for (const tarif of [
      catalogue.tarifsTransverses.tauxHoraire,
      catalogue.tarifsTransverses.premierControle,
    ]) {
      expect(tarif).toMatchObject({
        nature: 'chiffre',
        statut: 'a_valider',
        aPartirDe: false,
        vehiculeReference: null,
        dateEffet: { annee: 2026, mois: 9, jour: 24 },
      })
    }
    const chiffres = [
      ...[
        'Vidange',
        'Révision',
        'Plaquettes avant posées',
        'Batterie posée',
        'Pneu monté et équilibré',
        'Géométrie (parallélisme)',
        'Recharge de climatisation',
        'Diagnostic électronique',
      ].map((intitule) => forfaits.get(intitule)),
    ]
    for (const prix of chiffres) {
      expect(prix?.nature).toBe('chiffre')
      if (prix?.nature !== 'chiffre') continue
      expect(prix).toMatchObject({
        statut: 'a_valider',
        aPartirDe: true,
        vehiculeReference: 'citadine essence',
        dateEffet: { annee: 2026, mois: 9, jour: 24 },
      })
    }
    const premierControle = catalogue.tarifsTransverses.premierControle
    expect(premierControle).toMatchObject({
      duree: '30 minutes environ',
      deduitDeLaReparation: true,
    })
    expect(forfaits.has('Réparation de carrosserie')).toBe(false)
    expect(catalogue.exemplesAccueil).toEqual(['vidange', 'revision', 'plaquettes-avant'])
  })

  it('ne propose la pièce seule que hors prestations, et jamais d’occasion pour les organes exclus par la loi', async () => {
    const catalogue = await creerSourceCatalogueFichier(FICHIER_DU_SITE).charger()
    const prestations = catalogue.familles
      .filter((famille) => !famille.ventePieceSeule)
      .map((famille) => famille.identifiant)
    expect(prestations).toEqual(['climatisation', 'diagnostic-electronique', 'peinture'])
    const exclues = catalogue.familles
      .filter((famille) => famille.organeExcluDuReemploi !== null)
      .map((famille) => [famille.identifiant, famille.organeExcluDuReemploi])
    expect(exclues).toEqual([
      ['freinage', 'freinage'],
      ['pneus', 'liaison-au-sol'],
      ['amortisseurs-et-suspension', 'trains-roulants'],
    ])
  })

  it('exclut la carrosserie, validée par le garage (2026-10-21)', async () => {
    const catalogue = await creerSourceCatalogueFichier(FICHIER_DU_SITE).charger()
    expect(catalogue.ceQueNousNeFaisonsPas).toEqual([
      { texte: 'Carrosserie', provenance: { statut: 'valide', source: 'garage' } },
    ])
  })

  it('ne contient aucune expression interdite, commentaire compris', async () => {
    const { readFile } = await import('node:fs/promises')
    expect(expressionsInterditesDans(await readFile(FICHIER_DU_SITE, 'utf8'))).toEqual([])
  })
})
