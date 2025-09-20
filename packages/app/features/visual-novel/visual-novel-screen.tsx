'use client'

import { YStack, XStack, Text, Button, AnimatePresence, useToastController, Image } from '@my/ui'
import { useState, useEffect, useCallback } from 'react'
import { useColorScheme, BackHandler } from 'react-native'
import { Menu, ArrowLeft } from '@tamagui/lucide-icons'

import { StoryDisplay } from './components/story-display'
import { GameMenu } from './components/game-menu'
import { GameSetup, GameConfig } from './components/game-setup'
import { ThemeToggle } from './components/theme-toggle'
import { useGameEngine } from './hooks/use-game-engine'
import { useStoryGenerator } from './hooks/use-story-generator'
import { GameSession, GameState, StorySegment, VisualNovelSettings, Character } from './types'

type GamePhase = 'setup' | 'playing' | 'loading'

interface VisualNovelScreenProps {
  onExit?: () => void
}

export function VisualNovelScreen({ onExit }: VisualNovelScreenProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup')
  const [currentSegment, setCurrentSegment] = useState<StorySegment | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Use functional hooks instead of classes
  const gameEngine = useGameEngine()
  const storyGenerator = useStoryGenerator()
  const [settings, setSettings] = useState<VisualNovelSettings>({
    textSpeed: 50,
    autoAdvance: false,
    autoAdvanceDelay: 3,
    voiceVolume: 0.7,
    musicVolume: 0.5,
    effectsVolume: 0.8,
    fullscreen: false,
  })

  const colorScheme = useColorScheme()
  const toast = useToastController()

  // Load settings from storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('vn_settings')
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      }
    }
  }, [])

  // Save settings to storage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vn_settings', JSON.stringify(settings))
    }
  }, [settings])

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isMenuOpen) {
        setIsMenuOpen(false)
        return true
      }
      if (gamePhase === 'playing') {
        setIsMenuOpen(true)
        return true
      }
      return false
    })

    return () => backHandler.remove()
  }, [isMenuOpen, gamePhase])

  const createInitialStorySegment = (config: GameConfig): StorySegment => {
    return {
      id: 'intro_segment',
      text: `Welcome to your ${config.genre} adventure! Your story is being generated...`,
      isBreakpoint: false,
      metadata: {
        scene: 'introduction',
        mood: config.tone,
        location: config.setting || 'unknown',
      },
    }
  }

  const createInitialCharacter = (config: GameConfig): Character => {
    return {
      id: 'player_character',
      name: config.playerCharacter || 'The Protagonist',
      description: config.playerCharacter || 'A brave adventurer ready for anything',
      personality: 'determined and curious',
      imagePrompt: `${config.genre} protagonist, ${config.tone} mood, detailed character portrait`,
    }
  }

  const handleStartGame = useCallback(
    async (config: GameConfig) => {
      setIsGenerating(true)
      setGamePhase('loading')

      try {
        // Create initial game session
        const initialSegment = createInitialStorySegment(config)
        const playerCharacter = createInitialCharacter(config)

        const newGameSession: GameSession = {
          id: `game_${Date.now()}`,
          title: config.title || `${config.genre} Adventure`,
          genre: config.genre,
          theme: config.theme,
          characters: [playerCharacter],
          story: [initialSegment],
          gameState: {
            currentSegmentId: initialSegment.id,
            visitedSegments: new Set([initialSegment.id]),
            playerChoices: {},
            characterRelationships: {},
            gameVariables: {
              tone: config.tone,
              setting: config.setting,
              customPrompt: config.customPrompt,
            },
            saveDate: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Generate the first story segment with choices and comprehensive scene image
        const result = await storyGenerator.generateStoryAndImagesInParallel({
          context: {
            gameState: newGameSession.gameState,
            previousSegments: [],
            currentSegment: { metadata: { scene: config.setting || 'starting location' } },
          },
          parameters: {
            genre: config.genre,
            mood: config.tone,
          },
        })

        const firstSegment = result.story
        firstSegment.choices = result.choices
        firstSegment.id = 'first_segment'

        // Set the generated comprehensive scene image
        firstSegment.backgroundImage = result.sceneImage

        // Update the game session
        newGameSession.story = [firstSegment]
        newGameSession.gameState.currentSegmentId = firstSegment.id

        // Set up game engine with the new session
        gameEngine.setGameSession(newGameSession)
        gameEngine.setCallbacks({
          onStateChange: (gameState: GameState) => {
            gameEngine.setGameSession((prev) => (prev ? { ...prev, gameState } : null))
          },
          onSegmentChange: (segment: StorySegment) => {
            setCurrentSegment(segment)
          },
        })

        setCurrentSegment(firstSegment)
        setGamePhase('playing')

        toast.show('Adventure begins!', {
          message: 'Your story has been generated successfully',
          type: 'success',
        })
      } catch (error) {
        console.error('Failed to start game:', error)
        toast.show('Generation Failed', {
          message: 'Failed to generate your story. Please try again.',
          type: 'error',
        })
        setGamePhase('setup')
      } finally {
        setIsGenerating(false)
      }
    },
    [storyGenerator, gameEngine, toast]
  )

  const handleChoiceSelect = useCallback(
    async (choiceId: string) => {
      if (!gameEngine.gameSession || !currentSegment) return

      setIsGenerating(true)

      try {
        // Make the choice (this updates game state)
        gameEngine.makeChoice(choiceId)

        // Get the selected choice text for context
        const selectedChoice = currentSegment.choices?.find((choice) => choice.id === choiceId)
        const choiceText = selectedChoice?.text || ''

        // Generate the next story segment with choices and images in parallel
        const result = await storyGenerator.generateStoryAndImagesInParallel({
          context: {
            currentSegment,
            gameState: gameEngine.gameSession.gameState,
            previousSegments: gameEngine.getPreviousSegments(3),
            playerChoice: choiceText,
          },
          parameters: {
            genre: gameEngine.gameSession.genre,
            mood: currentSegment.metadata?.mood,
          },
        })

        const nextSegment = result.story
        nextSegment.choices = result.choices

        // Set the comprehensive scene image
        nextSegment.backgroundImage = result.sceneImage

        setCurrentSegment(nextSegment)

        // Auto-save progress
        gameEngine.saveGame()
      } catch (error) {
        console.error('Failed to process choice:', error)
        toast.show('Error', {
          message: 'Failed to continue story. Please try again.',
          type: 'error',
        })
      } finally {
        setIsGenerating(false)
      }
    },
    [gameEngine, currentSegment, storyGenerator, toast]
  )

  const handleCustomChoice = useCallback(
    async (customText: string) => {
      if (!gameEngine.gameSession || !currentSegment) return

      setIsGenerating(true)

      try {
        // Generate story based on custom input with images in parallel
        const result = await storyGenerator.generateStoryAndImagesInParallel({
          context: {
            currentSegment,
            gameState: gameEngine.gameSession.gameState,
            previousSegments: gameEngine.getPreviousSegments(3),
            playerInput: customText,
          },
          parameters: {
            genre: gameEngine.gameSession.genre,
            mood: currentSegment.metadata?.mood,
          },
        })

        const nextSegment = result.story
        nextSegment.choices = result.choices

        // Set the comprehensive scene image
        nextSegment.backgroundImage = result.sceneImage

        setCurrentSegment(nextSegment)

        // Update game state
        gameEngine.makeChoice('custom', customText)
      } catch (error) {
        console.error('Failed to process custom choice:', error)
        toast.show('Error', {
          message: 'Failed to process your custom action. Please try again.',
          type: 'error',
        })
      } finally {
        setIsGenerating(false)
      }
    },
    [gameEngine, currentSegment, storyGenerator, toast]
  )

  const handleSaveGame = useCallback(() => {
    if (gameEngine.gameSession) {
      gameEngine.saveGame()
      toast.show('Game Saved', {
        message: 'Your progress has been saved successfully',
        type: 'success',
      })
    }
  }, [gameEngine, toast])

  const handleNewGame = useCallback(() => {
    setGamePhase('setup')
    gameEngine.setGameSession(null)
    setCurrentSegment(null)
    setIsMenuOpen(false)
  }, [gameEngine])

  const handleMainMenu = useCallback(() => {
    setGamePhase('setup')
    gameEngine.setGameSession(null)
    setCurrentSegment(null)
    setIsMenuOpen(false)
  }, [gameEngine])

  return (
    <YStack
      flex={1}
      backgroundColor={colorScheme === 'dark' ? '#0a0a0a' : '$color2'}
      style={{
        ...(colorScheme === 'dark' && {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        }),
      }}
    >
      {/* Header */}
      {gamePhase !== 'setup' && (
        <XStack
          alignItems="center"
          justifyContent="space-between"
          padding="$3"
          backgroundColor={colorScheme === 'dark' ? 'rgba(10, 10, 10, 0.95)' : '$color1'}
          borderBottomWidth={1}
          borderBottomColor={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '$color6'}
          {...(colorScheme === 'dark' && {
            style: {
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
            },
          })}
        >
          <Button
            size="$3"
            chromeless
            icon={ArrowLeft}
            onPress={onExit || handleMainMenu}
            hoverStyle={{ backgroundColor: '$color4' }}
          >
            Back
          </Button>

          {gameEngine.gameSession && (
            <Text fontSize="$4" fontWeight="500" color="$color11" flex={1} textAlign="center">
              {gameEngine.gameSession.title}
            </Text>
          )}

          <XStack gap="$2" alignItems="center">
            <ThemeToggle size="$3" variant="minimal" />
            <Button
              size="$3"
              chromeless
              icon={Menu}
              onPress={() => setIsMenuOpen(true)}
              hoverStyle={{ backgroundColor: '$color4' }}
            />
          </XStack>
        </XStack>
      )}

      {/* Full Screen Background Image */}
      {currentSegment?.backgroundImage && (
        <Image
          source={{ uri: currentSegment.backgroundImage }}
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          width="100%"
          height="100%"
          zIndex={-2}
          opacity={colorScheme === 'dark' ? 0.7 : 0.9}
          objectFit="cover"
        />
      )}

      {/* Main Content */}
      <YStack flex={1}>
        <AnimatePresence>
          {gamePhase === 'setup' && (
            <GameSetup key="setup" onStartGame={handleStartGame} isGenerating={isGenerating} />
          )}

          {gamePhase === 'loading' && (
            <YStack
              key="loading"
              flex={1}
              alignItems="center"
              justifyContent="center"
              gap="$4"
              animation="bouncy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            >
              <Text fontSize="$6" color="$color11" textAlign="center">
                ✨ Creating your adventure...
              </Text>
              <Text fontSize="$4" color="$color9" textAlign="center">
                Generating story, characters, and images
              </Text>
            </YStack>
          )}

          {gamePhase === 'playing' && currentSegment && (
            <StoryDisplay
              key="playing"
              segment={currentSegment}
              onChoiceSelect={handleChoiceSelect}
              onCustomChoice={handleCustomChoice}
              isGenerating={isGenerating}
              autoAdvance={settings.autoAdvance}
              textSpeed={settings.textSpeed}
            />
          )}
        </AnimatePresence>
      </YStack>

      {/* Game Menu */}
      <GameMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        gameSession={gameEngine.gameSession || undefined}
        onSaveGame={handleSaveGame}
        onLoadGame={() => {
          /* TODO: Implement load game */
        }}
        onNewGame={handleNewGame}
        onMainMenu={handleMainMenu}
      />
    </YStack>
  )
}
