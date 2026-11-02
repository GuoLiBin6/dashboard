import * as R from 'ramda'
import { h, normalizeClass, normalizeStyle } from 'vue'

/** 将 width/height 转为可用的 CSS 尺寸（纯数字视为 px） */
function toCssSize (val) {
  if (val == null || val === '') return undefined
  if (typeof val === 'number' && !Number.isNaN(val)) return `${val}px`
  const s = String(val).trim()
  if (/^\d+(\.\d+)?$/.test(s)) return `${s}px`
  return s
}

// 仅保留 ?raw（可变色内联 SVG），去掉 url 双份 eager，减小首屏体积
// glob 会扫描 assets 下全部 svg（含 navbar-global-search 等新增图标）
const commonSvgsRaw = import.meta.glob('./assets/**/*.svg', { eager: true, query: '?raw' })
const scopeSvgsRaw = import.meta.glob('@scope/assets/**/*.svg', { eager: true, query: '?raw' })

const svgRawModules = {
  ...commonSvgsRaw,
  ...scopeSvgsRaw,
}

const iconRawMap = {}
Object.keys(svgRawModules).forEach((path) => {
  const mod = svgRawModules[path]
  const name = path.split('/').pop().replace('.svg', '')
  const raw = typeof mod === 'string' ? mod : (mod && mod.default)
  if (raw) iconRawMap[name] = raw
})

// iconTypeList：用于判断 type.icon/defaultIcon 是否存在
const iconTypeList = Object.keys(iconRawMap)

// 蓝底白图案等多色 SVG：默认保留原色，避免 currentColor 把细节糊成一团
const PRESERVE_COLOR_TYPES = new Set(['k8s'])

/**
 * 3D 立体配图（控制面板数字卡片、图标选择器等）：
 * 亮色版本是「白 + 浅蓝」的浅色系，直接放到暗底上会整体发亮、缺少层次。
 * 这里按同一色相把明度整体压到暗色系 —— 蓝色的主色语义不变，只是换成暗色版，
 * 任何引用这几个图标的地方（卡片、图标选择器、配置面板）都统一生效。
 */
const DARK_TINT_ICONS = new Set(['icon_cpu', 'icon_ram', 'icon_tenant', 'icon_baremetal'])
const DARK_ICON_COLOR_MAP = {
  '#FFFFFF': '#5B6579',
  '#FEFEFF': '#5B6579',
  '#FEFEFE': '#565F72',
  '#F9FAFF': '#525B6E',
  '#FFF5EE': '#5E5A64',
  '#F0F4FF': '#4F5768',
  '#E5EFFF': '#4D586E',
  '#DCEEFF': '#44597A',
  '#CCE1FD': '#456089',
  '#C8E2FF': '#46618B',
  '#D0EAFE': '#435B80',
  '#CFE4FF': '#445C82',
  '#D5E2F8': '#4B5670',
  '#D5DFF5': '#4F5B76',
  '#C3DBF5': '#47618C',
  '#B6D6F9': '#4A6B95',
  '#ACC9F0': '#4F6E9C',
  '#ABC4F1': '#516DA0',
  '#ECDEF8': '#544A70',
  '#ACB8ED': '#5C5F9B',
  '#C1C9F4': '#585D93',
  '#D8D8D8': '#525A68',
  '#D1D1D1': '#586272',
  '#ABABAB': '#68727F',
  '#FDDABF': '#654A34',
  '#F1AB76': '#A87244',
  '#4C9EFF': '#58A2F2',
  '#4996E6': '#5292D9',
  '#358AE6': '#4B92E0',
  '#77A9E4': '#6F9BD4',
  '#81ADE1': '#759ED2',
  '#70A3D1': '#6B96C0',
  '#6B9AD1': '#6790C3',
  '#6C8CD0': '#6A7FBE',
  '#3D7BBC': '#5892CE',
  '#00C6FB': '#45BEF0',
  '#005BEA': '#3577D8',
}
const darkIconRawCache = {}

