"""Construction du jeu final du logo BF Auto, concept ecrou, palette graphite et orange.

Derive de concepts/c5-ecrou/source/construction.py. Changements apportes apres le jury
(voir charte-logo.md, section Historique) :
- alesage de l'ecrou reduit (21 a 16) : l'ecrou se lit comme une piece pleine
  percee, et non comme un petit o entre le B et le F (risque de lecture "BoF") ;
- jeu entre l'ecrou et les lettres porte de 8 a 10 unites (fabrication) ;
- chanfreins raccourcis (28 a 20) et mot AUTO elargi, approches ouvertes : le
  lettrage perd son cote pochoir sans changer de famille ;
- panses du B plus droites (chanfrein court) : le B se lit comme un B ;
- un chat couche sur le haut de TO, dessine avec les memes regles (aplats, une
  seule oblique a 60 degres, jeu constant avec les lettres), queue pendante
  terminee par un crochet construit comme le bas du U.

Aucune lettre n'est composee en police, sauf le descripteur extrait de Hanken
Grotesk SemiBold (licence SIL OFL 1.1) et vectorise en chemins.

Usage : /usr/bin/python3 construction.py <dossier_de_sortie>
"""
import math
import os
import sys

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

S3 = math.sqrt(3.0)
T60 = S3

# ---------------------------------------------------------------- couleurs (palette finale)
GRAPHITE = "#3A3935"       # lettres sur fond clair, fond du symbole et des fonds sombres
GRAPHITE_PROFOND = "#2F2E2B"
ORANGE = "#E4682B"         # ecrou (objet graphique, jamais du texte sur fond clair)
ORANGE_FONCE = "#B5501B"   # texte orange sur fond clair
CASSE = "#F5F4F2"          # blanc casse : lettres sur fond sombre, fond clair de reference
TEXTE = "#262626"
GRIS_CLAIR = "#C9C6BF"     # descripteur sur fond sombre
NOIR = "#000000"
BLANC = "#FFFFFF"

DESC_FONT = "/Users/anthonybalou/Library/Fonts/HankenGrotesk-SemiBold.ttf"


# ---------------------------------------------------------------- grille
class Grille:
    H = 240.0     # hauteur de capitale
    V = 44.0      # futs
    Hs = 40.0     # traverses hautes et basses
    M = 36.0      # barres medianes
    c = 20.0      # chanfrein de courbe (projection horizontale, 60 degres)
    cA = 34.0     # chanfrein du sommet du A
    r = 48.0      # rayon circonscrit de l'ecrou (hexagone pose a plat)
    rb = 16.0     # rayon de l'alesage
    g = 10.0      # jeu entre l'ecrou et les lettres
    xi = 29.0     # demi-largeur du canal entre B et F
    Bw = 144.0    # chasse du B
    Fw = 120.0    # chasse du F (bras haut)
    Fm = 0.84     # bras median / bras haut
    Aw = 164.0
    Ab = -104.0   # axe de la barre du A
    Uw = 148.0
    Tw = 144.0
    Ow = 158.0
    mot = 92.0                        # espace entre le F et le A
    approches = (28.0, 26.0, 24.0)    # A-U, U-T, T-O


class GrilleSymbole(Grille):
    """Taille optique du symbole, dessinee dans le carre de 512.

    Capitale de 320 (haut 96, bas 416), futs de 64, B de 192, canal de 64, F de 160 :
    le monogramme va de 48 a 464, tous les bords droits tombent sur des multiples de
    16 unites, donc sur des pixels entiers a 32 et 64 px (et 48 px pour les
    multiples de 32). Barre mediane fine (32) pour rouvrir les contreformes du B,
    ecrou plus gros, alesage et jeu elargis pour survivre en petit.
    """
    H = 320.0
    V = 64.0
    Hs = 48.0
    M = 32.0
    c = 32.0
    r = 58.0
    rb = 19.0
    g = 14.0
    xi = 32.0
    Bw = 192.0
    Fw = 160.0


# ---------------------------------------------------------------- geometrie
def hexagone(cx, cy, r):
    """Hexagone regulier pose a plat (faces haute et basse horizontales)."""
    return [(cx + r * math.cos(math.radians(60 * i)), cy + r * math.sin(math.radians(60 * i))) for i in range(6)]


