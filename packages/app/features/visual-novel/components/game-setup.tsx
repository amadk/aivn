'use client'

import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Form,
  Select,
  TextArea,
  AnimatePresence,
} from '@my/ui'
import { useState } from 'react'
import { useColorScheme } from 'react-native'
import { Sparkles, Play, Shuffle } from '@tamagui/lucide-icons'
import { ThemeToggle } from './theme-toggle'

interface GameSetupProps {
  onStartGame: (config: GameConfig) => void
  isGenerating?: boolean
}

export interface GameConfig {
  title: string
  genre: string
  theme: string
  setting: string
  playerCharacter: string
  tone: string
  customPrompt?: string
}

const GENRES = [
  { label: 'Fantasy Adventure', value: 'fantasy' },
  { label: 'Science Fiction', value: 'sci-fi' },
  { label: 'Mystery/Detective', value: 'mystery' },
  { label: 'Romance', value: 'romance' },
  { label: 'Horror/Thriller', value: 'horror' },
  { label: 'Historical', value: 'historical' },
  { label: 'Modern Drama', value: 'drama' },
  { label: 'Superhero', value: 'superhero' },
]

const THEMES = [
  { label: "Hero's Journey", value: 'hero-journey' },
  { label: 'Coming of Age', value: 'coming-of-age' },
  { label: 'Redemption', value: 'redemption' },
  { label: 'Love & Relationships', value: 'love' },
  { label: 'Survival', value: 'survival' },
  { label: 'Discovery', value: 'discovery' },
  { label: 'Betrayal & Trust', value: 'betrayal' },
  { label: 'Good vs Evil', value: 'good-vs-evil' },
]

const TONES = [
  { label: 'Light & Humorous', value: 'light' },
  { label: 'Serious & Dramatic', value: 'serious' },
  { label: 'Dark & Mysterious', value: 'dark' },
  { label: 'Romantic & Emotional', value: 'romantic' },
  { label: 'Action-Packed', value: 'action' },
  { label: 'Thoughtful & Philosophical', value: 'philosophical' },
]