function getIconRaw (name, dark) {
  const raw = iconRawMap[name]
  if (!raw || !dark || !DARK_TINT_ICONS.has(name)) return raw
  if (!darkIconRawCache[name]) {
    darkIconRawCache[name] = raw.replace(/#[0-9A-Fa-f]{6}/g, (color) => DARK_ICON_COLOR_MAP[color.toUpperCase()] || color)
  }
  return darkIconRawCache[name]
}

function resolveIconName (finalType) {
  if (!finalType) return null
  const pick = (name) => {
    if (!name) return null
    if (iconTypeList.includes(name)) return name
    // 兼容原 antd icon 命名：question-circle-o / xxx-outlined / xxx-filled / xxx-two-tone
    const stripped = String(name).replace(/-(o|outlined|filled|fill|twotone|two-tone)$/i, '')
    return iconTypeList.includes(stripped) ? stripped : name
  }
  if (R.is(Object, finalType)) {
    const iconName = finalType.icon
    const defaultIconName = finalType.defaultIcon
    return iconTypeList.includes(iconName) ? iconName : pick(defaultIconName)
  }
  return pick(finalType)
}

function shouldPreserveColor (preserveColorProp, finalType) {
  if (preserveColorProp) return true
  const name = resolveIconName(finalType)
  return !!(name && PRESERVE_COLOR_TYPES.has(name))
}

// 自定义 Icon 组件：统一走 svg-sprite + <use>（可变色依赖 currentColor）
const Iconfont = {
  name: 'Icon',
  inheritAttrs: false,
  props: {
    // 兼容原来传入的 type，对象或字符串
    type: {
      type: [String, Object],
      default: null,
    },
    // 兼容原 ant-design-vue Icon / a-icon 的 spin（列表 loading、status 转圈等）
    spin: {
      type: Boolean,
      default: false,
    },
    // 品牌/平台等多色图标：保留 SVG 原始配色，不强制 currentColor
    preserveColor: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    // 读 store 让图标在明暗切换时跟着重渲染（3D 配图需要换一套配色）
    darkMode () {
      return !!(this.$store && this.$store.getters.darkMode)
    },
  },
  render () {
    const { $slots, $attrs, $listeners, type, spin, preserveColor: preserveColorProp } = this
    const children = $slots.default ? $slots.default() : null

    let content = null
    const finalType = type
    const preserveColor = shouldPreserveColor(preserveColorProp, finalType)

    const fill = preserveColor ? undefined : (($attrs && $attrs.fill) || 'currentColor')
    if (finalType) {
      // component > children > type
      if (R.is(Object, finalType)) {
        const spriteName = resolveIconName(finalType)
        const spriteId = `oc-${spriteName}`
        const rawSvg = getIconRaw(spriteName, this.darkMode)
        const hasSprite = !preserveColor && typeof document !== 'undefined' && document.getElementById(spriteId)

        content = hasSprite
          ? h('use', { 'xlink:href': `#${spriteId}` })
          : (rawSvg ? (preserveColor ? inlineRawSvg(rawSvg, spriteId) : patchRawSvgToInline(rawSvg, fill)) : null)
      } else {
        const iconName = resolveIconName(finalType) || finalType
        const spriteId = `oc-${iconName}`
        const rawSvg = getIconRaw(iconName, this.darkMode)
        const hasSprite = !preserveColor && typeof document !== 'undefined' && document.getElementById(spriteId)

        content = hasSprite
          ? h('use', { 'xlink:href': `#${spriteId}` })
          : (rawSvg ? (preserveColor ? inlineRawSvg(rawSvg, spriteId) : patchRawSvgToInline(rawSvg, fill)) : null)
      }
    }

    if (children) {
      content = children
    }

    const { class: cls, spin: _spinAttr, style: styleAttr, ...restAttrs } = ($attrs || {})
    // 兼容 attrs.spin / 布尔属性；props.spin 优先
    // type=loading 默认转圈（原 a-icon loading 行为）；sync/refresh 等需显式 spin
    const isLoadingType = finalType === 'loading' || (R.is(Object, finalType) && (finalType.icon === 'loading' || finalType.defaultIcon === 'loading'))
    const shouldSpin = !!(spin || isLoadingType || _spinAttr === true || _spinAttr === '' || _spinAttr === 'true' || _spinAttr === 'spin')
    // class 可能是 string/array/object，必须 normalize，否则会变成 "[object Object]" 导致业务 class 丢失
    const mergedClass = normalizeClass(['oc-icon', preserveColor ? 'oc-icon--colorful' : '', shouldSpin ? 'oc-icon-spin' : '', cls])

    const width = restAttrs.width || '1em'
    const height = restAttrs.height || '1em'
    // 显式传入 width/height 时写入 style（可压过外部 !important 以外的规则）；
    // 拓扑等场景有 56px !important，再在 mounted 里 setProperty(..., 'important')
    const explicitW = restAttrs.width != null && restAttrs.width !== ''
    const explicitH = restAttrs.height != null && restAttrs.height !== ''
    const sizeStyle = {}
    if (explicitW) sizeStyle.width = toCssSize(restAttrs.width)
    if (explicitH) sizeStyle.height = toCssSize(restAttrs.height)
    const mergedStyle = normalizeStyle([styleAttr, sizeStyle])

    // Vue2 compat：$listeners；Vue3：事件已在 $attrs(onXxx)。两者都挂到原生 svg
    const listenerProps = {}
    const listeners = $listeners || {}
    Object.keys(listeners).forEach((event) => {
      const handler = listeners[event]
      if (!handler) return
      listenerProps[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = handler
    })
    // 显式保留常见鼠标事件（inheritAttrs:false 时确保 hover tooltip 能触发）
    ;['onClick', 'onMouseenter', 'onMouseleave', 'onMouseover', 'onMouseout', 'onMousemove'].forEach((key) => {
      if (restAttrs[key] != null && listenerProps[key] == null) {
        listenerProps[key] = restAttrs[key]
      }
    })

    // 外层统一用 svg 包裹：sprite 时通过 fill/currentColor 生效；多色图标不写 fill，保留原色
    // 注意：走 innerHTML 时第三参必须是 null/undefined，不能传 []，否则 Vue3 会清空 innerHTML
    const useChild = content && content.type === 'use' ? [content] : null
    const svgProps = {
      ...restAttrs,
      ...listenerProps,
      class: mergedClass,
      style: mergedStyle,
      ...(fill ? { fill } : null),
      width,
      height,
      ...(content && content.__ocViewBox ? { viewBox: content.__ocViewBox } : null),
      ...(content && typeof content.__ocInnerHtml === 'string' ? { innerHTML: content.__ocInnerHtml } : null),
      // 显式尺寸：用行内 !important 压过拓扑等处的 width/height !important
      ...(explicitW || explicitH
        ? {
          ref: (el) => {
            if (!el || !el.style) return
            if (explicitW) el.style.setProperty('width', toCssSize(restAttrs.width), 'important')
            if (explicitH) el.style.setProperty('height', toCssSize(restAttrs.height), 'important')
          },
        }
        : null),
    }
    return h('svg', svgProps, useChild)
  },
}

export default Iconfont

function inlineRawSvg (rawSvg, idPrefix) {
  if (!rawSvg) return null
  const viewBoxMatch = rawSvg.match(/viewBox="([^"]+)"/i)
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : null
  const innerMatch = rawSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
  let inner = innerMatch ? innerMatch[1] : ''
  // 多色图标并排时避免 defs id 冲突（url(#linearGradient-1) 会串色）
  if (idPrefix && inner) {
    const ids = []
    inner.replace(/\sid="([^"]+)"/gi, (_, id) => { ids.push(id); return _ })
    ids.sort((a, b) => b.length - a.length).forEach((id) => {
      const scoped = `${idPrefix}-${id}`
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      inner = inner
        .replace(new RegExp(`\\sid="${escaped}"`, 'g'), ` id="${scoped}"`)
        .replace(new RegExp(`url\\(#${escaped}\\)`, 'g'), `url(#${scoped})`)
    })
  }
  return {
    __ocViewBox: viewBox,
    __ocInnerHtml: inner,
  }
}