def demi_plans(contraintes, boite=(-2000.0, -2000.0, 2000.0, 2000.0)):
    """Intersection de demi-plans a*x + b*y <= c (polygone convexe)."""
    x0, y0, x1, y1 = boite
    poly = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    for a, b, c in contraintes:
        sortie = []
        for i in range(len(poly)):
            p, q = poly[i], poly[(i + 1) % len(poly)]
            fp = a * p[0] + b * p[1] - c
            fq = a * q[0] + b * q[1] - c
            if fp <= 0:
                sortie.append(p)
            if (fp < 0 < fq) or (fq < 0 < fp):
                t = fp / (fp - fq)
                sortie.append((p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])))
        poly = sortie
    return poly


def recul(p, q, interieur, t):
    """Demi-plan : rester a distance >= t de la droite (p, q), du cote du point interieur."""
    a, b = q[1] - p[1], -(q[0] - p[0])
    n = math.hypot(a, b)
    a, b = a / n, b / n
    c = a * p[0] + b * p[1]
    if a * interieur[0] + b * interieur[1] > c:
        a, b, c = -a, -b, -c
    return (a, b, c - t)


def rayon_decale(G):
    return G.r + G.g / (S3 / 2)


def bande(points, t):
    """Contour d'une bande d'epaisseur t le long d'une ligne brisee (joints en onglet)."""
    def decale(sens):
        segs = []
        for i in range(len(points) - 1):
            (x0, y0), (x1, y1) = points[i], points[i + 1]
            dx, dy = x1 - x0, y1 - y0
            n = math.hypot(dx, dy)
            nx, ny = -dy / n * sens * t / 2, dx / n * sens * t / 2
            segs.append(((x0 + nx, y0 + ny), (x1 + nx, y1 + ny)))
        pts = [segs[0][0]]
        for (p0, p1), (q0, q1) in zip(segs, segs[1:]):
            d1 = (p1[0] - p0[0], p1[1] - p0[1])
            d2 = (q1[0] - q0[0], q1[1] - q0[1])
            den = d1[0] * d2[1] - d1[1] * d2[0]
            s = ((q0[0] - p0[0]) * d2[1] - (q0[1] - p0[1]) * d2[0]) / den
            pts.append((p0[0] + s * d1[0], p0[1] + s * d1[1]))
        pts.append(segs[-1][1])
        return pts
    return decale(1) + list(reversed(decale(-1)))


# ---------------------------------------------------------------- glyphes
def glyphe_B(G, ox):
    H, V, Hs, M, c, W = G.H, G.V, G.Hs, G.M, G.c, G.Bw
    ax = -H / 2
    rg = rayon_decale(G)
    xn = W + G.xi                        # centre de l'ecrou
    xv = xn - rg                         # fond de l'encoche
    m = (W - xv) * T60                   # demi-ouverture de l'encoche
    cv = c * T60
    ext = [(0, -H), (W - c, -H), (W, -H + cv), (W, ax - m), (xv, ax), (W, ax + m),
           (W, -cv), (W - c, 0), (0, 0)]
    dedans = (W / 2, ax - 40)
    diag = (V + Hs) / 2
    haut = demi_plans([
        (-1, 0, -V), (1, 0, W - V), (0, -1, H - Hs), (0, 1, ax - M / 2),
        recul((W - c, -H), (W, -H + cv), dedans, diag),
        recul((W, ax - m), (xv, ax), dedans, V),
    ])
    bas = [(x, 2 * ax - y) for x, y in reversed(haut)]
    dx = lambda P: [(x + ox, y) for x, y in P]
    return {"ext": dx(ext), "trous": [dx(haut), dx(bas)], "ecrou_x": xn + ox}


def glyphe_F(G, ox):
    H, V, Hs, M, W = G.H, G.V, G.Hs, G.M, G.Fw
    ax = -H / 2
    dv = rayon_decale(G) - G.xi          # profondeur de l'encoche dans le fut
    m = dv * T60
    xm = W * G.Fm
    ext = [(0, -H), (W, -H), (W, -H + Hs), (V, -H + Hs), (V, ax - M / 2), (xm, ax - M / 2),
           (xm, ax + M / 2), (V, ax + M / 2), (V, 0), (0, 0), (0, ax + m), (dv, ax), (0, ax - m)]
    return {"ext": [(x + ox, y) for x, y in ext], "trous": []}


