import type { AnalysisRequest } from './platform'
import type { BodyArea } from './types'

export const SYSTEM_PROMPT = `You compare weekly progress photos for a personal fitness tracker. \
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
  before: Blob
  after: Blob
}

export interface AnalysisContext {
  beforeLabel: string
  afterLabel: string
  weightNote: string
}

/** One prompt plus images in a stated order, for the artifact's built-in Claude. */
export function buildAnalysisRequest(pairs: PhotoPair[], context: AnalysisContext): AnalysisRequest {
  const images: Blob[] = []
  const order: string[] = []
  for (const pair of pairs) {
    images.push(pair.before, pair.after)
    order.push(
      `image ${images.length - 1}: ${pair.area}, earlier (${context.beforeLabel})`,
      `image ${images.length}: ${pair.area}, later (${context.afterLabel})`,
    )
  }
  const prompt = `${SYSTEM_PROMPT}

The attached images are, in order:
${order.map((o) => `- ${o}`).join('\n')}

Compare the earlier and later photos. ${context.weightNote}`.trim()
  return { prompt, images }
}
