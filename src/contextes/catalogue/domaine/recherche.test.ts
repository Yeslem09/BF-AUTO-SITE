import { describe, expect, it } from 'vitest'
import type { FamillePubliee } from './publication.js'
import {
  distanceAuPlusUn,
  LONGUEUR_MAX_REQUETE,
  motsUtiles,
  nettoyerRequete,
  rechercherFamilles,
  ressembleAUnSymptome,
} from './recherche.js'

function famille(
  identifiant: string,
  libelle: string,
  motsCourants: readonly string[],
  synonymes: readonly string[] = [],
): FamillePubliee {
  return {
    identifiant,
    libelle,
    motsCourants,
    synonymes,
    role: 'Rôle.',
    signesUsure: ['Signe'],
    ceQueFaitLeGarage: 'Travail.',
    forfaits: [],
    ventePieceSeule: true,
    pieces: [],
    consigneDemande: null,
    photoParSms: false,
    organeExcluDuReemploi: null,
    aRelire: false,
  }
}

const FAMILLES = [
  famille('freinage', 'Freinage', ['plaquettes', 'disques', 'liquide de frein'], ['frein']),
  famille('batterie', 'Batterie', ['batterie à plat', 'démarrage difficile']),
  famille('distribution', 'Distribution', ['courroie de distribution', 'galets']),
  famille('demarrage-et-charge', 'Démarrage et charge', ['alternateur', 'courroie d’accessoires']),
  famille(
    'echappement',
    'Échappement',
    ['pot d’échappement', 'filtre à particules'],
    ['pot', 'FAP'],
  ),
  famille('vidange-et-filtres', 'Vidange et filtres', ['huile moteur', 'filtre à huile']),
  famille(
    'moteur-et-injection',
    'Moteur et injection',
    ['injecteurs', 'liquide de refroidissement'],
    ['fuite d’huile'],
  ),
  famille('carrosserie', 'Carrosserie', ['chocs', 'bosses', 'rayures', 'rétroviseurs']),
  famille(
    'climatisation',
    'Climatisation',
    ['recharge de climatisation', 'air qui ne refroidit plus'],
    ['clim'],
  ),
  famille('boite-de-vitesses', 'Boîte de vitesses', ['vitesses qui craquent', 'cardans']),
  famille('eclairage', 'Éclairage', ['ampoules', 'feux arrière']),
  famille('pare-brise-et-vitrage', 'Pare-brise et vitrage', ['fissure', 'lunette arrière']),
  famille('embrayage', 'Embrayage', ['kit d’embrayage'], ['disque d’embrayage']),
]

const trouvees = (requete: string): readonly string[] =>
  rechercherFamilles(FAMILLES, requete).familles.map(({ famille: f }) => f.identifiant)

describe('recherche par mot : ce qui compte dans la requête', () => {
  it('retire accents, majuscules, pluriels et mots de liaison', () => {
    expect(motsUtiles('Les PLAQUETTES de frein de ma voiture')).toEqual(['plaquette', 'frein'])
    expect(motsUtiles('Pneus, phares et eaux')).toEqual(['pneu', 'phare', 'eau'])
    expect(motsUtiles('  ')).toEqual([])
  })

  it('ramène la requête à une ligne courte', () => {
    expect(nettoyerRequete('  pot   d’échappement  ')).toBe('pot d’échappement')
    expect(nettoyerRequete('a'.repeat(200))).toHaveLength(LONGUEUR_MAX_REQUETE)
  })

  it('pardonne une seule faute de frappe', () => {
    expect(distanceAuPlusUn('plaquete', 'plaquette')).toBe(true)
    expect(distanceAuPlusUn('plaquetes', 'plaquettes')).toBe(true)
    expect(distanceAuPlusUn('batterei', 'batterie')).toBe(false)
    expect(distanceAuPlusUn('disque', 'disque')).toBe(true)
  })
})

