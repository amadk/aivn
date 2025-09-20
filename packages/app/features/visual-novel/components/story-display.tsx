'use client'

import { YStack, XStack, Text, Button, Input, AnimatePresence, isWeb, Image } from '@my/ui'
import { useState, useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { StorySegment, Choice } from '../types'
import { Play, Pause, SkipForward } from '@tamagui/lucide-icons'

interface StoryDisplayProps {
  segment: StorySegment
  onChoiceSelect: (choiceId: string) => void
  onCustomChoice: (text: string) => void
  isGenerating?: boolean
  autoAdvance?: boolean
  textSpeed?: number
}

export function StoryDisplay({
  segment,
  onChoiceSelect,
  onCustomChoice,
  isGenerating = false,
  autoAdvance = false,
  textSpeed = 50,
}: StoryDisplayProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [showChoices, setShowChoices] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const colorScheme = useColorScheme()

  // Typewriter effect for story text
  useEffect(() => {
    setDisplayedText('')
    setIsTyping(true)
    setShowChoices(false)

    let index = 0
    const text = segment.text
    const fastTextSpeed = Math.max(textSpeed * 0.3, 15) // Much faster, minimum 15ms

    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index))
        index++
      } else {
        setIsTyping(false)
        setShowChoices(segment.isBreakpoint)
        clearInterval(timer)
      }
    }, fastTextSpeed)

    return () => clearInterval(timer)
  }, [segment.text, textSpeed])

  const skipTypewriter = () => {
    setDisplayedText(segment.text)
    setIsTyping(false)
    setShowChoices(segment.isBreakpoint)
  }

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      onCustomChoice(customInput.trim())
      setCustomInput('')
      setShowCustomInput(false)
    }
  }

  return (
    <YStack flex={1} position="relative">
      {/* Story Text Container */}
      <YStack
        position="absolute"
        bottom="$4"
        left="$4"
        right="$4"
        backgroundColor={
          colorScheme === 'dark' ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.9)'
        }
        borderRadius="$6"
        padding="$4"
        borderWidth={1}
        borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(0, 0, 0, 0.1)'}
        shadowColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : '$shadowColor'}
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={colorScheme === 'dark' ? 0.4 : 0.2}
        shadowRadius={16}
        elevation={8}
        minHeight={150}
        maxHeight={400}
        {...(isWeb && {
          style: {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            ...(colorScheme === 'dark' && {
              boxShadow:
                '0 8px 32px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }),
          },
        })}
      >
        {/* Character Name */}
        {segment.characterName && (
          <XStack alignItems="center" marginBottom="$2">
            <Text
              fontSize="$5"
              fontWeight="600"
              color={colorScheme === 'dark' ? '$blue10' : '$blue11'}
            >
              {segment.characterName}
            </Text>
          </XStack>
        )}

        {/* Story Text */}
        <YStack
          flex={1}
          justifyContent="flex-start"
          onPress={isTyping ? skipTypewriter : undefined}
          cursor={isTyping ? 'pointer' : 'default'}
          hoverStyle={isTyping ? { backgroundColor: 'rgba(99, 102, 241, 0.05)' } : {}}
          pressStyle={isTyping ? { backgroundColor: 'rgba(99, 102, 241, 0.1)' } : {}}
          borderRadius="$2"
          padding="$1"
          marginHorizontal={-4}
        >
          <Text
            fontSize="$4"
            lineHeight="$6"
            color={colorScheme === 'dark' ? '$color12' : '$color12'}
            minHeight={80}
            userSelect={isTyping ? 'none' : 'auto'}
          >
            {displayedText}
            {isTyping && (
              <Text animation="bouncy" opacity={0.7}>
                |
              </Text>
            )}
          </Text>

          {/* Click hint when typing */}
          {isTyping && (
            <Text
              fontSize="$1"
              color={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.7)' : '$color9'}
              opacity={0.6}
              marginTop="$1"
              textAlign="right"
            >
              Click to skip
            </Text>
          )}
        </YStack>

        {/* Controls */}
        <XStack justifyContent="flex-end" alignItems="center" gap="$2" marginTop="$2">
          {isTyping && (
            <Button
              size="$3"
              chromeless
              circular
              icon={SkipForward}
              onPress={skipTypewriter}
              hoverStyle={{ backgroundColor: '$color5' }}
              pressStyle={{ scale: 0.95 }}
            />
          )}

          {!isTyping && !showChoices && autoAdvance && (
            <Button
              size="$3"
              chromeless
              circular
              icon={Play}
              onPress={() => {
                /* Auto advance logic */
              }}
              hoverStyle={{ backgroundColor: '$color5' }}
              pressStyle={{ scale: 0.95 }}
            />
          )}
        </XStack>

        {/* Choices Grid - Above text box in layout flow */}
        <AnimatePresence>
          {showChoices && !isGenerating && (
            <YStack
              paddingHorizontal="$4"
              paddingBottom="$4"
              animation="bouncy"
              enterStyle={{ opacity: 0, y: 20 }}
              exitStyle={{ opacity: 0, y: 20 }}
            >
              {/* 2x2 Grid for 4 choices */}
              <YStack gap="$2">
                <XStack gap="$2">
                  {segment.choices?.slice(0, 2).map((choice, index) => (
                    <Button
                      key={choice.id}
                      onPress={() => onChoiceSelect(choice.id)}
                      backgroundColor={
                        colorScheme === 'dark'
                          ? 'rgba(30, 30, 50, 0.9)'
                          : 'rgba(255, 255, 255, 0.9)'
                      }
                      borderWidth={1}
                      borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.4)' : '$color4'}
                      hoverStyle={{
                        backgroundColor:
                          colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '$color3',
                        borderColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.6)' : '$blue7',
                        scale: 1.02,
                        ...(colorScheme === 'dark' && {
                          shadowColor: 'rgba(99, 102, 241, 0.4)',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                        }),
                      }}
                      pressStyle={{ scale: 0.98 }}
                      paddingVertical="$3"
                      paddingHorizontal="$3"
                      borderRadius="$4"
                      animation="bouncy"
                      enterStyle={{ opacity: 0, y: 10 }}
                      flex={1}
                      minHeight={60}
                      style={{
                        animationDelay: `${index * 100}ms`,
                        ...(colorScheme === 'dark' && {
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                        }),
                      }}
                    >
                      <Text
                        color={colorScheme === 'dark' ? '$color12' : '$color12'}
                        fontSize="$3"
                        textAlign="center"
                        fontWeight="500"
                        numberOfLines={2}
                      >
                        {choice.text}
                      </Text>
                    </Button>
                  ))}
                </XStack>

                <XStack gap="$2">
                  {segment.choices?.slice(2, 4).map((choice, index) => (
                    <Button
                      key={choice.id}
                      onPress={() => onChoiceSelect(choice.id)}
                      backgroundColor={
                        colorScheme === 'dark'
                          ? 'rgba(30, 30, 50, 0.9)'
                          : 'rgba(255, 255, 255, 0.9)'
                      }
                      borderWidth={1}
                      borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.4)' : '$color4'}
                      hoverStyle={{
                        backgroundColor:
                          colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '$color3',
                        borderColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.6)' : '$blue7',
                        scale: 1.02,
                        ...(colorScheme === 'dark' && {
                          shadowColor: 'rgba(99, 102, 241, 0.4)',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                        }),
                      }}
                      pressStyle={{ scale: 0.98 }}
                      paddingVertical="$3"
                      paddingHorizontal="$3"
                      borderRadius="$4"
                      animation="bouncy"
                      enterStyle={{ opacity: 0, y: 10 }}
                      flex={1}
                      minHeight={60}
                      style={{
                        animationDelay: `${(index + 2) * 100}ms`,
                        ...(colorScheme === 'dark' && {
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                        }),
                      }}
                    >
                      <Text
                        color={colorScheme === 'dark' ? '$color12' : '$color12'}
                        fontSize="$3"
                        textAlign="center"
                        fontWeight="500"
                        numberOfLines={2}
                      >
                        {choice.text}
                      </Text>
                    </Button>
                  ))}
                </XStack>
              </YStack>

              {/* Custom Input Toggle */}
              <Button
                onPress={() => setShowCustomInput(!showCustomInput)}
                backgroundColor={showCustomInput ? '$blue5' : 'transparent'}
                borderWidth={1}
                borderColor="$blue7"
                borderStyle={showCustomInput ? 'solid' : 'dashed'}
                hoverStyle={{
                  backgroundColor: '$blue4',
                  borderColor: '$blue8',
                }}
                pressStyle={{ scale: 0.98 }}
                paddingVertical="$3"
                paddingHorizontal="$4"
                borderRadius="$4"
              >
                <Text color="$blue11" fontSize="$3" fontWeight="500">
                  {showCustomInput ? 'Cancel Custom Action' : '✨ Write Your Own Action'}
                </Text>
              </Button>

              {/* Custom Input Field */}
              <AnimatePresence>
                {showCustomInput && (
                  <YStack
                    gap="$2"
                    animation="bouncy"
                    enterStyle={{ opacity: 0, height: 0 }}
                    exitStyle={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      placeholder="Describe what you want to do..."
                      value={customInput}
                      onChangeText={setCustomInput}
                      multiline
                      numberOfLines={3}
                      backgroundColor={colorScheme === 'dark' ? '$color2' : '$color1'}
                      borderColor="$blue7"
                      focusStyle={{ borderColor: '$blue9' }}
                      fontSize="$3"
                    />
                    <XStack gap="$2" justifyContent="flex-end">
                      <Button
                        size="$3"
                        chromeless
                        onPress={() => {
                          setShowCustomInput(false)
                          setCustomInput('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="$3"
                        backgroundColor="$blue9"
                        color="white"
                        onPress={handleCustomSubmit}
                        disabled={!customInput.trim()}
                        opacity={customInput.trim() ? 1 : 0.5}
                      >
                        Submit Action
                      </Button>
                    </XStack>
                  </YStack>
                )}
              </AnimatePresence>
            </YStack>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {isGenerating && (
            <YStack
              alignItems="center"
              justifyContent="center"
              padding="$4"
              animation="bouncy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            >
              <Text color="$color10" fontSize="$3" textAlign="center">
                ✨ Generating story...
              </Text>
            </YStack>
          )}
        </AnimatePresence>
      </YStack>
    </YStack>
  )
}
