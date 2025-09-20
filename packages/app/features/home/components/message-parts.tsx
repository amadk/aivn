import { Text, YStack, XStack, Image, Button } from '@my/ui'
import {
  Bot,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Brain,
} from '@tamagui/lucide-icons'
import { MarkdownUI } from 'app/components/markdown-ui'
import { useState } from 'react'

interface MessagePartProps {
  part: any
  index: number
}

export function TextPart({ part }: MessagePartProps) {
  return <MarkdownUI>{part.text}</MarkdownUI>
}

export function ReasoningPart({ part }: MessagePartProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <YStack marginVertical="$1">
      <Button
        size="$2"
        backgroundColor="transparent"
        borderWidth={0}
        paddingHorizontal="$2"
        paddingVertical="$1"
        onPress={() => setIsExpanded(!isExpanded)}
        alignSelf="flex-start"
        hoverStyle={{
          backgroundColor: '$color3',
        }}
        pressStyle={{ scale: 0.98 }}
      >
        <XStack alignItems="center" space="$1.5">
          {isExpanded ? (
            <ChevronDown size={12} color="$color9" />
          ) : (
            <ChevronRight size={12} color="$color9" />
          )}
          <Brain size={12} color="$color9" />
          <Text fontSize="$1" color="$color9" fontStyle="italic">
            AI Reasoning
          </Text>
        </XStack>
      </Button>

      {isExpanded && (
        <YStack
          backgroundColor="$color2"
          borderRadius="$2"
          padding="$3"
          marginTop="$1"
          borderLeftWidth={2}
          borderLeftColor="$color6"
        >
          <Text fontSize="$2" color="$color10" fontStyle="italic" lineHeight="$1">
            <MarkdownUI>{part.text}</MarkdownUI>
          </Text>
        </YStack>
      )}
    </YStack>
  )
}

export function ToolCallPart({ part }: MessagePartProps) {
  return (
    <XStack
      backgroundColor="$blue2"
      borderRadius="$2"
      padding="$2"
      marginVertical="$1"
      alignItems="center"
      space="$2"
      flex={1}
    >
      {/* <Tool size={12} color="$blue10" /> */}
      <Text fontSize="$2" color="$blue10" flex={1}>
        {JSON.stringify(part, null, 2)}
        {/* Tool Call: {part.toolName || 'Unknown'} */}
      </Text>
    </XStack>
  )
}

export function ToolResultPart({ part }: MessagePartProps) {
  // Debug logging to see the structure
  console.log('ToolResultPart received:', JSON.stringify(part, null, 2))

  // Check if this is a createImage tool result with a URL
  // Try different possible structures for the result
  let parsedResult = part.result

  // If result is a string, try to parse it as JSON
  if (typeof part.result === 'string') {
    try {
      parsedResult = JSON.parse(part.result)
    } catch (e) {
      // Not valid JSON, keep as string
    }
  }

  const isImageResult =
    (part.toolName === 'createImage' ||
      part.type === 'tool-createImage' ||
      (part.type === 'tool-result' && part.toolCallId)) &&
    (parsedResult?.url ||
      part.output?.url ||
      part.args?.url ||
      part.content?.url ||
      (typeof part.result === 'string' && part.result.includes('url')))

  // Extract URL from different possible locations
  const imageUrl = parsedResult?.url || part.output?.url || part.args?.url || part.content?.url
  const imagePrompt =
    parsedResult?.prompt ||
    part.output?.prompt ||
    part.args?.prompt ||
    part.content?.prompt ||
    'Generated Image'
  const fileName =
    parsedResult?.fileName || part.output?.fileName || part.args?.fileName || part.content?.fileName

  console.log('Is image result:', isImageResult, {
    toolName: part.toolName,
    type: part.type,
    hasResult: !!part.result,
    imageUrl,
    fileName,
  })

  return (
    <YStack space="$2">
      <XStack
        backgroundColor="$green2"
        borderRadius="$2"
        padding="$2"
        marginVertical="$1"
        alignItems="center"
        space="$2"
      >
        <FileText size={12} color="$green10" />
        <Text fontSize="$2" color="$blue10" flex={1}>
          {isImageResult
            ? `Image generated successfully: ${fileName || 'image'}`
            : JSON.stringify(part, null, 2)}
        </Text>
      </XStack>

      {/* Render the actual image if it's a createImage result */}
      {isImageResult && imageUrl && (
        <YStack backgroundColor="$background" borderRadius="$3" padding="$2" marginVertical="$1">
          <Image
            source={{ uri: imageUrl }}
            width="100%"
            height={200}
            borderRadius="$2"
            resizeMode="contain"
          />
          <Text fontSize="$1" color="$color11" textAlign="center" marginTop="$1">
            {imagePrompt}
          </Text>
        </YStack>
      )}
    </YStack>
  )
}

export function ImagePart({ part }: MessagePartProps) {
  return (
    <XStack
      backgroundColor="$color3"
      borderRadius="$2"
      padding="$2"
      marginVertical="$1"
      alignItems="center"
      space="$2"
    >
      <ImageIcon size={12} color="$color11" />
      <Text fontSize="$2" color="$color11">
        Image
      </Text>
    </XStack>
  )
}

export function MessagePart({ part, index }: MessagePartProps) {
  // console.log('MessagePart received:', JSON.stringify(part, null, 2))
  switch (part.type) {
    case 'text':
      return <TextPart part={part} index={index} />
    case 'reasoning':
      return <ReasoningPart part={part} index={index} />
    case 'tool_call':
    case 'tool-call':
      return <ToolCallPart part={part} index={index} />
    case 'tool_result':
    case 'tool-result':
      return <ToolResultPart part={part} index={index} />
    case 'tool-createFile':
      return <ToolCallPart part={part} index={index} />
    case 'tool-createImage':
      return <ToolResultPart part={part} index={index} />
    case 'image':
      return <ImagePart part={part} index={index} />
    default:
      return null
  }
}
