import { YStack, XStack, Text, Button, isWeb } from 'tamagui'
import { X, Move, RefreshCw } from '@tamagui/lucide-icons'
import { useEffect, useRef, useState } from 'react'

interface DraggableIframeProps {
  id: string
  filename: string
  content: string
  title: string
  width: number
  height: number
  initialPosition: { x: number; y: number }
  onClose: (id: string) => void
}

export function DraggableIframe({
  id,
  filename,
  content,
  title,
  width,
  height,
  initialPosition,
  onClose,
}: DraggableIframeProps) {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Function to refresh iframe content
  const handleRefresh = () => {
    if (iframeRef.current && isWeb) {
      const iframe = iframeRef.current
      const doc = iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(content)
        doc.close()
      }
    }
  }

  // Initialize iframe content
  useEffect(() => {
    if (iframeRef.current && isWeb) {
      const iframe = iframeRef.current
      const doc = iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(content)
        doc.close()
      }
    }
  }, [content])

  // Handle mouse events for dragging (web only)
  useEffect(() => {
    if (!isWeb) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isWeb) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setIsDragging(true)
    }
  }

  if (!isWeb) {
    // For mobile, show a simplified non-draggable version
    return (
      <YStack
        position="absolute"
        top={initialPosition.y}
        left={initialPosition.x}
        width={width}
        height={height}
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        overflow="hidden"
        zIndex={1}
      >
        <XStack
          backgroundColor="$color3"
          padding="$2"
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <Text fontSize="$3" fontWeight="500" flex={1} numberOfLines={1}>
            {title}
          </Text>
          <XStack gap="$1">
            <Button size="$2" circular chromeless icon={RefreshCw} onPress={handleRefresh} />
            <Button size="$2" circular chromeless icon={X} onPress={() => onClose(id)} />
          </XStack>
        </XStack>
        <YStack flex={1} padding="$3">
          <Text fontSize="$4" color="$color11">
            HTML content display not available on mobile
          </Text>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack
      ref={containerRef}
      position="absolute"
      left={position.x}
      top={position.y}
      width={width}
      height={height}
      backgroundColor="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
      zIndex={1}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.15}
      shadowRadius={12}
      elevation={4}
      style={{
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header with drag handle and close button */}
      <XStack
        backgroundColor="$color3"
        padding="$2"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        style={{ cursor: 'grab' }}
        onMouseDown={handleMouseDown}
      >
        <XStack alignItems="center" gap="$2" flex={1}>
          <Move size={16} color="$color11" />
          <Text fontSize="$3" fontWeight="500" flex={1} numberOfLines={1}>
            {title}
          </Text>
        </XStack>
        <XStack gap="$1">
          <Button
            size="$2"
            circular
            chromeless
            icon={RefreshCw}
            onPress={handleRefresh}
            hoverStyle={{ backgroundColor: '$color5' }}
            pressStyle={{ scale: 0.9 }}
          />
          <Button
            size="$2"
            circular
            chromeless
            icon={X}
            onPress={() => onClose(id)}
            hoverStyle={{ backgroundColor: '$red5' }}
            pressStyle={{ scale: 0.9 }}
          />
        </XStack>
      </XStack>

      {/* Iframe content */}
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: 'calc(100% - 40px)', // Subtract header height
          border: 'none',
          backgroundColor: 'white',
        }}
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </YStack>
  )
}
