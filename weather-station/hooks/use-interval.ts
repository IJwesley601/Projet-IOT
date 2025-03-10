import { useEffect, useRef } from "react"

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>()

  // Enregistrer la fonction de rappel
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Configurer l'intervalle
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current()
      }
    }

    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id) // Nettoyer l'intervalle
    }
  }, [delay])
}