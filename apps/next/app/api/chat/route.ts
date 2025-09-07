import { openai } from '@ai-sdk/openai'
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

// export const config = {
//   runtime: 'edge', // this must be set to `edge`
//   // execute this function on iad1 or hnd1, based on the connecting client location
//   regions: ['iad1', 'lhr1'],
//   maxDuration: 780,
// }

// export const maxDuration = 780

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

export async function POST(req: Request) {
  const { messages, model = 'openai/gpt-4o' } = await req.json()

  // console.log('model', model)

  // console.log('messages', JSON.stringify(messages, null, 2))

  const result = streamText({
    model: openrouter('anthropic/claude-sonnet-4'),
    // model: openrouter('moonshotai/kimi-k2-0905'),
    // model: anthropic('claude-4-sonnet-20250514'),
    tools: {
      createFile: createFileTool,
    },
    stopWhen: stepCountIs(1000),
    maxOutputTokens: 10000,
    // Custom condition based on step content
    // stopWhen: ({ steps }) => {
    //   const lastStep = steps[steps.length - 1]
    //   console.log('lastStep', lastStep)
    //   // Custom logic - only triggers if last step has tool results
    //   return lastStep?.text?.includes('COMPLETE')
    // },
    messages: convertToModelMessages(messages),
    // experimental_transform: smoothStream(),
  })

  return result.toUIMessageStreamResponse()
}
