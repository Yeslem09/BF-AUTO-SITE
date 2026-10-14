/**
 * Données qui passent la porte de démarrage en production (Kano D8), pour les
 * parcours qui doivent voir la production elle-même : les vraies données du
 * site, sauf le garage et le catalogue, remplacés par leurs configurations
 * d'essai entièrement validées (fictives). Le canal de notification désigne un
 * serveur d'envoi fictif : aucun de ces parcours n'envoie de demande.
 */
import { cp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { documentCatalogue, familleEssai } from '../../src/contextes/catalogue/essai.js'
import { donneesEssai } from '../../src/contextes/garage/essais/donnees-essai.js'

const DONNEES_DU_SITE = resolve(import.meta.dirname, '../../donnees')

export const CANAL_DE_NOTIFICATION_FICTIF = {
  SMTP_HOTE: 'smtp.exemple.invalid',
  SMTP_EXPEDITEUR: 'site@exemple.invalid',
  COURRIEL_GARAGE: 'garage@exemple.invalid',
} as const

/** Écrit dans `dossier` un jeu de données publiable ; renvoie le chemin à passer en CHEMIN_DONNEES. */
export async function preparerDonneesDeProduction(dossier: string): Promise<string> {
  const donnees = join(dossier, 'donnees')
  await cp(DONNEES_DU_SITE, donnees, { recursive: true })
  await writeFile(join(donnees, 'garage.json'), JSON.stringify(await donneesEssai()))
  const catalogue = documentCatalogue({
    familles: [familleEssai('freinage'), familleEssai('batterie')],
    ce_que_nous_ne_faisons_pas: [
      { libelle: 'Carrosserie et peinture', statut: 'valide', source: 'garage' },
    ],
  })
  await writeFile(join(donnees, 'catalogue.json'), JSON.stringify(catalogue))
  return donnees
}
