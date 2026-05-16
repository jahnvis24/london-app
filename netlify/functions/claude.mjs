import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()
    const { model, max_tokens, messages } = body

    const message = await anthropic.messages.create({
      model: model || 'claude-sonnet-4-5',
      max_tokens: max_tokens || 1000,
      messages,
    })

    return Response.json(message)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const config = {
  path: '/api/claude',
}
