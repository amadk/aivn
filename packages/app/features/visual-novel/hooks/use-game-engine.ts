import { useState, useCallback } from 'react'
import { StorySegment, Choice, GameState, GameSession } from '../types'

interface GameEngineCallbacks {
  onStateChange?: (gameState: GameState) => void
  onSegmentChange?: (segment: StorySegment) => void
}

export function useGameEngine(initialGameSession?: GameSession) {
  const [gameSession, setGameSession] = useState<GameSession | null>(initialGameSession || null)
  const [callbacks, setCallbacks] = useState<GameEngineCallbacks>({})

  const setGameEngineCallbacks = useCallback((newCallbacks: GameEngineCallbacks) => {
    setCallbacks(newCallbacks)
  }, [])

  const getCurrentSegment = useCallback((): StorySegment | null => {
    if (!gameSession) return null

    return (
      gameSession.story.find((segment) => segment.id === gameSession.gameState.currentSegmentId) ||
      null
    )
  }, [gameSession])

  const makeChoice = useCallback(
    (choiceId: string, customInput?: string): void => {
      if (!gameSession) return

      const currentSegment = getCurrentSegment()
      if (!currentSegment) return

      let nextSegmentId: string | null = null

      if (customInput) {
        // Handle custom player input
        nextSegmentId = `custom_${Date.now()}`
      } else {
        // Find the selected choice
        const selectedChoice = currentSegment.choices?.find((choice) => choice.id === choiceId)
        if (!selectedChoice) return
        nextSegmentId = selectedChoice.nextSegmentId
      }

      // Update game state
      updateGameState(currentSegment.id, choiceId, nextSegmentId)
    },
    [gameSession, getCurrentSegment]
  )

  const updateGameState = useCallback(
    (segmentId: string, choiceId: string, nextSegmentId: string): void => {
      if (!gameSession) return

      const updatedGameSession = {
        ...gameSession,
        gameState: {
          ...gameSession.gameState,
          playerChoices: {
            ...gameSession.gameState.playerChoices,
            [segmentId]: choiceId,
          },
          visitedSegments: new Set([...gameSession.gameState.visitedSegments, segmentId]),
          currentSegmentId: nextSegmentId,
        },
        updatedAt: new Date(),
      }

      setGameSession(updatedGameSession)

      // Trigger callbacks
      callbacks.onStateChange?.(updatedGameSession.gameState)

      const nextSegment = updatedGameSession.story.find((segment) => segment.id === nextSegmentId)
      if (nextSegment) {
        callbacks.onSegmentChange?.(nextSegment)
      }
    },
    [gameSession, callbacks]
  )

  const getPreviousSegments = useCallback(
    (count: number): StorySegment[] => {
      if (!gameSession) return []

      const visitedIds = Array.from(gameSession.gameState.visitedSegments)
      const recentIds = visitedIds.slice(-count)

      return recentIds
        .map((id) => gameSession.story.find((segment) => segment.id === id))
        .filter(Boolean) as StorySegment[]
    },
    [gameSession]
  )

  const saveGame = useCallback((): void => {
    if (!gameSession) return

    const saveData = {
      gameSession,
      timestamp: new Date().toISOString(),
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(`vn_save_${gameSession.id}`, JSON.stringify(saveData))
    }
  }, [gameSession])

  const getGameProgress = useCallback((): {
    completed: number
    total: number
    percentage: number
  } => {
    if (!gameSession) return { completed: 0, total: 0, percentage: 0 }

    const totalSegments = gameSession.story.length
    const visitedSegments = gameSession.gameState.visitedSegments.size

    return {
      completed: visitedSegments,
      total: totalSegments,
      percentage: totalSegments > 0 ? (visitedSegments / totalSegments) * 100 : 0,
    }
  }, [gameSession])

  return {
    gameSession,
    setGameSession,
    getCurrentSegment,
    makeChoice,
    getPreviousSegments,
    saveGame,
    getGameProgress,
    setCallbacks: setGameEngineCallbacks,
  }
}

// Utility function to load game from storage
export function loadGameFromStorage(sessionId: string): GameSession | null {
  if (typeof window === 'undefined') return null

  const saveData = localStorage.getItem(`vn_save_${sessionId}`)
  if (!saveData) return null

  try {
    const parsed = JSON.parse(saveData)
    return parsed.gameSession
  } catch (error) {
    console.error('Failed to load game:', error)
    return null
  }
}
