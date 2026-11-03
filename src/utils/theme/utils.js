// import { message } from 'ant-design-vue'
import i18n from '@/locales'
import themeColor from './colors.js'

/** 默认主题色：拂晓蓝（主题色 / 背景色系都找不到时的兜底） */
export const DEFAULT_THEME_COLOR = '#1890FF'
/** 不应用主题背景色（系统默认） */
export const THEME_BG_NONE = 'none'
/** 灰色系：浅色为浅灰、深色为深灰，可继续选深度 */
export const THEME_BG_GRAY_HUE = 'gray'
/** 灰色系色块预览色 */
export const BG_GRAY_SWATCH_LIGHT = '#BFBFBF'
export const BG_GRAY_SWATCH_DARK = '#595959'
/** 系统默认全局背景（灰色系中的中性灰） */
export const THEME_BG_GRAY = '#DEE1E6'
/** @deprecated 兼容旧默认；现默认改为灰色系 */
export const DEFAULT_THEME_BG_COLOR = THEME_BG_GRAY_HUE
// 全局背景透明度：彩色选项半透明；无背景用实色灰
export const THEME_BG_ALPHA = 0.4

export function isThemeBgNone (val) {
  return !val || val === THEME_BG_NONE
}

/** 是否为灰色系（兼容历史 'none' / 空值） */
export function isThemeBgGray (val) {
  return isThemeBgNone(val) || val === THEME_BG_GRAY_HUE
}

/** 背景色：档位数量（渐变深度） */
export const BG_LEVEL_COUNT = 8
/** 背景深度默认档位：从左往右第 4 个（浅色 / 灰色 / 深色一致） */
export const DEFAULT_BG_LEVEL_LIGHT = 3
/** 浅色灰色系默认档位（与彩色系一致，避免新老视觉分裂） */
export const DEFAULT_BG_LEVEL_GRAY_LIGHT = 3
/** 深色模式默认档位 */
export const DEFAULT_DARK_BG_LEVEL = 3
/** @deprecated 兼容旧命名 */
export const DEFAULT_DARK_BG_INDEX = DEFAULT_DARK_BG_LEVEL

