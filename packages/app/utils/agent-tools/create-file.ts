import { z } from 'zod'

export const createFileTool = {
  description:
    'Creates an HTML file in a draggable iframe window that appears behind the chat interface',
  inputSchema: z.object({
    filename: z.string().describe('The name of the file to create (e.g., "my-page.html")'),
    content: z.string().describe('The HTML content to display in the iframe'),
    title: z.string().optional().describe('Optional title for the iframe window'),
    width: z.number().optional().default(600).describe('Width of the iframe window in pixels'),
    height: z.number().optional().default(400).describe('Height of the iframe window in pixels'),
    position: z.object({
      x: z.number().optional().default(100).describe('X position of the iframe window in pixels'),
      y: z.number().optional().default(100).describe('Y position of the iframe window in pixels'),
    }),
  }),
  execute: async ({ filename, content, title, width, height }) => {
    // Return structured data that the frontend can use to create the iframe
    const iframeData = {
      id: `iframe-${Date.now()}`,
      filename,
      content,
      title: title || filename,
      width: width || 600,
      height: height || 400,
      position: {
        x: Math.random() * 200 + 100, // Random initial position
        y: Math.random() * 200 + 100,
      },
    }

    console.log('filename', filename)

    return { filename }
  },
}
