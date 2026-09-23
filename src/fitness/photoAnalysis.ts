import Anthropic from '@anthropic-ai/sdk'
import type { BodyArea } from './types'

const SYSTEM_PROMPT = `You compare weekly progress photos for a personal fitness tracker. \
The user trains with push-ups and tracks body weight. For each body area you receive the \
earlier photo first and the later photo second.

Describe visible differences plainly and briefly: waist (midsection size, definition, \
how clothing/waistband sits) and arms (size, muscle definition, vascularity). Be honest \
when change is not visible — small weekly changes usually aren't. Call out differences in \
lighting, pose, distance, angle or pump that could make the comparison unreliable, and \
suggest one tip to make next week's photos more consistent if needed. Don't estimate body \
fat percentages or give medical advice.

Format as plain text (it is shown as-is, so no markdown symbols like ** or #): a \
"Waist:" line and an "Arms:" line (only for areas provided), each followed by 1-3 \
"• " bullets, then a one-line "Overall:" takeaway. Keep it under 150 words.`

export interface PhotoPair {
  area: BodyArea
  before: string // data URL
  after: string // data URL
}

function imageBlock(dataUrl: string): Anthropic.Beta.BetaImageBlockParam {
  const [, meta, data] = /^data:(image\/\w+);base64,(.*)$/.exec(dataUrl) ?? []
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: (meta ?? 'image/jpeg') as 'image/jpeg',
      data: data ?? '',
    },
  }
}

export async function analyzePhotos(
  apiKey: string,
  pairs: PhotoPair[],
  context: { beforeLabel: string; afterLabel: string; weightNote: string },
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const content: Anthropic.Beta.BetaContentBlockParam[] = []
  for (const pair of pairs) {
    content.push({ type: 'text', text: `${pair.area.toUpperCase()} — earlier (${context.beforeLabel}):` })
    content.push(imageBlock(pair.before))
    content.push({ type: 'text', text: `${pair.area.toUpperCase()} — later (${context.afterLabel}):` })
    content.push(imageBlock(pair.after))
  }
  content.push({
    type: 'text',
    text: `Compare the earlier and later photos. ${context.weightNote}`.trim(),
  })

  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  })

  if (response.stop_reason === 'refusal') {
    throw new Error("Claude couldn't analyse these photos. Try different shots.")
  }
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
  if (!text) throw new Error('No analysis came back — try again.')
  return text
}

export function describeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return 'That API key was rejected. Check it in Settings.'
  if (error instanceof Anthropic.RateLimitError) return 'Rate limited — wait a minute and try again.'
  if (error instanceof Anthropic.APIError) return `Claude API error (${error.status}): ${error.message}`
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
