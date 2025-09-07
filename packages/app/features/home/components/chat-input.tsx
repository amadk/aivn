import { Div, Flex, Button } from '@my/ui'
import {
  ChevronDown,
  ChevronUp,
  Send,
  Bot,
  User,
  Camera,
  StopCircle,
  ArrowUp,
} from '@tamagui/lucide-icons'
import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { useLink, usePathname } from 'solito/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { GrowingInput } from './growing-input'
import { useIsMobile } from 'app/hooks/use-is-mobile'

interface ChatInputProps {
  placeholder: string
  input: string
  setInput: (input: string) => void
  onSubmit: () => void
  isLoading: boolean
  onFocus?: () => void
  onBlur?: () => void
  stopHandler: () => void
  allFilesUploaded: boolean
  isMessagesVisible?: boolean
  isFullscreen?: boolean
}

export const ChatInput = (props) => {
  const {
    placeholder,
    input,
    setInput,
    onSubmit,
    allFilesUploaded,
    isLoading,
    stopHandler,
    onFocus,
    onBlur,
    isMessagesVisible,
    isFullscreen,
  } = props
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pathname = usePathname()
  const isMobile = useIsMobile()

  return (
    <Div>
      <Flex
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        px={'$3.5'}
        // backgroundColor="red"
      >
        {/* do not add borderWidth="$0", it prevents the chat input from shrinking */}
        <GrowingInput
          ref={inputRef as any}
          // width={isMessagesVisible ? '100%' : '40%'}
          fontSize={16}
          placeholder={placeholder}
          px={0}
          borderWidth={0}
          hoverStyle={{ outlineColor: 'transparent', borderColor: 'transparent' }}
          borderColor="transparent"
          backgroundColor="transparent"
          outlineColor="transparent"
          placeholderTextColor="$color11"
          focusStyle={{ outlineColor: 'transparent', borderColor: 'transparent' }}
          shadowOpacity={0}
          flex={1}
          multiline
          value={input}
          onChangeText={setInput}
          autoFocus={!isMobile}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyPress={(e: any) => {
            if (
              e?.nativeEvent?.key === 'Enter' &&
              !e?.nativeEvent?.shiftKey &&
              !isMobile &&
              allFilesUploaded
            ) {
              e?.preventDefault()
              onSubmit(e)
            }
          }}
        />
        {isMessagesVisible && (
          <Button
            size="$3"
            circular
            onPress={isLoading ? stopHandler : onSubmit}
            disabled={!isLoading && (!input?.trim() || !allFilesUploaded)}
            icon={isLoading ? StopCircle : ArrowUp}
            scaleIcon={1.2}
            mb="$2"
            hoverStyle={{ scale: 1.05 }}
            pressStyle={{ scale: 0.95 }}
          />
        )}
      </Flex>
    </Div>
  )
}
