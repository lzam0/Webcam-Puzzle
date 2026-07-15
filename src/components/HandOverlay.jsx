import { useEffect, useRef } from 'react'

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],       // thumb
  [0,5],[5,6],[6,7],[7,8],       // index
  [0,9],[9,10],[10,11],[11,12],  // middle
  [0,13],[13,14],[14,15],[15,16],// ring
  [0,17],[17,18],[18,19],[19,20],// pinky
  [5,9],[9,13],[13,17],          // palm
]

export function HandOverlay({ videoRef, handStateRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let rafId

    const draw = () => {
      const ctx = canvas.getContext('2d')
      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      // Draw live video feed (mirrored)
      const video = videoRef.current
      if (video && video.readyState >= 2) {
        ctx.save()
        ctx.scale(-1, 1)
        ctx.translate(-W, 0)
        ctx.drawImage(video, 0, 0, W, H)
        ctx.restore()

        // Dim overlay so skeleton pops
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(0, 0, W, H)
      }

      const hand = handStateRef.current
      if (hand.landmarks && hand.landmarks.length > 0) {
        const lm = hand.landmarks

        // Draw skeleton connections
        ctx.lineWidth = 1.5
        for (const [a, b] of CONNECTIONS) {
          if (a >= lm.length || b >= lm.length) continue
          const ax = (1 - lm[a].x) * W
          const ay = lm[a].y * H
          const bx = (1 - lm[b].x) * W
          const by = lm[b].y * H

          ctx.strokeStyle = hand.isPinched
            ? 'rgba(255, 120, 120, 0.8)'
            : 'rgba(120, 220, 255, 0.7)'
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(bx, by)
          ctx.stroke()
        }

        // Draw landmark dots
        lm.forEach((l, i) => {
          const x = (1 - l.x) * W
          const y = l.y * H
          const isKey = i === 4 || i === 8

          ctx.beginPath()
          ctx.arc(x, y, isKey ? 6 : 3, 0, Math.PI * 2)
          ctx.fillStyle = isKey
            ? (hand.isPinched ? '#ff6060' : '#60dfff')
            : 'rgba(200, 230, 255, 0.85)'
          ctx.fill()
        })

        // Pinch indicator — pulsing ring between thumb & index
        if (hand.isPinched) {
          const t = lm[4], idx = lm[8]
          const mx = ((1 - t.x) + (1 - idx.x)) / 2 * W
          const my = (t.y + idx.y) / 2 * H
          const pulse = 10 + Math.sin(Date.now() / 80) * 4

          ctx.beginPath()
          ctx.arc(mx, my, pulse, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(255, 100, 100, 0.85)'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [videoRef, handStateRef])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1.5">
      {/* Label */}
      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur rounded-full px-3 py-1">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
        <span className="text-white/70 text-xs font-medium">Hand Tracking</span>
      </div>

      {/* Video + skeleton canvas */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ width: 180, height: 135 }}>
        {/* Gradient border */}
        <div className="absolute -inset-px bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl" />
        <canvas
          ref={canvasRef}
          width={180}
          height={135}
          className="relative rounded-2xl block"
        />
      </div>
    </div>
  )
}
