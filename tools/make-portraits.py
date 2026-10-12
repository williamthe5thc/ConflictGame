"""Draw the character portraits in assets/images/characters/.

Every portrait is built from the same parts, so the cast shares one
illustrated style: a tinted round backdrop, shoulders with clothing details,
a shaded head, a hairstyle, and a few facial features. The light comes from
the upper left in every portrait, and all colours are set here.

Names and roles are not baked into the images; the game shows them as text,
so they stay readable and translatable.

The game puts the SVG straight into the page so it can animate parts of it.
Three class names are used for that:
  p-bust  the whole figure (slow breathing motion)
  p-head  the head and hair
  p-lids  closed eyelids, hidden by default (opacity 0); the page CSS shows
          them for a moment so the character blinks
Every gradient id starts with the character's name, so several portraits can
sit in one page without clashing.

Run from the repository root: python3 tools/make-portraits.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "characters"

# Skin tones: (highlight, base, shadow, lip colour)
SKIN = {
    "light": ("#FBE4D3", "#F2CDB2", "#D9A98A", "#B85E52"),
    "light-medium": ("#F3CFB2", "#E3AF8A", "#C48E6A", "#A9584A"),
    "medium": ("#DDA77F", "#C68A5E", "#A46C45", "#8C4A39"),
    "medium-deep": ("#BC825C", "#9E6440", "#7D4C2E", "#6A3428"),
    "deep": ("#8E5E41", "#6E4429", "#53311C", "#4A251B"),
}


# --- colour helpers --------------------------------------------------------

def _rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def mix(a, b, t):
    """Blend colour a toward colour b by t (0..1)."""
    return "#" + "".join(f"{round(x + (y - x) * t):02X}" for x, y in zip(_rgb(a), _rgb(b)))


def lighten(c, t):
    return mix(c, "#FFFFFF", t)


def darken(c, t):
    return mix(c, "#000000", t)


def lin(id_, stops, x1=0, y1=0, x2=1, y2=1):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{id_}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def rad(id_, stops, cx=0.5, cy=0.5, r=0.5):
    """stops: (offset, colour) or (offset, colour, opacity)."""
    s = ""
    for st in stops:
        op = f' stop-opacity="{st[2]}"' if len(st) > 2 else ""
        s += f'<stop offset="{st[0]}" stop-color="{st[1]}"{op}/>'
    return f'<radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}">{s}</radialGradient>'


# --- hair ------------------------------------------------------------------

def hair(style, p):
    """Return (back, front) hair markup. Front hair is drawn over the face."""
    g = f"url(#{p}-hair)"
    hi = f'stroke="url(#{p}-hairhi)" stroke-width="3" fill="none" stroke-linecap="round"'
    hi_thin = f'stroke="url(#{p}-hairhi)" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"'
    back, front = "", ""
    if style == "short":
        front = (f'<path d="M65 86 C61 56 80 39 102 39 C125 39 141 56 135 86 C133 77 130 70 126 66 '
                 f'C116 59 100 58 90 60 C79 63 70 72 65 86 Z" fill="{g}"/>'
                 f'<path d="M66 84 L68 99 L71 99 L70 82 Z M134 84 L132 99 L129 99 L130 82 Z" fill="{g}"/>'
                 f'<path d="M82 50 C92 44 108 43 120 48" {hi}/>')
    elif style == "swept":
        front = (f'<path d="M64 90 C59 58 79 37 104 37 C129 37 143 56 136 90 C134 76 129 66 122 61 '
                 f'C110 67 92 63 80 57 C72 65 66 77 64 90 Z" fill="{g}"/>'
                 f'<path d="M80 57 C94 50 112 52 122 61 C110 56 96 54 80 57 Z" fill="#000000" opacity=".14"/>'
                 f'<path d="M86 46 C98 40 116 42 128 52" {hi}/>')
    elif style == "long":
        back = (f'<path d="M58 92 C52 50 80 33 102 33 C128 33 152 52 144 96 C142 122 150 150 158 170 '
                f'C142 180 122 174 116 160 L84 160 C78 174 58 180 42 170 C52 150 60 122 58 92 Z" fill="{g}"/>')
        front = (f'<path d="M64 98 C60 60 80 39 103 39 C127 39 143 60 137 98 C133 80 125 64 110 56 '
                 f'C102 67 86 72 72 75 C68 82 65 90 64 98 Z" fill="{g}"/>'
                 f'<path d="M76 54 C88 44 106 42 118 48" {hi}/>'
                 f'<path d="M141 108 C145 126 143 140 151 156" {hi} opacity=".6"/>'
                 f'<path d="M59 108 C55 126 57 142 49 158" {hi} opacity=".4"/>')
    elif style == "parted":
        front = (f'<path d="M65 88 C60 56 80 38 101 38 C124 38 141 55 135 88 C133 76 129 68 123 63 '
                 f'C113 60 104 60 96 58 L92 54 C84 60 72 70 65 88 Z" fill="{g}"/>'
                 f'<path d="M92 52 C100 44 116 45 126 53" {hi}/>'
                 f'<path d="M66 86 L68 99 L71 99 L70 84 Z M134 86 L132 99 L129 99 L130 84 Z" fill="{g}"/>')
    elif style == "curly":
        # one shared gradient across the whole mass, with curl edges drawn on top
        m = f"url(#{p}-hairmass)"
        rim = f'stroke="url(#{p}-hairhi)" stroke-width="1.6" opacity=".7"'
        back = f'<path d="M60 100 C50 70 62 36 100 32 C138 36 150 70 140 100 C132 84 120 76 100 76 C80 76 68 84 60 100 Z" fill="{m}"/>'
        spots = [(64, 94, 10), (60, 78, 12), (66, 60, 13), (80, 45, 13), (98, 37, 13), (116, 39, 13),
                 (131, 50, 13), (139, 66, 12), (140, 83, 11), (136, 97, 10)]
        back += "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{m}"/>' for x, y, r in spots)
        back += "".join(f'<path d="M{x - r * .7:.1f} {y - r * .25:.1f} A{r} {r} 0 0 1 {x + r * .55:.1f} {y - r * .6:.1f}" fill="none" {rim}/>'
                        for x, y, r in spots)
        curls = [(76, 63, 8), (89, 56, 8.5), (103, 54, 8.5), (117, 57, 8.5), (128, 65, 7.5), (70, 75, 6.5),
                 (133, 77, 6.5)]
        front = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{m}"/>' for x, y, r in curls)
        front += "".join(f'<path d="M{x - r * .7:.1f} {y - r * .1:.1f} A{r} {r} 0 0 1 {x + r * .5:.1f} {y - r * .6:.1f}" fill="none" {rim}/>'
                         for x, y, r in curls)
    elif style == "messy":
        front = (f'<path d="M63 90 C57 57 79 37 102 37 C127 37 145 56 137 90 C135 79 131 71 125 66 '
                 f'L127 76 L117 64 L113 75 L104 62 L98 73 L90 63 L86 74 L78 65 C71 72 66 80 63 90 Z" fill="{g}"/>'
                 f'<path d="M100 38 C97 31 103 27 108 30 C104 31 103 34 104 38 Z" fill="{g}"/>'
                 f'<path d="M80 50 C92 43 110 42 122 50" {hi}/>')
    elif style == "bun":
        back = (f'<circle cx="101" cy="35" r="16" fill="{g}"/>'
                f'<path d="M90 30 C96 25 106 25 112 30" {hi}/>')
        front = (f'<path d="M64 92 C61 58 82 41 101 41 C121 41 141 58 136 92 C132 72 120 57 106 56 '
                 f'C96 57 88 58 82 62 C72 70 66 80 64 92 Z" fill="{g}"/>'
                 f'<path d="M82 58 C88 50 98 46 110 46" {hi}/>'
                 f'<path d="M106 56 C118 58 128 68 132 80" {hi} opacity=".5"/>')
    elif style == "crop":
        front = (f'<path d="M66 84 C64 58 82 44 101 44 C120 44 137 58 134 84 C130 72 118 64 101 63 '
                 f'C84 63 72 72 66 84 Z" fill="{g}"/>')
    else:
        raise ValueError(style)
    return back, front


# --- clothing --------------------------------------------------------------

BODY = "M24 214 C26 170 56 150 100 147 C144 150 174 170 176 214 Z"


def clothing(kind, p, c, neck_fill):
    """Clothing over the shoulders. c holds this character's colours."""
    main = c["main"]
    dark = darken(main, 0.28)
    out = f'<path d="{BODY}" fill="url(#{p}-cloth)"/>'
    # a soft fold on each side reads as shoulders at small sizes
    out += (f'<path d="M48 214 C50 186 56 172 66 164" stroke="{dark}" stroke-width="2" fill="none" opacity=".35"/>'
            f'<path d="M152 214 C150 186 144 172 134 164" stroke="{dark}" stroke-width="2" fill="none" opacity=".35"/>')
    if kind == "jacket":
        inner = c.get("inner", "#F1F5F9")
        out += f'<path d="M84 148 L100 192 L116 148 Z" fill="{inner}"/>'
        if c.get("collar", True):
            out += (f'<path d="M84 146 L99 159 L91 168 L81 152 Z" fill="{lighten(inner, .4)}" '
                    f'stroke="{darken(inner, .15)}" stroke-width="1"/>'
                    f'<path d="M116 146 L101 159 L109 168 L119 152 Z" fill="{lighten(inner, .4)}" '
                    f'stroke="{darken(inner, .15)}" stroke-width="1"/>')
        else:
            out += f'<path d="M89 148 Q100 162 111 148 Z" fill="{neck_fill}"/>'
            if c.get("necklace"):
                out += (f'<path d="M88 150 Q100 170 112 150" stroke="{c["necklace"]}" stroke-width="1.6" fill="none"/>'
                        f'<circle cx="100" cy="166" r="2.2" fill="{c["necklace"]}"/>')
        lap = darken(main, 0.18)
        edge = lighten(main, .25)
        out += (f'<path d="M82 149 L100 196 L95 200 L72 162 L78 156 L74 152 Z" fill="{lap}" stroke="{edge}" stroke-width="1"/>'
                f'<path d="M118 149 L100 196 L105 200 L128 162 L122 156 L126 152 Z" fill="{lap}" stroke="{edge}" stroke-width="1"/>'
                f'<circle cx="104" cy="206" r="2.4" fill="{darken(main, .45)}"/>')
    elif kind == "sweater":
        inner = c.get("inner", "#FFFFFF")
        out += (f'<path d="M85 148 L100 176 L115 148 Z" fill="{inner}"/>'
                f'<path d="M86 146 L99 158 L92 167 L82 151 Z" fill="{lighten(inner, .5)}" stroke="{darken(inner, .18)}" stroke-width="1"/>'
                f'<path d="M114 146 L101 158 L108 167 L118 151 Z" fill="{lighten(inner, .5)}" stroke="{darken(inner, .18)}" stroke-width="1"/>'
                f'<path d="M83 148 L100 180 L117 148" stroke="{dark}" stroke-width="4" fill="none" stroke-linejoin="round"/>')
    elif kind == "blouse":
        out += (f'<path d="M86 147 Q100 178 114 147 Z" fill="{neck_fill}"/>'
                f'<path d="M84 147 Q100 182 116 147" stroke="{dark}" stroke-width="3" fill="none"/>'
                f'<path d="M89 150 Q100 166 111 150" stroke="#E9C46A" stroke-width="1.4" fill="none"/>'
                f'<circle cx="100" cy="163" r="2.4" fill="#E9C46A"/>')
    elif kind == "quarterzip":
        out += (f'<path d="M82 147 C86 138 114 138 118 147 L116 160 C108 155 92 155 84 160 Z" fill="{darken(main, .12)}"/>'
                f'<path d="M100 141 L100 184" stroke="{lighten(main, .45)}" stroke-width="1.8"/>'
                f'<rect x="97.5" y="156" width="5" height="8" rx="1.5" fill="{lighten(main, .6)}"/>'
                f'<path d="M84 160 C92 155 108 155 116 160" stroke="{dark}" stroke-width="1.5" fill="none" opacity=".6"/>')
    elif kind == "overshirt":
        inner = c.get("inner", "#F8FAFC")
        out += (f'<path d="M87 148 Q100 164 113 148 L111 168 Q100 172 89 168 Z" fill="{inner}"/>'
                f'<path d="M84 145 L98 160 L90 172 L78 152 Z" fill="{lighten(main, .12)}" stroke="{dark}" stroke-width="1"/>'
                f'<path d="M116 145 L102 160 L110 172 L122 152 Z" fill="{lighten(main, .12)}" stroke="{dark}" stroke-width="1"/>'
                f'<path d="M98 160 L96 214" stroke="{dark}" stroke-width="1.5" opacity=".7"/>'
                f'<circle cx="99" cy="184" r="1.8" fill="{lighten(main, .5)}"/>'
                f'<circle cx="98.5" cy="200" r="1.8" fill="{lighten(main, .5)}"/>')
    elif kind == "hoodie":
        rim = darken(main, 0.16)
        tee = c.get("inner", "#3F4652")
        out += (f'<path d="M84 148 L100 178 L116 148 Z" fill="{tee}"/>'
                f'<path d="M89 148 Q100 159 111 148 Z" fill="{neck_fill}"/>'
                f'<path d="M80 145 Q85 166 100 180 M120 145 Q115 166 100 180" stroke="{rim}" stroke-width="7" '
                f'fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
                f'<path d="M78 146 Q83 168 100 183 M122 146 Q117 168 100 183" stroke="{darken(main, .32)}" '
                f'stroke-width="1.2" fill="none" opacity=".6"/>'
                f'<path d="M93 172 C92 182 93 190 91 198" stroke="{lighten(main, .6)}" stroke-width="2" fill="none" stroke-linecap="round"/>'
                f'<path d="M107 172 C108 182 107 190 109 198" stroke="{lighten(main, .6)}" stroke-width="2" fill="none" stroke-linecap="round"/>'
                f'<rect x="89.5" y="197" width="3" height="5" rx="1" fill="{darken(main, .4)}"/>'
                f'<rect x="107.5" y="197" width="3" height="5" rx="1" fill="{darken(main, .4)}"/>')
    elif kind == "tee":
        out += (f'<path d="M88 148 Q100 159 112 148 Z" fill="{neck_fill}"/>'
                f'<path d="M86 148 Q100 162 114 148" stroke="{dark}" stroke-width="3.5" fill="none"/>')
    else:
        raise ValueError(kind)
    return out


