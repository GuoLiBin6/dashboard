/**
 * Aiproxy catalog provider_key icons.
 * Assets: src/assets/images/aiproxy-providers/ (lobe-icons *-color, MIT).
 * Regenerate: ./scripts/sync-aiproxy-provider-icons.sh
 */
import anthropicIcon from '@/assets/images/aiproxy-providers/anthropic.svg'
import deepseekIcon from '@/assets/images/aiproxy-providers/deepseek.svg'
import geminiIcon from '@/assets/images/aiproxy-providers/gemini.svg'
import groqIcon from '@/assets/images/aiproxy-providers/groq.svg'
import huggingfaceIcon from '@/assets/images/aiproxy-providers/huggingface.svg'
import mistralIcon from '@/assets/images/aiproxy-providers/mistral.svg'
import ollamaIcon from '@/assets/images/aiproxy-providers/ollama.svg'
import openaiIcon from '@/assets/images/aiproxy-providers/openai.svg'
import openrouterIcon from '@/assets/images/aiproxy-providers/openrouter.svg'
import sglangIcon from '@/assets/images/aiproxy-providers/sglang.svg'
import vllmIcon from '@/assets/images/aiproxy-providers/vllm.svg'
import xiaomiIcon from '@/assets/images/aiproxy-providers/xiaomi.svg'
import moonshotIcon from '@/assets/images/aiproxy-providers/moonshot.svg'
import zhipuIcon from '@/assets/images/aiproxy-providers/zhipu.svg'
import defaultIcon from '@/assets/images/aiproxy-providers/default.svg'

function resolveAssetUrl (asset) {
  if (!asset) return ''
  if (typeof asset === 'string') return asset
  return asset.default || ''
}

const AIPROXY_PROVIDER_ICON_MAP = {
  // aliyun: resolveAssetUrl(aliyunIcon), // uncommon
  anthropic: resolveAssetUrl(anthropicIcon),
  // azure: resolveAssetUrl(azureIcon), // uncommon
  // baidu: resolveAssetUrl(baiduIcon), // uncommon
  // bedrock: resolveAssetUrl(bedrockIcon), // uncommon
  // cerebras: resolveAssetUrl(cerebrasIcon), // uncommon
  // cohere: resolveAssetUrl(cohereIcon), // uncommon
  deepseek: resolveAssetUrl(deepseekIcon),
  // elevenlabs: resolveAssetUrl(elevenlabsIcon), // uncommon
  // fireworks: resolveAssetUrl(fireworksIcon), // uncommon
  gemini: resolveAssetUrl(geminiIcon),
  groq: resolveAssetUrl(groqIcon),
  huggingface: resolveAssetUrl(huggingfaceIcon),
  mistral: resolveAssetUrl(mistralIcon),
  // nebius: resolveAssetUrl(nebiusIcon), // uncommon
  ollama: resolveAssetUrl(ollamaIcon),
  openai: resolveAssetUrl(openaiIcon),
  openrouter: resolveAssetUrl(openrouterIcon),
  // parasail: resolveAssetUrl(parasailIcon), // uncommon
  // perplexity: resolveAssetUrl(perplexityIcon), // uncommon
  // replicate: resolveAssetUrl(replicateIcon), // uncommon
  // runway: resolveAssetUrl(runwayIcon), // uncommon
  sglang: resolveAssetUrl(sglangIcon),
  // legacy alias until DB migration completes on all nodes
  sgl: resolveAssetUrl(sglangIcon),
  // vertex: resolveAssetUrl(vertexIcon), // uncommon
  vllm: resolveAssetUrl(vllmIcon),
  // xai: resolveAssetUrl(xaiIcon), // uncommon
  xiaomi: resolveAssetUrl(xiaomiIcon),
  moonshot: resolveAssetUrl(moonshotIcon),
  zhipu: resolveAssetUrl(zhipuIcon),
  custom: resolveAssetUrl(defaultIcon),
}

const DEFAULT_ICON = resolveAssetUrl(defaultIcon)

/** @param {string} providerKey */
export function isKnownAiproxyProviderKey (providerKey) {
  const key = String(providerKey || '').trim().toLowerCase()
  return Boolean(key && AIPROXY_PROVIDER_ICON_MAP[key])
}

/**
 * @param {string} providerKey
 * @returns {string} img src URL, or default icon URL when unknown
 */
export function getAiproxyProviderIcon (providerKey) {
  const key = String(providerKey || '').trim().toLowerCase()
  if (!key) return ''
  return AIPROXY_PROVIDER_ICON_MAP[key] || DEFAULT_ICON
}

/**
 * @param {string} providerKey
 * @returns {string}
 */
export function getAiproxyProviderIconLabel (providerKey) {
  const key = String(providerKey || '').trim()
  if (!key) return '?'
  return key.slice(0, 2).toUpperCase()
}
