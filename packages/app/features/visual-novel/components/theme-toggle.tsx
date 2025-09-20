'use client'

import { useState } from 'react'
import { Button, useIsomorphicLayoutEffect, isWeb } from '@my/ui'
import { useThemeSetting, useRootTheme } from '@tamagui/next-theme'
import { useColorScheme } from 'react-native'
import { Sun, Moon } from '@tamagui/lucide-icons'

interface ThemeToggleProps {
  size?: '$2' | '$3' | '$4' | '$5'
  variant?: 'default' | 'minimal' | 'floating'
  showLabel?: boolean
}

export function ThemeToggle({
  size = '$3',
  variant = 'default',
  showLabel = false,
}: ThemeToggleProps) {
  const themeSetting = useThemeSetting()
  const [theme] = useRootTheme()
  const colorScheme = useColorScheme()

  const [clientTheme, setClientTheme] = useState<string | undefined>('light')

  useIsomorphicLayoutEffect(() => {
    if (isWeb) {
      setClientTheme(themeSetting.forcedTheme || themeSetting.current || theme)
    } else {
      setClientTheme(colorScheme || 'light')
    }
  }, [themeSetting.current, themeSetting.resolvedTheme, colorScheme, theme])

  const isDark = clientTheme === 'dark'
  const toggleTheme = () => {
    if (isWeb) {
      themeSetting.toggle()
    } else {
      // For React Native, we could implement a custom theme provider
      // For now, this will work with the system theme
      console.log('Theme toggle on React Native - using system theme')
    }
  }

  if (variant === 'minimal') {
    return (
      <Button
        size={size}
        circular
        chromeless
        icon={isDark ? Sun : Moon}
        onPress={toggleTheme}
        hoverStyle={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        }}
        pressStyle={{ scale: 0.95 }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      />
    )
  }

  if (variant === 'floating') {
    return (
      <Button
        size={size}
        circular
        backgroundColor={isDark ? 'rgba(99, 102, 241, 0.9)' : 'rgba(255, 255, 255, 0.9)'}
        borderWidth={1}
        borderColor={isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(0, 0, 0, 0.1)'}
        icon={isDark ? Sun : Moon}
        iconColor={isDark ? 'white' : '$color12'}
        onPress={toggleTheme}
        shadowColor={isDark ? 'rgba(99, 102, 241, 0.3)' : '$shadowColor'}
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.2}
        shadowRadius={8}
        elevation={8}
        hoverStyle={{
          backgroundColor: isDark ? 'rgba(99, 102, 241, 1)' : 'rgba(255, 255, 255, 1)',
          scale: 1.05,
          ...(isDark && {
            shadowColor: 'rgba(99, 102, 241, 0.5)',
            shadowOpacity: 0.3,
            shadowRadius: 12,
          }),
        }}
        pressStyle={{ scale: 0.95 }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        {...(isWeb &&
          isDark && {
            style: {
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            },
          })}
      />
    )
  }

  return (
    <Button
      size={size}
      backgroundColor={isDark ? 'rgba(30, 30, 50, 0.8)' : '$color2'}
      borderWidth={1}
      borderColor={isDark ? 'rgba(99, 102, 241, 0.4)' : '$color6'}
      onPress={toggleTheme}
      icon={isDark ? Sun : Moon}
      iconColor={isDark ? 'rgba(99, 102, 241, 0.9)' : '$color11'}
      hoverStyle={{
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '$color3',
        borderColor: isDark ? 'rgba(99, 102, 241, 0.6)' : '$blue7',
        ...(isDark && {
          shadowColor: 'rgba(99, 102, 241, 0.4)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }),
      }}
      pressStyle={{ scale: 0.98 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {showLabel && (isDark ? 'Light Mode' : 'Dark Mode')}
    </Button>
  )
}
