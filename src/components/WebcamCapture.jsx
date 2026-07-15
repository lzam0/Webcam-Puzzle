import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import robotImg from '../public/robot.webp'

export function WebcamCapture({ videoRef, onCapture }) {
  const canvasRef = useRef(null)
  const displayCanvasRef = useRef(null)
  const [checked, setChecked] = useState(false)
  const [ready, setReady] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!checked) return
    const canvas = displayCanvasRef.current
    if (!canvas) return
    let rafId

    const draw = () => {
      const video = videoRef.current
      if (video && video.readyState >= 2) {
        if (!ready) setReady(true)
        const ctx = canvas.getContext('2d')
        const vw = video.videoWidth
        const vh = video.videoHeight
        const size = Math.min(vw, vh)
        const sx = (vw - size) / 2
        const sy = (vh - size) / 2
        ctx.save()
        ctx.scale(-1, 1)
        ctx.translate(-canvas.width, 0)
        ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height)
        ctx.restore()
      }
      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [checked, videoRef, ready])

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const vw = video.videoWidth
    const vh = video.videoHeight
    const size = Math.min(vw, vh)
    canvas.width = size
    canvas.height = size
    const sx = (vw - size) / 2
    const sy = (vh - size) / 2
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-canvas.width, 0)
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)
    ctx.restore()

    setFlash(true)
    setTimeout(() => {
      setFlash(false)
      onCapture(canvas.toDataURL('image/png'))
    }, 250)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 relative z-10">

      {/* Robot + headline */}
      {!checked && (
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="relative">
            <div className="absolute -inset-3 bg-blue-500 rounded-full blur-xl opacity-30" />
            <img
              src={robotImg}
              alt="Robot"
              className="relative object-contain drop-shadow-2xl"
              style={{ width: '12rem', height: '12rem' }}
            />
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
              I'm not a robot
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-xs">
              Take a selfie · solve the pinch puzzle · prove it
            </p>
          </div>
        </div>
      )}

      {/* Checkbox — shown until ticked */}
      {!checked && (
        <div className="flex items-center gap-4 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-2xl px-6 py-4 transition-all duration-200">
          <Checkbox
            id="not-robot"
            onCheckedChange={(val) => { if (val) setChecked(true) }}
            className="w-6 h-6 border-gray-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-0"
          />
          <Label htmlFor="not-robot" className="text-gray-900 font-semibold text-lg cursor-pointer">
            I&apos;m not a robot
          </Label>
        </div>
      )}

      {/* Camera card — revealed after checkbox */}
      {checked && (
        <>
          <div className="relative">
            <div className="absolute -inset-1 bg-blue-500 rounded-3xl blur-sm opacity-50" />
            <div className="relative bg-gray-950 rounded-3xl overflow-hidden shadow-2xl" style={{ width: '24rem', height: '24rem' }}>
              <canvas
                ref={displayCanvasRef}
                width={384}
                height={384}
                className="w-full h-full object-cover"
              />

              {!ready && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 gap-3">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/50 text-sm font-medium">Starting camera...</p>
                </div>
              )}

              {ready && (
                <>
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br" />
                </>
              )}

              {flash && (
                <div className="absolute inset-0 bg-white animate-ping" style={{ animationDuration: '0.15s', animationIterationCount: 1 }} />
              )}
            </div>
          </div>

          {/* Confirmed checkbox row */}
          <div className="mt-5 flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
            <Checkbox
              id="not-robot-confirmed"
              checked
              disabled
              className="w-6 h-6 border-0 bg-blue-500 data-[state=checked]:bg-blue-500 data-[disabled]:opacity-100"
            />
            <Label htmlFor="not-robot-confirmed" className="text-gray-900 font-semibold text-lg">
              I&apos;m not a robot
            </Label>
          </div>

          {/* Capture button */}
          <div className="mt-5 flex flex-col items-center gap-3">
            <Button
              onClick={handleCapture}
              disabled={!ready}
              size="lg"
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg px-10"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </Button>
            <p className="text-gray-400 text-sm">Make sure your face is centered</p>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
