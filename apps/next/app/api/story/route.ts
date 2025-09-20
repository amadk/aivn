import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@ai-sdk/anthropic'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateObject } from 'ai'
import { z } from 'zod'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const StorySegmentSchema = z.object({
  text: z.string().min(1).max(1000),
  characterName: z.string().optional(),
  scene: z.string().optional(),
  mood: z.string().optional(),
  isBreakpoint: z.boolean().default(true),
})

const ChoicesSchema = z.object({
  choices: z
    .array(
      z.object({
        text: z.string().min(1).max(100),
      })
    )
    .length(4),
})

const StoryWithChoicesSchema = z.object({
  story: StorySegmentSchema,
  choices: z
    .array(
      z.object({
        text: z.string().min(1).max(100),
      })
    )
    .length(4),
  imagePrompt: z.string().min(1).max(500),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context, parameters } = body

    if (!context) {
      return NextResponse.json({ error: 'Missing required field: context' }, { status: 400 })
    }

    // Build the story prompt
    const prompt = buildStoryPrompt(context, parameters)

    // Generate story segment with choices using structured output
    const result = await generateObject({
      // model: anthropic('claude-3-5-sonnet-20241022'),
      model: openrouter('moonshotai/kimi-k2-0905'),
      schema: StoryWithChoicesSchema,
      prompt: prompt,
      temperature: 0.8,
    })

    return NextResponse.json({
      story: result.object.story,
      choices: result.object.choices,
      imagePrompt: result.object.imagePrompt,
    })
  } catch (error) {
    console.error('Story generation error:', error)
    return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 })
  }
}

function buildStoryPrompt(context: any, parameters: any = {}): string {
  const { currentSegment, gameState, previousSegments, playerInput, playerChoice } = context
  const { genre = 'fantasy', mood = 'neutral' } = parameters

  let prompt = `You are writing an interactive visual novel in the ${genre} genre with a ${mood} mood.

Current story context:
${
  previousSegments
    ?.map(
      (seg: any, i: number) =>
        `${i + 1}. ${seg.characterName ? seg.characterName + ': ' : ''}${seg.text}`
    )
    .join('\n') || 'Beginning of story'
}

Current situation: ${currentSegment?.text || 'Starting the adventure'}

${playerInput ? `Player's custom action: "${playerInput}"` : ''}
${playerChoice ? `Player chose: "${playerChoice}"` : ''}

Generate the next story segment that:
1. Continues naturally from the current situation
2. Is engaging and immersive (2-4 sentences)
3. Ends at a decision point where the player must make a choice
4. Maintains consistency with previous events
5. Includes appropriate character dialogue if relevant

Also generate exactly 4 meaningful choices that:
1. Offer different approaches (brave, cautious, clever, diplomatic)
2. Lead to different story branches
3. Are all viable options (no obviously wrong choices)
4. Are 3-8 words each
5. Reflect the player's agency in the story

Finally, generate a detailed image prompt for a comprehensive scene illustration that:
1. Shows ALL characters present in the scene (not just backgrounds)
2. Includes their positioning, expressions, and interactions
3. Describes the complete visual setting and atmosphere
4. Captures the mood and genre with environmental details
5. Creates one cohesive visual novel scene with characters and environment together
6. Avoids separating characters from the background - they should be integrated

Format your response as:
{
  "story": {
    "text": "The story text here...",
    "characterName": "Character Name (if applicable)",
    "scene": "Brief scene description",
    "mood": "current mood/tone",
    "isBreakpoint": true
  },
  "choices": [
    {"text": "Choice 1 text"},
    {"text": "Choice 2 text"},  
    {"text": "Choice 3 text"},
    {"text": "Choice 4 text"}
  ],
  "imagePrompt": "Detailed visual description for the complete scene showing all characters and environment together..."
}`

  return prompt
}