# --- face ------------------------------------------------------------------

BROWS = {
    "relaxed": ("M79 78 Q86 74 94 77", "M106 77 Q114 74 121 78"),
    "firm": ("M79 77 Q87 75 95 79", "M105 79 Q113 75 121 77"),
    "concerned": ("M79 80 Q86 77 94 74", "M106 74 Q114 77 121 80"),
    "tired": ("M79 80 Q86 76 94 78", "M106 78 Q114 76 121 80"),
}


def mouth(kind, lip):
    line = f'stroke="{lip}" fill="none" stroke-linecap="round"'
    if kind == "smile":
        return (f'<path d="M88 112 Q100 123 112 112 Q100 116.5 88 112 Z" fill="{lip}"/>'
                f'<path d="M91 113.4 Q100 116 109 113.4 L108 115 Q100 117.5 92 115 Z" fill="#FFFFFF" opacity=".85"/>')
    if kind == "warm":
        return f'<path d="M89 113 Q100 121 111 113" stroke-width="3" {line}/>'
    if kind == "soft":
        return f'<path d="M91 114 Q100 119 109 114" stroke-width="2.8" {line}/>'
    if kind == "neutral":
        return f'<path d="M91 115.5 Q100 117.5 109 115.5" stroke-width="2.8" {line}/>'
    if kind == "unsure":
        return f'<path d="M91 116 Q97 114 101 115.5 Q106 117 109 115" stroke-width="2.8" {line}/>'
    raise ValueError(kind)


