import { useEffect, useRef } from 'react'
import { Hand } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { usePuzzle } from '../hooks/usePuzzle'

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
]

export function PuzzleBoard({ image, onSolved, handStateRef, videoRef }) {
  const canvasRef = useRef(null)
  const handFeedCanvasRef = useRef(null)
  const imageRef = useRef(null)
  const carriedSlotRef = useRef(null)
  const wasPinchedRef = useRef(false)
  const { tiles, scramble, swapTiles, isSolved } = usePuzzle()
  const scrambleRef = useRef(scramble)
  scrambleRef.current = scramble

  const CANVAS_SIZE = 480
  const HAND_FEED_SIZE = 200
  const TILE_SIZE = CANVAS_SIZE / 3
  const GAP = 4

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      scrambleRef.current()
    }
    img.src = image
  }, [image])

  // Check solve after every tile swap
  useEffect(() => {
    if (imageRef.current && isSolved()) onSolved()
  }, [tiles]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hand feed: draw live video + skeleton to the side panel
  useEffect(() => {
    const canvas = handFeedCanvasRef.current
    if (!canvas) return
    let rafId

    const draw = () => {
      const video = videoRef.current
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        const vw = video.videoWidth
        const vh = video.videoHeight
        const targetH = CANVAS_SIZE
        const targetW = Math.round(vw * targetH / vh)
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW
          canvas.height = targetH
        }
      }

      const W = canvas.width
      const H = canvas.height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)

      if (video && video.readyState >= 2) {
        ctx.save()
        ctx.scale(-1, 1)
        ctx.translate(-W, 0)
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, W, H)
        ctx.restore()
        ctx.fillStyle = 'rgba(0,0,0,0.25)'
        ctx.fillRect(0, 0, W, H)
      }

      const hand = handStateRef.current
      if (hand.landmarks && hand.landmarks.length > 0) {
        const lm = hand.landmarks
        ctx.lineWidth = 2
        for (const [a, b] of CONNECTIONS) {
          if (a >= lm.length || b >= lm.length) continue
          ctx.strokeStyle = hand.isPinched ? 'rgba(255,120,120,0.8)' : 'rgba(120,220,255,0.75)'
          ctx.beginPath()
          ctx.moveTo((1 - lm[a].x) * W, lm[a].y * H)
          ctx.lineTo((1 - lm[b].x) * W, lm[b].y * H)
          ctx.stroke()
        }
        lm.forEach((l, i) => {
          const x = (1 - l.x) * W
          const y = l.y * H
          const isKey = i === 4 || i === 8
          ctx.beginPath()
          ctx.arc(x, y, isKey ? 8 : 4, 0, Math.PI * 2)
          ctx.fillStyle = isKey ? (hand.isPinched ? '#ff6060' : '#60dfff') : 'rgba(200,230,255,0.85)'
          ctx.fill()
        })
        if (hand.isPinched) {
          const t = lm[4], ix = lm[8]
          const mx = ((1 - t.x) + (1 - ix.x)) / 2 * W
          const my = (t.y + ix.y) / 2 * H
          const pulse = 14 + Math.sin(Date.now() / 80) * 5
          ctx.beginPath()
          ctx.arc(mx, my, pulse, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(255,100,100,0.85)'
          ctx.lineWidth = 2.5
          ctx.stroke()
        }
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [videoRef, handStateRef])

  // Main rAF loop — pinch logic + drawing, restarts after each swap
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let rafId

    const loop = () => {
      const img = imageRef.current
      if (!img) { rafId = requestAnimationFrame(loop); return }

      const ctx = canvas.getContext('2d')
      const hand = handStateRef.current
      const isPinched = hand.isPinched
      const cursorX = hand.cursorNormX * CANVAS_SIZE
      const cursorY = hand.cursorNormY * CANVAS_SIZE

      // Pinch start → pick up tile
      if (!wasPinchedRef.current && isPinched) {
        const col = Math.min(2, Math.max(0, Math.floor(cursorX / TILE_SIZE)))
        const row = Math.min(2, Math.max(0, Math.floor(cursorY / TILE_SIZE)))
        carriedSlotRef.current = row * 3 + col
      }

      // Pinch release → drop tile
      if (wasPinchedRef.current && !isPinched && carriedSlotRef.current !== null) {
        let nearestSlot = 0, minDist = Infinity
        for (let s = 0; s < 9; s++) {
          const sr = Math.floor(s / 3), sc = s % 3
          const cx = sc * TILE_SIZE + TILE_SIZE / 2
          const cy = sr * TILE_SIZE + TILE_SIZE / 2
          const d = Math.hypot(cursorX - cx, cursorY - cy)
          if (d < minDist) { minDist = d; nearestSlot = s }
        }
        const from = carriedSlotRef.current
        carriedSlotRef.current = null
        wasPinchedRef.current = false
        swapTiles(from, nearestSlot)
        return // tiles state changes → loop restarts with fresh closure
      }

      wasPinchedRef.current = isPinched

      // --- Draw ---
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      // Dark background
      ctx.fillStyle = '#0f0a1a'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      for (let slot = 0; slot < 9; slot++) {
        if (slot === carriedSlotRef.current) continue

        const tileIndex = tiles[slot]
        const row = Math.floor(slot / 3)
        const col = slot % 3
        const srcRow = Math.floor(tileIndex / 3)
        const srcCol = tileIndex % 3

        const destX = col * TILE_SIZE + GAP / 2
        const destY = row * TILE_SIZE + GAP / 2
        const tileW = TILE_SIZE - GAP
        const tileH = TILE_SIZE - GAP

        // Rounded tile clip
        ctx.save()
        ctx.beginPath()
        roundRect(ctx, destX, destY, tileW, tileH, 8)
        ctx.clip()
        ctx.drawImage(
          img,
          srcCol * (img.width / 3), srcRow * (img.height / 3),
          img.width / 3, img.height / 3,
          destX, destY, tileW, tileH
        )
        ctx.restore()

        // Subtle inner border
        ctx.save()
        ctx.beginPath()
        roundRect(ctx, destX, destY, tileW, tileH, 8)
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()
      }

      // Carried tile — floats above cursor with glow
      if (carriedSlotRef.current !== null) {
        const tileIndex = tiles[carriedSlotRef.current]
        const srcRow = Math.floor(tileIndex / 3)
        const srcCol = tileIndex % 3
        const scaled = TILE_SIZE * 1.18
        const half = scaled / 2

        ctx.save()
        ctx.shadowColor = 'rgba(168, 85, 247, 0.7)'
        ctx.shadowBlur = 28
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 8
        ctx.beginPath()
        roundRect(ctx, cursorX - half, cursorY - half, scaled, scaled, 10)
        ctx.clip()
        ctx.drawImage(
          img,
          srcCol * (img.width / 3), srcRow * (img.height / 3),
          img.width / 3, img.height / 3,
          cursorX - half, cursorY - half, scaled, scaled
        )
        ctx.restore()

        // Bright border on carried tile
        ctx.save()
        ctx.shadowColor = 'rgba(244, 114, 182, 0.9)'
        ctx.shadowBlur = 12
        ctx.beginPath()
        roundRect(ctx, cursorX - half, cursorY - half, scaled, scaled, 10)
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'
        ctx.lineWidth = 2.5
        ctx.stroke()
        ctx.restore()
      }

      // Cursor dot when not carrying
      if (hand.landmarks && hand.landmarks.length > 0 && carriedSlotRef.current === null) {
        ctx.beginPath()
        ctx.arc(cursorX, cursorY, 6, 0, Math.PI * 2)
        ctx.fillStyle = isPinched ? 'rgba(248, 113, 113, 0.9)' : 'rgba(167, 139, 250, 0.7)'
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [tiles]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 relative z-10">
      {/* Header */}
      <div className="text-center mb-6">
        <Badge className="gap-2 bg-blue-50 border-blue-200 text-blue-700 rounded-full px-4 py-1.5 mb-3 hover:bg-blue-50">
          <Hand className="w-4 h-4 text-blue-500" />
          Solve with Pinch
        </Badge>
        <h2 className="text-4xl font-black text-gray-900">
          Reassemble the
          <span className="text-blue-500"> Puzzle</span>
        </h2>
        <p className="text-gray-500 text-sm mt-1">Pinch a tile to grab it · move your hand · release to drop</p>
      </div>

      {/* Puzzle + hand feed side by side */}
      <div className="flex flex-row items-start gap-4 overflow-x-auto max-w-full">
        {/* Puzzle canvas */}
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-1 bg-blue-500 rounded-3xl blur-sm opacity-40" />
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="relative rounded-2xl block"
          />
        </div>

        {/* Live hand feed */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <Badge className="gap-1.5 bg-gray-100 border-gray-200 text-gray-600 rounded-full px-3 py-1 hover:bg-gray-100">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Hand Tracking
          </Badge>
          <div className="relative">
            <div className="absolute -inset-px bg-blue-500 rounded-2xl opacity-50" />
            <canvas
              ref={handFeedCanvasRef}
              width={640}
              height={CANVAS_SIZE}
              className="relative rounded-2xl block"
            />
          </div>
          <p className="text-gray-400 text-xs text-center">Pinch to grab tiles</p>
        </div>
      </div>
    </div>
  )
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