def glyphe_A(G, ox):
    H, V, Hs, M, cA, W = G.H, G.V, G.Hs, G.M, G.cA, G.Aw
    cv = cA * T60
    y0, y1 = G.Ab - M / 2, G.Ab + M / 2
    ext = [(0, 0), (0, -H + cv), (cA, -H), (W - cA, -H), (W, -H + cv), (W, 0), (W - V, 0),
           (W - V, y1), (V, y1), (V, 0)]
    dedans = (W / 2, -H + 80)
    diag = (V + Hs) / 2
    trou = demi_plans([
        (-1, 0, -V), (1, 0, W - V), (0, -1, H - Hs), (0, 1, y0),
        recul((0, -H + cv), (cA, -H), dedans, diag),
        recul((W - cA, -H), (W, -H + cv), dedans, diag),
    ])
    dx = lambda P: [(x + ox, y) for x, y in P]
    return {"ext": dx(ext), "trous": [dx(trou)]}


def glyphe_U(G, ox):
    H, V, Hs, c, W = G.H, G.V, G.Hs, G.c, G.Uw
    cv = c * T60
    a, b, cc = recul((0, -cv), (c, 0), (W / 2, -H / 2), (V + Hs) / 2)
    yL = (cc - a * V) / b
    xL = (cc + b * Hs) / a
    gauche = [(V, yL), (xL, -Hs)] if (yL < -Hs and xL > V) else [(V, -Hs)]
    droite = [(W - x, y) for x, y in reversed(gauche)]
    ext = [(0, -H), (V, -H)] + gauche + droite + [(W - V, -H), (W, -H), (W, -cv), (W - c, 0), (c, 0), (0, -cv)]
    return {"ext": [(x + ox, y) for x, y in ext], "trous": []}


def glyphe_T(G, ox):
    H, V, Hs, W = G.H, G.V, G.Hs, G.Tw
    x0 = (W - V) / 2
    ext = [(0, -H), (W, -H), (W, -H + Hs), (x0 + V, -H + Hs), (x0 + V, 0), (x0, 0), (x0, -H + Hs), (0, -H + Hs)]
    return {"ext": [(x + ox, y) for x, y in ext], "trous": []}


def glyphe_O(G, ox):
    H, V, Hs, c, W = G.H, G.V, G.Hs, G.c, G.Ow
    cv = c * T60
    ext = [(c, -H), (W - c, -H), (W, -H + cv), (W, -cv), (W - c, 0), (c, 0), (0, -cv), (0, -H + cv)]
    cons = [(-1, 0, -V), (1, 0, W - V), (0, -1, H - Hs), (0, 1, -Hs)]
    for i in range(1, 8, 2):
        cons.append(recul(ext[i], ext[(i + 1) % 8], (W / 2, -H / 2), (V + Hs) / 2))
    trou = demi_plans(cons)
    dx = lambda P: [(x + ox, y) for x, y in P]
    return {"ext": dx(ext), "trous": [dx(trou)]}


def monogramme(G, ox=0.0):
    b = glyphe_B(G, ox)
    xf = b["ecrou_x"] + G.xi
    f = glyphe_F(G, xf)
    ecrou = {"hex": hexagone(b["ecrou_x"], -G.H / 2, G.r), "alesage": (b["ecrou_x"], -G.H / 2, G.rb)}
    return {"lettres": [b, f], "ecrou": ecrou, "x0": ox, "x1": xf + G.Fw}


def logotype(G):
    mg = monogramme(G)
    x = mg["x1"] + G.mot
    xa = x
    mot = []
    pos = {}
    for nom, fabrique, chasse, approche in (("A", glyphe_A, G.Aw, G.approches[0]), ("U", glyphe_U, G.Uw, G.approches[1]),
                                            ("T", glyphe_T, G.Tw, G.approches[2]), ("O", glyphe_O, G.Ow, 0.0)):
        mot.append(fabrique(G, x))
        pos[nom] = (x, x + chasse)
        x += chasse + approche
    return {"lettres": mg["lettres"] + mot, "ecrou": mg["ecrou"], "x_auto": xa, "x1": x, "pos": pos}


