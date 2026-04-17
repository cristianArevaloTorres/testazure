import { useEffect, useRef, useCallback } from "react"

interface Star   { x:number;y:number;radius:number;opacity:number;speed:number;phase:number;color:string;bright:boolean }
interface Shooter{ x:number;y:number;vx:number;vy:number;length:number;opacity:number;life:number;maxLife:number }
interface Drop   { x:number;y:number;radius:number;maxRadius:number;opacity:number;speed:number }
interface Caustic{ x:number;y:number;size:number;phase:number;speed:number }

const BELT = [{ nx:0.34,ny:0.56 },{ nx:0.50,ny:0.50 },{ nx:0.66,ny:0.44 }]

const STAR_COLORS = [
  "rgba(241,245,249,","rgba(147,197,253,","rgba(196,181,253,",
  "rgba(253,224,71,", "rgba(255,210,180,",
]

// Water wave layers — different frequencies and speeds create organic water feel
const WAVES = [
  { fy:0.022, aX:5,  aY:1.5, sy:0.009 },
  { fy:0.006, aX:11, aY:3.0, sy:0.004 },
  { fy:0.048, aX:2,  aY:0.7, sy:0.018 },
  { fy:0.013, aX:7,  aY:2.0, sy:0.007 },
  { fy:0.031, aX:3,  aY:1.0, sy:0.012 },
]