export function GameSetup({ onStartGame, isGenerating = false }: GameSetupProps) {
  const [config, setConfig] = useState<GameConfig>({
    title: '',
    genre: 'fantasy',
    theme: 'hero-journey',
    setting: '',
    playerCharacter: '',
    tone: 'light',
    customPrompt: '',
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const colorScheme = useColorScheme()

  const updateConfig = (key: keyof GameConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const randomizeConfig = () => {
    const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)]
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)]
    const randomTone = TONES[Math.floor(Math.random() * TONES.length)]

    setConfig((prev) => ({
      ...prev,
      genre: randomGenre.value,
      theme: randomTheme.value,
      tone: randomTone.value,
    }))
  }

  const handleSubmit = () => {
    if (!config.title.trim()) {
      config.title = `${GENRES.find((g) => g.value === config.genre)?.label} Adventure`
    }
    onStartGame(config)
  }

  const isValid = config.title.trim().length > 0 || config.setting.trim().length > 0

  return (
    <YStack
      flex={1}
      padding="$4"
      gap="$4"
      justifyContent="center"
      maxWidth={600}
      alignSelf="center"
      position="relative"
      style={{
        ...(colorScheme === 'dark' && {
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(139, 69, 193, 0.06) 0%, transparent 50%),
            linear-gradient(135deg, rgba(10, 10, 10, 0.9) 0%, rgba(26, 26, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%)
          `,
        }),
      }}
    >
      {/* Floating Theme Toggle */}
      <YStack position="absolute" top="$3" right="$3" zIndex={10}>
        <ThemeToggle size="$3" variant="floating" />
      </YStack>
      {/* Header */}
      <YStack alignItems="center" gap="$2" marginBottom="$4">
        <Sparkles
          size={48}
          color={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.9)' : '$blue10'}
          style={{
            ...(colorScheme === 'dark' && {
              filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))',
            }),
          }}
        />
        <Text
          fontSize="$8"
          fontWeight="700"
          color={colorScheme === 'dark' ? '#ffffff' : '$color12'}
          textAlign="center"
          style={{
            ...(colorScheme === 'dark' && {
              textShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
            }),
          }}
        >
          Create Your Story
        </Text>
        <Text
          fontSize="$4"
          color={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : '$color10'}
          textAlign="center"
        >
          Let AI generate a unique visual novel adventure for you
        </Text>
      </YStack>

      <Form onSubmit={handleSubmit}>
        <YStack
          gap="$4"
          backgroundColor={colorScheme === 'dark' ? 'rgba(10, 10, 20, 0.8)' : 'transparent'}
          padding={colorScheme === 'dark' ? '$4' : '$0'}
          borderRadius={colorScheme === 'dark' ? '$6' : '$0'}
          borderWidth={colorScheme === 'dark' ? 1 : 0}
          borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}
          {...(colorScheme === 'dark' && {
            style: {
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1)',
            },
          })}
        >
          {/* Story Title */}
          <YStack gap="$2">
            <Text
              fontSize="$4"
              fontWeight="500"
              color={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '$color11'}
            >
              Story Title (Optional)
            </Text>
            <Input
              placeholder="Enter a title or leave blank for AI to generate"
              value={config.title}
              onChangeText={(text) => updateConfig('title', text)}
              backgroundColor={colorScheme === 'dark' ? 'rgba(20, 20, 35, 0.8)' : '$color1'}
              borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : '$color6'}
              focusStyle={{
                borderColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.8)' : '$blue9',
                ...(colorScheme === 'dark' && {
                  shadowColor: 'rgba(99, 102, 241, 0.3)',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.5,
                  shadowRadius: 4,
                }),
              }}
              color={colorScheme === 'dark' ? '$color12' : undefined}
              placeholderTextColor={colorScheme === 'dark' ? '$color9' : undefined}
            />
          </YStack>

          {/* Genre Selection */}
          <YStack gap="$2">
            <Text
              fontSize="$4"
              fontWeight="500"
              color={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '$color11'}
            >
              Genre *
            </Text>
            <Select value={config.genre} onValueChange={(value) => updateConfig('genre', value)}>
              <Select.Trigger
                backgroundColor={colorScheme === 'dark' ? 'rgba(20, 20, 35, 0.8)' : '$color1'}
                borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : '$color6'}
                focusStyle={{
                  borderColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.8)' : '$blue9',
                  ...(colorScheme === 'dark' && {
                    shadowColor: 'rgba(99, 102, 241, 0.3)',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                  }),
                }}
                color={colorScheme === 'dark' ? '$color12' : undefined}
              >
                <Select.Value placeholder="Choose a genre" />
              </Select.Trigger>
              <Select.Content>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {GENRES.map((genre) => (
                    <Select.Item
                      key={genre.value}
                      index={GENRES.indexOf(genre)}
                      value={genre.value}
                    >
                      <Select.ItemText>{genre.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
          </YStack>

          {/* Theme Selection */}
          <YStack gap="$2">
            <Text
              fontSize="$4"
              fontWeight="500"
              color={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '$color11'}
            >
              Theme *
            </Text>
            <Select value={config.theme} onValueChange={(value) => updateConfig('theme', value)}>
              <Select.Trigger
                backgroundColor={colorScheme === 'dark' ? 'rgba(20, 20, 35, 0.8)' : '$color1'}
                borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : '$color6'}
                focusStyle={{
                  borderColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.8)' : '$blue9',
                  ...(colorScheme === 'dark' && {
                    shadowColor: 'rgba(99, 102, 241, 0.3)',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                  }),
                }}
                color={colorScheme === 'dark' ? '$color12' : undefined}
              >
                <Select.Value placeholder="Choose a theme" />
              </Select.Trigger>
              <Select.Content>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {THEMES.map((theme) => (
                    <Select.Item
                      key={theme.value}
                      index={THEMES.indexOf(theme)}
                      value={theme.value}
                    >
                      <Select.ItemText>{theme.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
          </YStack>

          {/* Tone Selection */}
          <YStack gap="$2">
            <Text
              fontSize="$4"
              fontWeight="500"
              color={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '$color11'}
            >
              Tone *
            </Text>
            <Select value={config.tone} onValueChange={(value) => updateConfig('tone', value)}>
              <Select.Trigger
                backgroundColor={colorScheme === 'dark' ? 'rgba(20, 20, 35, 0.8)' : '$color1'}
                borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : '$color6'}
                focusStyle={{
                  borderColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.8)' : '$blue9',
                  ...(colorScheme === 'dark' && {
                    shadowColor: 'rgba(99, 102, 241, 0.3)',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                  }),
                }}
                color={colorScheme === 'dark' ? '$color12' : undefined}
              >
                <Select.Value placeholder="Choose a tone" />
              </Select.Trigger>
              <Select.Content>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {TONES.map((tone) => (
                    <Select.Item key={tone.value} index={TONES.indexOf(tone)} value={tone.value}>
                      <Select.ItemText>{tone.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
          </YStack>

          {/* Quick Actions */}
          <XStack gap="$2" justifyContent="center">
            <Button
              size="$3"
              backgroundColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.8)' : '$blue9'}
              color="white"
              onPress={randomizeConfig}
              icon={Shuffle}
              flex={1}
              hoverStyle={{
                backgroundColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 1)' : '$blue10',
                ...(colorScheme === 'dark' && {
                  shadowColor: 'rgba(99, 102, 241, 0.4)',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }),
              }}
              pressStyle={{ scale: 0.98 }}
            >
              Randomize
            </Button>
            <Button
              size="$3"
              backgroundColor={
                showAdvanced
                  ? colorScheme === 'dark'
                    ? 'rgba(139, 69, 193, 0.8)'
                    : '$color6'
                  : colorScheme === 'dark'
                    ? 'rgba(75, 85, 99, 0.8)'
                    : '$color9'
              }
              color="white"
              onPress={() => setShowAdvanced(!showAdvanced)}
              flex={1}
              hoverStyle={{
                backgroundColor: showAdvanced
                  ? colorScheme === 'dark'
                    ? 'rgba(139, 69, 193, 1)'
                    : '$color7'
                  : colorScheme === 'dark'
                    ? 'rgba(75, 85, 99, 1)'
                    : '$color10',
                ...(colorScheme === 'dark' && {
                  shadowColor: showAdvanced ? 'rgba(139, 69, 193, 0.4)' : 'rgba(75, 85, 99, 0.4)',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }),
              }}
              pressStyle={{ scale: 0.98 }}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </XStack>

          {/* Advanced Options */}
          <AnimatePresence>
            {showAdvanced && (
              <YStack
                gap="$4"
                animation="bouncy"
                enterStyle={{ opacity: 0, height: 0 }}
                exitStyle={{ opacity: 0, height: 0 }}
                backgroundColor={colorScheme === 'dark' ? 'rgba(20, 20, 35, 0.6)' : 'transparent'}
                padding={colorScheme === 'dark' ? '$3' : '$0'}
                borderRadius={colorScheme === 'dark' ? '$4' : '$0'}
                borderWidth={colorScheme === 'dark' ? 1 : 0}
                borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}
                {...(colorScheme === 'dark' && {
                  style: {
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  },
                })}
              >
                {/* Setting Description */}
                <YStack gap="$2">
                  <Text
                    fontSize="$4"
                    fontWeight="500"
                    color={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '$color11'}
                  >
                    Setting Description
                  </Text>
                  <TextArea
                    placeholder="Describe the world, time period, or specific location..."
                    value={config.setting}
                    onChangeText={(text) => updateConfig('setting', text)}
                    backgroundColor={colorScheme === 'dark' ? 'rgba(20, 20, 35, 0.8)' : '$color1'}
                    borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : '$color6'}
                    focusStyle={{
                      borderColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.8)' : '$blue9',
                      ...(colorScheme === 'dark' && {
                        shadowColor: 'rgba(99, 102, 241, 0.3)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                      }),
                    }}
                    color={colorScheme === 'dark' ? '$color12' : undefined}
                    placeholderTextColor={colorScheme === 'dark' ? '$color9' : undefined}
                    minHeight={80}
                  />
                </YStack>

                {/* Player Character */}
                <YStack gap="$2">
                  <Text
                    fontSize="$4"
                    fontWeight="500"
                    color={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '$color11'}
                  >
                    Player Character
                  </Text>
                  <Input
                    placeholder="Describe your character (optional - AI will create one if empty)"
                    value={config.playerCharacter}
                    onChangeText={(text) => updateConfig('playerCharacter', text)}
                    backgroundColor={colorScheme === 'dark' ? 'rgba(20, 20, 35, 0.8)' : '$color1'}
                    borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : '$color6'}
                    focusStyle={{
                      borderColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.8)' : '$blue9',
                      ...(colorScheme === 'dark' && {
                        shadowColor: 'rgba(99, 102, 241, 0.3)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                      }),
                    }}
                    color={colorScheme === 'dark' ? '$color12' : undefined}
                    placeholderTextColor={colorScheme === 'dark' ? '$color9' : undefined}
                  />
                </YStack>

                {/* Custom Prompt */}
                <YStack gap="$2">
                  <Text
                    fontSize="$4"
                    fontWeight="500"
                    color={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '$color11'}
                  >
                    Custom Story Prompt
                  </Text>
                  <TextArea
                    placeholder="Any specific ideas, plot points, or requirements for your story..."
                    value={config.customPrompt}
                    onChangeText={(text) => updateConfig('customPrompt', text)}
                    backgroundColor={colorScheme === 'dark' ? 'rgba(20, 20, 35, 0.8)' : '$color1'}
                    borderColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : '$color6'}
                    focusStyle={{
                      borderColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.8)' : '$blue9',
                      ...(colorScheme === 'dark' && {
                        shadowColor: 'rgba(99, 102, 241, 0.3)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                      }),
                    }}
                    color={colorScheme === 'dark' ? '$color12' : undefined}
                    placeholderTextColor={colorScheme === 'dark' ? '$color9' : undefined}
                    minHeight={100}
                  />
                </YStack>
              </YStack>
            )}
          </AnimatePresence>

          {/* Start Button */}
          <Button
            size="$5"
            backgroundColor={colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.9)' : '$blue9'}
            color="white"
            onPress={handleSubmit}
            disabled={isGenerating}
            opacity={isGenerating ? 0.7 : 1}
            marginTop="$4"
            icon={isGenerating ? undefined : Play}
            animation="bouncy"
            pressStyle={{ scale: 0.98 }}
            hoverStyle={{
              backgroundColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 1)' : '$blue10',
              ...(colorScheme === 'dark' && {
                shadowColor: 'rgba(99, 102, 241, 0.6)',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
              }),
            }}
            {...(colorScheme === 'dark' && {
              style: {
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
              },
            })}
          >
            {isGenerating ? (
              <Text color="white" fontSize="$4">
                ✨ Generating Your Story...
              </Text>
            ) : (
              <Text color="white" fontSize="$4" fontWeight="600">
                Start Adventure
              </Text>
            )}
          </Button>

          {/* Info Text */}
          <Text
            fontSize="$2"
            color={colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '$color9'}
            textAlign="center"
            marginTop="$2"
            style={{
              ...(colorScheme === 'dark' && {
                textShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
              }),
            }}
          >
            Your story will be generated using AI and will include unique characters, plot twists,
            and choices tailored to your preferences.
          </Text>
        </YStack>
      </Form>
    </YStack>
  )
}
