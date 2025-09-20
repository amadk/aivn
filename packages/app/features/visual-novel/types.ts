export interface StorySegment {
  id: string
  text: string
  characterName?: string
  characterImage?: string
  backgroundImage?: string
  isBreakpoint: boolean
  choices?: Choice[]
  nextSegmentId?: string
  metadata?: {
    scene?: string
    mood?: string
    location?: string
  }
}

export interface Choice {
  id: string
  text: string
  nextSegmentId: string
  weight?: number // For AI generation preference
}

export interface GameState {
  currentSegmentId: string
  visitedSegments: Set<string>
  playerChoices: Record<string, string>
  characterRelationships?: Record<string, number>
  gameVariables?: Record<string, any>
  saveDate: Date
}

export interface Character {
  id: string
  name: string
  description: string
  personality: string
  imagePrompt: string
  currentImage?: string
}

export interface GameSession {
  id: string
  title: string
  genre: string
  theme: string
  characters: Character[]
  story: StorySegment[]
  gameState: GameState
  createdAt: Date
  updatedAt: Date
}

export interface AIGenerationRequest {
  type: 'story' | 'image' | 'choices'
  context: {
    currentSegment?: StorySegment
    gameState: GameState
    previousSegments: StorySegment[]
    playerInput?: string
  }
  parameters?: {
    genre?: string
    mood?: string
    characterCount?: number
    imageStyle?: string
  }
}

export interface VisualNovelSettings {
  textSpeed: number
  autoAdvance: boolean
  autoAdvanceDelay: number
  voiceVolume: number
  musicVolume: number
  effectsVolume: number
  fullscreen: boolean
}