/** '#1890ff' → [24, 144, 255] */
function parseHexToRgb (hex) {
  const raw = String(hex || '').replace('#', '')
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return [24, 144, 255]
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * 相对亮度（0~1，WCAG）：用于判断「用户自选的文字色」在当前底色上还看不看得见。
 * 非法值按 parseHexToRgb 的兜底（主题蓝）处理。
 */
export function hexLuminance (hex) {
  const [r, g, b] = parseHexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 暗底可读阈值：深色模式下的 slogan 等自选色低于该亮度即视为「看不见」 */
export const DARK_TEXT_MIN_LUMINANCE = 0.35

/**
 * 深色模式下保证自选文字色可读：
 * 过暗（如默认 #000000）换成主题正文色，其余原样返回；浅色模式不干预。
 * 返回 undefined 表示调用方「没有配置颜色」，交由 CSS 决定。
 */
export function resolveReadableOnDark (hex, dark, fallback = 'var(--oc-dark-text)') {
  if (!hex) return undefined
  if (!dark) return hex
  return hexLuminance(hex) < DARK_TEXT_MIN_LUMINANCE ? fallback : hex
}

function rgbToHsl ([r, g, b]) {
  const nr = r / 255
  const ng = g / 255
  const nb = b / 255
  const max = Math.max(nr, ng, nb)
  const min = Math.min(nr, ng, nb)
  const l = (max + min) / 2
  const d = max - min
  if (!d) return { h: 0, s: 0 }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === nr) h = (ng - nb) / d + (ng < nb ? 6 : 0)
  else if (max === ng) h = (nb - nr) / d + 2
  else h = (nr - ng) / d + 4
  return { h: h * 60, s }
}

function hslToHex (h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const m = l - c / 2
  let rgb
  if (hp < 1) rgb = [c, x, 0]
  else if (hp < 2) rgb = [x, c, 0]
  else if (hp < 3) rgb = [0, c, x]
  else if (hp < 4) rgb = [0, x, c]
  else if (hp < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  return '#' + rgb.map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/**
 * 由「色系」派生页面底色梯度（8 档，从浅到深）。
 *
 * 色系 = 任意一个 hex（一般取主题色板里的色），只取它的色相；
 * 深色模式落在暗面明度区间，浅色模式落在浅面明度区间。
 * 因此可以「红色主题 + 蓝色背景」——两者互不绑定。
 */
export function deriveBgColors (hue = '#1890ff', dark = false) {
  // 灰色系：不取色相，直接出中性灰梯度
  const isGray = isThemeBgGray(hue)
  const { h, s } = isGray ? { h: 0, s: 0 } : rgbToHsl(parseHexToRgb(hue))
  if (dark) {
    const sat = isGray ? 0 : Math.min(0.22, Math.max(0.12, s * 0.25))
    const lightSteps = [0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44]
    return lightSteps.map(l => hslToHex(h, sat, l))
  }
  const sat = isGray ? 0 : Math.min(0.34, Math.max(0.16, s * 0.42))
  const lightSteps = [0.97, 0.945, 0.92, 0.895, 0.87, 0.845, 0.82, 0.795]
  return lightSteps.map(l => hslToHex(h, sat, l))
}

/** @deprecated 用 deriveBgColors(hue, true) */
export function deriveDarkBgColors (primary = '#1890ff') {
  return deriveBgColors(primary, true)
}

/** 旧版固定深色色板，仅用于把历史存储的 hex 映射回档位 */
const LEGACY_DARK_BG = ['#232833', '#2B313F', '#343B4C', '#3D4557', '#474F63', '#515A70', '#5C667E', '#68738D']

/** 存储值 → 档位（0~7，兼容旧 hex） */
export function resolveBgLevel (val, fallback = DEFAULT_BG_LEVEL_LIGHT) {
  if (val === null || val === undefined || val === '') return fallback
  const n = Number(val)
  if (Number.isInteger(n) && n >= 0 && n < BG_LEVEL_COUNT) return n
  const i = LEGACY_DARK_BG.indexOf(String(val).toUpperCase())
  return i >= 0 ? i : fallback
}

/** @deprecated 用 resolveBgLevel(val, DEFAULT_DARK_BG_LEVEL) */
export function resolveDarkBgIndex (val) {
  return resolveBgLevel(val, DEFAULT_DARK_BG_LEVEL)
}

/** 旧彩色背景值 → 最近色系（用于历史数据迁移） */
export function nearestBgHue (hex) {
  if (isThemeBgGray(hex)) return THEME_BG_GRAY_HUE
  const { h, s } = rgbToHsl(parseHexToRgb(hex))
  // 接近无彩度 → 判为灰色系
  if (s < 0.06) return THEME_BG_GRAY_HUE
  let best = colorList[0].color
  let min = Infinity
  colorList.forEach(item => {
    const { h: hh } = rgbToHsl(parseHexToRgb(item.color))
    const d = Math.abs(((h - hh + 540) % 360) - 180)
    if (d < min) {
      min = d
      best = item.color
    }
  })
  return best
}

/** 色系 + 档位 + 明暗 → 实际底色 hex */
export function resolveBgColor (hue, level, dark) {
  const fallback = dark
    ? DEFAULT_DARK_BG_LEVEL
    : (isThemeBgGray(hue) ? DEFAULT_BG_LEVEL_GRAY_LIGHT : DEFAULT_BG_LEVEL_LIGHT)
  return deriveBgColors(hue, dark)[resolveBgLevel(level, fallback)]
}

/** @deprecated 用 resolveBgColor */
export function resolveDarkBgColor (val, primary) {
  return resolveBgColor(primary, resolveBgLevel(val, DEFAULT_DARK_BG_LEVEL), true)
}

/** 兼容旧引用：默认深色底（按默认蓝派生） */
export const DEFAULT_DARK_BG_COLOR = resolveBgColor('#1890FF', DEFAULT_DARK_BG_LEVEL, true)

/** 兼容旧引用：默认主题色下的深色色板 */
export const darkBgColorList = deriveBgColors('#1890FF', true).map(color => ({ key: color, color }))

/** 解析实际用于渲染的背景 hex（'none' → 灰色） */
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

/** 背景色「第一层：色系」可选列表（与主题色板一致 + 灰色系） */
export const bgHueList = [
  ...colorList.map(item => ({ key: item.key, color: item.color })),
  { key: i18n.t('common.theme.background_gray'), color: THEME_BG_GRAY_HUE },
]

export function hexToRgbChannels (hex = THEME_BG_GRAY) {
  const resolved = resolveThemeBgColor(hex)
  const raw = String(resolved || '').replace('#', '')
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return '222, 225, 230'
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

/**
 * 深色模式下个别主题色在暗底上过暗或过艳，看着刺眼，
 * 这里换成同色相、降饱和并提亮的版本；其它色相原样返回。
 */
const DARK_PRIMARY_OVERRIDES = {
  // 极客蓝：暗底上偏沉，提亮成中蓝
  '#2F54EB': '#5D7CE5',
  // 酱紫：暗底上过艳，压饱和后转成柔紫
  '#A100FF': '#B158E4',
  // 薄暮：纯红在暗底上刺眼，压饱和后转成柔红（比原色略深，避免发浅）
  '#F5222D': '#EB424D',
}

/** 主题色 → 深色模式实际使用的主色（未命中则原样返回） */
export function resolveDarkPrimary (hex) {
  if (!hex) return hex
  return DARK_PRIMARY_OVERRIDES[String(hex).toUpperCase()] || hex
}

/**
 * 浅色模式下个别主题色在白底上「发虚」，这里换成同色相、压一档明度的版本；
 * 其它色相原样返回。
 */
const LIGHT_PRIMARY_OVERRIDES = {
  // 日暮（金）：#FAAD14 明度过高，白底上像「没上色」的一抹浅黄，
  // 主按钮白字也压不住。按同色相把明度从 53% 降到 47%，对比度 1.9:1 → 2.3:1，
  // 与其它色板（明青 2.19、极光绿 2.25）的观感对齐。
  '#FAAD14': '#EB9905',
}

/** 主题色 → 浅色模式实际使用的主色（未命中则原样返回） */
export function resolveLightPrimary (hex) {
  if (!hex) return hex
  return LIGHT_PRIMARY_OVERRIDES[String(hex).toUpperCase()] || hex
}

const updateThemeColor = newPrimaryColor => {
  // const hideMessage = message.loading(i18n.t('common_321'), 0)
  // themeColor.changeColor(newPrimaryColor).finally(() => {
  //   hideMessage()
  // })
  themeColor.changeColor(newPrimaryColor)
}

export { updateThemeColor, colorList, bgColorList }
