"""Rendus PNG et couleurs.json du jeu final du logo BF Auto (ecrou, graphite et orange).

A lancer apres construction.py, depuis le dossier final-ecrou :
  /usr/bin/python3 source/construction.py . && /usr/bin/python3 source/rendus.py .
Rendu par rsvg-convert (Homebrew).
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import construction as C  # noqa: E402

RSVG = "rsvg-convert"


def rendre(svg, png, w, h=None, fond=None):
    cmd = [RSVG, "-w", str(w)] + (["-h", str(h)] if h else []) + [svg, "-o", png]
    if fond:
        cmd[1:1] = ["-b", fond]
    subprocess.run(cmd, check=True)


def interieur(chemin_svg):
    """Contenu d'un SVG sans l'enveloppe, avec son viewBox."""
    s = open(chemin_svg, encoding="utf-8").read()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    corps = re.sub(r"(?s)^.*?</desc>\n", "", s).replace("</svg>", "").strip()
    return vb, corps


def composer(sortie, largeur, hauteur, fond, logo_svg, largeur_logo, rayon=0, dy=0.0):
    vb, corps = interieur(logo_svg)
    k = largeur_logo / vb[2]
    h = vb[3] * k
    x = (largeur - largeur_logo) / 2
    y = (hauteur - h) / 2 + dy
    fond_el = '<rect width="%d" height="%d" rx="%s" fill="%s"/>' % (largeur, hauteur, rayon, fond)
    s = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d">%s'
         '<g transform="translate(%.2f %.2f) scale(%.5f) translate(%.2f %.2f)">%s</g></svg>'
         % (largeur, hauteur, fond_el, x, y, k, -vb[0], -vb[1], corps))
    open(sortie, "w", encoding="utf-8").write(s)


def lum(hexa):
    r, g, b = (int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contraste(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return round((la + 0.05) / (lb + 0.05), 2)


COULEURS = [
    ("Graphite", "graphite", C.GRAPHITE,
     "Lettres et chat du logo sur fond clair, fond du symbole, de l'icône et des bandeaux sombres."),
    ("Graphite profond", "graphite-profond", C.GRAPHITE_PROFOND,
     "Fond sombre du site (pied de page, zones profondes) ; le logo y passe en négatif."),
    ("Orange atelier", "orange", C.ORANGE,
     "Écrou du logo, filets, boutons principaux. Objet graphique : jamais de texte orange atelier sur fond clair."),
    ("Orange foncé", "orange-fonce", C.ORANGE_FONCE,
     "Texte orange sur fond clair (liens, intertitres courts)."),
    ("Blanc cassé", "blanc-casse", C.CASSE,
     "Fond clair de référence ; lettres et chat du logo en négatif."),
    ("Texte", "texte", C.TEXTE, "Texte courant du site."),
    ("Gris clair", "gris-clair", C.GRIS_CLAIR,
     "Descripteur GARAGE AUTOMOBILE du logo négatif, petits textes sur graphite."),
]

PAIRES = [
    ("graphite", "blanc-casse"), ("graphite", "blanc"), ("blanc-casse", "graphite"),
    ("blanc-casse", "graphite-profond"), ("orange", "blanc-casse"), ("orange", "blanc"),
    ("orange", "graphite"), ("orange", "graphite-profond"), ("graphite-profond", "orange"),
    ("orange-fonce", "blanc-casse"), ("orange-fonce", "blanc"), ("texte", "blanc-casse"),
    ("texte", "blanc"), ("gris-clair", "graphite"), ("gris-clair", "graphite-profond"),
]


def couleurs_json(sortie):
    table = {cle: hexa for _, cle, hexa, _ in COULEURS}
    table["blanc"] = "#FFFFFF"
    donnees = {
        "marque": "BF Auto",
        "version": "2.0",
        "note": ("Palette finale graphite et orange (décision d'Anthony, 2026-09-23). Rapports de contraste "
                 "calculés selon WCAG 2.2 (texte courant : 4,5 minimum, AA ; objets graphiques : 3 minimum)."),
        "couleurs": [{"nom": n, "cle": k, "hex": h, "rvb": [int(h[i:i + 2], 16) for i in (1, 3, 5)], "usage": u}
                     for n, k, h, u in COULEURS],
        "contrastes": [{"avant_plan": a, "fond": b, "rapport": contraste(table[a], table[b])} for a, b in PAIRES],
    }
    with open(sortie, "w", encoding="utf-8") as f:
        json.dump(donnees, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return donnees


def main(d):
    J = lambda n: os.path.join(d, n)
    src = J("source")
    rendre(J("source/favicon-16.svg"), J("favicon-16.png"), 16, 16)
    rendre(J("favicon.svg"), J("favicon-32.png"), 32, 32)
    rendre(J("symbole.svg"), J("favicon-48.png"), 48, 48)
    # Icone Apple : carre plein (iOS pose son propre masque), fond graphite, pas de transparence
    s = open(J("symbole.svg"), encoding="utf-8").read().replace('rx="96"', 'rx="0"')
    open(os.path.join(src, "symbole-plein.svg"), "w", encoding="utf-8").write(s)
    rendre(os.path.join(src, "symbole-plein.svg"), J("apple-touch-icon.png"), 180, 180, fond=C.GRAPHITE)
    rendre(J("symbole.svg"), J("icon-192.png"), 192, 192)
    rendre(J("symbole.svg"), J("icon-512.png"), 512, 512)
    og = os.path.join(src, "og-image.svg")
    composer(og, 1200, 630, C.GRAPHITE, J("logo-negatif.svg"), 720, dy=0)
    rendre(og, J("og-image.png"), 1200, 630)
    # apercus a plat pour la planche
    for n, w in (("logo", 1600), ("logo-negatif", 1600), ("logo-mono", 1600), ("logo-sans-chat", 1600)):
        rendre(J(n + ".svg"), os.path.join(src, "apercu-" + n + ".png"), w)
    couleurs_json(J("couleurs.json"))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
