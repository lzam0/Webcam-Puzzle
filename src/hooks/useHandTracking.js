import { useEffect, useRef } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const PINCH_ON = 0.030
const PINCH_OFF = 0.048
const MISS_GRACE = 8
const RELEASE_FRAMES = 4
const SENSITIVITY = 1.8
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export function useHandTracking(videoRef) {
  const handStateRef = useRef({
    isPinched: false,
    cursorNormX: 0,
    cursorNormY: 0,
    landmarks: [],
  })

  const handLandmarkerRef = useRef(null)
  const animationFrameRef = useRef(null)
  const missCountRef = useRef(0)
  const releaseCountRef = useRef(0)

  useEffect(() => {
    let isMounted = true

    async function initializeHandTracking() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          },
          numHands: 1,
          runningMode: 'VIDEO',
        })

        if (isMounted) {
          handLandmarkerRef.current = handLandmarker
          startTracking()
        }
      } catch (error) {
        console.error('Failed to initialize hand tracking:', error)
      }
    }

    function startTracking() {
      function detectHands() {
        if (
          !videoRef.current ||
          !handLandmarkerRef.current ||
          videoRef.current.readyState !== 4
        ) {
          animationFrameRef.current = requestAnimationFrame(detectHands)
          return
        }

        const results = handLandmarkerRef.current.detectForVideo(
          videoRef.current,
          performance.now()
        )

        if (results.landmarks && results.landmarks.length > 0) {
          missCountRef.current = 0

          const landmarks = results.landmarks[0]
          const thumbTip = landmarks[4]
          const indexTip = landmarks[8]

          const dx = thumbTip.x - indexTip.x
          const dy = thumbTip.y - indexTip.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          const prev = handStateRef.current.isPinched
          const isPinched = distance < PINCH_ON ? true
                          : distance > PINCH_OFF ? false
                          : prev

          const cursorNormX = clamp(((1 - indexTip.x) - 0.5) * SENSITIVITY + 0.5, 0, 1)
          const cursorNormY = clamp((indexTip.y - 0.5) * SENSITIVITY + 0.5, 0, 1)

          if (isPinched) {
            releaseCountRef.current = 0
            handStateRef.current = { isPinched: true, cursorNormX, cursorNormY, landmarks }
          } else {
            releaseCountRef.current++
            if (releaseCountRef.current >= RELEASE_FRAMES) {
              handStateRef.current = { isPinched: false, cursorNormX, cursorNormY, landmarks }
            } else {
              handStateRef.current = { isPinched: prev, cursorNormX, cursorNormY, landmarks }
            }
          }
        } else {
          missCountRef.current++
          if (missCountRef.current >= MISS_GRACE) {
            missCountRef.current = MISS_GRACE
            releaseCountRef.current = 0
            handStateRef.current = { isPinched: false, cursorNormX: 0, cursorNormY: 0, landmarks: [] }
          }
        }

        animationFrameRef.current = requestAnimationFrame(detectHands)
      }

      animationFrameRef.current = requestAnimationFrame(detectHands)
    }

    initializeHandTracking()

    return () => {
      isMounted = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [videoRef])

  return handStateRef
}
