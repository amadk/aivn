import React, { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Button,
  Text,
  Spinner,
  Image as TamaguiImage,
  Card,
  AnimatePresence,
} from '@my/ui'
import { ChevronLeft, ChevronRight, X, Download, RotateCw, Maximize2 } from '@tamagui/lucide-icons'
import { Image, useColorScheme, Dimensions } from 'react-native'

export interface SlideshowImage {
  id: string
  url: string
  prompt: string
  timestamp: string
  isLoading?: boolean
}

interface SlideshowProps {
  images?: SlideshowImage[]
  onClose: () => void
  onRemoveImage: (id: string) => void
  width: number
  height: number
  position: { x: number; y: number }
}

export function Slideshow({
  images = [],
  onClose,
  onRemoveImage,
  width,
  height,
  position,
}: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const colorScheme = useColorScheme()

  // Auto-advance to newest image when new ones are added
  useEffect(() => {
    if (images && images.length > 0) {
      setCurrentIndex(images.length - 1)
    }
  }, [images?.length])

  const currentImage = images[currentIndex]

  const goToPrevious = () => {
    if (!images || images.length === 0) return
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const goToNext = () => {
    if (!images || images.length === 0) return
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  const handleDownload = async () => {
    if (!currentImage?.url) return

    try {
      // For web, create a temporary link and trigger download
      if (typeof window !== 'undefined') {
        const link = document.createElement('a')
        link.href = currentImage.url
        link.download = `generated-image-${currentImage.id}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  if (!images || images.length === 0) {
    return (
      <YStack
        position="absolute"
        left={position.x}
        top={position.y}
        width={width}
        height={height}
        backgroundColor={colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'}
        borderRadius="$4"
        borderWidth={1}
        borderColor={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
        padding="$4"
        alignItems="center"
        justifyContent="center"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.15}
        shadowRadius={12}
        elevation={8}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <Button
          size="$2"
          circular
          chromeless
          icon={X}
          position="absolute"
          top="$2"
          right="$2"
          onPress={onClose}
          backgroundColor={
            colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
          hoverStyle={{
            backgroundColor:
              colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          }}
        />

        <Text fontSize="$4" color="$color10" textAlign="center">
          AI Generated Images
        </Text>
        <Text fontSize="$2" color="$color9" textAlign="center" marginTop="$2">
          Images will appear here as the AI generates them
        </Text>
      </YStack>
    )
  }

  const slideshowContent = (
    <YStack flex={1} gap="$2">
      {/* Header */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal="$3"
        paddingTop="$2"
      >
        <YStack>
          <Text fontSize="$3" fontWeight="600" color="$color12">
            AI Gallery ({currentIndex + 1}/{images.length})
          </Text>
          {/* Debug info */}
          {currentImage && (
            <Text fontSize="$1" color="$color9" numberOfLines={1}>
              {currentImage.isLoading
                ? 'Loading...'
                : currentImage.url
                  ? 'URL: ' + currentImage.url.substring(0, 50) + '...'
                  : 'No URL'}
            </Text>
          )}
        </YStack>
        <XStack gap="$2">
          <Button
            size="$2"
            circular
            chromeless
            icon={Download}
            onPress={handleDownload}
            backgroundColor="rgba(255, 255, 255, 0.1)"
            hoverStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          />
          {!isFullscreen && (
            <Button
              size="$2"
              circular
              chromeless
              icon={Maximize2}
              onPress={() => setIsFullscreen(true)}
              backgroundColor="rgba(255, 255, 255, 0.1)"
              hoverStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            />
          )}
          <Button
            size="$2"
            circular
            chromeless
            icon={X}
            onPress={isFullscreen ? () => setIsFullscreen(false) : onClose}
            backgroundColor="rgba(255, 255, 255, 0.1)"
            hoverStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          />
        </XStack>
      </XStack>

      {/* Main Image Display */}
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$3">
        {currentImage?.isLoading ? (
          <YStack alignItems="center" gap="$3">
            <Spinner size="large" color="$blue9" />
            <Text color="$color10">Generating image...</Text>
            <Text fontSize="$2" color="$color9" textAlign="center" maxWidth={300}>
              {currentImage.prompt}
            </Text>
          </YStack>
        ) : currentImage?.url ? (
          <Card
            elevate
            borderRadius="$4"
            overflow="hidden"
            maxWidth="100%"
            maxHeight="100%"
            backgroundColor="$background"
          >
            {typeof window !== 'undefined' ? (
              // Web version using HTML img tag
              <img
                src={currentImage.url}
                alt={currentImage.prompt}
                style={{
                  width: '100%',
                  height: isFullscreen ? 400 : 300,
                  objectFit: 'contain',
                  display: 'block',
                }}
                onError={(error) => {
                  console.error('Image load error:', error)
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', currentImage.url)
                }}
              />
            ) : (
              // Native version using React Native Image
              <Image
                source={{ uri: currentImage.url }}
                style={{
                  width: '100%',
                  height: isFullscreen ? 400 : 300,
                  resizeMode: 'contain',
                }}
                onError={(error) => {
                  console.error('Image load error:', error)
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', currentImage.url)
                }}
              />
            )}
          </Card>
        ) : (
          <YStack alignItems="center" gap="$2">
            <Text color="$color10">Failed to load image</Text>
            <Button
              size="$2"
              onPress={() => {
                // Retry logic could go here
              }}
              icon={RotateCw}
            >
              Retry
            </Button>
          </YStack>
        )}
      </YStack>

      {/* Navigation and Info */}
      <YStack gap="$2" paddingHorizontal="$3" paddingBottom="$2">
        {/* Navigation */}
        {images.length > 1 && (
          <XStack justifyContent="space-between" alignItems="center">
            <Button
              size="$3"
              circular
              chromeless
              icon={ChevronLeft}
              onPress={goToPrevious}
              backgroundColor="rgba(255, 255, 255, 0.1)"
              hoverStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              disabled={images.length <= 1}
            />

            {/* Dot indicators */}
            <XStack gap="$1" alignItems="center">
              {images.map((_, index) => (
                <Button
                  key={index}
                  size="$1"
                  circular
                  chromeless
                  backgroundColor={index === currentIndex ? '$blue9' : 'rgba(255, 255, 255, 0.3)'}
                  width={8}
                  height={8}
                  onPress={() => setCurrentIndex(index)}
                />
              ))}
            </XStack>

            <Button
              size="$3"
              circular
              chromeless
              icon={ChevronRight}
              onPress={goToNext}
              backgroundColor="rgba(255, 255, 255, 0.1)"
              hoverStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              disabled={images.length <= 1}
            />
          </XStack>
        )}

        {/* Current Image Info */}
        {currentImage && (
          <YStack gap="$1" backgroundColor="rgba(0, 0, 0, 0.3)" padding="$2" borderRadius="$3">
            <Text fontSize="$2" color="$color11" numberOfLines={2}>
              {currentImage.prompt}
            </Text>
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$1" color="$color9">
                {new Date(currentImage.timestamp).toLocaleTimeString()}
              </Text>
              <Button
                size="$1"
                chromeless
                onPress={() => onRemoveImage(currentImage.id)}
                color="$red10"
                fontSize="$1"
              >
                Remove
              </Button>
            </XStack>
          </YStack>
        )}
      </YStack>
    </YStack>
  )

  if (isFullscreen) {
    return (
      <AnimatePresence>
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0, 0, 0, 0.95)"
          zIndex={1000}
          animation="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        >
          {slideshowContent}
        </YStack>
      </AnimatePresence>
    )
  }

  return (
    <YStack
      position="absolute"
      left={position.x}
      top={position.y}
      width={width}
      height={height}
      backgroundColor={colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'}
      borderRadius="$4"
      borderWidth={1}
      borderColor={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.15}
      shadowRadius={12}
      elevation={8}
      overflow="hidden"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {slideshowContent}
    </YStack>
  )
}
