"""Genera data/rooms.json y data/routes.json a partir de los SVG originales y REFERENCIA-JUGADORES.md."""
import json, re, sys
import xml.etree.ElementTree as ET

SRC = sys.argv[1]; OUT = sys.argv[2]
NS = {'s': 'http://www.w3.org/2000/svg'}
FLOORS = [
    {"id": "S",  "file": "S-plano.svg",  "short": "S",  "name": "Superficie", "prefix": "s"},
    {"id": "N1", "file": "N1-plano.svg", "short": "−1", "name": "Nivel −1", "prefix": "n1"},
    {"id": "N2", "file": "N2-plano.svg", "short": "−2", "name": "Nivel −2", "prefix": "n2"},
    {"id": "N3", "file": "N3-plano.svg", "short": "−3", "name": "Nivel −3", "prefix": "n3"},
]

# --- referencia: descripciones literales ---
ref = open(f"{SRC}/REFERENCIA-JUGADORES.md", encoding="utf-8").read()
section_floor = {"## Superficie": "S", "## Nivel −1": "N1", "## Nivel −2": "N2", "## Nivel −3": "N3"}
cur = None; refrooms = []
for line in ref.splitlines():
    for k, v in section_floor.items():
        if line.startswith(k): cur = v
    m = re.match(r"^- \*\*([0-9S]+) · (.+?):\*\* (.+)$", line)
    if m and cur:
        refrooms.append({"code": m.group(1), "name": m.group(2), "desc": m.group(3), "floor": cur})
conn = {}
for line in ref.splitlines():
    m = re.match(r"^- \*\*([A-Z0-9/]+):\*\* (.+)$", line)
    if m: conn[m.group(1)] = m.group(2)
assert len(refrooms) == 38, len(refrooms)

