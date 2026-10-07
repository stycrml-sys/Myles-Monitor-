import Anthropic from '@anthropic-ai/sdk'
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema'
import { describeError } from './photoAnalysis'

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, calories: { type: 'integer' } },
        required: ['name', 'calories'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
} as const

/** Web build only: ask Claude with the user's own API key. */
export async function askFoodCalories(apiKey: string, prompt: string): Promise<unknown> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      output_config: { effort: 'low', format: jsonSchemaOutputFormat(SCHEMA) },
      messages: [{ role: 'user', content: prompt }],
    })
    if (response.stop_reason === 'refusal') throw new Error("Claude couldn't estimate that.")
    return response.parsed_output
  } catch (e) {
    throw new Error(describeError(e))
  }
}
