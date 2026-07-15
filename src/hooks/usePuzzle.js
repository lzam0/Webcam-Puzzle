import { useState } from 'react'

export function usePuzzle() {
  const [tiles, setTiles] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8])

  const isSolved = () => {
    return tiles.every((v, i) => v === i)
  }

  const scramble = () => {
    // Fisher-Yates shuffle until not solved
    let shuffled = [...tiles]
    do {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
    } while (shuffled.every((v, i) => v === i))
    setTiles(shuffled)
  }

  const swapTiles = (slotA, slotB) => {
    setTiles(prev => {
      const newTiles = [...prev]
      ;[newTiles[slotA], newTiles[slotB]] = [newTiles[slotB], newTiles[slotA]]
      return newTiles
    })
  }

  const reset = () => {
    setTiles([0, 1, 2, 3, 4, 5, 6, 7, 8])
  }

  return { tiles, scramble, swapTiles, isSolved, reset }
}
