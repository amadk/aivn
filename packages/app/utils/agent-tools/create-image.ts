import { z } from 'zod'
import { experimental_generateImage as generateImage } from 'ai'
import { createReplicate } from '@ai-sdk/replicate'
import { createClient } from '@supabase/supabase-js'

// Create a server-side Supabase client with service key for storage operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const replicateProvider = createReplicate({
  apiToken: process.env.REPLICATE_API_KEY,
})

export const createImageTool = {
  description: "Generates an AI image based on a text prompt using Replicate's Flux 1.1 Pro model",
  inputSchema: z.object({
    prompt: z.string().describe('The text prompt describing the image to generate'),
    aspectRatio: z
      .string()
      .optional()
      .default('1:1')
      .describe('The aspect ratio of the image (e.g., 1:1, 16:9, 9:16, 3:4, 4:3)'),
    outputFormat: z.string().optional().default('jpg').describe('The output format (jpg, png)'),
    outputQuality: z.number().optional().default(80).describe('The output quality (1-100)'),
    parameters: z
      .object({
        genre: z.string().optional().describe('Genre context for enhanced prompting'),
        mood: z.string().optional().describe('Mood or atmosphere for the image'),
        character: z.string().optional().describe('Character description if applicable'),
        scene: z.string().optional().describe('Scene description for context'),
      })
      .optional()
      .describe('Additional parameters for enhanced image generation'),
  }),
  execute: async ({ prompt, aspectRatio, outputFormat, outputQuality, parameters }) => {
    try {
      // Enhance prompt with additional context if parameters provided
      let enhancedPrompt = prompt
      if (parameters) {
        const contextParts: string[] = []
        if (parameters.genre) contextParts.push(`${parameters.genre} genre`)
        if (parameters.mood) contextParts.push(`${parameters.mood} mood`)
        if (parameters.character) contextParts.push(`featuring ${parameters.character}`)
        if (parameters.scene) contextParts.push(`in ${parameters.scene}`)

        if (contextParts.length > 0) {
          enhancedPrompt = `${prompt}, ${contextParts.join(', ')}, anime art style, high quality, detailed, professional digital artwork, vibrant colors, clean lines`
        }
      }

      console.log('Generating image with Flux 1.1 Pro, prompt:', enhancedPrompt)

      // Use AI SDK's generateImage with official Replicate provider
      const { image } = await generateImage({
        model: replicateProvider.image('black-forest-labs/flux-1.1-pro'),
        prompt: enhancedPrompt,
        // Note: Replicate provider may not support all parameters directly in generateImage
        // These parameters would be passed through the model configuration
        providerOptions: {
          replicate: {
            style: 'anime',
            safety_tolerance: 6,
          },
        },
      })

      // console.log('image', image)

      console.log('Generated image successfully with Flux 1.1 Pro')

      // Upload image to Supabase storage
      const fileName = `generated-images/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${outputFormat}`

      console.log('Preparing to upload image:', {
        fileName,
        bufferSize: image.uint8Array.length,
        contentType: `image/${outputFormat}`,
      })

      // Convert Uint8Array to Buffer for Supabase upload
      const imageBuffer = Buffer.from(image.uint8Array)

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(fileName, imageBuffer, {
          contentType: `image/${outputFormat}`,
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Supabase upload error:', {
          error: uploadError,
          fileName,
          bucketName: 'files',
          hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
        })
        throw new Error(`Failed to upload image to storage: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage.from('files').getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      console.log('Image uploaded to Supabase:', publicUrl)

      return {
        success: true,
        url: publicUrl,
        fileName,
        service: 'replicate',
        model: 'flux-1.1-pro',
        prompt: enhancedPrompt,
        originalPrompt: prompt,
        metadata: {
          aspectRatio,
          outputFormat,
          outputQuality,
          parameters,
        },
      }
    } catch (error) {
      console.error('Image generation error:', error)
      return {
        success: false,
        error: error.message || 'Failed to generate image',
        prompt,
      }
    }
  },
}
