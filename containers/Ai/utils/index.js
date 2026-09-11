/**
 * 模型品牌图标：来自 lobe-icons (MIT) 与 simple-icons (CC0)，见 src/assets/images/llm-images/
 * @see https://github.com/lobehub/lobe-icons
 */
import qianwenIcon from '@/assets/images/llm-images/qianwen.svg'
import deepseekIcon from '@/assets/images/llm-images/deepseek.svg'
import glmIcon from '@/assets/images/llm-images/glm.svg'
import falconIcon from '@/assets/images/llm-images/falcon.svg'
import gptIcon from '@/assets/images/llm-images/gpt.svg'
import whisperIcon from '@/assets/images/llm-images/whisper.svg'
import voxtralIcon from '@/assets/images/llm-images/voxtral.svg'
import mistralIcon from '@/assets/images/llm-images/mistral.svg'
import graniteIcon from '@/assets/images/llm-images/granite.svg'
import bgeIcon from '@/assets/images/llm-images/bge.svg'
import jinaIcon from '@/assets/images/llm-images/jina.svg'
import kimiIcon from '@/assets/images/llm-images/kimi.svg'
import hyIcon from '@/assets/images/llm-images/hy.svg'
import minimaxIcon from '@/assets/images/llm-images/minimax.svg'
import stepIcon from '@/assets/images/llm-images/step.svg'
import paddleIcon from '@/assets/images/llm-images/paddle.svg'
import openclawIcon from '@/assets/images/llm-images/openclaw.svg'
import difyIcon from '@/assets/images/llm-images/dify.svg'
import comfyuiIcon from '@/assets/images/llm-images/comfyui.svg'
import hermesIcon from '@/assets/images/llm-images/hermes-agent.svg'

function resolveAssetUrl (asset) {
  if (!asset) return ''
  if (typeof asset === 'string') return asset
  return asset.default || ''
}

// 须放在 assets/images 等目录：Icon 目录下 SVG 走 svg-sprite-loader，不能用于 <img src>
const MODEL_ICON_RULES = [
  { test: /qwen|qianwen/i, icon: resolveAssetUrl(qianwenIcon) },
  { test: /deepseek/i, icon: resolveAssetUrl(deepseekIcon) },
  { test: /glm|chatglm/i, icon: resolveAssetUrl(glmIcon) },
  { test: /falcon/i, icon: resolveAssetUrl(falconIcon) },
  { test: /gpt-oss|gpt/i, icon: resolveAssetUrl(gptIcon) },
  { test: /whisper/i, icon: resolveAssetUrl(whisperIcon) },
  { test: /voxtral/i, icon: resolveAssetUrl(voxtralIcon) },
  { test: /mistral/i, icon: resolveAssetUrl(mistralIcon) },
  { test: /granite/i, icon: resolveAssetUrl(graniteIcon) },
  { test: /\bbge\b|bge-/i, icon: resolveAssetUrl(bgeIcon) },
  { test: /jina/i, icon: resolveAssetUrl(jinaIcon) },
  { test: /kimi|moonshot/i, icon: resolveAssetUrl(kimiIcon) },
  { test: /tencent\/hy|tencent\/hunyuan|hunyuan|混元/i, icon: resolveAssetUrl(hyIcon) },
  { test: /minimax/i, icon: resolveAssetUrl(minimaxIcon) },
  { test: /\bstep/i, icon: resolveAssetUrl(stepIcon) },
  { test: /paddle|ocr-vl/i, icon: resolveAssetUrl(paddleIcon) },
  { test: /openclaw|open-claw/i, icon: resolveAssetUrl(openclawIcon) },
  { test: /dify/i, icon: resolveAssetUrl(difyIcon) },
  { test: /comfyui|comfy-ui/i, icon: resolveAssetUrl(comfyuiIcon) },
  { test: /hermes/i, icon: resolveAssetUrl(hermesIcon) },
]

/**
 * 根据模型名称返回展示用图标 URL（img src）；无匹配时返回空字符串
 * @param {string} modelName
 * @returns {string}
 */
export function getModelIcon (modelName) {
  const name = String(modelName || '')
  const rule = MODEL_ICON_RULES.find(r => r.test.test(name))
  return rule ? rule.icon : ''
}

/**
 * 无品牌图标时，用模型名称生成卡片占位文案（首字母）
 * @param {string} modelName
 * @returns {string}
 */
export function getModelIconLabel (modelName) {
  const name = String(modelName || '').trim()
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
}
