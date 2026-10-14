import { describe, expect, it } from 'vitest'
import {
  arbreAccepte,
  creerArbreEssai,
  lireArbreDuSite,
  relire,
  resultatBrut,
} from '../essais/arbre-essai.js'
import type { Arbre } from './arbre.js'
import { cheminsDeBranche, MAX_QUESTIONS_PAR_CHEMIN } from './chemins.js'
import { lireArbre } from './lecture-arbre.js'
import { rangNiveau } from './niveau.js'
import {
  avancer,
  ETAT_INITIAL,
  type Etape,
  type EtapeArret,
  type EtapeQuestion,
  type EtapeResultat,
  type EtapeSignes,
  type EtatParcours,
} from './parcours.js'

const ESSAI = arbreAccepte()

function etat(partiel: Partial<EtatParcours>): EtatParcours {
  return { ...ETAT_INITIAL, ...partiel }
}

function attendre<T extends Etape['type']>(
  etape: Etape,
  type: T,
): Extract<Etape, { readonly type: T }> {
  if (etape.type !== type) throw new Error(`Étape ${type} attendue, ${etape.type} obtenue`)
  return etape as Extract<Etape, { readonly type: T }>
}

const signes = (arbre: Arbre, partiel: Partial<EtatParcours>): EtapeSignes =>
  attendre(avancer(arbre, etat(partiel)), 'signes')
const question = (arbre: Arbre, partiel: Partial<EtatParcours>): EtapeQuestion =>
  attendre(avancer(arbre, etat(partiel)), 'question')
const arret = (arbre: Arbre, partiel: Partial<EtatParcours>): EtapeArret =>
  attendre(avancer(arbre, etat(partiel)), 'arret')
const resultat = (arbre: Arbre, partiel: Partial<EtatParcours>): EtapeResultat =>
  attendre(avancer(arbre, etat(partiel)), 'resultat')

describe('parcours : première question', () => {
  it('sans réponse, pose la question 1 avec un choix par branche', () => {
    const etape = attendre(avancer(ESSAI, ETAT_INITIAL), 'symptome')
    expect(etape.numero).toBe(1)
    expect(etape.intitule).toBe('Que remarquez-vous ?')
    expect(etape.options.map((option) => option.code)).toEqual([
      'voyant',
      'bruit',
      'vibrations',
      'freinage',
      'ne-sais-pas',
    ])
    expect(etape.cochee).toBeNull()
  })

  it('ignore un symptôme inconnu : la question 1 s’affiche de nouveau', () => {
    expect(avancer(ESSAI, etat({ symptome: 'moteur-en-feu' })).type).toBe('symptome')
  })

  it('marque la réponse précédente quand on y revient', () => {
    const etape = attendre(avancer(ESSAI, etat({ coches: ['bruit'] })), 'symptome')
    expect(etape.cochee).toBe('bruit')
  })
})

