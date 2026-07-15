import { useState, useRef, useEffect } from 'react'
import { WebcamCapture } from './components/WebcamCapture'
import { PuzzleBoard } from './components/PuzzleBoard'
import { SuccessScreen } from './components/SuccessScreen'
import { useHandTracking } from './hooks/useHandTracking'
import { Alert, AlertDescription } from '@/components/ui/alert'

function App() {
  const [phase, setPhase] = useState('capture')
  const [capturedImage, setCapturedImage] = useState(null)
  const [camError, setCamError] = useState(null)
  const videoRef = useRef(null)
  const handStateRef = useHandTracking(videoRef)

  // Start webcam once — keep stream alive across all phases
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setCamError('Camera access denied. Please allow camera and refresh.'))

    return () => {
      const v = videoRef.current
      if (v && v.srcObject) v.srcObject.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleCapture = dataUrl => {
    setCapturedImage(dataUrl)
    setPhase('puzzle')
  }

  const handleReset = () => {
    setCapturedImage(null)
    setPhase('capture')
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">

      {/* Video always in DOM — stream never stops */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute opacity-0 pointer-events-none w-px h-px"
      />

      {camError && (
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant="destructive" className="max-w-sm bg-red-900/60 border-red-400 text-red-200 text-center">
            <AlertDescription>
              <div className="text-4xl mb-3">📵</div>
              <p className="font-semibold">{camError}</p>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {!camError && phase === 'capture' && (
        <WebcamCapture videoRef={videoRef} onCapture={handleCapture} />
      )}

      {!camError && phase === 'puzzle' && (
        <PuzzleBoard
          image={capturedImage}
          onSolved={() => setPhase('success')}
          handStateRef={handStateRef}
          videoRef={videoRef}
        />
      )}

      {phase === 'success' && <SuccessScreen onReset={handleReset} />}
    </div>
  )
}

export default App
