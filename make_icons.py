"""Renders the app icon from the game's own art code, so it matches exactly.
Needs: pip install playwright pillow  +  python3 -m playwright install chromium"""
import subprocess, os
from PIL import Image

HTML = """<!DOCTYPE html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#2B1B3F}
svg{display:block;width:1024px;height:1024px}</style></head><body>
<svg id="s" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet"></svg>
<script src="art.js"></script>
<script>
var st=document.getElementById('s'), S=ART.S, ink=ART.ink;
S('rect',{x:0,y:0,width:200,height:200,fill:'#2B1B3F'},st);
S('circle',{cx:60,cy:52,r:130,fill:ART.glow(st,'#FF8A3D',0.30)},st);
S('circle',{cx:158,cy:172,r:100,fill:ART.glow(st,'#6EC6E8',0.22)},st);
ART.star(st,163,44,17,'#FFC93C');
ART.star(st,36,150,10,'#6EC6E8');
ART.star(st,176,120,7,'#FFF6E6',0);
ART.animal(st,{kind:'cat',x:100,y:88,size:42,fill:'#FF8A3D',mood:'happy',bob:false,blink:false,shadow:false});
</script></body></html>"""

open("_icon.html", "w").write(HTML)
open("_shot.py", "w").write('''
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width":1024,"height":1024}, device_scale_factor=1)
    pg.goto("file://%s/_icon.html")
    pg.wait_for_timeout(500)
    pg.locator("#s").screenshot(path="_icon.png")
    b.close()
''' % os.getcwd())
subprocess.check_call(["python3", "_shot.py"])

src = Image.open("_icon.png").convert("RGB")
for s in (180, 192, 512):
    src.resize((s, s), Image.LANCZOS).save("icon-%d.png" % s, optimize=True)
    print("icon-%d.png" % s)
for f in ("_icon.html", "_shot.py", "_icon.png"):
    os.remove(f)
