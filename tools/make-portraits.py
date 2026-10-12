"""Draw the character portraits in assets/images/characters/.

All portraits share one flat style: a round tinted backdrop, shoulders and
collar, a head with simple features and a neutral, friendly expression.
Names and roles are not baked into the images; the game shows them as text,
so they stay readable and translatable. Run: python3 tools/make-portraits.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "characters"

SKIN = {
    "light": ("#F6D3B8", "#E3B394"),
    "light-medium": ("#E9B994", "#D49C74"),
    "medium": ("#C98E62", "#B0764C"),
    "medium-deep": ("#A0663F", "#87532F"),
    "deep": ("#6E4429", "#59341E"),
}


def hair_shape(style, color):
    """Hair drawn behind (back) and over (front) the head."""
    back, front = "", ""
    if style == "short":
        front = f'<path d="M64 92 C62 58 86 44 100 44 C118 44 140 56 136 92 C130 74 116 66 100 66 C84 66 70 74 64 92 Z" fill="{color}"/>'
    elif style == "side-part":
        front = f'<path d="M63 94 C58 56 88 42 104 43 C126 44 142 60 137 94 C134 78 128 70 118 66 C104 72 84 70 72 74 C67 80 65 86 63 94 Z" fill="{color}"/>'
    elif style == "messy":
        front = (f'<path d="M62 92 C58 60 80 42 100 42 C122 42 144 58 138 92 C134 80 128 72 120 68 '
                 f'L116 76 L108 66 L100 74 L92 64 L84 74 L78 66 C70 72 65 80 62 92 Z" fill="{color}"/>')
    elif style == "long":
        back = f'<path d="M60 96 C56 54 84 40 100 40 C118 40 146 54 140 96 L144 150 L56 150 Z" fill="{color}"/>'
        front = f'<path d="M64 92 C62 56 88 44 100 44 C116 44 138 56 136 92 C126 72 112 64 98 64 C86 64 72 74 64 92 Z" fill="{color}"/>'
    elif style == "bun":
        back = f'<circle cx="100" cy="38" r="15" fill="{color}"/>'
        front = f'<path d="M64 92 C62 58 86 46 100 46 C116 46 140 58 136 92 C128 72 114 64 100 64 C86 64 72 72 64 92 Z" fill="{color}"/>'
    elif style == "curly":
        bumps = "".join(f'<circle cx="{x}" cy="{y}" r="13" fill="{color}"/>' for x, y in
                        [(70, 70), (80, 54), (96, 46), (112, 46), (126, 54), (134, 70), (66, 86), (138, 86)])
        front = bumps
    elif style == "buzz":
        front = f'<path d="M66 88 C66 60 86 50 100 50 C116 50 136 60 134 88 C126 74 114 68 100 68 C86 68 74 74 66 88 Z" fill="{color}" opacity=".9"/>'
    return back, front


def portrait(*, bg, ring, skin, hair, hair_color, shirt, collar="#FFFFFF", glasses=False, jacket=None):
    face, shade = SKIN[skin]
    back, front = hair_shape(hair, hair_color)
    body = (f'<path d="M40 200 C42 160 64 146 100 146 C136 146 158 160 160 200 Z" fill="{jacket or shirt}"/>')
    if jacket:
        body += (f'<path d="M86 148 L100 176 L114 148 Z" fill="{shirt}"/>'
                 f'<path d="M86 148 L80 156 L100 182 Z M114 148 L120 156 L100 182 Z" fill="{jacket}" stroke="#00000022"/>')
    else:
        body += f'<path d="M84 148 L100 166 L116 148 Z" fill="{collar}"/>'
    glasses_svg = ('<g fill="none" stroke="#2B2B2B" stroke-width="2.5">'
                   '<rect x="76" y="90" width="20" height="15" rx="5"/><rect x="104" y="90" width="20" height="15" rx="5"/>'
                   '<path d="M96 96 L104 96"/></g>') if glasses else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img">
  <circle cx="100" cy="100" r="96" fill="{bg}" stroke="{ring}" stroke-width="6"/>
  <clipPath id="c"><circle cx="100" cy="100" r="93"/></clipPath>
  <g clip-path="url(#c)">
    {back}
    {body}
    <rect x="89" y="124" width="22" height="26" rx="6" fill="{shade}"/>
    <ellipse cx="64" cy="98" rx="7" ry="10" fill="{shade}"/>
    <ellipse cx="136" cy="98" rx="7" ry="10" fill="{shade}"/>
    <ellipse cx="100" cy="94" rx="36" ry="42" fill="{face}"/>
    {front}
    <path d="M78 84 Q86 80 94 84 M106 84 Q114 80 122 84" stroke="#3A2A20" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="86" cy="97" r="3.6" fill="#2B2B2B"/>
    <circle cx="114" cy="97" r="3.6" fill="#2B2B2B"/>
    {glasses_svg}
    <path d="M97 104 Q100 112 103 104" stroke="{shade}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M88 118 Q100 126 112 118" stroke="#8A3B2E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  </g>
</svg>
'''


CAST = {
    # scenario 1
    "alex": dict(bg="#E3EEFB", ring="#2563EB", skin="medium", hair="short", hair_color="#1F1A17",
                 shirt="#E8EEF7", jacket="#1E3A8A", glasses=True),
    "jordan": dict(bg="#E5F6EC", ring="#16A34A", skin="light", hair="side-part", hair_color="#7A4A2A",
                   shirt="#2F855A", collar="#D7F0E1"),
    # scenario 2
    "maria": dict(bg="#FDECEC", ring="#DC2626", skin="medium-deep", hair="long", hair_color="#2A1A12",
                  shirt="#B91C1C", collar="#F8D7D7"),
    "david": dict(bg="#ECEBFD", ring="#6366F1", skin="light-medium", hair="side-part", hair_color="#1F1A17",
                  shirt="#4338CA", collar="#E0E7FF"),
    "sam": dict(bg="#E3F6F5", ring="#0D9488", skin="deep", hair="curly", hair_color="#1B1310",
                shirt="#0F766E", collar="#CCF2EE"),
    # scenario 3
    "chris": dict(bg="#F1F2F4", ring="#64748B", skin="light-medium", hair="messy", hair_color="#5A3A22",
                  shirt="#6B7280", collar="#D1D5DB"),
    "leslie": dict(bg="#FFF4E0", ring="#D97706", skin="medium", hair="bun", hair_color="#2E1F16",
                   shirt="#F8FAFC", jacket="#334155"),
}


def team():
    """Three small figures for the 'team members' speaker."""
    def mini(x, skin, hair, shirt):
        face, shade = SKIN[skin]
        return (f'<path d="M{x-30} 200 C{x-28} 168 {x-16} 158 {x} 158 C{x+16} 158 {x+28} 168 {x+30} 200 Z" fill="{shirt}"/>'
                f'<circle cx="{x}" cy="128" r="24" fill="{face}"/>'
                f'<path d="M{x-24} 124 C{x-24} 104 {x-10} 98 {x} 98 C{x+12} 98 {x+26} 106 {x+24} 124 C{x+16} 112 {x-14} 112 {x-24} 124 Z" fill="{hair}"/>'
                f'<circle cx="{x-8}" cy="130" r="2.6" fill="#2B2B2B"/><circle cx="{x+8}" cy="130" r="2.6" fill="#2B2B2B"/>'
                f'<path d="M{x-7} 140 Q{x} 144 {x+7} 140" stroke="#8A3B2E" stroke-width="2.5" fill="none" stroke-linecap="round"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img">
  <circle cx="100" cy="100" r="96" fill="#EEF2F7" stroke="#475569" stroke-width="6"/>
  <clipPath id="c"><circle cx="100" cy="100" r="93"/></clipPath>
  <g clip-path="url(#c)">
    {mini(58, "deep", "#1B1310", "#0F766E")}
    {mini(142, "light", "#B7791F", "#B91C1C")}
    {mini(100, "medium", "#2A1A12", "#1D4ED8")}
  </g>
</svg>
'''


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, spec in CAST.items():
        (OUT / f"{name}.svg").write_text(portrait(**spec))
    (OUT / "team.svg").write_text(team())
    print("wrote", len(CAST) + 1, "portraits to", OUT)
