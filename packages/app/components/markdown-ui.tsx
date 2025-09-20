import { memo, useMemo, useEffect, useRef, useState } from 'react'
import {
  useThemeName,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Paragraph,
  SizableText,
  Button,
  View,
  Image,
  Div,
} from '@my/ui'
import Markdown from 'react-native-markdown-display'

// Function to extract all attributes from HTML content
const extractHtmlAttributes = (htmlContent: string): Record<string, string> => {
  const attributes: Record<string, string> = {}

  // Match all attribute patterns: attribute="value" or attribute='value'
  const attributeRegex = /(\w+)=["']([^"']*?)["']/g
  let match

  while ((match = attributeRegex.exec(htmlContent)) !== null) {
    const [, attrName, attrValue] = match
    attributes[attrName] = attrValue
  }

  return attributes
}

// Table analysis will be stored in component state instead of global variables

// Function to analyze table structure and calculate column widths
const analyzeTableStructure = (tableNode: any): number[] => {
  const columnContents: string[][] = []

  // Helper to extract text content from a node
  const extractTextFromNode = (node: any): string => {
    if (typeof node === 'string') return node
    if (node.content) return node.content.toString()
    if (node.children) {
      return node.children.map(extractTextFromNode).join('')
    }
    return ''
  }

  // Function to traverse and collect all cell contents
  const collectCells = (node: any) => {
    if (!node) return

    if (node.type === 'tr' && node.children) {
      // Process each cell in this row
      let colIndex = 0
      for (const cell of node.children) {
        if (cell.type === 'td' || cell.type === 'th') {
          const cellText = extractTextFromNode(cell) || ''

          // Initialize column content array if needed
          if (!columnContents[colIndex]) {
            columnContents[colIndex] = []
          }

          // Store this cell's content
          columnContents[colIndex].push(cellText)
          colIndex++
        }
      }
    }

    // Recursively process children
    if (node.children) {
      for (const child of node.children) {
        collectCells(child)
      }
    }
  }

  // Collect all cell contents
  collectCells(tableNode)

  const columnWidths: number[] = []

  // Calculate flex values for each column based on content analysis
  for (let colIndex = 0; colIndex < columnContents.length; colIndex++) {
    const column = columnContents[colIndex] || []
    const avgLength =
      column.reduce((sum, text) => sum + text.length, 0) / Math.max(column.length, 1)
    const maxLength = Math.max(...column.map((text) => text.length))

    // Check if this is a single-character column (like L, I, #)
    const isSingleCharColumn = maxLength <= 2 && avgLength <= 2

    // Check if this is a short numeric column (like Score)
    const isNumericColumn = column.every(
      (text) => /^\d+(\s*\([^)]+\))?$/.test(text.trim()) || text.length <= 3
    )

    // Convert to flex value with better logic
    let flex = 1
    if (isSingleCharColumn) {
      flex = 0.15 // Very minimal width for single chars
    } else if (isNumericColumn || maxLength <= 8) {
      flex = 0.4 // Small width for short numeric columns
    } else if (avgLength < 15) {
      flex = 0.8 // Medium-small for shorter text
    } else if (avgLength < 30) {
      flex = 1.2 // Medium for regular text
    } else if (avgLength < 60) {
      flex = 2.0 // Large for long descriptions
    } else {
      flex = 2.5 // Very large for very long content
    }

    columnWidths.push(flex)
  }

  console.log(
    'COLLECTED COLUMNS:',
    columnContents.map((col, i) => `${i}: [${col.join(', ')}]`)
  )

  return columnWidths
}

