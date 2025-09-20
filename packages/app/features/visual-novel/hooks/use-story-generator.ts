import { useCallback } from 'react'
import { StorySegment, Choice, Character, AIGenerationRequest } from '../types'

interface GenerateStoryAndChoicesParams {
  context: any
  parameters?: any
}

interface GenerateImageParams {
  prompt: string
  style?: string
  character?: Character
  scene?: string
}

interface GenerateInParallelParams {
  context: any
  parameters?: any
}

export function useStoryGenerator() {
  const generateStoryWithChoices = useCallback(
    async ({
      context,
      parameters = {},
    }: GenerateStoryAndChoicesParams): Promise<{
      story: StorySegment
      choices: Choice[]
      imagePrompt?: string
    }> => {
      try {
        const response = await fetch('/api/story', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context,
            parameters,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Parse the structured response
        const storySegment: StorySegment = {
          id: `generated_${Date.now()}`,
          text: data.story.text,
          characterName: data.story.characterName,
          isBreakpoint: data.story.isBreakpoint !== false,
          metadata: {
            scene: data.story.scene,
            mood: data.story.mood,
          },
        }

        const choices: Choice[] = data.choices.map((choice: any, index: number) => ({
          id: `choice_${Date.now()}_${index}`,
          text: choice.text,
          nextSegmentId: `next_${Date.now()}_${index}`,
        }))

        return { story: storySegment, choices, imagePrompt: data.imagePrompt }
      } catch (error) {
        console.error('Failed to generate story with choices:', error)
        return {
          story: createFallbackSegment(),
          choices: createFallbackChoices(),
        }
      }
    },
    []
  )

  const generateImage = useCallback(
    async ({ prompt, style = 'anime', character, scene }: GenerateImageParams): Promise<string> => {
      const enhancedPrompt = buildImagePrompt({ prompt, style, character, scene })

      try {
        const response = await fetch('/api/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            parameters: { style },
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data.imageUrl || getFallbackImage()
      } catch (error) {
        console.error('Failed to generate image:', error)
        return getFallbackImage()
      }
    },
    []
  )

  const generateStoryThenImage = useCallback(
    async ({
      context,
      parameters = {},
    }: Omit<GenerateInParallelParams, 'backgroundPrompt' | 'characterPrompt'>): Promise<{
      story: StorySegment
      choices: Choice[]
      sceneImage: string
    }> => {
      try {
        console.log(
          '🎨 Starting sequential generation: story first, then comprehensive scene image'
        )

        // Step 1: Generate story with choices and scene description
        const storyResult = await generateStoryWithChoices({ context, parameters })
        const { story, choices } = storyResult

        console.log('📖 Story generated, now generating comprehensive scene image...')

        // Step 2: Generate a single comprehensive scene image that includes all characters and environment
        const aiImagePrompt = (storyResult as any).imagePrompt
        let scenePrompt: string

        if (aiImagePrompt) {
          // Enhance the AI-generated prompt to ensure it includes characters in the scene
          scenePrompt = `${aiImagePrompt}, showing all characters present in the scene, complete visual novel illustration with characters and environment together`
          console.log('🖼️ Generating scene with AI-generated prompt:', scenePrompt)
        } else {
          // Fallback to comprehensive scene-based prompt
          const characterContext = story.characterName ? `, featuring ${story.characterName}` : ''
          scenePrompt = `${parameters?.genre || 'fantasy'} scene: ${story.metadata?.scene || 'mysterious location'}, ${story.metadata?.mood || 'neutral'} mood${characterContext}, complete visual novel illustration showing all characters and environment in one cohesive image`
          console.log('🖼️ Using fallback comprehensive scene prompt:', scenePrompt)
        }

        const sceneImage = await generateImage({
          prompt: scenePrompt,
          style: 'anime',
          scene: story.metadata?.scene,
        })

        return {
          story,
          choices,
          sceneImage,
        }
      } catch (error) {
        console.error('Failed to generate story and scene image:', error)
        return {
          story: createFallbackSegment(),
          choices: createFallbackChoices(),
          sceneImage: getFallbackImage(),
        }
      }
    },
    [generateStoryWithChoices, generateImage]
  )

  return {
    generateStoryWithChoices,
    generateImage,
    generateStoryAndImagesInParallel: generateStoryThenImage,
  }
}

// Helper functions
function buildImagePrompt({
  prompt,
  style,
  character,
  scene,
}: {
  prompt: string
  style: string
  character?: Character
  scene?: string
}): string {
  let enhancedPrompt = prompt

  if (character) {
    enhancedPrompt += `, featuring ${character.name}: ${character.description}, ${character.personality}`
  }

  if (scene) {
    enhancedPrompt += `, scene: ${scene}`
  }

  // Enhanced visual novel specific styling
  enhancedPrompt += `, ${style} art style, visual novel illustration, anime style, high quality, detailed, professional digital artwork, vibrant colors, clean lines, beautiful lighting, masterpiece`

  return enhancedPrompt
}

function createFallbackSegment(): StorySegment {
  const segmentId = `fallback_${Date.now()}`

  return {
    id: segmentId,
    text: 'The adventure continues, though the path ahead remains uncertain...',
    isBreakpoint: true,
    choices: createFallbackChoices(),
    metadata: {
      scene: 'unknown',
      mood: 'mysterious',
    },
  }
}

function createFallbackChoices(): Choice[] {
  const baseId = `fallback_${Date.now()}`

  return [
    {
      id: `${baseId}_1`,
      text: 'Move forward carefully',
      nextSegmentId: `${baseId}_forward`,
    },
    {
      id: `${baseId}_2`,
      text: 'Look around for clues',
      nextSegmentId: `${baseId}_explore`,
    },
    {
      id: `${baseId}_3`,
      text: 'Call out for help',
      nextSegmentId: `${baseId}_call`,
    },
    {
      id: `${baseId}_4`,
      text: 'Wait and observe',
      nextSegmentId: `${baseId}_wait`,
    },
  ]
}

function getFallbackImage(): string {
  // Return a placeholder image URL or base64 encoded placeholder
  return 'https://via.placeholder.com/800x600/4f46e5/ffffff?text=Visual+Novel+Scene'
}