rooms = []; routes = []; floors_out = []
for fl in FLOORS:
    tree = ET.parse(f"{SRC}/planos/{fl['file']}"); root = tree.getroot()
    title = root.find('s:title', NS).text
    floors_out.append({"id": fl["id"], "short": fl["short"], "name": fl["name"], "title": title,
                       "svg": f"assets/maps/{fl['file']}"})
    rects = [r.attrib for r in root.findall('s:rect', NS)]
    roomrects = [r for r in rects if r.get('fill') == '#1b2c31' and r.get('y') != '260']
    stubs = [r for r in rects if r.get('fill') == '#233a3e' and r.get('width') == '24' and r.get('height') == '25']
    for g in root.findall('s:g', NS):
        t = g.find('s:text', NS); code = t.text; tx, ty = float(t.get('x')), float(t.get('y'))
        box = [r for r in roomrects if float(r['x']) <= tx <= float(r['x'])+float(r['width']) and float(r['y']) <= ty <= float(r['y'])+float(r['height'])]
        assert len(box) == 1, code
        b = box[0]; x, y, w, h = (float(b[k]) for k in ('x', 'y', 'width', 'height'))
        refr = next(r for r in refrooms if r['code'] == code)
        assert refr['floor'] == fl['id'], code
        rooms.append({"id": code, "floor": fl["id"], "code": code, "name": refr["name"], "desc": refr["desc"],
                      "shape": {"type": "rect", "x": x, "y": y, "w": w, "h": h}, "badge": [x + 6, y + 6]})
        # acceso: stub contiguo a la sala que contenga la x de la etiqueta
        top = y < 260
        sy = 235 if top else 350
        st = [s for s in stubs if float(s['y']) == sy and float(s['x']) <= tx + 12 and abs(float(s['x']) + 12 - tx) < 200 and x <= float(s['x']) <= x + w]
        assert len(st) == 1, (code, st)
        s = st[0]; sx = float(s['x'])
        dest = "patio de servicio" if fl["id"] == "S" else "pasillo principal"
        routes.append({"id": f"acc-{code}", "floor": fl["id"], "kind": "route", "group": "access",
                       "name": f"Acceso {code}", "desc": f"Acceso de {code} · {refr['name']} al {dest}.",
                       "shape": {"type": "rect", "x": sx - 4, "y": sy, "w": 32, "h": 25},
                       "badge": [sx + 30, sy + 4 if top else sy + 6]})
    p = fl["prefix"]; S = fl["id"] == "S"
    cname = "Patio de servicio" if S else "Pasillo principal"
    for sid, lab, x0, x1 in (("o", "oeste", 195, 403.5), ("c", "central", 403.5, 595.5), ("e", "este", 595.5, 805)):
        routes.append({"id": f"{p}-pasillo-{sid}", "floor": fl["id"], "kind": "route", "group": "corridor",
                       "name": f"{cname} · tramo {lab}",
                       "desc": ("Tramo del patio de servicio, donde desembocan A y B." if S else "Tramo del pasillo principal entre los accesos de las salas."),
                       "shape": {"type": "rect", "x": x0, "y": 260, "w": x1 - x0, "h": 90}, "badge": [(x0 + x1) / 2 - 30, 266]})
    # núcleos A / B
    routes.append({"id": f"{p}-A", "floor": fl["id"], "kind": "core", "core": "A", "name": "A · núcleo vertical",
                   "desc": "A: " + conn["A"], "shape": {"type": "rect", "x": 60, "y": 260, "w": 135, "h": 90},
                   "parts": [f"{p}-A-esc", f"{p}-A-asc"]})
    routes.append({"id": f"{p}-B", "floor": fl["id"], "kind": "core", "core": "B", "name": "B · núcleo vertical",
                   "desc": "B: " + conn["B"], "shape": {"type": "rect", "x": 805, "y": 260, "w": 135, "h": 90},
                   "parts": [f"{p}-B-esc", f"{p}-B-carga"]})
    for cid, core, chip, name, desc, x in (
        ("A-esc", "A", "ESC.", "A · escalera", "Escalera del núcleo A.", 70),
        ("A-asc", "A", "ASC.", "A · ascensor de personal", "Ascensor de personal del núcleo A.", 131),
        ("B-esc", "B", "ESC.", "B · escalera protegida", "Escalera protegida del núcleo B, en recinto separado del montacargas.", 815),
        ("B-carga", "B", "CARGA", "B · montacargas", "Montacargas del núcleo B, en recinto separado de la escalera.", 876)):
        routes.append({"id": f"{p}-{cid}", "floor": fl["id"], "kind": "transport", "core": core, "chip": chip,
                       "name": name, "desc": desc, "shape": {"type": "rect", "x": x, "y": 326, "w": 54, "h": 19}})
    side2 = "vial perimetral" if S else "pasillo de mantenimiento"
    for core, xc, xo in (("A", 195, 60), ("B", 805, 940)):
        routes.append({"id": f"{p}-{core}-ent-pasillo", "floor": fl["id"], "kind": "route", "group": "entry",
                       "name": f"Entrada a {core} desde el {cname.lower()}", "desc": f"Puerta entre {core} y el {cname.lower()}.",
                       "shape": {"type": "rect", "x": xc - 7, "y": 289, "w": 14, "h": 32}, "badge": [xc - 22, 273]})
        routes.append({"id": f"{p}-{core}-ent-{'vial' if S else 'pm'}", "floor": fl["id"], "kind": "route", "group": "entry",
                       "name": f"Entrada a {core} desde el {side2}", "desc": f"Puerta entre {core} y el {side2}.",
                       "shape": {"type": "rect", "x": xo - 7, "y": 289, "w": 14, "h": 32},
                       "badge": [xo - 22 if core == "A" else xo - 22, 273]})
    # PM / vial perimetral segmentado
    segs = (("o", "oeste (lado A)", [[60, 305], [42, 305], [42, 575]], [48, 430]),
            ("so", "sur-oeste", [[42, 575], [330, 575]], [160, 568]),
            ("sc", "sur-central", [[330, 575], [670, 575]], [470, 568]),
            ("se", "sur-este", [[670, 575], [958, 575]], [780, 568]),
            ("e", "este (lado B)", [[958, 575], [958, 305], [940, 305]], [890, 430]))
    for sid, lab, pts, badge in segs:
        if S:
            routes.append({"id": f"s-vial-{sid}", "floor": "S", "kind": "route", "group": "vial",
                           "name": f"Vial perimetral · tramo {lab}", "desc": "Tramo del vial perimetral que rodea el patio y enlaza con E.",
                           "shape": {"type": "line", "points": pts, "width": 22}, "badge": badge})
        else:
            routes.append({"id": f"{p}-pm-{sid}", "floor": fl["id"], "kind": "route", "group": "pm",
                           "name": f"PM · tramo {lab}", "desc": "Tramo del pasillo de mantenimiento: " + conn["PM"],
                           "shape": {"type": "line", "points": pts, "width": 22}, "badge": badge})
    if S:
        routes.append({"id": "s-E", "floor": "S", "kind": "route", "group": "e", "name": "E · acceso terrestre",
                       "desc": "E: " + conn["E"], "shape": {"type": "line", "points": [[958, 575], [996, 575]], "width": 16},
                       "badge": [940, 590]})
        routes.append({"id": "s-entrada-servicio", "floor": "S", "kind": "route", "group": "service",
                       "name": "Entrada de servicio", "desc": "Entrada de servicio representada bajo S07, cruzando el vial perimetral.",
                       "shape": {"type": "line", "points": [[307, 545], [307, 622]], "width": 14}, "badge": [314, 600]})
    if fl["id"] == "N3":
        routes.append({"id": "n3-PT", "floor": "N3", "kind": "route", "group": "pt", "name": "PT · portillo",
                       "desc": "PT: " + conn["PT"], "shape": {"type": "rect", "x": 680, "y": 545, "w": 28, "h": 30},
                       "badge": [712, 548]})
        for c, x in (("C1", 270), ("C2", 730)):
            routes.append({"id": f"n3-{c}", "floor": "N3", "kind": "terminal", "name": f"{c} · terminal",
                           "desc": "C1/C2: " + conn["C1/C2"] + " Solo referencia en esta versión.",
                           "shape": {"type": "circle", "cx": x, "cy": 505, "r": 17}})

assert len(rooms) == 38
json.dump({"floors": floors_out, "rooms": rooms}, open(f"{OUT}/rooms.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump({"mapVersion": "sitio67-planos-1.0", "routes": routes}, open(f"{OUT}/routes.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(rooms), "salas;", len(routes), "elementos de ruta/conexión;", "conexiones:", list(conn))