def figure(p, *, skin, hair_style, hair_color, cloth, cloth_colors, brows="relaxed", mouth_kind="soft",
           glasses=False, earrings=None, beard=False, tired=False, eye_color="#2A1C14"):
    """One person in a 200x200 box. p is the id prefix. Returns (defs, markup)."""
    hi, base, shade, lip = SKIN[skin]
    hc = hair_color
    defs = (
        lin(f"{p}-skin", [(0, hi), (0.55, base), (1, shade)], 0.2, 0, 0.85, 1)
        + lin(f"{p}-neck", [(0, shade), (1, mix(shade, base, .4))], 0, 0, 0, 1)
        + lin(f"{p}-hair", [(0, lighten(hc, .22)), (0.5, hc), (1, darken(hc, .35))], 0.1, 0, 0.9, 1)
        + (f'<linearGradient id="{p}-hairmass" gradientUnits="userSpaceOnUse" x1="70" y1="30" x2="130" y2="110">'
           f'<stop offset="0" stop-color="{lighten(hc, .2)}"/><stop offset="1" stop-color="{darken(hc, .3)}"/></linearGradient>')
        + lin(f"{p}-hairhi", [(0, lighten(hc, .45)), (1, lighten(hc, .1))], 0, 0, 1, 0)
        + lin(f"{p}-cloth", [(0, lighten(cloth_colors["main"], .16)), (0.6, cloth_colors["main"]),
                             (1, darken(cloth_colors["main"], .25))], 0.1, 0, 0.9, 1)
        + rad(f"{p}-cheek", [(0, "#F0707A", 0.3), (1, "#F0707A", 0)])
        + rad(f"{p}-shine", [(0, "#FFFFFF", 0.35), (1, "#FFFFFF", 0)])
    )
    back, front = hair(hair_style, p)
    b1, b2 = BROWS[brows]
    brow_col = mix(darken(hc, .25), "#140E0B", .3)
    neck_fill = f"url(#{p}-neck)"

    neck = (f'<path d="M87 112 L87 150 Q100 158 113 150 L113 112 Z" fill="{neck_fill}"/>'
            f'<path d="M87 128 Q100 140 113 128 L113 120 L87 120 Z" fill="{darken(shade, .15)}" opacity=".35"/>')
    ears = (f'<ellipse cx="66.5" cy="92" rx="6.5" ry="10" fill="{base}"/>'
            f'<ellipse cx="133.5" cy="92" rx="6.5" ry="10" fill="{shade}"/>'
            f'<path d="M64 88 Q67 92 65 97" stroke="{darken(shade, .1)}" stroke-width="1.6" fill="none" opacity=".6"/>'
            f'<path d="M136 88 Q133 92 135 97" stroke="{darken(shade, .15)}" stroke-width="1.6" fill="none" opacity=".6"/>')
    if earrings:
        ears += (f'<circle cx="66" cy="103" r="2.6" fill="{earrings}"/>'
                 f'<circle cx="134" cy="103" r="2.6" fill="{earrings}"/>')
    face = ('<path d="M100 46 C123 46 134 63 134 86 C134 104 128 116 118 124 C112 129 106 131 100 131 '
            'C94 131 88 129 82 124 C72 116 66 104 66 86 C66 63 77 46 100 46 Z" '
            f'fill="url(#{p}-skin)"/>')
    # Shading on the side away from the light, cheeks, and a soft highlight
    face += (f'<path d="M122 60 C132 70 134 86 133 96 C131 110 124 120 114 127 C122 116 127 102 126 88 '
             f'C125 76 124 68 122 60 Z" fill="{shade}" opacity=".45"/>'
             f'<ellipse cx="82" cy="102" rx="9" ry="6" fill="url(#{p}-cheek)"/>'
             f'<ellipse cx="118" cy="102" rx="9" ry="6" fill="url(#{p}-cheek)"/>'
             f'<ellipse cx="86" cy="66" rx="12" ry="7" fill="url(#{p}-shine)"/>')
    if beard:
        face += (f'<path d="M69 100 C71 120 86 133 100 133 C114 133 129 120 131 100 C127 112 120 119 113 121 '
                 f'C108 117 92 117 87 121 C80 119 73 112 69 100 Z" fill="url(#{p}-hair)" opacity=".9"/>'
                 f'<path d="M89 110 Q100 105 111 110 Q100 108 89 110 Z" fill="url(#{p}-hair)"/>')
    nose = (f'<path d="M101 92 Q98 102 99 105 Q101.5 107 105 104.5" stroke="{darken(shade, .12)}" '
            f'stroke-width="2" fill="none" stroke-linecap="round" opacity=".75"/>')
    eyes = ""
    for x in (87, 113):
        eyes += (f'<ellipse cx="{x}" cy="91" rx="3.9" ry="4.5" fill="{eye_color}"/>'
                 f'<circle cx="{x - 1.2}" cy="89.4" r="1.3" fill="#FFFFFF"/>'
                 f'<path d="M{x - 6} 88.5 Q{x} 84.5 {x + 6} 88.5" stroke="#1E1410" stroke-width="1.8" '
                 f'fill="none" stroke-linecap="round"/>')
    if tired:
        eyes += (f'<path d="M81 97 Q87 100 93 97 M107 97 Q113 100 119 97" stroke="{darken(shade, .1)}" '
                 f'stroke-width="1.5" fill="none" opacity=".55" stroke-linecap="round"/>')
    # Closed eyelids for the blink; hidden until the page animates them.
    lids = (f'<g class="p-lids" opacity="0">'
            f'<ellipse cx="87" cy="90.5" rx="6.2" ry="6" fill="{base}"/>'
            f'<ellipse cx="113" cy="90.5" rx="6.2" ry="6" fill="{base}"/>'
            f'<path d="M81 92 Q87 95 93 92 M107 92 Q113 95 119 92" stroke="#1E1410" stroke-width="1.8" '
            f'fill="none" stroke-linecap="round"/></g>')
    brows_svg = "".join(f'<path d="{b}" stroke="{brow_col}" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
                        for b in (b1, b2))
    glasses_svg = ""
    if glasses:
        glasses_svg = ('<g fill="#FFFFFF" fill-opacity=".14" stroke="#1F2937" stroke-width="2.6">'
                       '<rect x="76" y="82" width="22" height="17" rx="6"/>'
                       '<rect x="102" y="82" width="22" height="17" rx="6"/>'
                       '<path d="M98 89 Q100 87 102 89" fill="none"/>'
                       '<path d="M76 88 L68 86 M124 88 L132 86" fill="none"/></g>'
                       '<path d="M79 85 L84 85 M105 85 L110 85" stroke="#FFFFFF" stroke-width="1.6" '
                       'opacity=".7" stroke-linecap="round"/>')

    body = clothing(cloth, p, cloth_colors, neck_fill)
    if cloth == "hoodie":
        # the hood, bunched up behind the neck
        neck = (f'<path d="M66 160 C64 140 82 129 100 129 C118 129 136 140 134 160 Z" '
                f'fill="{darken(cloth_colors["main"], .22)}"/>') + neck
    # the head sits a little low on the neck, which keeps the neck short
    head = (f'<g class="p-head"><g transform="translate(0 4)">{ears}{face}{front}{nose}{eyes}{lids}{brows_svg}{glasses_svg}'
            f'{mouth(mouth_kind, lip)}</g></g>')
    return defs, f'<g transform="translate(0 4)">{back}</g>{neck}{body}{head}'