# ---------------------------------------------------------------- le chat
class Chat:
    """Chat couche sur le haut du O, dessine sur la grille du lettrage.

    Tete : bloc a joues chanfreinees a 60 degres, deux oreilles en triangles
    equilateraux (60 degres, l'oblique unique du logo). Corps : pain pose, dos
    chanfreine. Queue : bande qui pend a droite du O et se releve en crochet,
    construit comme le bas du U. Yeux clos : deux fentes evidees, nez : petit
    triangle evide. Le chat repose au jeu g des lettres, comme l'ecrou.
    """
    hw = 96.0     # largeur de la tete
    hh = 66.0     # hauteur de la tete (sans les oreilles)
    ch = 18.0     # chanfrein des joues
    eb = 36.0     # base d'une oreille (triangle equilateral)
    bh = 50.0     # hauteur du corps
    cb = 26.0     # chanfrein du dos (arriere)
    lg = 192.0    # longueur totale, de la joue gauche a l'arriere du corps
    tw = 22.0     # epaisseur de la queue
    tl = 62.0     # longueur de la partie droite de la queue, sous le dessus des lettres
    tc = 14.0     # chanfrein du crochet (axe)
    th = 20.0     # palier du crochet (axe)
    tp = 16.0     # remontee de la pointe (axe)
    ex = 22.0     # demi-ecart des yeux au centre de la tete
    ey = 36.0     # hauteur des yeux au-dessus du bas de la tete
    ew = 8.0      # demi-largeur d'un oeil
    eh = 3.0      # demi-hauteur d'un oeil
    nz = 9.0      # cote du nez (triangle equilateral pointe en bas)
    ny = 20.0     # hauteur du nez au-dessus du bas de la tete


def chat(G, lg, C=Chat):
    """Renvoie le contour du corps, de la queue et les evidements du chat."""
    xo0, xo1 = lg["pos"]["O"]
    y0 = -G.H - G.g                     # le chat repose au jeu g du haut des lettres
    xq = xo1 + G.g + C.tw / 2          # axe de la queue : au jeu g du flanc du O
    xe = xq + C.tw / 2                 # arriere du corps, aligne sur le bord de la queue
    hx0 = xe - C.lg
    hx1 = hx0 + C.hw
    yh = y0 - C.hh
    eh_ = C.eb * S3 / 2
    chv = C.ch * T60
    yb = y0 - C.bh
    cbv = C.cb * T60
    yq = y0 + G.g + C.tl
    axe = [(xq, y0 - 4.0), (xq, yq), (xq + C.tc, yq + C.tc * T60), (xq + C.tc + C.th, yq + C.tc * T60),
           (xq + 2 * C.tc + C.th, yq), (xq + 2 * C.tc + C.th, yq - C.tp)]
    queue = bande(axe, C.tw)
    corps = [
        (hx0, y0 - chv), (hx0, yh), (hx0 + C.eb / 2, yh - eh_), (hx0 + C.eb, yh),
        (hx1 - C.eb, yh), (hx1 - C.eb / 2, yh - eh_), (hx1, yh), (hx1, yb),
        (xe - C.cb, yb), (xe, yb + cbv), (xe, y0), (hx0 + C.ch, y0),
    ]
    cx = (hx0 + hx1) / 2
    yo = y0 - C.ey
    trous = []
    d = C.eh / T60
    for s in (-1, 1):
        ox = cx + s * C.ex
        trous.append([(ox - C.ew, yo), (ox - C.ew + d, yo - C.eh), (ox + C.ew - d, yo - C.eh),
                      (ox + C.ew, yo), (ox + C.ew - d, yo + C.eh), (ox - C.ew + d, yo + C.eh)])
    yn = y0 - C.ny
    trous.append([(cx - C.nz / 2, yn - C.nz * S3 / 2), (cx + C.nz / 2, yn - C.nz * S3 / 2), (cx, yn)])
    return {"corps": corps, "queue": queue, "yeux": trous,
            "haut": yh - eh_, "droite": xq + 2 * C.tc + C.th + C.tw / 2, "bas": yq + C.tc * T60 + C.tw / 2}


