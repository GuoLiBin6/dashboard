// import { message } from 'ant-design-vue'
import i18n from '@/locales'
import themeColor from './colors.js'

/** 不应用主题背景色（系统默认） */
export const THEME_BG_NONE = 'none'
/** 选择「无」时使用的灰色全局背景 */
export const THEME_BG_GRAY = '#DEE1E6'
/** @deprecated 兼容旧默认；现默认改为 none → 灰色 */
export const DEFAULT_THEME_BG_COLOR = THEME_BG_NONE
// 全局背景透明度：彩色选项半透明；无背景用实色灰
export const THEME_BG_ALPHA = 0.4

export function isThemeBgNone (val) {
  return !val || val === THEME_BG_NONE
}

/** 解析实际用于渲染的背景 hex */
export function resolveThemeBgColor (val) {
  return isThemeBgNone(val) ? THEME_BG_GRAY : val
}

// let lessNodesAppended
const colorList = [
  {
    key: i18n.t('common_313'), color: '#F5222D',
  },
  {
    key: i18n.t('common_314'), color: '#FA541C',
  },
  {
    key: i18n.t('common_315'), color: '#FAAD14',
  },
  {
    key: i18n.t('common_316'), color: '#13C2C2',
  },
  {
    key: i18n.t('common_317'), color: '#52C41A',
  },
  {
    key: i18n.t('common_318'), color: '#1890FF',
  },
  {
    key: i18n.t('common_319'), color: '#2F54EB',
  },
  {
    key: i18n.t('common_320'), color: '#A100FF',
  },
  {
    key: i18n.t('common.theme.color.lake_blue'), color: '#0099F0',
  },
]

/** 主题色弱化：降饱和并压到中等明度；extraLift 再淡一档（红/酱紫等偏重色） */
export function softenThemeColor (hex, extraLift = 0) {
  const raw = String(hex || '').replace('#', '')
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex
  const n = parseInt(full, 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  // 向灰度靠拢，降低鲜艳度
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  const desat = 0.62
  r = Math.round(r + (gray - r) * desat)
  g = Math.round(g + (gray - g) * desat)
  b = Math.round(b + (gray - b) * desat)
  // 再略提一点明度，色相保留但不压实
  const lift = Math.min(0.55, 0.28 + extraLift)
  r = Math.round(r + (255 - r) * lift)
  g = Math.round(g + (255 - g) * lift)
  b = Math.round(b + (255 - b) * lift)
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

// 薄暮、火山、酱紫：背景再淡一档
const BG_EXTRA_FADE = {
  '#F5222D': 0.18,
  '#FA541C': 0.18,
  '#A100FF': 0.18,
}

const bgColorList = colorList.map(item => ({
  key: item.key,
  color: softenThemeColor(item.color, BG_EXTRA_FADE[item.color.toUpperCase()] || 0),
}))

export function hexToRgbChannels (hex = THEME_BG_GRAY) {
  const resolved = resolveThemeBgColor(hex)
  const raw = String(resolved || '').replace('#', '')
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return '222, 225, 230'
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

const updateThemeColor = newPrimaryColor => {
  // const hideMessage = message.loading(i18n.t('common_321'), 0)
  // themeColor.changeColor(newPrimaryColor).finally(() => {
  //   hideMessage()
  // })
  themeColor.changeColor(newPrimaryColor)
}

export { updateThemeColor, colorList, bgColorList }