// Mermaid component for rendering diagrams
const MermaidDiagram = memo(({ code, theme }: { code: string; theme?: string | null }) => {
  const [svgContent, setSvgContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const diagramId = useRef(`mermaid-${Math.random().toString(36).substring(2, 11)}`)

  return (
    <View
      marginVertical={16}
      padding={16}
      backgroundColor={theme?.includes?.('dark') ? '#1a1a1a' : '#f8f9fa'}
      borderRadius={8}
      borderWidth={1}
      borderColor={theme?.includes?.('dark') ? '#333' : '#e9ecef'}
      overflow="scroll"
    >
      {error ? (
        <SizableText fontSize={14} color="red">
          Error rendering Mermaid diagram: {error}
        </SizableText>
      ) : svgContent ? (
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      ) : (
        <SizableText fontSize={14} color={theme?.includes?.('dark') ? '#888' : '#666'}>
          Loading Mermaid diagram...
        </SizableText>
      )}
    </View>
  )
})

export const MarkdownUI = memo((props: { children: string }) => {
  const { children } = props
  const theme = useThemeName()

  // Component-scoped table analysis state
  const tableAnalysisRef = useRef<{ [tableKey: string]: number[] }>({})
  const currentTableRef = useRef<string>('')
  const columnIndexRef = useRef<number>(0)

  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState<{ src: string; alt?: string }>({ src: '' })

  // Reset state when children change
  useEffect(() => {
    tableAnalysisRef.current = {}
    currentTableRef.current = ''
    columnIndexRef.current = 0
  }, [children])

  const markdownStyle = useMemo(
    () => ({
      body: {
        color: theme?.includes?.('dark') ? '#fff' : '#000',
      },
      ordered_list: {
        marginVertical: 12,
        paddingLeft: 8,
      },
      bullet_list: {
        marginVertical: 12,
        paddingLeft: 8,
      },
      list_item: {
        marginBottom: 8,
        flexDirection: 'row' as const,
        alignItems: 'flex-start' as const,
      },
      ordered_list_icon: {
        fontSize: 16,
        lineHeight: 24,
        marginRight: 8,
        color: theme?.includes?.('dark') ? '#fff' : '#000',
        minWidth: 20,
      },
      ordered_list_content: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        color: theme?.includes?.('dark') ? '#fff' : '#000',
      },
      bullet_list_icon: {
        fontSize: 16,
        lineHeight: 24,
        marginRight: 8,
        color: theme?.includes?.('dark') ? '#fff' : '#000',
        minWidth: 20,
      },
      bullet_list_content: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        color: theme?.includes?.('dark') ? '#fff' : '#000',
      },
      table: {
        borderWidth: 1,
        borderColor: theme?.includes?.('dark') ? '#666' : '#ddd',
        marginVertical: 12,
      },
      thead: {},
      tbody: {},
      th: {
        backgroundColor: theme?.includes?.('dark') ? '#333' : '#f5f5f5',
        padding: 8,
        borderWidth: 1,
        borderColor: theme?.includes?.('dark') ? '#666' : '#ddd',
      },
      td: {
        padding: 8,
        borderWidth: 1,
        borderColor: theme?.includes?.('dark') ? '#666' : '#ddd',
        textAlign: 'left' as const,
      },
      tr: {
        borderBottomWidth: 0,
      },
      blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: theme?.includes?.('dark') ? '#666' : '#ccc',
        paddingLeft: 16,
        marginVertical: 12,
        marginLeft: 0,
        backgroundColor: theme?.includes?.('dark')
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(0, 0, 0, 0.05)',
        paddingVertical: 12,
        paddingRight: 16,
      },
      hr: {
        borderBottomWidth: 1,
        borderBottomColor: theme?.includes?.('dark') ? '#666' : '#ddd',
        marginVertical: 16,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
      },
    }),
    [theme]
  )

  const markdownRules = useMemo(() => {
    // Create a closure with access to refs
    const getTableAnalysis = () => tableAnalysisRef.current
    const setTableAnalysis = (key: string, analysis: number[]) => {
      tableAnalysisRef.current[key] = analysis
    }
    const getCurrentTable = () => currentTableRef.current
    const setCurrentTable = (key: string) => {
      currentTableRef.current = key
    }
    const getColumnIndex = () => columnIndexRef.current
    const setColumnIndex = (index: number) => {
      columnIndexRef.current = index
    }
    const incrementColumnIndex = () => {
      columnIndexRef.current++
      return columnIndexRef.current - 1
    }

    return {
      heading1: (node, children, parent, styles) => {
        return <H1 key={node.key}>{children}</H1>
      },
      heading2: (node, children, parent, styles) => {
        return <H2 key={node.key}>{children}</H2>
      },
      heading3: (node, children, parent, styles) => {
        return <H3 key={node.key}>{children}</H3>
      },
      heading4: (node, children, parent, styles) => {
        return <H4 key={node.key}>{children}</H4>
      },
      heading5: (node, children, parent, styles) => {
        return <H5 key={node.key}>{children}</H5>
      },
      heading6: (node, children, parent, styles) => {
        return <H6 key={node.key}>{children}</H6>
      },
      paragraph: (node, children, parent, styles) => {
        return (
          <Paragraph key={node.key} fontSize={15}>
            {children}
          </Paragraph>
        )
      },
      code_inline: (node, children, parent, styles) => {
        return (
          <SizableText
            key={node.key}
            style={{ fontFamily: 'var(--font-mono)' }}
            // backgroundColor="$gray3"
            paddingHorizontal="$1"
            paddingVertical="$0"
            borderRadius="$2"
            fontSize={13}
            color={theme?.includes?.('dark') ? '#fff' : '#000'}
          >
            {(node as any).content}
          </SizableText>
        )
      },
      // Image rule - handles markdown images
      image: (node, children, parent, styles) => {
        const { attributes } = node as any
        const src = attributes?.src
        const alt = attributes?.alt

        return (
          <Div key={node.key} my="$3.5" jc="center">
            <Button
              unstyled
              onPress={() => {
                setCurrentImage({ src, alt })
                setImageViewerOpen(true)
              }}
              cursor="pointer"
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
              width="100%"
              p={0}
              borderRadius={0}
            >
              <Image
                source={{ uri: src }}
                alt={alt || 'Image'}
                width="100%"
                minHeight={500}
                objectFit="contain"
                resizeMethod="scale"
                resizeMode="contain"
                bc="black"
                borderRadius="$4"
              />
            </Button>
            {alt && (
              <SizableText
                fontSize={12}
                color="$gray10"
                textAlign="center"
                marginTop="$2"
                fontStyle="italic"
              >
                {alt}
              </SizableText>
            )}
          </Div>
        )
      },
      // Custom table rules for better width control
      table: (node, children, parent, styles) => {
        // Analyze the table structure to get column widths
        const columnWidths = analyzeTableStructure(node)
        console.log('CALCULATED COLUMN WIDTHS:', columnWidths)

        // Store in component-scoped analysis
        setTableAnalysis(node.key, columnWidths)
        setCurrentTable(node.key)

        return (
          <View
            key={node.key}
            style={{
              borderWidth: 1,
              borderColor: theme?.includes?.('dark') ? '#666' : '#ddd',
              marginVertical: 12,
              overflow: 'scroll',
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            {children}
          </View>
        )
      },
      thead: (node, children, parent, styles) => {
        return <View key={node.key}>{children}</View>
      },
      tbody: (node, children, parent, styles) => {
        return <View key={node.key}>{children}</View>
      },
      tr: (node, children, parent, styles) => {
        // Reset column index for each row
        setColumnIndex(0)

        return (
          <View
            key={node.key}
            style={{
              flexDirection: 'row',
            }}
          >
            {children}
          </View>
        )
      },
      th: (node, children, parent, styles) => {
        // Use component-scoped tracking
        const columnIndex = incrementColumnIndex()

        // Get flex value from component analysis
        const tableAnalysis = getTableAnalysis()
        const currentTable = getCurrentTable()
        const columnWidths = tableAnalysis[currentTable] || []
        const flex = columnWidths[columnIndex] || 1

        // Get text content for debugging
        const extractTextFromNode = (node: any): string => {
          if (typeof node === 'string') return node
          if (node.content) return node.content.toString()
          if (node.children) {
            return node.children.map(extractTextFromNode).join('')
          }
          return ''
        }
        const textContent = extractTextFromNode(node)

        console.log(
          `TH[${columnIndex}] (table:${currentTable.slice(-8)}): content="${textContent}", flex=${flex}`
        )

        return (
          <View
            key={node.key}
            style={{
              backgroundColor: theme?.includes?.('dark') ? '#333' : '#f5f5f5',
              padding: 8,
              borderWidth: 1,
              borderColor: theme?.includes?.('dark') ? '#666' : '#ddd',
              flex,
              minWidth: 40,
            }}
          >
            {children}
          </View>
        )
      },
      td: (node, children, parent, styles) => {
        // Use component-scoped tracking
        const columnIndex = incrementColumnIndex()

        // Get flex value from component analysis
        const tableAnalysis = getTableAnalysis()
        const currentTable = getCurrentTable()
        const columnWidths = tableAnalysis[currentTable] || []
        const flex = columnWidths[columnIndex] || 1

        return (
          <View
            key={node.key}
            style={{
              padding: 8,
              borderWidth: 1,
              borderColor: theme?.includes?.('dark') ? '#666' : '#ddd',
              flex,
              minWidth: 40,
            }}
          >
            {children}
          </View>
        )
      },
      // Custom artifact rule - triggers on HTML div with class="artifact"
      div: (node, children, parent, styles) => {
        // Default div rendering
        return <View key={node.key}>{children}</View>
      },
    }
  }, [
    theme,
    tableAnalysisRef,
    currentTableRef,
    columnIndexRef,
    setCurrentImage,
    setImageViewerOpen,
  ])

  if (!children) {
    return null
  }

  return (
    <>
      <Markdown style={markdownStyle} rules={markdownRules}>
        {children}
      </Markdown>
    </>
  )
})
