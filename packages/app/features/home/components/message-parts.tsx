import { Text, YStack, XStack } from '@my/ui'
import { Bot, FileText, Image as ImageIcon } from '@tamagui/lucide-icons'

interface MessagePartProps {
  part: any
  index: number
}

export function TextPart({ part }: MessagePartProps) {
  return <Text>{part.text}</Text>
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
  return (
    <XStack
      backgroundColor="$green2"
      borderRadius="$2"
      padding="$2"
      marginVertical="$1"
      alignItems="center"
      space="$2"
    >
      <FileText size={12} color="$green10" />
      {/* <Text fontSize="$2" color="$green10"> */}
      {/* Tool Result: {part.toolName || 'Unknown'} */}
      {/* </Text> */}
      <Text fontSize="$2" color="$blue10" flex={1}>
        {JSON.stringify(part, null, 2)}
        {/* Tool Call: {part.toolName || 'Unknown'} */}
      </Text>
    </XStack>
  )
}

export function ImagePart({ part }: MessagePartProps) {
  return (
    <XStack
      backgroundColor="$purple2"
      borderRadius="$2"
      padding="$2"
      marginVertical="$1"
      alignItems="center"
      space="$2"
    >
      <ImageIcon size={12} color="$purple10" />
      <Text fontSize="$2" color="$purple10">
        Image
      </Text>
    </XStack>
  )
}

export function MessagePart({ part, index }: MessagePartProps) {
  switch (part.type) {
    case 'text':
      return <TextPart part={part} index={index} />
    case 'tool_call':
    case 'tool-call':
      return <ToolCallPart part={part} index={index} />
    case 'tool_result':
    case 'tool-result':
      return <ToolResultPart part={part} index={index} />
    case 'tool-createFile':
      return <ToolCallPart part={part} index={index} />
    case 'image':
      return <ImagePart part={part} index={index} />
    default:
      return null
  }
}
