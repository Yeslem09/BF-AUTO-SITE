import type { AdressePostale, ModeSite, TelephonePublic } from '../../../contrats/index.js'
import type { Hebergeur, Mediateur, PrestataireEnvoi } from '../domaine/garage.js'
import { publier, type Publication } from '../domaine/valeur-publiee.js'
import type { SourceIdentiteGarage } from './ports.js'

/** Informations d'éditeur, d'hébergement et de médiation, dans le mode du site. */
export interface InformationsLegales {
  readonly nom: string
  readonly adresse: AdressePostale
  readonly telephone: TelephonePublic
  /** Ce que fait l'atelier : l'activité de l'éditeur, dite telle qu'elle est publiée. */
  readonly activites: Publication<string>
  readonly courriel: Publication<string>
  readonly raisonSociale: Publication<string>
  readonly formeJuridique: Publication<string>
  readonly capital: Publication<string>
  readonly siege: Publication<string>
  readonly registre: Publication<string>
  readonly siret: Publication<string>
  readonly tva: Publication<string>
  readonly directeurPublication: Publication<string>
  readonly hebergeur: Publication<Hebergeur>
  readonly region: Publication<string>
  readonly prestatairesEnvoi: Publication<readonly PrestataireEnvoi[]>
  readonly encadrementTransferts: Publication<string>
  readonly mediateur: Publication<Mediateur>
  readonly nomDeDomaine: Publication<string>
}

export type ConsulterInformationsLegales = () => Promise<InformationsLegales>

export function creerConsulterInformationsLegales(
  source: SourceIdentiteGarage,
  mode: ModeSite,
): ConsulterInformationsLegales {
  return async () => {
    const { identite, editeur, hebergement, mediateur, marque } = await source.charger()
    return {
      nom: identite.nom.valeur,
      adresse: identite.adresse.valeur,
      telephone: identite.telephone.valeur,
      activites: publier(identite.activites, mode),
      courriel: publier(identite.courriel, mode),
      raisonSociale: publier(editeur.raisonSociale, mode),
      formeJuridique: publier(editeur.formeJuridique, mode),
      capital: publier(editeur.capital, mode),
      siege: publier(editeur.siege, mode),
      registre: publier(editeur.registre, mode),
      siret: publier(editeur.siret, mode),
      tva: publier(editeur.tva, mode),
      directeurPublication: publier(editeur.directeurPublication, mode),
      hebergeur: publier(hebergement.hebergeur, mode),
      region: publier(hebergement.region, mode),
      prestatairesEnvoi: publier(hebergement.prestatairesEnvoi, mode),
      encadrementTransferts: publier(hebergement.encadrementTransferts, mode),
      mediateur: publier(mediateur, mode),
      nomDeDomaine: publier(marque.nomDeDomaine, mode),
    }
  }
}
