import { Button, Center, XStack, YStack, Text, isWeb } from '@my/ui'
import { ChevronLeft, ChevronRight, Bot, User, BookOpen, X } from '@tamagui/lucide-icons'
import { useEffect, useRef, useState } from 'react'
import { useColorScheme, Image, ScrollView } from 'react-native'
import { useRouter } from 'solito/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ChatInput } from './components/chat-input'
import { ThemeToggle } from '../visual-novel/components/theme-toggle'
import { SlideshowImage as BaseSlideshowImage } from 'app/components/slideshow'

// Extended interface to link images with messages
interface SlideshowImage extends BaseSlideshowImage {
  messageIndex?: number
}
import { MarkdownUI } from 'app/components/markdown-ui'

interface HomeScreenProps {}

export function HomeScreen({}: HomeScreenProps) {
  const router = useRouter()
  const colorScheme = useColorScheme()

  // State for slideshow images
  const [slideshowImages, setSlideshowImages] = useState<SlideshowImage[]>([])

  // State for synchronized message and image slides
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [input, setInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [showDebugInfo, setShowDebugInfo] = useState(true)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { model: 'anthropic/claude-4-sonnet' },
    }),
    experimental_throttle: 400,
    onFinish: (data) => {
      console.log('onFinish called with:', data)
      // Check for image prompts in the finished message and generate images
      if (data.message?.parts) {
        const messageText = data.message.parts
          .filter((p) => p.type === 'text')
          .map((p) => (p as any).text)
          .join('')
        console.log('Message text:', messageText)
        const structuredContent = parseStructuredResponse(messageText)
        console.log('Structured content:', structuredContent)
        if (structuredContent?.imagePrompt) {
          console.log('Found image prompt, generating image:', structuredContent.imagePrompt)
          generateImageFromPrompt(structuredContent.imagePrompt)
        } else {
          console.log('No image prompt found in structured content')
        }
      }

      // Auto-advance to the newest message/slide
      if (messages.length > 0) {
        setCurrentSlideIndex(messages.length - 1)
      }
    },
  })

  // Handle form submission
  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput('')
    }
  }

  // Test function to manually trigger image generation
  const testImageGeneration = () => {
    console.log('Testing image generation...')
    generateImageFromPrompt('A beautiful anime girl with long flowing hair in a visual novel style')
  }

  // Navigation functions for synchronized slides
  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  const goToNextSlide = () => {
    const maxIndex = Math.max(messages.length - 1, slideshowImages.length - 1)
    if (currentSlideIndex < maxIndex) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  // Helper function to parse structured response from AI
  const parseStructuredResponse = (text: string) => {
    try {
      // Look for JSON code block
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }

      // Try to parse as direct JSON
      return JSON.parse(text)
    } catch (error) {
      console.error('Failed to parse structured response:', error)
      return null
    }
  }

  // Image generation function
  const generateImageFromPrompt = async (prompt: string) => {
    const imageId = `img-${Date.now()}`

    console.log('Generating image for prompt:', prompt)
    console.log('Current messages length:', messages.length)

    // Add loading image to slideshow - use messages.length as the index since the new message will be at that position
    const loadingImage: SlideshowImage = {
      id: imageId,
      url: '',
      prompt,
      timestamp: new Date().toISOString(),
      isLoading: true,
      messageIndex: messages.length, // Link to the new message that will be added
    }

    // Just append the image to the array for now - we'll fix indexing later
    setSlideshowImages((prev) => {
      const newImages = [...prev, loadingImage]
      console.log('Added image to slideshow, total images:', newImages.length)
      return newImages
    })

    try {
      const response = await fetch('/api/image-replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          parameters: {
            genre: 'visual novel',
            mood: 'intimate',
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()

      console.log('Image generation response:', data)

      // Update the loading image with the actual URL
      setSlideshowImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, url: data.imageUrl, isLoading: false } : img
        )
      )
    } catch (error) {
      console.error('Failed to generate image:', error)
      // Remove the failed loading image
      setSlideshowImages((prev) => prev.filter((img) => img.id !== imageId))
    }
  }

  // Slideshow management functions
  const removeSlideshowImage = (imageId: string) => {
    setSlideshowImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  // Get current message and image for display
  const currentMessage = messages[currentSlideIndex]
  // For now, show the most recent image if there's no image at current index
  const currentImage =
    slideshowImages[currentSlideIndex] || slideshowImages[slideshowImages.length - 1]
  const isLoading = status === 'streaming'

  // Debug logging
  console.log('Current slide index:', currentSlideIndex)
  console.log('Messages length:', messages.length)
  console.log('Slideshow images length:', slideshowImages.length)
  console.log('Slideshow images:', slideshowImages)
  console.log('Current image:', currentImage)
  console.log('Current message:', currentMessage)

  // Auto-advance to newest slide when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setCurrentSlideIndex(messages.length - 1)
    }
  }, [messages.length])

  // Auto-open custom input when no suggestions are available
  useEffect(() => {
    // Don't show input while AI is responding
    if (isLoading) {
      setShowCustomInput(false)
      return
    }

    if (currentMessage && currentMessage.role === 'assistant') {
      const messageText =
        currentMessage.parts
          ?.filter((p) => p.type === 'text')
          .map((p) => (p as any).text)
          .join('') || ''

      const structuredContent = parseStructuredResponse(messageText)

      // Open custom input if no suggestions are available
      const hasSuggestions =
        structuredContent?.suggestions && structuredContent.suggestions.length > 0
      setShowCustomInput(!hasSuggestions)
    } else if (currentMessage && currentMessage.role === 'user') {
      // Close custom input when showing user messages
      setShowCustomInput(false)
    } else if (!currentMessage) {
      // Open custom input when no messages (initial state)
      setShowCustomInput(true)
    }
  }, [currentMessage, isLoading])

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    // Auto-submit the suggestion
    setTimeout(() => {
      sendMessage({ text: suggestion })
      setInput('')
    }, 100)
  }

  // Render the current message content
  const renderMessageContent = (message: any) => {
    if (!message) return null

    // Parse structured content for assistant messages
    const structuredContent =
      message.role === 'assistant' && message.parts?.length > 0
        ? parseStructuredResponse(message.parts.map((p) => p.text).join(''))
        : null

    if (message.role === 'user') {
      return (
        <Text fontSize="$4" color="white" textAlign="center">
          {message.parts?.[0]?.text || message.content}
        </Text>
      )
    }

    if (structuredContent) {
      return (
        <YStack gap="$3" alignItems="center">
          {/* AI Response */}
          {structuredContent.aiResponse && <MarkdownUI>{structuredContent.aiResponse}</MarkdownUI>}

          {/* Stats */}
          {structuredContent.stats && (
            <YStack
              gap="$2"
              backgroundColor="rgba(255, 255, 255, 0.1)"
              padding="$3"
              borderRadius="$3"
              width="100%"
            >
              <Text fontSize="$3" fontWeight="600" color="white" textAlign="center">
                Current Status
              </Text>
              <XStack gap="$3" flexWrap="wrap" justifyContent="center">
                {structuredContent.stats.sexPosition && (
                  <Text fontSize="$2" color="rgba(255, 255, 255, 0.9)">
                    Position: {structuredContent.stats.sexPosition}
                  </Text>
                )}
                {structuredContent.stats.dressStatus && (
                  <Text fontSize="$2" color="rgba(255, 255, 255, 0.9)">
                    Dress: {structuredContent.stats.dressStatus}
                  </Text>
                )}
                {structuredContent.stats.location && (
                  <Text fontSize="$2" color="rgba(255, 255, 255, 0.9)">
                    Location: {structuredContent.stats.location}
                  </Text>
                )}
              </XStack>
            </YStack>
          )}

          {/* Pleasure Rating */}
          {typeof structuredContent.pleasureRating === 'number' && (
            <XStack
              alignItems="center"
              gap="$2"
              backgroundColor="rgba(220, 38, 38, 0.8)"
              padding="$2"
              borderRadius="$3"
              width="100%"
              justifyContent="center"
            >
              <Text fontSize="$3" fontWeight="600" color="white">
                Pleasure:
              </Text>
              <Text fontSize="$3" color="white" fontWeight="600">
                {structuredContent.pleasureRating}/100
              </Text>
            </XStack>
          )}

          {/* Suggestions as Buttons */}
          {structuredContent.suggestions && structuredContent.suggestions.length > 0 && (
            <YStack gap="$2" width="100%" alignItems="center">
              <Text fontSize="$3" fontWeight="600" color="white" marginBottom="$1">
                Suggestions:
              </Text>
              <XStack gap="$2" flexWrap="wrap" justifyContent="center">
                {structuredContent.suggestions.map((suggestion: string, index: number) => (
                  <Button
                    key={index}
                    size="$2"
                    backgroundColor="$blue5"
                    borderColor="$blue7"
                    borderWidth={1}
                    borderRadius="$3"
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    onPress={() => handleSuggestionClick(suggestion)}
                    hoverStyle={{ backgroundColor: '$blue6' }}
                    pressStyle={{ scale: 0.95, backgroundColor: '$blue7' }}
                  >
                    <Text fontSize="$2" color="$blue12" textAlign="center">
                      {suggestion}
                    </Text>
                  </Button>
                ))}
                {/* Custom Button */}
                <Button
                  size="$2"
                  backgroundColor="$green5"
                  borderColor="$green7"
                  borderWidth={1}
                  borderRadius="$3"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  onPress={() => setShowCustomInput(!showCustomInput)}
                  hoverStyle={{ backgroundColor: '$green6' }}
                  pressStyle={{ scale: 0.95, backgroundColor: '$green7' }}
                >
                  <Text fontSize="$2" color="$green12" textAlign="center">
                    Custom
                  </Text>
                </Button>
              </XStack>
            </YStack>
          )}
        </YStack>
      )
    }

    // Fallback to regular message display
    return (
      <Text fontSize="$4" color="white" textAlign="center">
        {message.parts?.map((part: any) => part.text).join('') || message.content}
      </Text>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Top Menu Bar */}
      <XStack
        height={40}
        backgroundColor={colorScheme === 'dark' ? '$color3' : '$color2'}
        paddingHorizontal="$3"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Text fontSize="$3" fontWeight="600" color="$color12">
          AI Visual Novel Chat
        </Text>

        <XStack gap="$2" alignItems="center">
          <Button
            size="$2"
            backgroundColor="$green9"
            color="white"
            paddingHorizontal="$3"
            onPress={testImageGeneration}
            hoverStyle={{ backgroundColor: '$green10' }}
          >
            <Text fontSize="$2" color="white" fontWeight="500">
              Test Image
            </Text>
          </Button>
          <Button
            size="$2"
            backgroundColor={showDebugInfo ? '$red9' : '$gray9'}
            color="white"
            paddingHorizontal="$3"
            onPress={() => setShowDebugInfo(!showDebugInfo)}
            hoverStyle={{ backgroundColor: showDebugInfo ? '$red10' : '$gray10' }}
          >
            <Text fontSize="$2" color="white" fontWeight="500">
              Debug
            </Text>
          </Button>
          <Button
            size="$2"
            backgroundColor="$blue9"
            color="white"
            paddingHorizontal="$3"
            onPress={() => router.push('/visual-novel')}
            hoverStyle={{ backgroundColor: '$blue10' }}
          >
            <XStack gap="$1.5" alignItems="center">
              <BookOpen size={14} color="white" />
              <Text fontSize="$2" color="white" fontWeight="500">
                Visual Novel
              </Text>
            </XStack>
          </Button>
          <ThemeToggle size="$2" variant="minimal" />
        </XStack>
      </XStack>

      {/* Full Screen Image Background */}
      <YStack height="calc(100vh - 40px)" position="relative">
        {/* Debug Info */}
        {showDebugInfo && (
          <YStack
            position="absolute"
            top="$10"
            left="$4"
            zIndex={20}
            backgroundColor="rgba(0,0,0,0.8)"
            padding="$2"
            borderRadius="$2"
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.2)"
          >
            {/* Close button */}
            <Button
              size="$1"
              circular
              chromeless
              icon={X}
              position="absolute"
              top="$1"
              right="$1"
              onPress={() => setShowDebugInfo(false)}
              backgroundColor="rgba(255, 255, 255, 0.2)"
              color="white"
              hoverStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
              pressStyle={{ scale: 0.95 }}
            />

            <Text color="white" fontSize="$2" fontWeight="600" marginBottom="$1">
              Debug Info
            </Text>
            <Text color="white" fontSize="$1">
              Slide Index: {currentSlideIndex}
            </Text>
            <Text color="white" fontSize="$1">
              Images: {slideshowImages.length}
            </Text>
            <Text color="white" fontSize="$1">
              Messages: {messages.length}
            </Text>
            <Text color="white" fontSize="$1">
              Current Image: {currentImage ? 'Yes' : 'No'}
            </Text>
            <Text color="white" fontSize="$1">
              Image URL: {currentImage?.url ? 'Yes' : 'None'}
            </Text>
            <Text color="white" fontSize="$1">
              Is Loading: {currentImage?.isLoading ? 'Yes' : 'No'}
            </Text>
          </YStack>
        )}

        {/* Background Image */}
        {slideshowImages.length > 0 ? (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            alignItems="center"
            justifyContent="center"
          >
            {!currentImage ? (
              <YStack alignItems="center" gap="$3">
                <Text fontSize="$4" color="white">
                  No image at current slide index {currentSlideIndex}
                </Text>
                <Text fontSize="$2" color="rgba(255, 255, 255, 0.8)">
                  Available images:{' '}
                  {slideshowImages
                    .map((img, i) => `${i}: ${img.url ? 'URL' : 'No URL'}`)
                    .join(', ')}
                </Text>
              </YStack>
            ) : currentImage.isLoading ? (
              <YStack alignItems="center" gap="$3">
                <Text fontSize="$4" color="white">
                  Generating image...
                </Text>
                <Text
                  fontSize="$2"
                  color="rgba(255, 255, 255, 0.8)"
                  textAlign="center"
                  maxWidth={300}
                >
                  {currentImage.prompt}
                </Text>
              </YStack>
            ) : currentImage.url ? (
              <>
                {typeof window !== 'undefined' ? (
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                ) : (
                  <Image
                    source={{ uri: currentImage.url }}
                    style={{
                      width: '100%',
                      height: '100%',
                      resizeMode: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                )}
              </>
            ) : (
              <Text color="white">Failed to load image</Text>
            )}
          </YStack>
        ) : (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="$color2"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="$5" color="$color10" textAlign="center">
              AI Generated Images
            </Text>
            <Text fontSize="$3" color="$color9" textAlign="center" marginTop="$2">
              Images will appear here as the AI generates them
            </Text>
          </YStack>
        )}

        {/* Dark Overlay for Better Text Readability */}
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0, 0, 0, 0.3)"
        />

        {/* Slide Navigation */}
        {(messages.length > 1 || slideshowImages.length > 1) && (
          <XStack
            position="absolute"
            top="$4"
            left="50%"
            transform={[{ translateX: -50 }]}
            justifyContent="center"
            alignItems="center"
            zIndex={10}
            gap="$3"
          >
            <Button
              size="$2"
              circular
              icon={ChevronLeft}
              onPress={goToPreviousSlide}
              disabled={currentSlideIndex === 0}
              backgroundColor="rgba(0, 0, 0, 0.6)"
              color="white"
              borderColor="rgba(255, 255, 255, 0.3)"
              borderWidth={1}
              opacity={currentSlideIndex === 0 ? 0.5 : 1}
            />

            <Text
              fontSize="$2"
              color="white"
              backgroundColor="rgba(0, 0, 0, 0.6)"
              padding="$1"
              paddingHorizontal="$2"
              borderRadius="$2"
              borderColor="rgba(255, 255, 255, 0.3)"
              borderWidth={1}
            >
              {currentSlideIndex + 1} / {Math.max(messages.length, slideshowImages.length)}
            </Text>

            <Button
              size="$2"
              circular
              icon={ChevronRight}
              onPress={goToNextSlide}
              disabled={
                currentSlideIndex >= Math.max(messages.length - 1, slideshowImages.length - 1)
              }
              backgroundColor="rgba(0, 0, 0, 0.6)"
              color="white"
              borderColor="rgba(255, 255, 255, 0.3)"
              borderWidth={1}
              opacity={
                currentSlideIndex >= Math.max(messages.length - 1, slideshowImages.length - 1)
                  ? 0.5
                  : 1
              }
            />
          </XStack>
        )}

        {/* Stats Panel - Top Right */}
        {currentMessage &&
          (() => {
            const structuredContent =
              currentMessage.role === 'assistant' && currentMessage.parts?.length > 0
                ? parseStructuredResponse(
                    currentMessage.parts
                      .filter((p) => p.type === 'text')
                      .map((p) => (p as any).text)
                      .join('')
                  )
                : null

            return structuredContent?.stats ||
              typeof structuredContent?.pleasureRating === 'number' ? (
              <YStack
                position="absolute"
                top="$4"
                right="$4"
                gap="$2"
                zIndex={10}
                alignItems="flex-end"
              >
                {/* Stats */}
                {structuredContent.stats && (
                  <YStack
                    gap="$2"
                    backgroundColor="rgba(0, 0, 0, 0.7)"
                    padding="$3"
                    borderRadius="$3"
                    borderColor="rgba(255, 255, 255, 0.3)"
                    borderWidth={1}
                    {...(isWeb && {
                      style: {
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                      },
                    })}
                  >
                    <Text fontSize="$2" fontWeight="600" color="white" textAlign="center">
                      Status
                    </Text>
                    <YStack gap="$1">
                      {structuredContent.stats.sexPosition && (
                        <Text fontSize="$1" color="rgba(255, 255, 255, 0.9)">
                          Position: {structuredContent.stats.sexPosition}
                        </Text>
                      )}
                      {structuredContent.stats.dressStatus && (
                        <Text fontSize="$1" color="rgba(255, 255, 255, 0.9)">
                          Dress: {structuredContent.stats.dressStatus}
                        </Text>
                      )}
                      {structuredContent.stats.location && (
                        <Text fontSize="$1" color="rgba(255, 255, 255, 0.9)">
                          Location: {structuredContent.stats.location}
                        </Text>
                      )}
                    </YStack>
                  </YStack>
                )}

                {/* Pleasure Rating */}
                {typeof structuredContent?.pleasureRating === 'number' && (
                  <XStack
                    alignItems="center"
                    gap="$2"
                    backgroundColor="rgba(220, 38, 38, 0.8)"
                    padding="$2"
                    borderRadius="$3"
                    borderColor="rgba(255, 255, 255, 0.3)"
                    borderWidth={1}
                    {...(isWeb && {
                      style: {
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                      },
                    })}
                  >
                    <Text fontSize="$2" fontWeight="600" color="white">
                      Pleasure: {structuredContent.pleasureRating}/100
                    </Text>
                  </XStack>
                )}
              </YStack>
            ) : null
          })()}

        {/* Combined Bottom Container - Message Text, Suggestions, and Chat Input */}
        <YStack
          position="absolute"
          bottom="$6"
          left="$4"
          right="$4"
          alignItems="center"
          zIndex={10}
          gap="$3"
        >
          {/* Suggestion Buttons */}
          {currentMessage &&
            (() => {
              const structuredContent =
                currentMessage.role === 'assistant' && currentMessage.parts?.length > 0
                  ? parseStructuredResponse(
                      currentMessage.parts
                        .filter((p) => p.type === 'text')
                        .map((p) => (p as any).text)
                        .join('')
                    )
                  : null

              return structuredContent?.suggestions && structuredContent.suggestions.length > 0 ? (
                <YStack gap="$2" width="100%" alignItems="flex-start" paddingLeft="$4">
                  {structuredContent.suggestions.map((suggestion: string, index: number) => (
                    <Button
                      key={index}
                      size="$2"
                      backgroundColor="transparent"
                      borderColor="rgba(255, 255, 255, 0.3)"
                      borderWidth={1}
                      borderRadius="$3"
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      onPress={() => handleSuggestionClick(suggestion)}
                      hoverStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      pressStyle={{ scale: 0.95 }}
                      alignSelf="flex-start"
                    >
                      <Text fontSize="$2" color="white" textAlign="left">
                        {suggestion}
                      </Text>
                    </Button>
                  ))}
                  {/* Custom Button */}
                  <Button
                    size="$2"
                    backgroundColor="transparent"
                    borderColor="rgba(255, 255, 255, 0.3)"
                    borderWidth={1}
                    borderRadius="$3"
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    onPress={() => setShowCustomInput(!showCustomInput)}
                    hoverStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    pressStyle={{ scale: 0.95 }}
                    alignSelf="flex-start"
                  >
                    <Text fontSize="$2" color="white" textAlign="left">
                      Custom
                    </Text>
                  </Button>
                </YStack>
              ) : null
            })()}

          {/* Chat Input */}
          {showCustomInput && !isLoading && (
            <YStack
              width="100%"
              maxWidth={400}
              backgroundColor="rgba(0, 0, 0, 0.8)"
              borderRadius="$3"
              borderWidth={1}
              borderColor="rgba(255, 255, 255, 0.3)"
              alignSelf="center"
              {...(isWeb && {
                style: {
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                },
              })}
            >
              {/* Close Button */}
              <Button
                size="$2"
                circular
                chromeless
                icon={X}
                position="absolute"
                top="$1"
                right="$1"
                zIndex={10}
                onPress={() => setShowCustomInput(false)}
                backgroundColor="rgba(255, 255, 255, 0.2)"
                color="white"
                hoverStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                pressStyle={{ scale: 0.95 }}
              />

              <ChatInput
                placeholder="Type your custom message..."
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                onSubmit={(e) => {
                  handleSubmit(e)
                  setShowCustomInput(false)
                }}
                allFilesUploaded={true}
                stopHandler={() => {}}
                isMessagesVisible={true}
                isFullscreen={false}
              />
            </YStack>
          )}

          {/* Message Text Container */}
          {currentMessage ? (
            <YStack gap="$2" alignItems="flex-start" width="100%">
              {/* Character indicator */}
              <XStack alignItems="center" gap="$2" alignSelf="flex-start" paddingLeft="$4">
                {currentMessage.role === 'assistant' ? (
                  <Bot size={20} color="white" />
                ) : (
                  <User size={20} color="white" />
                )}
                <Text fontSize="$3" fontWeight="600" color="white">
                  {currentMessage.role === 'assistant' ? 'AI Assistant' : 'You'}
                </Text>
              </XStack>

              {/* Message text with fixed height */}
              <YStack
                backgroundColor="transparent"
                borderRadius="$4"
                width="100%"
                maxHeight={300}
                paddingLeft="$4"
              >
                <ScrollView
                  style={{ maxHeight: 300 }}
                  contentContainerStyle={{
                    padding: 16,
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    minHeight: 150,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  {currentMessage.role === 'user' ? (
                    <Text fontSize="$4" color="white" textAlign="left">
                      {currentMessage.parts
                        ?.filter((p) => p.type === 'text')
                        .map((p) => (p as any).text)
                        .join('') || 'User message'}
                    </Text>
                  ) : (
                    (() => {
                      const structuredContent =
                        currentMessage.parts?.length > 0
                          ? parseStructuredResponse(
                              currentMessage.parts
                                .filter((p) => p.type === 'text')
                                .map((p) => (p as any).text)
                                .join('')
                            )
                          : null

                      if (structuredContent?.aiResponse) {
                        return (
                          <YStack
                            width="100%"
                            {...(isWeb && {
                              style: {
                                color: 'white !important',
                                '& *': {
                                  color: 'white !important',
                                },
                              },
                            })}
                          >
                            <MarkdownUI>{structuredContent.aiResponse}</MarkdownUI>
                          </YStack>
                        )
                      }

                      return (
                        <Text fontSize="$4" color="white" textAlign="left">
                          {currentMessage.parts
                            ?.filter((p) => p.type === 'text')
                            .map((p) => (p as any).text)
                            .join('') || 'AI response'}
                        </Text>
                      )
                    })()
                  )}
                </ScrollView>
              </YStack>
            </YStack>
          ) : (
            <YStack
              alignItems="flex-start"
              backgroundColor="transparent"
              borderRadius="$4"
              padding="$4"
              width="100%"
              height={150}
              paddingLeft="$4"
            >
              <Bot size={48} color="white" />
              <Text color="white" fontSize="$5" marginTop="$2" textAlign="left">
                Start a conversation with the AI assistant
              </Text>
            </YStack>
          )}
        </YStack>
      </YStack>
    </YStack>
  )
}