# ---------------------------------------------------------------- descripteur
class Police:
    def __init__(self, chemin):
        self.f = TTFont(chemin)
        self.gs = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap()
        self.hmtx = self.f["hmtx"]
        bp = BoundsPen(self.gs)
        self.gs[self.cmap[ord("H")]].draw(bp)
        self.cap = bp.bounds[3]

    def chemin(self, texte, x, y, cap, approche):
        k = cap / self.cap
        morceaux = []
        for i, ch in enumerate(texte):
            nom = self.cmap[ord(ch)]
            sp = SVGPathPen(self.gs, ntos=lambda v: fmt(v))
            self.gs[nom].draw(TransformPen(sp, (k, 0, 0, -k, x, y)))
            morceaux.append(sp.getCommands())
            x += self.hmtx[nom][0] * k + (approche if i < len(texte) - 1 else 0)
        return " ".join(m for m in morceaux if m)

    def largeur(self, texte, cap):
        k = cap / self.cap
        return sum(self.hmtx[self.cmap[ord(ch)]][0] * k for ch in texte)

    def encre(self, texte, cap):
        k = cap / self.cap
        g0, g1 = self.cmap[ord(texte[0])], self.cmap[ord(texte[-1])]
        b0, b1 = BoundsPen(self.gs), BoundsPen(self.gs)
        self.gs[g0].draw(b0)
        self.gs[g1].draw(b1)
        return b0.bounds[0] * k, (self.hmtx[g1][0] - b1.bounds[2]) * k


def descripteur(police, texte, x0, x1, y, cap):
    gauche, droite = police.encre(texte, cap)
    brut = police.largeur(texte, cap) - gauche - droite
    approche = (x1 - x0 - brut) / (len(texte) - 1)
    return police.chemin(texte, x0 - gauche, y, cap, approche), approche


# ---------------------------------------------------------------- sortie SVG
def fmt(v):
    s = ("%.1f" % v).rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def poly_d(P, k=1.0, dx=0.0, dy=0.0):
    pts = ["%s %s" % (fmt(x * k + dx), fmt(y * k + dy)) for x, y in P]
    return "M" + " ".join(pts) + "Z"


def cercle_d(cx, cy, r, k=1.0, dx=0.0, dy=0.0):
    cx, cy, r = cx * k + dx, cy * k + dy, r * k
    return "M%s %sa%s %s 0 1 0 %s 0a%s %s 0 1 0 %s 0Z" % (
        fmt(cx - r), fmt(cy), fmt(r), fmt(r), fmt(2 * r), fmt(r), fmt(r), fmt(-2 * r))


def lettres_d(lettres, k=1.0, dx=0.0, dy=0.0):
    return "".join(poly_d(l["ext"], k, dx, dy) + "".join(poly_d(t, k, dx, dy) for t in l["trous"]) for l in lettres)


def ecrou_d(e, k=1.0, dx=0.0, dy=0.0):
    return poly_d(e["hex"], k, dx, dy) + cercle_d(*e["alesage"], k=k, dx=dx, dy=dy)


def chat_d(ch):
    # le contour du corps et celui de la queue se recouvrent : regle nonzero, meme sens de rotation
    return poly_d(sens_horaire(ch["corps"])) + poly_d(sens_horaire(ch["queue"])), "".join(poly_d(sens_antihoraire(y)) for y in ch["yeux"])


def aire(P):
    return sum(P[i][0] * P[(i + 1) % len(P)][1] - P[(i + 1) % len(P)][0] * P[i][1] for i in range(len(P))) / 2


def sens_horaire(P):
    return P if aire(P) > 0 else list(reversed(P))


def sens_antihoraire(P):
    return P if aire(P) < 0 else list(reversed(P))


def svg(vb, corps, titre, desc):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" role="img" aria-labelledby="t d">\n'
            '<title id="t">%s</title>\n<desc id="d">%s</desc>\n%s\n</svg>\n') % (vb, titre, desc, corps)


def ecrire(chemin, contenu):
    for interdit in ("\u2014", "\u2013", "<text", "Gradient", "filter"):
        assert interdit not in contenu, (chemin, interdit)
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(contenu)


MARGE = 24.0
CAPD, ECART = 34.0, 56.0


