import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { prompt, parameters } = body

  if (!prompt) {
    return NextResponse.json({ error: 'Missing required field: prompt' }, { status: 400 })
  }

  // Enhanced prompt for comprehensive visual novel scenes
  const enhancedPrompt = `${prompt}, complete visual novel scene illustration with all characters and environment integrated together, anime art style, high quality, detailed, professional digital artwork, vibrant colors, clean lines, cinematic composition, characters positioned naturally in the scene`

  try {
    // Generate image using Kie.ai Flux API
    const url = 'https://api.kie.ai/api/v1/flux/kontext/generate'
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        enableTranslation: true,
        aspectRatio: '16:9', // Wide format perfect for visual novel backgrounds
        outputFormat: 'jpeg',
        promptUpsampling: false,
        model: 'flux-kontext-pro',
      }),
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`Kie.ai API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    console.log('data', data)

    // Extract task ID from Kie.ai response
    const taskId = data?.data?.taskId

    if (!taskId) {
      throw new Error('No task ID returned from Kie.ai service')
    }

    // Poll for the completed image
    const imageUrl = await pollForImage(taskId)

    return NextResponse.json({
      imageUrl,
      service: 'kie.ai',
      model: 'flux-kontext-pro',
      taskId,
    })
  } catch (error) {
    console.error('Kie.ai image generation error:', error)

    // Fallback to pollinations.ai if Kie.ai fails
    try {
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=800&height=600&seed=${Math.floor(Math.random() * 1000000)}`
      return NextResponse.json({
        imageUrl: fallbackUrl,
        fallback: true,
        service: 'pollinations.ai',
        message: 'Using fallback image service',
      })
    } catch (fallbackError) {
      console.error('Fallback image generation error:', fallbackError)
      return NextResponse.json(
        { error: 'Failed to generate image with both primary and fallback services' },
        { status: 500 }
      )
    }
  }
}

async function pollForImage(taskId: string): Promise<string> {
  const maxAttempts = 24 // 24 attempts * 5 seconds = 2 minutes max
  const pollInterval = 3000 // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(
        `https://api.kie.ai/api/v1/flux/kontext/record-info?taskId=${taskId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.KIE_API_KEY}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Kie.ai polling error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      console.log('image data', data)

      // Check if the task is completed and has an image URL
      const imageUrl =
        data?.data?.response?.resultImageUrl || data.imageUrl || data.image_url || data.result?.url

      console.log('imageUrl', imageUrl)

      if (imageUrl) {
        return imageUrl
      }

      // If not ready, wait before next attempt
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval))
      }
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error)

      // If it's the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        throw error
      }

      // Otherwise, wait and try again
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }
  }

  throw new Error('Image generation timed out after 2 minutes')
}
