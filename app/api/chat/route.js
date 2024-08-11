import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = "You are a helpful customer support assistant for a travel agency. Your job is to assist customers with their travel inquiries, including booking flights, hotels, and car rentals, providing information about travel destinations, and resolving any issues they may encounter during their travel. Be polite, concise, and provide accurate information."

export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: 'gpt-4o-mini', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Handle the streaming response
  const stream = new ReadableStream({
    start: async (controller) => {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream)
}