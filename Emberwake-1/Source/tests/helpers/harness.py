# Drives one game window for the single-player tests: start a world, step the game, take pictures.
import asyncio, json, io, os, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from where import GAME_URL as URL, CHROME
class H:
    async def start(self, w=1280, h=720, mode='world', size=1, shape=0, seed=12345, gmode=0, init=None, ctx=None, pw=None):
        self.pw = pw or await async_playwright().start(); self.own = pw is None
        if ctx is None:
            self.b = await self.pw.chromium.launch(headless=True, args=['--no-sandbox'], **CHROME)
            self.ctx = await self.b.new_context(viewport={'width':w,'height':h})
        else: self.ctx = ctx; self.b = None
        if init: await self.ctx.add_init_script(init)
        self.pg = await self.ctx.new_page()
        self.errs=[]
        self.pg.on('console', lambda m: self.errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        self.pg.on('pageerror', lambda e: self.errs.append('PAGEERROR: '+str(e)))
        await self.pg.goto(URL); await self.pg.wait_for_timeout(700)
        if mode == 'world':
            await self.ev("Object.assign(WORLD,{id:'test',name:'Test',seed:%d,size:%d,shape:%d,mode:%d,arena:false}); G.skin=0; startWorld(null);"%(seed,size,shape,gmode))
            for i in range(100):
                st = await self.ev("G.state")
                if st in ('intro','play'): break
                await self.pg.wait_for_timeout(100)
            await self.ev("G.manual=true; if(G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.time=700; G.spawnT=1e9; G.found=new Set(LANDMARKS.map(l=>l.id)); for (const r of ['drift','under','deep']) G.found.add('realm_'+r); G.cine=null;")
        elif mode == 'arena':
            await self.ev("enterArena('TESTER', 0, 'open')"); await self.pg.wait_for_timeout(200); await self.ev("G.manual=true;")
        return self
    async def ev(self, js): return await self.pg.evaluate(js)
    async def step(self, n=1, js=''): return await self.pg.evaluate("(()=>{for(let i=0;i<%d;i++){%s; if(G.hitstop>0){G.hitstop--; tickParts();} else tick();} render(1);})()"%(n,js))
    async def shot(self, crop=None):
        png = await self.pg.screenshot()
        im = Image.open(io.BytesIO(png)).convert('RGB')
        return im.crop(crop) if crop else im
    async def pcrop(self, hw=110, hh=90):
        x,y = await self.ev("[(G.p.x+3-G.rcx)*VS.s,(G.p.y+10-G.rcy)*VS.s]")
        return await self.shot((int(x-hw),int(y-hh),int(x+hw),int(y+hh)))
    async def crop(self, wx, wy, hw=110, hh=90):
        x,y = await self.ev("[(%s-G.rcx)*VS.s,(%s-G.rcy)*VS.s]"%(wx,wy))
        return await self.shot((int(x-hw),int(y-hh),int(x+hw),int(y+hh)))
    async def goto(self, tx, ty=None):
        await self.ev("(()=>{const p=G.p; const tx=%s; if (typeof streamTo==='function') streamTo(tx*T, true); let ty=%s; if(ty===null){ ty=heights[tx]-3; } p.x=p.px=tx*T+1; p.y=p.py=ty*T; while(boxHits(p.x,p.y,p.w,p.h)) {p.y-=T; p.py=p.y;} p.vx=p.vy=0; snapCam();})()"%(tx, 'null' if ty is None else ty))
    async def stop(self):
        if self.b: await self.b.close()
        if self.own: await self.pw.stop()
def sheet(ims, cols, path, labels=None, scale=1.0):
    w,h = ims[0].size; rows=(len(ims)+cols-1)//cols
    out = Image.new('RGB',(cols*w, rows*(h+14)),(20,20,30)); d=ImageDraw.Draw(out)
    for i,im in enumerate(ims):
        x=(i%cols)*w; y=(i//cols)*(h+14); out.paste(im,(x,y+14))
        if labels: d.text((x+3,y+1),labels[i],fill=(255,220,120))
    if scale != 1.0: out = out.resize((int(out.width*scale), int(out.height*scale)), Image.LANCZOS)
    out.save(path)