def frame(name, defs, inner, bg, ring, zoom=1.0):
    bgdefs = (rad(f"{name}-bg", [(0, lighten(bg, .6)), (0.7, bg), (1, darken(bg, .07))], 0.38, 0.3, 0.85)
              + rad(f"{name}-shadow", [(0, "#0F172A", 0.22), (1, "#0F172A", 0)]))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="portrait" role="img">
  <defs>{defs}{bgdefs}<clipPath id="{name}-clip"><circle cx="100" cy="100" r="94"/></clipPath></defs>
  <circle cx="100" cy="100" r="97" fill="url(#{name}-bg)"/>
  <g clip-path="url(#{name}-clip)">
    <ellipse cx="100" cy="204" rx="90" ry="26" fill="url(#{name}-shadow)"/>
    <g class="p-bust"><g transform="translate(100 100) scale({zoom}) translate(-100 -96)">{inner}</g></g>
  </g>
  <circle cx="100" cy="100" r="96" fill="none" stroke="{ring}" stroke-width="5"/>
  <circle cx="100" cy="100" r="92.5" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".6"/>
</svg>
'''


CAST = {
    # scenario 1
    "alex": dict(bg="#DCE8FA", ring="#1E40AF", skin="medium", hair_style="short", hair_color="#1F1A17",
                 cloth="jacket", cloth_colors=dict(main="#1E3A8A", inner="#DCE7F7"), glasses=True,
                 brows="firm", mouth_kind="warm"),
    "jordan": dict(bg="#DDF3E6", ring="#15803D", skin="light", hair_style="swept", hair_color="#7A4528",
                   cloth="sweater", cloth_colors=dict(main="#2F855A", inner="#F0FAF4"),
                   brows="relaxed", mouth_kind="smile", eye_color="#3B2A1C"),
    # scenario 2
    "maria": dict(bg="#FBE3E3", ring="#B91C1C", skin="medium-deep", hair_style="long", hair_color="#20160F",
                  cloth="blouse", cloth_colors=dict(main="#C42B2B"), earrings="#E9C46A",
                  brows="firm", mouth_kind="smile"),
    "david": dict(bg="#E6E5FB", ring="#4F46E5", skin="light-medium", hair_style="parted", hair_color="#3A2A20",
                  cloth="quarterzip", cloth_colors=dict(main="#4338CA"), beard=True,
                  brows="relaxed", mouth_kind="neutral"),
    "sam": dict(bg="#D9F2EF", ring="#0F766E", skin="deep", hair_style="curly", hair_color="#1B1310",
                cloth="overshirt", cloth_colors=dict(main="#0F766E", inner="#E7F6F3"),
                brows="concerned", mouth_kind="soft"),
    # scenario 3
    "chris": dict(bg="#E8EBEF", ring="#64748B", skin="light-medium", hair_style="messy", hair_color="#5A3A22",
                  cloth="hoodie", cloth_colors=dict(main="#7B8494"), tired=True,
                  brows="tired", mouth_kind="neutral", eye_color="#3D3A2E"),
    "leslie": dict(bg="#FDF0DA", ring="#B45309", skin="medium", hair_style="bun", hair_color="#2E1F16",
                   cloth="jacket",
                   cloth_colors=dict(main="#334155", inner="#F8FAFC", collar=False, necklace="#D4A84A"),
                   brows="relaxed", mouth_kind="warm"),
}

# The 'Team' speaker in scenario 3: three colleagues in the same style.
# (prefix, centre x, top offset, scale, look); the front figure is drawn last.
TEAM = [
    ("team-a", 56, 24, 0.6, dict(skin="deep", hair_style="crop", hair_color="#1B1310", cloth="tee",
                                 cloth_colors=dict(main="#0E7490"), mouth_kind="soft")),
    ("team-b", 144, 24, 0.6, dict(skin="light", hair_style="bun", hair_color="#A8723A", cloth="sweater",
                                  cloth_colors=dict(main="#B45309", inner="#FFF7ED"), mouth_kind="soft")),
    ("team-c", 100, 46, 0.68, dict(skin="medium", hair_style="short", hair_color="#2A1A12", cloth="overshirt",
                                   cloth_colors=dict(main="#1D4ED8", inner="#EFF6FF"), mouth_kind="warm")),
]


def portrait(name, *, bg, ring, **spec):
    defs, fig = figure(name, **spec)
    # a little closer than the full figure, so faces read at 64 px
    return frame(name, defs, fig, bg, ring, zoom=1.1)


def team():
    defs, figs = "", ""
    for p, cx, top, s, spec in TEAM:
        d, f = figure(p, **spec)
        defs += d
        figs += f'<g transform="translate({cx - 100 * s:.1f} {top}) scale({s})">{f}</g>'
    return frame("team", defs, figs, "#E6EBF2", "#475569", zoom=1.0)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, spec in CAST.items():
        (OUT / f"{name}.svg").write_text(portrait(name, **spec))
    (OUT / "team.svg").write_text(team())
    print("wrote", len(CAST) + 1, "portraits to", OUT)