function patchRawSvgToInline (rawSvg, fill) {
  // 目标：最终 DOM 为 <svg ...><path .../></svg>，不要 <image>
  // - 抽取 viewBox（用于缩放）
  // - 抽取 <svg> 内部内容作为 innerHTML
  // - 将 fill/stroke 强制成 currentColor（或外部传入的 fill）
  if (!rawSvg) return null

  const marked = inlineRawSvg(rawSvg)
  if (!marked) return null

  const targetColor = fill || 'currentColor'
  let patchedInner = String(marked.__ocInnerHtml)
    // 统一把显式 fill/stroke 改成 currentColor，避免外部 color 不生效
    .replace(/\sfill="(?!none)[^"]*"/gi, ` fill="${targetColor}"`)
    .replace(/\sstroke="(?!none)[^"]*"/gi, ` stroke="${targetColor}"`)
  // 无 fill 的 path 等不会继承外层 svg 的 fill 属性（表现为 hover 时比文字浅）
  patchedInner = patchedInner.replace(
    /<(path|circle|rect|polygon|polyline|ellipse)(\s[^>]*?)?(\/?)>/gi,
    (match, tag, attrs = '', selfClose = '') => {
      if (/\sfill\s*=/i.test(attrs)) return match
      return `<${tag}${attrs} fill="${targetColor}"${selfClose}>`
    },
  )

  return {
    __ocViewBox: marked.__ocViewBox,
    __ocInnerHtml: patchedInner,
  }
}
