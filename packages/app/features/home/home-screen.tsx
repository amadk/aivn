import {
  Anchor,
  Button,
  Center,
  Div,
  H1,
  Paragraph,
  Separator,
  Sheet,
  SwitchRouterButton,
  SwitchThemeButton,
  useToastController,
  XStack,
  YStack,
  Input,
  Text,
  Form,
  Flex,
  isWeb,
  SizableText,
  AnimatePresence,
} from '@my/ui'
import { DraggableIframe } from 'app/components/DraggableIframe'
import {
  ChevronDown,
  ChevronUp,
  Send,
  Bot,
  User,
  Camera,
  X,
  MessageCircle,
  Settings,
  History,
  Plus,
  Maximize2,
  Minimize2,
  Grid3x3,
  Laptop2,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from '@tamagui/lucide-icons'
import { useEffect, useRef, useState } from 'react'
import { Platform, FlatList, useColorScheme, Image } from 'react-native'
import { useLink, usePathname, useRouter } from 'solito/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { ChatInput } from './components/chat-input'
import { MessagePart } from './components/message-parts'

interface ChatTab {
  id: string
  title: string
  messages: any[]
  input: string
}

interface IframeWindow {
  id: string
  filename: string
  content: string
  title: string
  width: number
  height: number
  position: { x: number; y: number }
}

interface Space {
  id: string
  name: string
  iframeWindows: IframeWindow[]
}

interface HomeScreenProps {
  spaceId?: string
}

export function HomeScreen({ spaceId }: HomeScreenProps) {
  const router = useRouter()

  const [isMessagesVisible, setIsMessagesVisible] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTabId, setActiveTabId] = useState('chat-1')
  const [chatTabs, setChatTabs] = useState<ChatTab[]>([
    { id: 'chat-1', title: 'Chat 1', messages: [], input: '' },
  ])
  const [iframeWindows, setIframeWindows] = useState<IframeWindow[]>([])
  const colorScheme = useColorScheme()
  const isUpdatingMessagesRef = useRef(false)

  // Initialize default space ID from URL or default to 'space-1'
  const defaultSpaceId = spaceId || 'space-1'

  // Space state management
  const [spaces, setSpaces] = useState<Space[]>(() => {
    // Load spaces from localStorage on web
    if (isWeb && typeof window !== 'undefined') {
      const savedSpaces = localStorage.getItem('aios_spaces')
      if (savedSpaces) {
        try {
          return JSON.parse(savedSpaces)
        } catch (e) {
          console.error('Failed to parse saved spaces:', e)
        }
      }
    }
    return [{ id: 'space-1', name: 'space-1', iframeWindows: [] }]
  })
  const [showSpaceSwitcher, setShowSpaceSwitcher] = useState(false)

  // Save spaces to localStorage whenever they change
  useEffect(() => {
    if (isWeb && typeof window !== 'undefined') {
      localStorage.setItem('aios_spaces', JSON.stringify(spaces))
    }
  }, [spaces])

  // Get active space ID from URL parameter
  const activeSpaceId = spaceId || spaces[0]?.id || 'space-1'

  // Get current active tab
  const activeTab = chatTabs.find((tab) => tab.id === activeTabId) || chatTabs[0]

  // Ensure the space from URL exists in our spaces array
  useEffect(() => {
    if (activeSpaceId && !spaces.find((s) => s.id === activeSpaceId)) {
      // Create the space if it doesn't exist
      setSpaces((prev) => [
        ...prev,
        {
          id: activeSpaceId,
          name: activeSpaceId,
          iframeWindows: [],
        },
      ])
    }
  }, [activeSpaceId])

  // Set initial space in URL if not present
  useEffect(() => {
    if (!spaceId && isWeb) {
      // No space in URL, redirect to default space
      router.replace(`/?space=${spaces[0]?.id || 'space-1'}`)
    }
  }, [spaceId, spaces, router])

  // Get current active space
  const activeSpace = spaces.find((space) => space.id === activeSpaceId) || spaces[0]

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // body: { model: 'openai/gpt-4o' },
      body: { model: 'anthropic/claude-4-sonnet' },
    }),
    onFinish: (data) => {
      console.log('onfinish', data)
    },
    onData: (data) => {
      console.log('onfinish', data)
    },
    onToolCall: ({ toolCall }) => {
      createIframeWindow({ ...(toolCall?.input ?? {}), id: `iframe-${Date.now()}` })
    },
  })

  // console.log('error', error)

  // Update messages when switching tabs
  useEffect(() => {
    isUpdatingMessagesRef.current = true
    setMessages(activeTab.messages)
    // Use setTimeout to reset the flag after the update completes
    setTimeout(() => {
      isUpdatingMessagesRef.current = false
    }, 0)
  }, [activeTabId, setMessages])

  // console.log('messages', JSON.stringify(messages, null, 2))
  // Tab management functions
  const createNewTab = () => {
    const newTabId = `chat-${Date.now()}`
    const newTab: ChatTab = {
      id: newTabId,
      title: `Chat ${chatTabs.length + 1}`,
      messages: [],
      input: '',
    }
    setChatTabs((prev) => [...prev, newTab])
    setActiveTabId(newTabId)
  }

  const closeTab = (tabId: string) => {
    if (chatTabs.length <= 1) return // Don't close the last tab

    setChatTabs((prev) => prev.filter((tab) => tab.id !== tabId))

    // If we're closing the active tab, switch to another tab
    if (activeTabId === tabId) {
      const remainingTabs = chatTabs.filter((tab) => tab.id !== tabId)
      setActiveTabId(remainingTabs[0]?.id || '')
    }
  }

  const switchTab = (tabId: string) => {
    // Save current input to the current tab before switching
    setChatTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId ? { ...tab, input: activeTab.input, messages: messages } : tab
      )
    )
    setActiveTabId(tabId)
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (activeTab.input.trim()) {
      sendMessage({ text: activeTab.input })
      // Update the tab's input
      setChatTabs((prev) =>
        prev.map((tab) => (tab.id === activeTabId ? { ...tab, input: '' } : tab))
      )
    }
  }

  const updateTabInput = (value: string) => {
    setChatTabs((prev) =>
      prev.map((tab) => (tab.id === activeTabId ? { ...tab, input: value } : tab))
    )
  }

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev)
    // Ensure messages are visible when entering fullscreen
    if (!isFullscreen) {
      setIsMessagesVisible(true)
    }
  }

  // Iframe management functions
  const createIframeWindow = (iframeData) => {
    setSpaces((prev) =>
      prev.map((space) =>
        space.id === activeSpaceId
          ? { ...space, iframeWindows: [...space.iframeWindows, iframeData] }
          : space
      )
    )
  }

  const closeIframeWindow = (id: string) => {
    setSpaces((prev) =>
      prev.map((space) =>
        space.id === activeSpaceId
          ? {
              ...space,
              iframeWindows: space.iframeWindows.filter((iframe) => iframe.id !== id),
            }
          : space
      )
    )
  }

  // Helper function to update URL with space parameter
  const navigateToSpace = (spaceId: string) => {
    // Solito's router works the same way on both platforms
    router.push(`/?space=${spaceId}`)
  }

  // Space management functions
  const createNewSpace = () => {
    const timestamp = Date.now()
    const newSpaceId = `space-${timestamp}`
    const newSpace: Space = {
      id: newSpaceId,
      name: newSpaceId, // Use the ID as the name
      iframeWindows: [],
    }
    setSpaces((prev) => [...prev, newSpace])
    navigateToSpace(newSpaceId)
  }

  const switchSpace = (spaceId: string) => {
    if (spaceId !== activeSpaceId) {
      navigateToSpace(spaceId)
    }
    setShowSpaceSwitcher(false)
  }

  const closeSpace = (spaceId: string) => {
    if (spaces.length <= 1) return // Don't close the last space

    setSpaces((prev) => prev.filter((space) => space.id !== spaceId))

    // If we're closing the active space, switch to another space
    if (activeSpaceId === spaceId) {
      const remainingSpaces = spaces.filter((space) => space.id !== spaceId)
      navigateToSpace(remainingSpaces[0]?.id || 'space-1')
    }
  }

  // Navigation helpers
  const goToPreviousSpace = () => {
    const currentIndex = spaces.findIndex((s) => s.id === activeSpaceId)
    if (currentIndex > 0) {
      navigateToSpace(spaces[currentIndex - 1].id)
    }
  }

  const goToNextSpace = () => {
    const currentIndex = spaces.findIndex((s) => s.id === activeSpaceId)
    if (currentIndex < spaces.length - 1) {
      navigateToSpace(spaces[currentIndex + 1].id)
    }
  }

  // Keyboard shortcuts for space switching
  useEffect(() => {
    if (!isWeb) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Left/Right arrow to switch spaces
      if ((e.metaKey || e.ctrlKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault()
        if (e.key === 'ArrowLeft') {
          goToPreviousSpace()
        } else {
          goToNextSpace()
        }
      }

      // Cmd/Ctrl + Number to switch to specific space
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const spaceIndex = parseInt(e.key) - 1
        if (spaceIndex < spaces.length) {
          navigateToSpace(spaces[spaceIndex].id)
        }
      }

      // F3 or Mission Control key to show space switcher
      if (e.key === 'F3' || (e.metaKey && e.key === 'ArrowUp')) {
        e.preventDefault()
        setShowSpaceSwitcher((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [spaces, activeSpaceId, goToPreviousSpace, goToNextSpace, navigateToSpace])

  // Update messages in the current tab when they change (but not when we're switching tabs)
  // useEffect(() => {
  //   if (!isUpdatingMessagesRef.current) {
  //     setChatTabs((prev) =>
  //       prev.map((tab) => (tab.id === activeTabId ? { ...tab, messages: messages } : tab))
  //     )
  //   }
  // }, [messages, activeTabId])

  const isLoading = status === 'streaming'
  const scrollViewRef = useRef<FlatList>(null)

  // Prepare data for FlatList
  const chatData = [...messages]

  // // Add loading indicator as a special item if streaming
  // if (isLoading) {
  //   chatData.push({
  //     id: 'loading',
  //     role: 'assistant',
  //     parts: [{ type: 'text', text: 'Thinking...' }],
  //   })
  // }

  const renderChatMessage = ({ item: message }: { item: any }) => {
    const isLoadingMessage = message.id === 'loading'

    return (
      <XStack
        space="$3"
        alignItems="flex-start"
        justifyContent={message.role === 'user' ? 'flex-end' : 'flex-start'}
        marginBottom="$3"
      >
        {message.role === 'assistant' && (
          <YStack
            backgroundColor="$blue5"
            borderRadius="$10"
            padding="$2"
            alignItems="center"
            justifyContent="center"
          >
            <Bot size={16} color="$blue11" />
          </YStack>
        )}

        <YStack
          backgroundColor={message.role === 'user' ? '$blue9' : '$backgroundHover'}
          borderRadius="$4"
          padding="$3"
          maxWidth="80%"
          borderTopLeftRadius={message.role === 'user' ? '$4' : '$1'}
          borderTopRightRadius={message.role === 'assistant' ? '$4' : '$1'}
        >
          {message.parts?.map((part: any, index: number) => (
            <MessagePart key={index} part={part} index={index} />
          ))}
        </YStack>

        {message.role === 'user' && (
          <YStack
            backgroundColor="$blue9"
            borderRadius="$10"
            padding="$2"
            alignItems="center"
            justifyContent="center"
          >
            <User size={16} color="white" />
          </YStack>
        )}
      </XStack>
    )
  }

  // Define wallpaper image URLs based on theme
  const lightWallpaper =
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=1080&fit=crop&crop=center'
  const darkWallpaper =
    'https://hdwallpapers4k.com/wp-content/uploads/2025/03/minimalist_dark_theme_wallpaper_ff8770f6.png.webp'
  // 'https://t3.ftcdn.net/jpg/05/64/82/08/360_F_564820811_n9WP1mM43pLiQwLkIA07KF9Hat5vkX2v.jpg'
  // 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&h=1080&fit=crop&crop=center'

  const wallpaperUrl = colorScheme === 'dark' ? darkWallpaper : lightWallpaper

  return (
    <YStack flex={1} position="relative">
      {/* Wallpaper Background */}
      <Image
        source={{ uri: wallpaperUrl }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
        }}
        resizeMode="cover"
      />

      {/* macOS-style Top Menu Bar */}
      <XStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        height={32}
        backgroundColor={
          colorScheme === 'dark' ? 'rgba(38, 38, 38, 0.85)' : 'rgba(242, 242, 242, 0.85)'
        }
        paddingHorizontal="$3"
        alignItems="center"
        justifyContent="space-between"
        zIndex={10}
        borderBottomWidth={1}
        borderBottomColor={
          colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
        {...(isWeb && {
          style: {
            backdropFilter: 'blur(50px)',
            WebkitBackdropFilter: 'blur(50px)',
          },
        })}
      >
        {/* Left section */}
        <XStack gap="$2" alignItems="center" flex={1}>
          {/* Space Switcher Button */}
          <Button
            size="$2"
            backgroundColor="transparent"
            borderWidth={0}
            paddingHorizontal="$2"
            paddingVertical="$1"
            onPress={() => setShowSpaceSwitcher(true)}
            hoverStyle={{
              backgroundColor:
                colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            }}
            pressStyle={{ scale: 0.98 }}
          >
            <XStack gap="$1.5" alignItems="center">
              <Grid3x3 size={14} color={colorScheme === 'dark' ? '$color11' : '$color12'} />
              <Text
                fontSize="$2"
                color={colorScheme === 'dark' ? '$color11' : '$color12'}
                fontWeight="500"
              >
                Spaces
              </Text>
            </XStack>
          </Button>
        </XStack>

        {/* Center section - Active Space */}
        <XStack gap="$2" alignItems="center">
          <Button
            size="$1"
            circular
            chromeless
            icon={ChevronLeft}
            disabled={spaces.findIndex((s) => s.id === activeSpaceId) === 0}
            opacity={spaces.findIndex((s) => s.id === activeSpaceId) === 0 ? 0.3 : 1}
            onPress={goToPreviousSpace}
            scaleIcon={0.8}
            paddingHorizontal="$1"
            hoverStyle={{
              backgroundColor:
                colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            }}
            aria-label="Previous Space (⌘←)"
          />

          <Text
            fontSize="$2"
            color={colorScheme === 'dark' ? '$color11' : '$color12'}
            fontWeight="500"
            minWidth={100}
            textAlign="center"
          >
            {activeSpace.name}
          </Text>

          <Button
            size="$1"
            circular
            chromeless
            icon={ChevronRight}
            disabled={spaces.findIndex((s) => s.id === activeSpaceId) === spaces.length - 1}
            opacity={
              spaces.findIndex((s) => s.id === activeSpaceId) === spaces.length - 1 ? 0.3 : 1
            }
            onPress={goToNextSpace}
            scaleIcon={0.8}
            paddingHorizontal="$1"
            hoverStyle={{
              backgroundColor:
                colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            }}
            aria-label="Next Space (⌘→)"
          />
        </XStack>

        {/* Right section */}
        <XStack gap="$2" alignItems="center" flex={1} justifyContent="flex-end">
          <Text fontSize="$1" color={colorScheme === 'dark' ? '$color10' : '$color11'}>
            {spaces.indexOf(activeSpace) + 1} of {spaces.length}
          </Text>
        </XStack>
      </XStack>

      {/* Space Switcher UI */}
      <AnimatePresence>
        {showSpaceSwitcher && (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0, 0, 0, 0.8)"
            zIndex={100}
            animation="quick"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            onPress={() => setShowSpaceSwitcher(false)}
          >
            <Center flex={1} padding="$4">
              <YStack gap="$4" alignItems="center">
                <Text fontSize="$8" fontWeight="600" color="white">
                  Spaces
                </Text>

                {/* Space Grid */}
                <XStack gap="$4" flexWrap="wrap" justifyContent="center">
                  {spaces.map((space, index) => (
                    <YStack
                      key={space.id}
                      backgroundColor={space.id === activeSpaceId ? '$blue9' : '$backgroundHover'}
                      borderRadius="$4"
                      padding="$3"
                      width={200}
                      height={150}
                      borderWidth={space.id === activeSpaceId ? 2 : 1}
                      borderColor={space.id === activeSpaceId ? '$blue11' : '$borderColor'}
                      animation="bouncy"
                      hoverStyle={{ scale: 1.05 }}
                      pressStyle={{ scale: 0.95 }}
                      onPress={() => switchSpace(space.id)}
                      position="relative"
                      overflow="hidden"
                    >
                      {/* Space Preview */}
                      <YStack flex={1} alignItems="center" justifyContent="center">
                        <Monitor size={40} color="$color10" />
                        <Text fontSize="$5" fontWeight="500" marginTop="$2">
                          {space.name}
                        </Text>
                        <Text fontSize="$2" color="$color10" marginTop="$1">
                          {space.iframeWindows.length} window
                          {space.iframeWindows.length !== 1 ? 's' : ''}
                        </Text>
                      </YStack>

                      {/* Keyboard shortcut hint */}
                      <Text
                        position="absolute"
                        top="$2"
                        left="$2"
                        fontSize="$2"
                        color="$color11"
                        backgroundColor="$background"
                        paddingHorizontal="$1.5"
                        paddingVertical="$0.5"
                        borderRadius="$2"
                      >
                        ⌘{index + 1}
                      </Text>

                      {/* Close button */}
                      {spaces.length > 1 && (
                        <Button
                          size="$2"
                          circular
                          chromeless
                          icon={X}
                          position="absolute"
                          top="$2"
                          right="$2"
                          onPress={(e) => {
                            e.stopPropagation()
                            closeSpace(space.id)
                          }}
                          backgroundColor="$red5"
                          hoverStyle={{ backgroundColor: '$red6' }}
                          pressStyle={{ scale: 0.9 }}
                        />
                      )}
                    </YStack>
                  ))}

                  {/* Add New Space Button */}
                  <YStack
                    backgroundColor="$backgroundHover"
                    borderRadius="$4"
                    padding="$3"
                    width={200}
                    height={150}
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderStyle="dashed"
                    animation="bouncy"
                    hoverStyle={{ scale: 1.05, backgroundColor: '$color3' }}
                    pressStyle={{ scale: 0.95 }}
                    onPress={createNewSpace}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Plus size={40} color="$color10" />
                    <Text fontSize="$4" color="$color10" marginTop="$2">
                      New Space
                    </Text>
                  </YStack>
                </XStack>

                {/* Instructions */}
                <YStack gap="$2" alignItems="center" marginTop="$4">
                  <Text fontSize="$3" color="$color11">
                    Press ⌘← or ⌘→ to switch spaces
                  </Text>
                  <Text fontSize="$3" color="$color11">
                    Press F3 or ⌘↑ to open space switcher
                  </Text>
                </YStack>
              </YStack>
            </Center>
          </YStack>
        )}
      </AnimatePresence>

      {/* Iframe windows - positioned behind chat */}
      <AnimatePresence>
        <YStack
          key={activeSpaceId}
          animation="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        >
          {activeSpace.iframeWindows.map((iframe) => (
            <YStack
              key={iframe.id}
              animation="quick"
              enterStyle={{ opacity: 0, scale: 0.95 }}
              exitStyle={{ opacity: 0, scale: 0.95 }}
            >
              <DraggableIframe
                id={iframe.id}
                filename={iframe.filename}
                content={iframe.content}
                title={iframe.title}
                width={iframe.width}
                height={iframe.height}
                initialPosition={iframe.position}
                onClose={closeIframeWindow}
              />
            </YStack>
          ))}
        </YStack>
      </AnimatePresence>

      {/* Background overlay when messages are visible */}
      {isMessagesVisible && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          // backgroundColor="rgba(0, 0, 0, 0.3)"
          zIndex={1}
          onPress={() => setIsMessagesVisible(false)}
        />
      )}

      {/* Absolute positioned container for both messages and input */}
      <Center
        position="absolute"
        bottom={isFullscreen ? 0 : '$4'}
        left={0}
        right={0}
        top={isFullscreen ? 0 : undefined}
        paddingHorizontal={isFullscreen ? '$2' : '$4'}
        paddingVertical={isFullscreen ? '$2' : undefined}
        zIndex={2}
      >
        <YStack
          width="100%"
          maxWidth={isFullscreen ? undefined : 500}
          height={isFullscreen ? '100%' : undefined}
          gap="$3"
          animation="quick"
        >
          {/* Messages Window */}
          <AnimatePresence>
            {isMessagesVisible && (
              <YStack
                key="messages"
                height={isFullscreen ? undefined : 500}
                flex={isFullscreen ? 1 : undefined}
                borderRadius="$6"
                borderWidth={1}
                borderColor="rgba(255, 255, 255, 0.2)"
                backgroundColor="rgba(255, 255, 255, 0.1)"
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: 8 }}
                shadowOpacity={0.15}
                shadowRadius={24}
                elevation={8}
                paddingHorizontal="$4"
                paddingTop="$4"
                paddingBottom="$2"
                animation="bouncy"
                enterStyle={{
                  opacity: 0,
                  scale: 0.95,
                  y: 20,
                }}
                exitStyle={{
                  opacity: 0,
                  scale: 0.95,
                  y: 20,
                }}
                {...(isWeb && {
                  style: {
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    backgroundColor:
                      colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                    borderColor:
                      colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                })}
              >
                {/* Header with Chat Tabs and Close Button */}
                <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                  {/* Chat Tabs */}
                  <XStack gap="$1" flex={1} overflow="hidden">
                    {chatTabs.map((tab) => (
                      <XStack
                        key={tab.id}
                        backgroundColor={activeTabId === tab.id ? '$blue5' : '$color3'}
                        borderRadius="$3"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        alignItems="center"
                        gap="$1"
                        maxWidth={120}
                        minWidth={80}
                        borderWidth={1}
                        borderColor={activeTabId === tab.id ? '$blue7' : '$color6'}
                        hoverStyle={{
                          backgroundColor: activeTabId === tab.id ? '$blue6' : '$color4',
                        }}
                        pressStyle={{ scale: 0.98 }}
                        onPress={() => switchTab(tab.id)}
                      >
                        <Text
                          fontSize="$2"
                          color={activeTabId === tab.id ? '$blue12' : '$color11'}
                          numberOfLines={1}
                          flex={1}
                        >
                          {tab.title}
                        </Text>
                        {chatTabs.length > 1 && (
                          <Button
                            size="$1"
                            circular
                            chromeless
                            icon={X}
                            onPress={(e) => {
                              e.stopPropagation()
                              closeTab(tab.id)
                            }}
                            padding="$0.5"
                            minWidth={16}
                            minHeight={16}
                            hoverStyle={{ backgroundColor: '$red5' }}
                            pressStyle={{ scale: 0.9 }}
                          />
                        )}
                      </XStack>
                    ))}

                    {/* Add New Tab Button */}
                    <Button
                      size="$2"
                      circular
                      chromeless
                      icon={Plus}
                      onPress={createNewTab}
                      backgroundColor="$color3"
                      borderWidth={1}
                      borderColor="$color6"
                      hoverStyle={{ backgroundColor: '$color4' }}
                      pressStyle={{ scale: 0.95 }}
                    />
                  </XStack>

                  {/* Fullscreen and Close Buttons */}
                  <XStack gap="$2">
                    <Button
                      size="$3"
                      circular
                      chromeless
                      icon={isFullscreen ? Minimize2 : Maximize2}
                      onPress={toggleFullscreen}
                      hoverStyle={{ backgroundColor: '$color5' }}
                      pressStyle={{ scale: 0.95 }}
                    />
                    <Button
                      size="$3"
                      circular
                      chromeless
                      icon={X}
                      onPress={() => {
                        setIsMessagesVisible(false)
                        setIsFullscreen(false)
                      }}
                      hoverStyle={{ backgroundColor: '$color5' }}
                      pressStyle={{ scale: 0.95 }}
                    />
                  </XStack>
                </XStack>

                {/* Chat Content */}
                <FlatList
                  ref={scrollViewRef}
                  data={chatData}
                  renderItem={renderChatMessage}
                  keyExtractor={(item) => item.id}
                  inverted={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                  ListEmptyComponent={
                    <Center flex={1} paddingVertical="$8">
                      <Bot size={48} color="$color10" />
                      <Text color="$color10" fontSize="$5" marginTop="$2" textAlign="center">
                        Start a conversation with the AI assistant
                      </Text>
                    </Center>
                  }
                />
              </YStack>
            )}
          </AnimatePresence>

          {/* Chat Input */}
          <YStack
            borderRadius="$6"
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.2)"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: isMessagesVisible ? 8 : 4 }}
            shadowOpacity={isMessagesVisible ? 0.2 : 0.1}
            shadowRadius={isMessagesVisible ? 16 : 12}
            elevation={isMessagesVisible ? 8 : 4}
            width={isFullscreen ? '100%' : isMessagesVisible ? 500 : 200}
            padding="$0.5"
            animation="bouncy"
            m="auto"
            scale={isMessagesVisible ? 1.02 : 1}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'visible',
            }}
            height={isMessagesVisible ? undefined : 45}
            // Add glow effect when messages are not visible
            {...(!isMessagesVisible && {
              borderColor: '$blue7',
              style: {
                ...(!isMessagesVisible && {
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  position: 'relative',
                  overflow: 'visible',
                  boxShadow: `0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)`,
                }),
              },
            })}
          >
            <ChatInput
              placeholder={isMessagesVisible ? 'Ask me anything...' : 'Ready...'}
              input={activeTab.input}
              setInput={updateTabInput}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              allFilesUploaded={true}
              stopHandler={() => {}}
              onFocus={() => setIsMessagesVisible(true)}
              onBlur={() => {
                // Don't hide messages on blur - they stay visible
              }}
              isMessagesVisible={isMessagesVisible}
              isFullscreen={isFullscreen}
            />
          </YStack>
        </YStack>
      </Center>
    </YStack>
  )
}
