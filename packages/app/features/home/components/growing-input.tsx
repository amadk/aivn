import { Flex, Input, InputProps } from '@my/ui'
import React, { useState, forwardRef } from 'react'
import debounce from 'lodash/debounce'

export const GrowingInput = forwardRef<any, InputProps>((props, ref) => {
  const [height, setHeight] = useState(54)

  const onContentSizeChange = debounce((event) => {
    const contentHeight = event?.nativeEvent?.contentSize?.height

    setHeight(contentHeight)
  }, 0.05)

  return (
    <Input
      ref={ref}
      maxHeight={400}
      scrollEnabled={(height || 0) > 400}
      overflow="hidden"
      multiline
      // overflow="hidden"
      height={height}
      onContentSizeChange={onContentSizeChange}
      {...props}
    />
  )
})