describe('parcours : les signes de danger, toujours en deuxième', () => {
  it('pose la question 2 juste après le symptôme, avec « Aucun » et « Je ne sais pas » en dernier', () => {
    const etape = signes(ESSAI, { symptome: 'voyant' })
    expect(etape.numero).toBe(2)
    expect(etape.intitule).toBe('Remarquez-vous l’un de ces signes ?')
    expect(etape.options.map((option) => option.code)).toEqual([
      'voyant-rouge',
      'pedale-molle',
      'fumee-brule',
      'direction',
      'aucun',
      'ne-sais-pas',
    ])
    expect(etape.options.at(-2)?.libelle).toBe('Aucun de ces signes')
    expect(etape.options.at(-1)?.libelle).toBe('Je ne sais pas')
    expect(etape.erreur).toBe(false)
    expect(etape.retour).toEqual(etat({ coches: ['voyant'] }))
  })

  it('signale l’erreur quand le formulaire revient sans aucune case cochée', () => {
    expect(signes(ESSAI, { symptome: 'bruit', etapeEnvoyee: 'signes' }).erreur).toBe(true)
  })

  it('ignore les cases inconnues : sans case connue, la question 2 revient', () => {
    expect(signes(ESSAI, { symptome: 'bruit', signes: ['<script>', 'libre'] }).numero).toBe(2)
  })

  it('pré-coche les cases transmises par le lien de retour', () => {
    expect(
      signes(ESSAI, { symptome: 'bruit', coches: ['aucun', 'inconnue', 'pedale-molle'] }).cochees,
    ).toEqual(['pedale-molle', 'aucun'])
  })

  it('un seul signe coché arrête le questionnaire, sans autre question', () => {
    const etape = arret(ESSAI, {
      symptome: 'bruit',
      signes: ['pedale-molle'],
      reponses: ['vitesse'],
    })
    expect(etape.niveau).toBe('ne-pas-rouler')
    expect(etape.signes.map((signe) => signe.code)).toEqual(['pedale-molle'])
    expect(etape.code).toBe('bruit.pedale-molle')
  })

  it('un signe coché l’emporte sur « Aucun de ces signes » et sur « Je ne sais pas »', () => {
    const etape = arret(ESSAI, {
      symptome: 'bruit',
      signes: ['aucun', 'fumee-brule', 'ne-sais-pas'],
    })
    expect(etape.signes.map((signe) => signe.code)).toEqual(['fumee-brule'])
    expect(etape.retour).toEqual(
      etat({ symptome: 'bruit', coches: ['fumee-brule', 'aucun', 'ne-sais-pas'] }),
    )
    expect(etape.reponses).toEqual([
      { question: 'Que remarquez-vous ?', reponse: 'Un bruit inhabituel' },
      { question: 'Remarquez-vous l’un de ces signes ?', reponse: 'De la fumée sous le capot' },
    ])
  })

  it('« Je ne sais pas » laisse continuer, sans jamais descendre sous « faire contrôler »', () => {
    const etape = resultat(ESSAI, {
      symptome: 'voyant',
      signes: ['ne-sais-pas'],
      reponses: ['entretien'],
    })
    expect(etape.niveau).toBe('a-controler')
    expect(etape.signesARappeler.map((signe) => signe.code)).toEqual([
      'voyant-rouge',
      'pedale-molle',
      'fumee-brule',
      'direction',
    ])
  })

  it('« Aucun » avec « Je ne sais pas » : le doute l’emporte', () => {
    const etape = resultat(ESSAI, {
      symptome: 'voyant',
      signes: ['aucun', 'ne-sais-pas'],
      reponses: ['entretien'],
    })
    expect(etape.niveau).toBe('a-controler')
    expect(etape.signesARappeler.length).toBeGreaterThan(0)
  })
})

describe('parcours : les questions de la branche', () => {
  it('numérote la première question de la branche 3, puis 4', () => {
    expect(question(ESSAI, { symptome: 'bruit', signes: ['aucun'] }).numero).toBe(3)
    const suivante = question(ESSAI, {
      symptome: 'bruit',
      signes: ['aucun'],
      reponses: ['freinage'],
    })
    expect(suivante.numero).toBe(4)
    expect(suivante.question.code).toBe('frein-bruit')
  })

  it('reporte les réponses déjà données dans l’état de l’étape', () => {
    const etape = question(ESSAI, { symptome: 'bruit', signes: ['aucun'], reponses: ['freinage'] })
    expect(etape.etat).toEqual(
      etat({ symptome: 'bruit', signes: ['aucun'], reponses: ['freinage'] }),
    )
  })

  it('ignore une réponse inconnue et tout ce qui la suit : la question revient', () => {
    const etape = question(ESSAI, {
      symptome: 'bruit',
      signes: ['aucun'],
      reponses: ['Texte libre', 'sifflement'],
    })
    expect(etape.question.code).toBe('bruit-moment')
    expect(etape.etat.reponses).toEqual([])
  })

  it('revenir à la question précédente pré-coche la dernière réponse', () => {
    const quatrieme = question(ESSAI, {
      symptome: 'bruit',
      signes: ['aucun'],
      reponses: ['freinage'],
    })
    expect(quatrieme.retour).toEqual(
      etat({ symptome: 'bruit', signes: ['aucun'], reponses: [], coches: ['freinage'] }),
    )
    const retour = question(ESSAI, quatrieme.retour)
    expect(retour.question.code).toBe('bruit-moment')
    expect(retour.cochee).toBe('freinage')
    const troisieme = question(ESSAI, { symptome: 'bruit', signes: ['aucun'] })
    expect(troisieme.retour).toEqual(etat({ symptome: 'bruit', coches: ['aucun'] }))
  })

  it('signale l’erreur quand la question revient sans réponse', () => {
    const etape = question(ESSAI, {
      symptome: 'bruit',
      signes: ['aucun'],
      etapeEnvoyee: 'bruit-moment',
    })
    expect(etape.erreur).toBe(true)
    expect(
      question(ESSAI, { symptome: 'bruit', signes: ['aucun'], etapeEnvoyee: 'autre' }).erreur,
    ).toBe(false)
  })
})

