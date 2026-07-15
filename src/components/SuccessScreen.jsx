import { useEffect, useRef } from 'react'
import { Check, Grid2x2, Hand, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const COLORS = ['#a855f7', '#ec4899', '#f97316', '#3b82f6', '#22c55e', '#eab308']

export function SuccessScreen({ onReset }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      spin: Math.random() * Math.PI * 2,
      spinV: (Math.random() - 0.5) * 0.2,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }))

    let rafId
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.spin += p.spinV
        if (p.y > canvas.height) {
          p.y = -p.size
          p.x = Math.random() * canvas.width
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.spin)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.85
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })
      rafId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Confetti */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Checkmark */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-40 scale-125" />
          <div className="relative w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-2xl">
            <Check className="w-16 h-16 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-6xl sm:text-7xl font-black mb-3 leading-tight">
          <span className="text-blue-500">
            You&apos;re Human!
          </span>
        </h1>
        <p className="text-gray-600 text-lg font-normal mb-2">Puzzle solved with pinch gestures</p>
        <p className="text-gray-400 text-sm mb-12">Identity verified — not a robot</p>

        {/* Stats card */}
        <Card className="bg-gray-50 border-gray-200 mb-10">
          <CardContent className="flex items-center gap-6 text-center px-8 py-6">
            <div className="flex flex-col items-center gap-1.5">
              <Check className="w-7 h-7 text-green-500" />
              <p className="text-gray-500 text-xs font-medium">Verified</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex flex-col items-center gap-1.5">
              <Grid2x2 className="w-7 h-7 text-blue-500" />
              <p className="text-gray-500 text-xs font-medium">9 Tiles</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex flex-col items-center gap-1.5">
              <Hand className="w-7 h-7 text-blue-500" />
              <p className="text-gray-500 text-xs font-medium">Pinch Gestures</p>
            </div>
          </CardContent>
        </Card>

        {/* Try again */}
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="group border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold rounded-2xl"
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Try Again
        </Button>
      </div>
    </div>
  )
}
