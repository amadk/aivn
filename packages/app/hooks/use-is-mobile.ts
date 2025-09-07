import { isWeb } from '@my/ui'
import { useMedia } from 'tamagui'

export function useIsMobile() {
  const media = useMedia()

  if (!isWeb) {
    return true
  }

  return !!media?.maxSm
}