export default function StarField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offRef    = useRef<HTMLCanvasElement | null>(null)
  const starsRef  = useRef<Star[]>([])
  const shootRef  = useRef<Shooter[]>([])
  const dropsRef  = useRef<Drop[]>([])
  const caustRef  = useRef<Caustic[]>([])
  const rafRef    = useRef<number>(0)
  const mouseRef  = useRef({ x:-999, y:-999 })
  const tRef      = useRef(0)

  const init = useCallback((canvas: HTMLCanvasElement) => {
    const W = canvas.width  = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    if (!offRef.current) offRef.current = document.createElement("canvas")
    offRef.current.width  = W
    offRef.current.height = H

    const count = Math.floor((W * H) / 4600)
    starsRef.current = Array.from({ length: count }, () => {
      const r = Math.random() * 1.9 + 0.15
      return {
        x:      Math.random() * W,
        y:      Math.random() * H,
        radius: r,
        opacity:Math.random() * 0.75 + 0.2,
        speed:  Math.random() * 0.0018 + 0.0004,
        phase:  Math.random() * Math.PI * 2,
        color:  STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        bright: r > 1.2,
      }
    })

    caustRef.current = Array.from({ length: 8 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      size:  Math.random() * 240 + 70,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.003 + 0.0007,
    }))
  }, [])

  const addDrop = useCallback((x: number, y: number, big = false) => {
    dropsRef.current.push({
      x, y, radius: 0,
      maxRadius: (big ? 230 : 130) + Math.random() * 90,
      opacity:   big ? 0.88 : 0.65,
      speed:     (big ? 2.4 : 1.4) + Math.random() * 0.9,
    })
  }, [])

  // ── render stars + nebulae + belt to offscreen canvas ─────────────────────
  const drawOff = useCallback((t: number) => {
    const off = offRef.current; if (!off) return
    const ctx = off.getContext("2d"); if (!ctx) return
    const W = off.width, H = off.height

    ctx.clearRect(0, 0, W, H)

    // Deep space gradient
    const bg = ctx.createRadialGradient(W*.5,H*.38,0, W*.5,H*.38,W*1.1)
    bg.addColorStop(0,   "#0e0b28")
    bg.addColorStop(0.5, "#07081c")
    bg.addColorStop(1,   "#020309")
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    // Nebulae
    ;[
      { x:.22, y:.32, r:.50, c:"rgba(75,12,175,0.14)" },
      { x:.70, y:.58, r:.44, c:"rgba(12,50,195,0.10)" },
      { x:.88, y:.18, r:.24, c:"rgba(195,22,65,0.10)" },  // Orion Nebula rojo-rosa
      { x:.50, y:.72, r:.28, c:"rgba(35,8,100,0.07)"  },
    ].forEach(n => {
      const g = ctx.createRadialGradient(n.x*W,n.y*H,0, n.x*W,n.y*H,n.r*W)
      g.addColorStop(0, n.c); g.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    })

    // Stars
    starsRef.current.forEach(star => {
      const alpha = star.opacity * (0.55 + 0.45 * Math.sin(t * star.speed * 60 + star.phase))
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
      ctx.fillStyle = `${star.color}${Math.min(alpha, 1)})`
      ctx.fill()
      if (star.bright) {
        const h = ctx.createRadialGradient(star.x,star.y,0, star.x,star.y,star.radius*5)
        h.addColorStop(0, `${star.color}${alpha*.28})`); h.addColorStop(1, `${star.color}0)`)
        ctx.fillStyle = h
        ctx.beginPath(); ctx.arc(star.x, star.y, star.radius*5, 0, Math.PI*2); ctx.fill()
      }
    })

    // Orion Belt — big stars with diffraction spikes
    const belt = BELT.map(b => ({ bx: b.nx*W, by: b.ny*H }))
    belt.forEach(({ bx, by }, i) => {
      const p = 0.65 + 0.35 * Math.sin(t * 0.012 + i * 1.3)
      // outer halo
      const og = ctx.createRadialGradient(bx,by,0, bx,by,30)
      og.addColorStop(0,   `rgba(175,215,255,${0.30*p})`)
      og.addColorStop(0.45,`rgba(95,140,255,${0.13*p})`)
      og.addColorStop(1,   "rgba(0,0,0,0)")
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(bx,by,30,0,Math.PI*2); ctx.fill()
      // inner glow
      const ig = ctx.createRadialGradient(bx,by,0, bx,by,10)
      ig.addColorStop(0, `rgba(220,240,255,${0.72*p})`); ig.addColorStop(1,"rgba(0,0,0,0)")
      ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(bx,by,10,0,Math.PI*2); ctx.fill()
      // core dot
      ctx.beginPath(); ctx.arc(bx,by,2.8,0,Math.PI*2)
      ctx.fillStyle = `rgba(245,252,255,${0.94*p})`; ctx.fill()
      // diffraction cross spikes (4-point star)
      ctx.save(); ctx.globalAlpha = 0.32 * p
      ;[0, Math.PI/4, Math.PI/2, Math.PI*3/4].forEach(angle => {
        ctx.save(); ctx.translate(bx,by); ctx.rotate(angle)
        const sg = ctx.createLinearGradient(0,-24,0,24)
        sg.addColorStop(0,   "rgba(200,225,255,0)")
        sg.addColorStop(0.5, "rgba(225,242,255,0.95)")
        sg.addColorStop(1,   "rgba(200,225,255,0)")
        ctx.strokeStyle = sg; ctx.lineWidth = 0.9
        ctx.beginPath(); ctx.moveTo(0,-24); ctx.lineTo(0,24); ctx.stroke()
        ctx.restore()
      })
      ctx.restore()
    })
    // belt connecting line
    ctx.beginPath(); ctx.moveTo(belt[0].bx, belt[0].by)
    belt.slice(1).forEach(s => ctx.lineTo(s.bx, s.by))
    ctx.strokeStyle = `rgba(147,197,253,${0.04+0.03*Math.sin(t*0.006)})`
    ctx.lineWidth = 0.6; ctx.stroke()

    // Shooting stars
    if (Math.random() < 0.004) {
      const ang = (Math.random()*30+15) * (Math.PI/180)
      const spd = Math.random()*7+4
      shootRef.current.push({ x:Math.random()*W, y:0, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
        length:Math.random()*160+60, opacity:0, life:0, maxLife:Math.random()*70+40 })
    }
    shootRef.current = shootRef.current.filter(s => {
      s.life++; s.x+=s.vx; s.y+=s.vy
      const prog = s.life/s.maxLife
      s.opacity = prog<.3 ? prog/.3 : prog>.7 ? 1-(prog-.7)/.3 : 1
      const spd = Math.sqrt(s.vx*s.vx+s.vy*s.vy)
      const tx = s.x-s.vx*(s.length/spd), ty = s.y-s.vy*(s.length/spd)
      const sg = ctx.createLinearGradient(tx,ty,s.x,s.y)
      sg.addColorStop(0,"rgba(255,255,255,0)")
      sg.addColorStop(.5,`rgba(190,215,255,${s.opacity*.25})`)
      sg.addColorStop(1, `rgba(255,255,255,${s.opacity*.95})`)
      ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(s.x,s.y)
      ctx.strokeStyle=sg; ctx.lineWidth=1.9; ctx.stroke()
      ctx.beginPath(); ctx.arc(s.x,s.y,2.2,0,Math.PI*2)
      ctx.fillStyle=`rgba(255,255,255,${s.opacity*.92})`; ctx.fill()
      return s.life < s.maxLife && s.x < W+200 && s.y < H+200
    })
  }, [])

  // ── copy offscreen to main canvas with water distortion ───────────────────
  const drawMain = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const off = offRef.current; if (!off) return
    const W = ctx.canvas.width, H = ctx.canvas.height
    ctx.clearRect(0, 0, W, H)

    // Update drop physics first so distortion matches ring positions
    dropsRef.current.forEach(d => { d.radius += d.speed; d.opacity *= 0.983 })

    // ── WATER DISTORTION: render star field as horizontal 2px strips ──────
    const SLICE = 2
    for (let y = 0; y < H; y += SLICE) {
      let dx = 0, dy = 0
      // Sum of wave layers
      for (const w of WAVES) {
        dx += Math.sin(y * w.fy + t * w.sy) * w.aX
        dy += Math.cos(y * w.fy * .8 + t * w.sy * .7) * w.aY
      }
      // Each water drop ring adds a displacement pulse around its ring edge
      for (const d of dropsRef.current) {
        const dd = y - (d.y + d.radius)   // signed distance from ring center
        if (Math.abs(dd) < 28) {
          const str = d.opacity * 15 * Math.exp(-Math.abs(dd) / 9)
          dx += Math.sin(dd * .55) * str
          dy += Math.cos(dd * .35) * str * .42
        }
      }
      ctx.drawImage(off, 0, y, W, SLICE, dx, y + dy, W, SLICE)
    }

    // ── CAUSTIC LIGHT OVERLAY (screen blend — light through water) ─────────
    ctx.save()
    ctx.globalCompositeOperation = "screen"

    // Slow drifting caustic blobs
    caustRef.current.forEach(c => {
      const cx = c.x + Math.sin(t * c.speed + c.phase) * 58
      const cy = c.y + Math.cos(t * c.speed * .88 + c.phase * 1.25) * 40
      const sz = c.size * (.80 + .20 * Math.sin(t * c.speed * 1.9 + c.phase))
      const cg = ctx.createRadialGradient(cx,cy,0, cx,cy,sz)
      cg.addColorStop(0,   "rgba(85,140,255,0.038)")
      cg.addColorStop(0.4, "rgba(65,100,225,0.015)")
      cg.addColorStop(1,   "rgba(0,0,0,0)")
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx,cy,sz,0,Math.PI*2); ctx.fill()
    })

    // Caustic shimmer streaks (horizontal light lines like pool bottom)
    for (let i = 0; i < 12; i++) {
      const frac = (((i / 12) + t * 0.00022 * (i % 2 ? 1 : -1)) % 1 + 1) % 1
      const sy   = frac * H
      const sw   = W * (.20 + .50 * Math.sin(t * .0016 + i * 2.4))
      const sx   = (W - sw) * .5 + Math.sin(t * .0023 + i * 1.15) * W * .13
      const a    = .010 + .008 * Math.sin(t * .0038 + i * 1.9)
      const lg = ctx.createLinearGradient(sx, sy, sx+sw, sy)
      lg.addColorStop(0,   "rgba(155,205,255,0)")
      lg.addColorStop(.35, `rgba(155,205,255,${a})`)
      lg.addColorStop(.65, `rgba(195,228,255,${a*1.5})`)
      lg.addColorStop(1,   "rgba(155,205,255,0)")
      ctx.fillStyle = lg; ctx.fillRect(sx, sy-.7, sw, 1.4)
    }
    ctx.restore()

    // ── WATER DROP RINGS (elliptical — charco perspective) ─────────────────
    ctx.save()
    dropsRef.current.forEach(d => {
      const baseOp = d.opacity * Math.max(0, 1 - d.radius / d.maxRadius)
      if (baseOp < 0.006) return

      // Multiple concentric elliptical rings
      for (let ring = 0; ring < 4; ring++) {
        const rr = d.radius - ring * 15
        if (rr < 3) continue
        const ro = baseOp * (1 - ring * .22)

        // Full ellipse ring
        ctx.beginPath()
        ctx.ellipse(d.x, d.y, rr, rr * .36, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(170,215,255,${ro * .55})`
        ctx.lineWidth   = Math.max(0.3, 1.5 - ring * .35)
        ctx.stroke()

        // Bright reflection highlight on top arc
        ctx.beginPath()
        ctx.ellipse(d.x, d.y - rr * .04, rr, rr * .36, 0, Math.PI * 1.18, Math.PI * 1.82)
        ctx.strokeStyle = `rgba(225,245,255,${ro * .85})`
        ctx.lineWidth   = 0.8
        ctx.stroke()
      }

      // Impact splash: bright dot that appears on first frames
      if (d.radius < 14) {
        const splashR = 4 * (1 - d.radius / 14)
        ctx.beginPath(); ctx.arc(d.x, d.y, splashR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220,242,255,${d.opacity * .75})`; ctx.fill()
      }
    })

    // Remove dead drops
    dropsRef.current = dropsRef.current.filter(
      d => d.opacity > 0.007 && d.radius < d.maxRadius
    )
    ctx.restore()
  }, [])

  // ── animation loop ─────────────────────────────────────────────────────────
  const frame = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext("2d"); if (!ctx) return
    const t = ++tRef.current
    const W = canvas.width, H = canvas.height
    if (Math.random() < 0.007) addDrop(Math.random() * W, Math.random() * H)
    drawOff(t)
    drawMain(ctx, t)
  }, [drawOff, drawMain, addDrop])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    init(canvas)
    const animate = () => { frame(); rafRef.current = requestAnimationFrame(animate) }
    animate()
    const onResize = () => init(canvas)
    window.addEventListener("resize", onResize)
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    window.addEventListener("mousemove", onMove)
    const onClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      addDrop(e.clientX - r.left, e.clientY - r.top, true)
    }
    window.addEventListener("click", onClick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("click", onClick)
    }
  }, [init, frame, addDrop])

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "fixed inset-0 w-full h-full pointer-events-none z-0"}
    />
  )
}