describe('parcours : le résultat', () => {
  it('donne le niveau, les pistes, les réponses lisibles et le code du parcours', () => {
    const etape = resultat(ESSAI, {
      symptome: 'bruit',
      signes: ['aucun'],
      reponses: ['freinage', 'sifflement'],
    })
    expect(etape.niveau).toBe('a-controler')
    expect(etape.conclusion.type).toBe('pistes')
    expect(etape.signesARappeler).toEqual([])
    expect(etape.code).toBe('bruit.aucun.freinage.sifflement')
    expect(etape.reponses).toEqual([
      { question: 'Que remarquez-vous ?', reponse: 'Un bruit inhabituel' },
      { question: 'Remarquez-vous l’un de ces signes ?', reponse: 'Aucun de ces signes' },
      { question: 'Quand entendez-vous ce bruit ?', reponse: 'Quand je freine' },
      { question: 'À quoi ressemble ce bruit ?', reponse: 'Un sifflement' },
    ])
    expect(etape.retour).toEqual(
      etat({
        symptome: 'bruit',
        signes: ['aucun'],
        reponses: ['freinage'],
        coches: ['sifflement'],
      }),
    )
  })

  it('ignore les réponses en trop après le résultat : le code reste celui du parcours', () => {
    const etape = resultat(ESSAI, {
      symptome: 'bruit',
      signes: ['aucun'],
      reponses: ['vitesse', 'sifflement', 'autre'],
    })
    expect(etape.code).toBe('bruit.aucun.vitesse')
  })

  it('un résultat de niveau « Ne roulez pas » reste un résultat de ce niveau', () => {
    const etape = resultat(ESSAI, {
      symptome: 'bruit',
      signes: ['aucun'],
      reponses: ['freinage', 'frottement'],
    })
    expect(etape.niveau).toBe('ne-pas-rouler')
  })

  it('« Pas d’urgence » reste possible hors des branches à plancher', () => {
    expect(
      resultat(ESSAI, { symptome: 'voyant', signes: ['aucun'], reponses: ['entretien'] }).niveau,
    ).toBe('sans-urgence')
  })

  it('« Je ne sais pas » partout : les réponses ne suffisent pas, l’atelier doit voir la voiture', () => {
    const etape = resultat(ESSAI, {
      symptome: 'ne-sais-pas',
      signes: ['ne-sais-pas'],
      reponses: ['ne-sais-pas'],
    })
    expect(etape.conclusion).toEqual({ type: 'insuffisante' })
    expect(etape.niveau).toBe('a-controler')
    expect(etape.signesARappeler.length).toBeGreaterThan(0)
  })

  it('une seule réponse précise suffit à garder les pistes', () => {
    const etape = resultat(ESSAI, {
      symptome: 'ne-sais-pas',
      signes: ['aucun'],
      reponses: ['ne-sais-pas'],
    })
    expect(etape.conclusion.type).toBe('pistes')
  })
})

