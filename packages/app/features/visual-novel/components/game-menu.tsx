'use client'

import {
  YStack,
  XStack,
  Text,
  Button,
  Sheet,
  Slider,
  Switch,
  Separator,
  AnimatePresence,
} from '@my/ui'
import { useState } from 'react'
import { useColorScheme } from 'react-native'
import {
  Settings,
  Save,
  FolderOpen,
  Home,
  Volume2,
  VolumeX,
  Zap,
  Pause,
  Play,
} from '@tamagui/lucide-icons'
import { VisualNovelSettings, GameSession } from '../types'

interface GameMenuProps {
  isOpen: boolean
  onClose: () => void
  settings: VisualNovelSettings
  onSettingsChange: (settings: VisualNovelSettings) => void
  gameSession?: GameSession
  onSaveGame: () => void
  onLoadGame: () => void
  onNewGame: () => void
  onMainMenu: () => void
}

export function GameMenu({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  gameSession,
  onSaveGame,
  onLoadGame,
  onNewGame,
  onMainMenu,
}: GameMenuProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'settings' | 'saves'>('main')
  const colorScheme = useColorScheme()

  const updateSettings = (key: keyof VisualNovelSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    })
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={onClose}
      snapPoints={[85]}
      dismissOnSnapToBottom
      animation="bouncy"
    >
      <Sheet.Overlay
        backgroundColor="rgba(0, 0, 0, 0.7)"
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />

      <Sheet.Handle backgroundColor="$color8" />

      <Sheet.Frame
        backgroundColor={colorScheme === 'dark' ? '$color1' : '$color2'}
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
        paddingHorizontal="$4"
        paddingTop="$2"
      >
        <YStack flex={1} gap="$4">
          {/* Header */}
          <XStack alignItems="center" justifyContent="space-between" paddingVertical="$2">
            <Text fontSize="$6" fontWeight="600" color="$color12">
              Game Menu
            </Text>
            <Button
              size="$3"
              circular
              chromeless
              onPress={onClose}
              hoverStyle={{ backgroundColor: '$color4' }}
            >
              <Text fontSize="$4">✕</Text>
            </Button>
          </XStack>

          {/* Tab Navigation */}
          <XStack gap="$2" backgroundColor="$color3" borderRadius="$4" padding="$1">
            {[
              { id: 'main', label: 'Game', icon: Home },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'saves', label: 'Saves', icon: Save },
            ].map((tab) => (
              <Button
                key={tab.id}
                flex={1}
                size="$3"
                backgroundColor={activeTab === tab.id ? '$color6' : 'transparent'}
                color={activeTab === tab.id ? '$color12' : '$color10'}
                onPress={() => setActiveTab(tab.id as any)}
                hoverStyle={{
                  backgroundColor: activeTab === tab.id ? '$color7' : '$color4',
                }}
                pressStyle={{ scale: 0.98 }}
                borderRadius="$3"
                icon={tab.icon}
              >
                {tab.label}
              </Button>
            ))}
          </XStack>

          {/* Content */}
          <YStack flex={1}>
            <AnimatePresence mode="wait">
              {activeTab === 'main' && (
                <YStack
                  key="main"
                  gap="$3"
                  animation="bouncy"
                  enterStyle={{ opacity: 0, x: -20 }}
                  exitStyle={{ opacity: 0, x: 20 }}
                >
                  <Button
                    size="$4"
                    backgroundColor="$blue9"
                    color="white"
                    onPress={onSaveGame}
                    icon={Save}
                    disabled={!gameSession}
                    opacity={gameSession ? 1 : 0.5}
                  >
                    Save Game
                  </Button>

                  <Button
                    size="$4"
                    backgroundColor="$green9"
                    color="white"
                    onPress={onLoadGame}
                    icon={FolderOpen}
                  >
                    Load Game
                  </Button>

                  <Separator />

                  <Button
                    size="$4"
                    backgroundColor="$red9"
                    color="white"
                    onPress={onNewGame}
                    icon={Zap}
                  >
                    New Game
                  </Button>

                  <Button size="$4" backgroundColor="$color6" onPress={onMainMenu} icon={Home}>
                    Main Menu
                  </Button>

                  {gameSession && (
                    <>
                      <Separator />
                      <YStack gap="$2" padding="$3" backgroundColor="$color3" borderRadius="$4">
                        <Text fontSize="$4" fontWeight="500" color="$color11">
                          Current Game
                        </Text>
                        <Text fontSize="$3" color="$color10">
                          {gameSession.title}
                        </Text>
                        <Text fontSize="$2" color="$color9">
                          Genre: {gameSession.genre} • Theme: {gameSession.theme}
                        </Text>
                        <Text fontSize="$2" color="$color9">
                          Started: {new Date(gameSession.createdAt).toLocaleDateString()}
                        </Text>
                      </YStack>
                    </>
                  )}
                </YStack>
              )}

              {activeTab === 'settings' && (
                <YStack
                  key="settings"
                  gap="$4"
                  animation="bouncy"
                  enterStyle={{ opacity: 0, x: -20 }}
                  exitStyle={{ opacity: 0, x: 20 }}
                >
                  {/* Text Speed */}
                  <YStack gap="$2">
                    <XStack alignItems="center" justifyContent="space-between">
                      <Text fontSize="$4" color="$color11">
                        Text Speed
                      </Text>
                      <Text fontSize="$3" color="$color9">
                        {settings.textSpeed}ms
                      </Text>
                    </XStack>
                    <Slider
                      value={[settings.textSpeed]}
                      onValueChange={([value]) => updateSettings('textSpeed', value)}
                      min={10}
                      max={200}
                      step={10}
                      backgroundColor="$color4"
                    >
                      <Slider.Track backgroundColor="$color6">
                        <Slider.TrackActive backgroundColor="$blue9" />
                      </Slider.Track>
                      <Slider.Thumb
                        size="$2"
                        index={0}
                        circular
                        backgroundColor="$blue10"
                        borderColor="$blue11"
                      />
                    </Slider>
                  </YStack>

                  {/* Auto Advance */}
                  <XStack alignItems="center" justifyContent="space-between">
                    <YStack flex={1}>
                      <Text fontSize="$4" color="$color11">
                        Auto Advance
                      </Text>
                      <Text fontSize="$3" color="$color9">
                        Automatically continue story
                      </Text>
                    </YStack>
                    <Switch
                      checked={settings.autoAdvance}
                      onCheckedChange={(checked) => updateSettings('autoAdvance', checked)}
                      backgroundColor={settings.autoAdvance ? '$blue9' : '$color6'}
                    />
                  </XStack>

                  {/* Auto Advance Delay */}
                  {settings.autoAdvance && (
                    <YStack gap="$2">
                      <XStack alignItems="center" justifyContent="space-between">
                        <Text fontSize="$4" color="$color11">
                          Auto Advance Delay
                        </Text>
                        <Text fontSize="$3" color="$color9">
                          {settings.autoAdvanceDelay}s
                        </Text>
                      </XStack>
                      <Slider
                        value={[settings.autoAdvanceDelay]}
                        onValueChange={([value]) => updateSettings('autoAdvanceDelay', value)}
                        min={1}
                        max={10}
                        step={0.5}
                        backgroundColor="$color4"
                      >
                        <Slider.Track backgroundColor="$color6">
                          <Slider.TrackActive backgroundColor="$blue9" />
                        </Slider.Track>
                        <Slider.Thumb
                          size="$2"
                          index={0}
                          circular
                          backgroundColor="$blue10"
                          borderColor="$blue11"
                        />
                      </Slider>
                    </YStack>
                  )}

                  <Separator />

                  {/* Volume Controls */}
                  <Text fontSize="$5" fontWeight="500" color="$color11">
                    Audio
                  </Text>

                  {/* Music Volume */}
                  <YStack gap="$2">
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap="$2">
                        <Volume2 size={16} color="$color10" />
                        <Text fontSize="$4" color="$color11">
                          Music
                        </Text>
                      </XStack>
                      <Text fontSize="$3" color="$color9">
                        {Math.round(settings.musicVolume * 100)}%
                      </Text>
                    </XStack>
                    <Slider
                      value={[settings.musicVolume]}
                      onValueChange={([value]) => updateSettings('musicVolume', value)}
                      min={0}
                      max={1}
                      step={0.1}
                      backgroundColor="$color4"
                    >
                      <Slider.Track backgroundColor="$color6">
                        <Slider.TrackActive backgroundColor="$green9" />
                      </Slider.Track>
                      <Slider.Thumb
                        size="$2"
                        index={0}
                        circular
                        backgroundColor="$green10"
                        borderColor="$green11"
                      />
                    </Slider>
                  </YStack>

                  {/* Effects Volume */}
                  <YStack gap="$2">
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap="$2">
                        <VolumeX size={16} color="$color10" />
                        <Text fontSize="$4" color="$color11">
                          Sound Effects
                        </Text>
                      </XStack>
                      <Text fontSize="$3" color="$color9">
                        {Math.round(settings.effectsVolume * 100)}%
                      </Text>
                    </XStack>
                    <Slider
                      value={[settings.effectsVolume]}
                      onValueChange={([value]) => updateSettings('effectsVolume', value)}
                      min={0}
                      max={1}
                      step={0.1}
                      backgroundColor="$color4"
                    >
                      <Slider.Track backgroundColor="$color6">
                        <Slider.TrackActive backgroundColor="$red9" />
                      </Slider.Track>
                      <Slider.Thumb
                        size="$2"
                        index={0}
                        circular
                        backgroundColor="$red10"
                        borderColor="$red11"
                      />
                    </Slider>
                  </YStack>
                </YStack>
              )}

              {activeTab === 'saves' && (
                <YStack
                  key="saves"
                  gap="$3"
                  animation="bouncy"
                  enterStyle={{ opacity: 0, x: -20 }}
                  exitStyle={{ opacity: 0, x: 20 }}
                >
                  <Text fontSize="$4" color="$color10" textAlign="center">
                    Save/Load functionality will be implemented here
                  </Text>

                  {/* Placeholder for save slots */}
                  {[1, 2, 3].map((slot) => (
                    <YStack
                      key={slot}
                      padding="$3"
                      backgroundColor="$color3"
                      borderRadius="$4"
                      borderWidth={1}
                      borderColor="$color6"
                      borderStyle="dashed"
                    >
                      <XStack alignItems="center" justifyContent="space-between">
                        <YStack>
                          <Text fontSize="$4" color="$color9">
                            Save Slot {slot}
                          </Text>
                          <Text fontSize="$2" color="$color8">
                            Empty
                          </Text>
                        </YStack>
                        <Button size="$3" backgroundColor="$color6" disabled opacity={0.5}>
                          Load
                        </Button>
                      </XStack>
                    </YStack>
                  ))}
                </YStack>
              )}
            </AnimatePresence>
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
