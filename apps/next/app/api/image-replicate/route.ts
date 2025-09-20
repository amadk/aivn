import { NextRequest, NextResponse } from 'next/server'
import { createImageTool } from 'app/utils/agent-tools/create-image'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, parameters } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Missing required field: prompt' }, { status: 400 })
    }

    console.log('Generating image with Replicate Flux 1.1 Pro:', { prompt, parameters })

    // Use the createImageTool from agent-tools
    const result = await createImageTool.execute({
      prompt,
      aspectRatio: '16:9', // Wide format perfect for visual novel backgrounds
      outputFormat: 'jpg',
      outputQuality: 80,
      parameters: {
        genre: 'visual novel',
        mood: 'intimate',
        ...parameters, // Allow overriding defaults
      },
    })

    if (!result.success) {
      console.error('Replicate image generation failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        { status: 500 }
      )
    }

    console.log('Successfully generated image with Replicate:', result.url)

    return NextResponse.json({
      imageUrl: result.url,
      service: result.service,
      model: result.model,
      fileName: result.fileName,
      prompt: result.prompt,
      originalPrompt: result.originalPrompt,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('Replicate image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image with Replicate service' },
      { status: 500 }
    )
  }
}
