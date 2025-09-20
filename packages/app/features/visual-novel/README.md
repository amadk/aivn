# AI Visual Novel Game

A fully-featured AI-powered visual novel game built with React, TypeScript, and Tamagui.

## Features

### 🎮 Core Game Features
- **AI-Generated Stories**: Unique narratives created by AI based on user preferences
- **Interactive Choices**: 4 AI-generated options plus custom text input for player actions
- **Dynamic Story Progression**: Stories adapt based on player choices and custom inputs
- **Multiple Breakpoints**: Strategic decision points throughout the narrative
- **Character Development**: AI-generated characters with personalities and relationships

### 🎨 Visual Features
- **AI-Generated Images**: Character portraits and background scenes
- **Typewriter Text Effect**: Immersive text display with customizable speed
- **Beautiful UI**: Modern, responsive design with dark/light theme support
- **Smooth Animations**: Polished transitions and effects using Tamagui animations
- **Cross-Platform**: Works on both web and mobile (React Native)

### ⚙️ Game Systems
- **Save/Load System**: Persistent game state with localStorage
- **Settings Management**: Customizable text speed, auto-advance, and audio settings
- **Game Progress Tracking**: Monitor story completion and choices made
- **Multiple Genre Support**: Fantasy, Sci-Fi, Mystery, Romance, Horror, and more
- **Theme Customization**: Various story themes and tones

### 🤖 AI Integration
- **Story Generation**: Uses Claude 3.5 Sonnet for narrative creation
- **Choice Generation**: AI creates meaningful decision options
- **Image Generation**: Uses Kie.ai Flux Kontext Pro for high-quality visual novel illustrations
- **Context Awareness**: AI maintains story consistency and character development
- **Fallback System**: Automatic fallback to alternative image services if primary fails

## File Structure

```
visual-novel/
├── components/
│   ├── story-display.tsx      # Main story display with choices
│   ├── game-menu.tsx          # Settings and save/load menu
│   └── game-setup.tsx         # Initial game configuration
├── types.ts                   # TypeScript type definitions
├── game-engine.ts             # Core game logic and state management
├── ai-generator.ts            # AI integration for content generation
├── visual-novel-screen.tsx    # Main game screen component
└── index.ts                   # Exports
```

## Usage

### Basic Implementation

```tsx
import { VisualNovelScreen } from 'app/features/visual-novel'

export default function GamePage() {
  return <VisualNovelScreen />
}
```

### With Custom Exit Handler

```tsx
import { VisualNovelScreen } from 'app/features/visual-novel'
import { useRouter } from 'solito/navigation'

export default function GamePage() {
  const router = useRouter()
  
  return (
    <VisualNovelScreen 
      onExit={() => router.push('/')} 
    />
  )
}
```

## API Integration

The visual novel requires an API endpoint at `/api/visual-novel` that handles:

- **Story Generation**: Creates narrative segments based on context
- **Choice Generation**: Generates 4 meaningful choices for each decision point
- **Image Generation**: Creates character portraits and scene backgrounds

### API Request Format

```typescript
{
  type: 'story' | 'choices' | 'image',
  prompt: string,
  parameters?: {
    genre?: string,
    mood?: string,
    style?: string
  }
}
```

## Game Flow

1. **Setup Phase**: Player configures genre, theme, tone, and optional custom parameters
2. **Story Generation**: AI creates initial story segment with characters and setting
3. **Interactive Play**: Player makes choices or inputs custom actions
4. **Dynamic Continuation**: AI generates new story segments based on player decisions
5. **Save/Load**: Players can save progress and resume later

## Customization

### Settings Available
- Text display speed (10-200ms per character)
- Auto-advance with customizable delays
- Audio volume controls (music, effects, voice)
- Fullscreen mode support

### Genre Options
- Fantasy Adventure
- Science Fiction
- Mystery/Detective
- Romance
- Horror/Thriller
- Historical
- Modern Drama
- Superhero

### Theme Options
- Hero's Journey
- Coming of Age
- Redemption
- Love & Relationships
- Survival
- Discovery
- Betrayal & Trust
- Good vs Evil

## Technical Details

### State Management
- Game state is managed by the `VisualNovelEngine` class
- Persistent storage using localStorage/MMKV
- Real-time state synchronization between components

### AI Integration
- Uses structured output generation with Zod schemas
- Error handling with fallback content
- Context-aware generation maintaining story consistency

### Performance
- Lazy loading of images
- Optimized re-renders with React hooks
- Efficient state updates and animations

### Cross-Platform Support
- Shared components between web and mobile
- Platform-specific optimizations
- Responsive design for all screen sizes

## Environment Setup

### Required Environment Variables

Add these to your `.env.local` file:

```env
# Kie.ai API Token for image generation
KIE_AI_TOKEN=your_kie_ai_token_here

# Anthropic API Key for story generation
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Getting API Keys

1. **Kie.ai Token**: Sign up at [kie.ai](https://kie.ai) to get your API token
2. **Anthropic API Key**: Get your key from [Anthropic Console](https://console.anthropic.com)

## Development

### Adding New Features

1. **New Game Mechanics**: Extend the `GameEngine` class
2. **UI Components**: Add new components in the `components/` directory
3. **AI Features**: Modify the `AIStoryGenerator` class
4. **Types**: Update `types.ts` for new data structures

### Testing

The game includes comprehensive error handling and fallback systems:
- Fallback story segments if AI generation fails
- Default choices when AI is unavailable
- Placeholder images for failed image generation

## Future Enhancements

- **Multiplayer Stories**: Collaborative story creation
- **Voice Acting**: AI-generated voice for characters
- **Music Generation**: Dynamic background music
- **Advanced Analytics**: Story branching visualization
- **Export Features**: Save stories as PDFs or share online
- **Community Features**: Share and rate player-created stories