def horizontal(G, police, couleurs, avec_descripteur=True, avec_chat=True, un_seul_chemin=False, marge=MARGE):
    """couleurs : dict lettres, ecrou, descripteur, chat. marge : zone vide autour de l'encre."""
    MARGE = marge
    lg = logotype(G)
    x0 = -MARGE
    y_haut = -G.H - MARGE
    corps = []
    L = lettres_d(lg["lettres"])
    E = ecrou_d(lg["ecrou"])
    x1 = lg["x1"] + MARGE
    if avec_chat:
        ch = chat(G, lg)
        y_haut = ch["haut"] - MARGE
        x1 = max(x1, ch["droite"] + MARGE)
        C, Y = chat_d(ch)
    if un_seul_chemin:
        d = '<path fill="%s" fill-rule="evenodd" d="%s%s"/>' % (couleurs["lettres"], L, E)
        corps.append(d)
    else:
        corps.append('<path fill="%s" fill-rule="evenodd" d="%s"/>' % (couleurs["lettres"], L))
        corps.append('<path fill="%s" fill-rule="evenodd" d="%s"/>' % (couleurs["ecrou"], E))
    if avec_chat:
        corps.append('<path fill="%s" fill-rule="nonzero" d="%s%s"/>' % (couleurs.get("chat", couleurs["lettres"]), C, Y))
    y_bas = (ECART + CAPD if avec_descripteur else 0.0) + MARGE
    if avec_chat and not avec_descripteur:
        y_bas = max(y_bas, ch["bas"] + MARGE)
    if avec_descripteur:
        d, _ = descripteur(police, "GARAGE AUTOMOBILE", lg["x_auto"], lg["x1"], ECART + CAPD, CAPD)
        corps.append('<path fill="%s" d="%s"/>' % (couleurs["descripteur"], d))
    vb = "%s %s %s %s" % (fmt(x0), fmt(y_haut), fmt(x1 - x0), fmt(y_bas - y_haut))
    return vb, "\n".join(corps)


def symbole(Gs, fond=GRAPHITE, lettres=CASSE, ecrou=ORANGE, cote=512.0, rayon=96.0):
    mg = monogramme(Gs)
    largeur = mg["x1"] - mg["x0"]
    dx = round((cote - largeur) / 2 - mg["x0"])
    dy = (cote + Gs.H) / 2
    corps = [
        '<rect width="%s" height="%s" rx="%s" fill="%s"/>' % (fmt(cote), fmt(cote), fmt(rayon), fond),
        '<path fill="%s" fill-rule="evenodd" d="%s"/>' % (lettres, lettres_d(mg["lettres"], 1.0, dx, dy)),
        '<path fill="%s" fill-rule="evenodd" d="%s"/>' % (ecrou, ecrou_d(mg["ecrou"], 1.0, dx, dy)),
    ]
    return "0 0 %s %s" % (fmt(cote), fmt(cote)), "\n".join(corps)


# ---------------------------------------------------------------- favicon au pixel
# Grille de 32 : les bords structurels (haut, bas, futs, barres) tombent sur des
# coordonnees paires, donc sur des pixels entiers a 16 px ; seuls les chanfreins et
# l'alesage utilisent les impairs (finesse visible a 32, gris doux a 16).
# L : lettre (blanc casse), E : ecrou (orange), . : fond graphite.
FAVICON_32 = [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "....LLLLLLLLL.....LLLLLLLLLL....",
    "....LLLLLLLLLL....LLLLLLLLLL....",
    "....LLLL..LLLL....LLLL..........",
    "....LLLL..LLLL....LLLL..........",
    "....LLLL..LLLL....LLLL..........",
    "....LLLL..LLLL....LLLL..........",
    "....LLLL..LLL......LLL..........",
    "....LLLL..LL..EEEE..LL..........",
    "....LLLLLLL..EEEEEE..LLLLLLL....",
    "....LLLLLLL..EE..EE..LLLLLLL....",
    "....LLLLLLL..EE..EE..LLLLLLL....",
    "....LLLLLLL..EEEEEE..LLLLLLL....",
    "....LLLL..LL..EEEE..LL..........",
    "....LLLL..LLL......LLL..........",
    "....LLLL..LLLL....LLLL..........",
    "....LLLL..LLLL....LLLL..........",
    "....LLLL..LLLL....LLLL..........",
    "....LLLL..LLLL....LLLL..........",
    "....LLLLLLLLLL....LLLL..........",
    "....LLLLLLLLL.....LLLL..........",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
]

FAVICON_16 = [
    "................",
    "................",
    "................",
    "..LLLLL..LLLLL..",
    "..LL.LL..LL.....",
    "..LL.LL..LL.....",
    "..LL.L....L.....",
    "..LLLL.EE.LLLL..",
    "..LLLL.EE.LLLL..",
    "..LL.L....L.....",
    "..LL.LL..LL.....",
    "..LL.LL..LL.....",
    "..LLLLL..LL.....",
    "................",
    "................",
    "................",
]


