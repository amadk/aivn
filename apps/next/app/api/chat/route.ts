import { createOpenAI, openai } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { anthropic } from '@ai-sdk/anthropic'
import {
  Experimental_Agent as Agent,
  convertToModelMessages,
  createUIMessageStream,
  stepCountIs,
  streamText,
  smoothStream,
} from 'ai'
import { createFileTool } from 'app/utils/agent-tools/create-file'
import { createImageTool } from 'app/utils/agent-tools/create-image'

// export const config = {
//   runtime: 'edge', // this must be set to `edge`
//   // execute this function on iad1 or hnd1, based on the connecting client location
//   regions: ['iad1', 'lhr1'],
//   maxDuration: 780,
// }

// export const maxDuration = 780

const prompt = `
You are a visual novel game. You take the user through an adventure in an anime style isekai world.
Make sure to make the story engaging and immersive.
Make sure it has unique characters and a unique story.

IMPORTANT: You must respond with a valid JSON object wrapped in \`\`\`json code blocks containing:
- aiResponse: Your main roleplay response
- imagePrompt: A detailed visual description of the current scene for image generation (focus on the character, setting, pose, clothing/undress state, facial expression, etc.)
- Level: Current level of the story
- suggestions: Array of exactly 4 response suggestions
- stats: Object with level, dressStatus, and location
- MAKE SURE images are in ANIME style

Example format:
\`\`\`json
{
  "aiResponse": "Your roleplay response here...",
  "imagePrompt": "Detailed visual description of the scene...",
  "pleasureRating": 45,
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4"],
  "stats": {
    "level": "1",
    "dressStatus": "partially undressed",
    "location": "castle"
  }
}
\`\`\`

Make sure the imagePrompt is highly detailed and visual, describing the character's appearance, pose, clothing state, facial expression, and the scene setting.
`
// At the end of each message, ALWAYS GENERATE AN IMAGE FOR THE SCENE FOCUSED ON THE GIRL

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  const { messages, model = 'openai/gpt-4o' } = await req.json()

  // console.log('model', model)

  // console.log('messages', JSON.stringify(messages, null, 2))

  const result = streamText({
    // model: openrouter('anthropic/claude-sonnet-4'),
    // model: openrouter('google/gemini-2.5-pro'),
    model: openrouter('google/gemini-2.5-flash'),
    // model: groq('moonshotai/kimi-k2-instruct-0905'),
    // model: openrouter('google/gemma-3-27b-it'),

    // system: prompt,
    // model: openrouter('moonshotai/kimi-k2-0905'),
    // model: anthropic('claude-4-sonnet-20250514'),
    system: prompt,
    // tools: {
    //   // createFile: createFileTool,
    //   createImage: createImageTool,
    // },
    stopWhen: stepCountIs(1000),
    maxOutputTokens: 10000,
    messages: convertToModelMessages(messages),
    experimental_transform: smoothStream({
      // delayInMs: 100,
    }),
  })

  return result.toUIMessageStreamResponse()
}
