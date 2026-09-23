import Anthropic from '@anthropic-ai/sdk'
import { blobToDataUrl } from './platform'
import { SYSTEM_PROMPT, type AnalysisContext, type PhotoPair } from './photoPrompt'

async function imageBlock(blob: Blob): Promise<Anthropic.Beta.BetaImageBlockParam> {
  const dataUrl = await blobToDataUrl(blob)
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
  context: AnalysisContext,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const content: Anthropic.Beta.BetaContentBlockParam[] = []
  for (const pair of pairs) {
    content.push({ type: 'text', text: `${pair.area.toUpperCase()} — earlier (${context.beforeLabel}):` })
    content.push(await imageBlock(pair.before))
    content.push({ type: 'text', text: `${pair.area.toUpperCase()} — later (${context.afterLabel}):` })
    content.push(await imageBlock(pair.after))
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