def grille_d(grille, car, k=1.0):
    d = []
    for y, ligne in enumerate(grille):
        x = 0
        while x < len(ligne):
            if ligne[x] == car:
                x1 = x
                while x1 < len(ligne) and ligne[x1] == car:
                    x1 += 1
                d.append("M%s %sh%sv%sh-%sz" % (fmt(x * k), fmt(y * k), fmt((x1 - x) * k), fmt(k), fmt((x1 - x) * k)))
                x = x1
            else:
                x += 1
    return "".join(d)


def favicon(grille, cote, rayon):
    corps = [
        '<rect width="%d" height="%d" rx="%s" fill="%s"/>' % (cote, cote, fmt(rayon), GRAPHITE),
        '<path fill="%s" d="%s"/>' % (CASSE, grille_d(grille, "L")),
        '<path fill="%s" d="%s"/>' % (ORANGE, grille_d(grille, "E")),
    ]
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" role="img" aria-labelledby="t d">\n'
            '<title id="t">BF Auto</title>\n<desc id="d">Favicon BF Auto dessiné au pixel : B, écrou orange, F sur carré graphite.</desc>\n%s\n</svg>\n'
            % (cote, cote, "\n".join(corps)))


# ---------------------------------------------------------------- ecriture
def main(sortie):
    os.makedirs(sortie, exist_ok=True)
    police = Police(DESC_FONT)
    G = Grille
    nom = "BF Auto"
    J = lambda n: os.path.join(sortie, n)
    versions = [
        ("logo", {"lettres": GRAPHITE, "ecrou": ORANGE, "descripteur": GRAPHITE},
         "Logo BF Auto, fond clair : lettres graphite, écrou orange serré entre le B et le F, chat couché sur le haut du mot AUTO."),
        ("logo-negatif", {"lettres": CASSE, "ecrou": ORANGE, "descripteur": GRIS_CLAIR},
         "Logo BF Auto sur fond graphite : lettres blanc cassé, écrou orange, chat couché sur AUTO."),
        ("logo-mono", {"lettres": NOIR, "ecrou": NOIR, "descripteur": NOIR},
         "Logo BF Auto en une seule couleur, noir."),
        ("logo-blanc", {"lettres": BLANC, "ecrou": BLANC, "descripteur": BLANC},
         "Logo BF Auto en une seule couleur, blanc, pour fond sombre ou photo."),
    ]
    for base, coul, desc in versions:
        mono = coul["ecrou"] == coul["lettres"]
        for chat_, suffixe in ((True, ""), (False, "-sans-chat")):
            vb, c = horizontal(G, police, coul, avec_chat=chat_, un_seul_chemin=mono)
            d = desc if chat_ else desc.replace(", chat couché sur le haut du mot AUTO", "").replace(", chat couché sur AUTO", "") + " Variante sans chat."
            ecrire(J(base + suffixe + ".svg"), svg(vb, c, nom, d))
    for chat_, suffixe in ((True, ""), (False, "-sans-chat")):
        vb, c = horizontal(G, police, {"lettres": GRAPHITE, "ecrou": ORANGE}, avec_descripteur=False, avec_chat=chat_, marge=2.0)
        ecrire(J("logo-compact" + suffixe + ".svg"), svg(vb, c, nom, "Logotype BF Auto sans descripteur, pour l'en-tête du site (32 à 40 px de haut)." + ("" if chat_ else " Variante sans chat.")))
        vb, c = horizontal(G, police, {"lettres": CASSE, "ecrou": ORANGE}, avec_descripteur=False, avec_chat=chat_, marge=2.0)
        ecrire(J("logo-compact-negatif" + suffixe + ".svg"), svg(vb, c, nom, "Logotype BF Auto sans descripteur, sur fond graphite." + ("" if chat_ else " Variante sans chat.")))
    vb, c = symbole(GrilleSymbole)
    ecrire(J("symbole.svg"), svg(vb, c, nom, "Symbole BF Auto : B, écrou orange, F sur carré graphite, pour icône d'application et avatar."))
    ecrire(J("favicon.svg"), favicon(FAVICON_32, 32, 6))
    ecrire(J("source/favicon-16.svg"), favicon(FAVICON_16, 16, 3))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