describe('parcours : plancher tenu par le moteur, en plus de la porte', () => {
  it('relève au plancher un résultat trop rassurant, même dans un arbre qui aurait échappé à la porte', () => {
    const brut = creerArbreEssai()
    resultatBrut(brut, 'bruit-roulement').niveau = 'sans-urgence'
    const lecture = lireArbre(brut)
    if (!lecture.lisible) throw new Error(lecture.problemes.join('\n'))
    const etape = resultat(lecture.arbre, {
      symptome: 'bruit',
      signes: ['aucun'],
      reponses: ['vitesse'],
    })
    expect(etape.niveau).toBe('a-controler')
  })
})

describe('parcours : branche refusée à la relecture', () => {
  const arbreElague = arbreAccepte({
    ...relire(creerArbreEssai()),
    branches_non_validees: ['bruit'],
  })

  it('pose encore la question des signes, puis conclut sans orienter', () => {
    expect(signes(arbreElague, { symptome: 'bruit' }).numero).toBe(2)
    const etape = resultat(arbreElague, {
      symptome: 'bruit',
      signes: ['aucun'],
      reponses: ['vitesse'],
    })
    expect(etape.conclusion).toEqual({ type: 'insuffisante' })
    expect(etape.niveau).toBe('a-controler')
    expect(etape.code).toBe('bruit.aucun')
  })

  it('garde l’écran d’arrêt sur un signe de danger', () => {
    expect(arret(arbreElague, { symptome: 'bruit', signes: ['direction'] }).niveau).toBe(
      'ne-pas-rouler',
    )
  })

  it('laisse les autres branches intactes', () => {
    expect(
      resultat(arbreElague, { symptome: 'voyant', signes: ['aucun'], reponses: ['entretien'] })
        .conclusion.type,
    ).toBe('pistes')
  })
})

describe('parcours : l’arbre du site, chemin par chemin', () => {
  const site = arbreAccepte(lireArbreDuSite())

  it('chaque chemin de chaque branche mène à un résultat en 5 questions au plus, plancher tenu', () => {
    let parcourus = 0
    for (const branche of site.branches) {
      for (const chemin of cheminsDeBranche(site, branche)) {
        for (const reponseSignes of ['aucun', 'ne-sais-pas']) {
          const etape = resultat(site, {
            symptome: branche.code,
            signes: [reponseSignes],
            reponses: chemin.pas.map((pas) => pas.choix.code),
          })
          parcourus += 1
          expect(2 + chemin.pas.length).toBeLessThanOrEqual(MAX_QUESTIONS_PAR_CHEMIN)
          expect(rangNiveau(etape.niveau)).toBeGreaterThanOrEqual(rangNiveau(branche.plancher))
          if (reponseSignes === 'ne-sais-pas') {
            expect(etape.niveau).not.toBe('sans-urgence')
          }
          if (etape.conclusion.type === 'pistes') {
            expect(etape.conclusion.resultat.pistes.length).toBeGreaterThanOrEqual(1)
            expect(etape.conclusion.resultat.pistes.length).toBeLessThanOrEqual(3)
          }
        }
      }
    }
    expect(parcourus).toBeGreaterThan(100)
  })

  it('chaque signe de danger de chaque branche mène à l’écran d’arrêt', () => {
    for (const branche of site.branches) {
      for (const code of branche.signes) {
        expect(arret(site, { symptome: branche.code, signes: [code, 'aucun'] }).niveau).toBe(
          'ne-pas-rouler',
        )
      }
    }
  })

  it('bruit, freinage et vibrations ne disent jamais « Pas d’urgence »', () => {
    for (const code of ['bruit', 'freinage', 'vibrations']) {
      const branche = site.branches.find((candidate) => candidate.code === code)
      if (branche === undefined) throw new Error(`branche ${code} absente`)
      for (const chemin of cheminsDeBranche(site, branche)) {
        const etape = resultat(site, {
          symptome: code,
          signes: ['aucun'],
          reponses: chemin.pas.map((pas) => pas.choix.code),
        })
        expect(etape.niveau).not.toBe('sans-urgence')
      }
    }
  })
})