describe('recherche par mot : familles trouvées', () => {
  it.each([
    ['plaquettes', ['freinage']],
    ['Plaquettes de frein', ['freinage']],
    ['plaq', ['freinage']],
    ['plaquete', ['freinage']],
    ['FREINS', ['freinage']],
    ['rétroviseur', ['carrosserie']],
    ['pot', ['echappement']],
    ['fap', ['echappement']],
  ])('« %s » mène à %j', (requete, attendues) => {
    expect(trouvees(requete)).toEqual(attendues)
  })

  it('garde les familles qui répondent au plus grand nombre de mots : « liquide de frein » mène au freinage seul', () => {
    expect(trouvees('liquide de frein')).toEqual(['freinage'])
    expect(trouvees('liquide')).toEqual(['freinage', 'moteur-et-injection'])
  })

  it('classe le nom de la famille avant un mot courant qui le contient', () => {
    expect(trouvees('batterie')).toEqual(['batterie'])
    expect(trouvees('démarrage')).toEqual(['demarrage-et-charge', 'batterie'])
    expect(trouvees('courroie')).toEqual(['distribution', 'demarrage-et-charge'])
  })

  it('préfère le terme entier : « filtre à particules » mène à l’échappement, pas à la vidange', () => {
    expect(trouvees('filtre à particules')).toEqual(['echappement'])
    expect(trouvees('huile moteur')).toEqual(['vidange-et-filtres'])
    expect(trouvees('huile')).toEqual(['vidange-et-filtres', 'moteur-et-injection'])
    expect(trouvees('filtre')).toEqual(['vidange-et-filtres', 'echappement'])
  })

  it('dit quel mot courant a mené à la famille, jamais un synonyme', () => {
    const [plaquettes] = rechercherFamilles(FAMILLES, 'plaquettes').familles
    expect(plaquettes?.motCourant).toBe('plaquettes')
    const [frein] = rechercherFamilles(FAMILLES, 'frein').familles
    expect(frein?.motCourant).toBeNull()
    const [freinage] = rechercherFamilles(FAMILLES, 'freinage').familles
    expect(freinage?.motCourant).toBeNull()
  })

  it('ignore les mots vides : « qui », possessifs et positions ne mènent à aucune famille', () => {
    expect(motsUtiles('Mon frein avant qui grince')).toEqual(['frein', 'grince'])
    expect(trouvees('freins qui grincent')).toEqual(['freinage'])
    expect(trouvees('plaquettes arrière')).toEqual(['freinage'])
    expect(trouvees('plaquettes avant de ma voiture')).toEqual(['freinage'])
    expect(trouvees('ma lunette arrière')).toEqual(['pare-brise-et-vitrage'])
  })

  it('ne trouve rien pour un mot inconnu, une requête vide ou faite de mots de liaison', () => {
    expect(trouvees('turbo magique')).toEqual([])
    expect(trouvees('')).toEqual([])
    expect(trouvees('la de ma voiture')).toEqual([])
    expect(trouvees('zz')).toEqual([])
  })
})

describe('recherche par mot : symptôme reconnu, pré-diagnostic proposé d’abord', () => {
  it.each([
    'freins qui grincent',
    'un bruit au freinage',
    'ça fume',
    'voyant moteur allumé',
    'le volant vibre',
    'la voiture fuit',
    'elle tire à gauche',
    'ça siffle',
  ])('« %s » ressemble à un symptôme', (requete) => {
    expect(ressembleAUnSymptome(requete)).toBe(true)
    expect(rechercherFamilles(FAMILLES, requete).symptome).toBe(true)
  })

  it.each(['plaquettes avant', 'batterie', 'rétroviseur', 'huile moteur', 'tirette'])(
    '« %s » désigne une pièce, pas un symptôme',
    (requete) => {
      expect(ressembleAUnSymptome(requete)).toBe(false)
    },
  )

  it('un symptôme sans pièce connue ne trouve aucune famille, mais le dit', () => {
    const resultat = rechercherFamilles(FAMILLES, 'ça fume')
    expect(resultat).toEqual({ familles: [], symptome: true })
  })
})
