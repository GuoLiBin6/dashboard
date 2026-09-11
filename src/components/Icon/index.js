import * as R from 'ramda'
import { h } from 'vue'

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

function resolveIconName (finalType) {
  if (!finalType) return null
  if (R.is(Object, finalType)) {
    const iconName = finalType.icon
    const defaultIconName = finalType.defaultIcon
    return iconTypeList.includes(iconName) ? iconName : defaultIconName
  }
  return finalType
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
        const rawSvg = iconRawMap[spriteName]
        const hasSprite = !preserveColor && typeof document !== 'undefined' && document.getElementById(spriteId)

        content = hasSprite
          ? h('use', { 'xlink:href': `#${spriteId}` })
          : (rawSvg ? (preserveColor ? inlineRawSvg(rawSvg, spriteId) : patchRawSvgToInline(rawSvg, fill)) : null)
      } else {
        const iconName = finalType
        const spriteId = `oc-${iconName}`
        const rawSvg = iconRawMap[iconName]
        const hasSprite = !preserveColor && typeof document !== 'undefined' && document.getElementById(spriteId)

        content = hasSprite
          ? h('use', { 'xlink:href': `#${spriteId}` })
          : (rawSvg ? (preserveColor ? inlineRawSvg(rawSvg, spriteId) : patchRawSvgToInline(rawSvg, fill)) : null)
      }
    }

    if (children) {
      content = children
    }

    const { class: cls, spin: _spinAttr, ...restAttrs } = ($attrs || {})
    // 兼容 attrs.spin / 布尔属性；props.spin 优先
    // type=loading 默认转圈（原 a-icon loading 行为）；sync/refresh 等需显式 spin
    const isLoadingType = finalType === 'loading' || (R.is(Object, finalType) && (finalType.icon === 'loading' || finalType.defaultIcon === 'loading'))
    const shouldSpin = !!(spin || isLoadingType || _spinAttr === true || _spinAttr === '' || _spinAttr === 'true' || _spinAttr === 'spin')
    const mergedClass = ['oc-icon', preserveColor ? 'oc-icon--colorful' : '', shouldSpin ? 'oc-icon-spin' : '', cls].filter(Boolean).join(' ')

    const width = restAttrs.width || '1em'
    const height = restAttrs.height || '1em'

    // Vue2 compat(MODE:2)：@click 等在 $listeners，不在 $attrs；需手动挂到原生 svg
    const listenerProps = {}
    const listeners = $listeners || {}
    Object.keys(listeners).forEach((event) => {
      const handler = listeners[event]
      if (!handler) return
      listenerProps[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = handler
    })

    // 外层统一用 svg 包裹：sprite 时通过 fill/currentColor 生效；多色图标不写 fill，保留原色
    return h('svg', {
      ...restAttrs,
      ...listenerProps,
      class: mergedClass,
      ...(fill ? { fill } : null),
      width,
      height,
      ...(content && content.__ocViewBox ? { viewBox: content.__ocViewBox } : null),
      ...(content && typeof content.__ocInnerHtml === 'string' ? { innerHTML: content.__ocInnerHtml } : null),
    }, (content && content.type === 'use') ? [content] : [])
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
