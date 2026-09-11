// vue-i18n v11 仅导出 createI18n，无 VueI18n 构造函数；用 createI18n(legacy: true) 得到 .global 供 Vue2 / Vue3 使用
import vueI18nCjs from 'vue-i18n/dist/vue-i18n.cjs.js'
import * as R from 'ramda'
import setting from '@/config/setting'
import { getLanguage } from '@/utils/common/cookie'
const createI18n = vueI18nCjs.createI18n || (vueI18nCjs.default && vueI18nCjs.default.createI18n)
if (!createI18n) throw new Error('[locales] vue-i18n CJS 未提供 createI18n')

// vxe-table 的 locale 文案里大量使用了 "{{0}}" 这种占位符写法，
// 在 vue-i18n v11 中会被当成「嵌套占位」而报错，这里统一转换为 "{0}" 形式。
function normalizeVxePlaceholders (obj) {
  if (typeof obj === 'string') {
    return obj.replace(/{{(\d+)}}/g, '{$1}')
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeVxePlaceholders)
  }
  if (obj && typeof obj === 'object') {
    const res = {}
    Object.keys(obj).forEach(k => {
      res[k] = normalizeVxePlaceholders(obj[k])
    })
    return res
  }
  return obj
}

function normalizeLang (lang) {
  if (!lang) return 'zh-CN'
  if (lang === 'zh' || lang.startsWith('zh')) return 'zh-CN'
  if (lang === 'ja' || lang.startsWith('ja')) return 'ja-JP'
  if (lang === 'en' || lang.startsWith('en')) return 'en'
  return lang
}

const currentLang = normalizeLang(getLanguage())
// 切语言会 reload，启动只加载当前语言
const langsToLoad = [currentLang]

const coreLocaleLoaders = {
  en: () => import('./en.json'),
  'zh-CN': () => import('./zh-CN.json'),
  'ja-JP': () => import('./ja-JP.json'),
}
const helpLocaleLoaders = {
  en: () => import('./help-en.js'),
  'zh-CN': () => import('./help-zh-CN.js'),
  'ja-JP': () => import('./help-ja-JP.js'),
}
const vxeLocaleLoaders = {
  en: () => import('vxe-table/lib/locale/lang/en-US'),
  'zh-CN': () => import('vxe-table/lib/locale/lang/zh-CN'),
  'ja-JP': () => import('vxe-table/lib/locale/lang/ja-JP'),
}

// containers / scope 文案：非 eager，按语言过滤后动态合并
// EE：@@ → dashboard-ee，需合并 EE containers（Reports/System 等）；相对 ../../containers 只命中 CE
const moduleLocaleLoaders = {
  ...import.meta.glob('../../containers/**/locales/*.json'),
  ...import.meta.glob('@@/containers/**/locales/*.json'),
}
const scopeLocaleLoaders = {
  ...import.meta.glob('@scope/**/locales/*.json'),
  ...import.meta.glob('../../scope/**/locales/*.json'),
}

function langFromPath (path) {
  const match = path.match(/([^\\/]+)(?=\.json$)/)
  return match ? match[1] : null
}

async function loadLocaleBundle (lang) {
  const [coreMod, helpMod, vxeMod] = await Promise.all([
    coreLocaleLoaders[lang](),
    helpLocaleLoaders[lang](),
    vxeLocaleLoaders[lang](),
  ])
  const core = coreMod.default || coreMod
  const help = helpMod.default || helpMod
  const vxe = normalizeVxePlaceholders(vxeMod.default || vxeMod)

  let messages = Object.assign({}, core, help, vxe, { brand: setting.brand[lang] })

  const mergeLoaderGroup = async (loaders) => {
    const tasks = Object.keys(loaders)
      .filter((p) => langFromPath(p) === lang)
      .map(async (p) => {
        const mod = await loaders[p]()
        return mod.default || mod
      })
    const parts = await Promise.all(tasks)
    parts.forEach((msg) => {
      messages = Object.assign(messages, msg)
    })
  }
  await mergeLoaderGroup(moduleLocaleLoaders)
  await mergeLoaderGroup(scopeLocaleLoaders)

  return messages
}

// vue-i18n v11 的 linked message（@:xxx）对 key token 有严格限制（不支持 '.' 等），
// 但项目中大量使用 `@:dictionary.xxx` 这种引用格式。为避免 linked 解析失败，
// 在创建 i18n 实例前预先把这些占位符展开为当前语言下的实际文案。
function getMsgByPath (root, path) {
  if (!root || !path) return undefined
  // 项目文案多为扁平 key（如 "bill.title.origin_res_type"），优先整 key 命中
  if (Object.prototype.hasOwnProperty.call(root, path)) {
    return root[path]
  }
  // 兼容少量真正嵌套的对象结构
  const parts = String(path).split('.')
  let cur = root
  for (let i = 0; i < parts.length; i++) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[parts[i]]
  }
  return cur
}

function replaceI18nPlaceholders (str, localeRoot) {
  if (typeof str !== 'string') return str
  let prev
  let cur = str
  let guard = 0
  // 可能多层 @:a -> 文案里还有 @:b，多轮展开
  while (cur !== prev && guard++ < 8) {
    prev = cur
    cur = cur.replace(/@:([a-zA-Z0-9_.]+)/g, (match, key) => {
      const v = getMsgByPath(localeRoot, key)
      return typeof v === 'string' ? v : match
    })
  }
  // @:key 展开后，残留的 @（如 ._@、邮箱）会被当成 linked format 报错
  if (cur.indexOf('@') !== -1) {
    cur = cur.replace(/@/g, "{'@'}")
  }
  // 文案里字面量 {}（如特殊字符列表）会被当成 Empty placeholder
  if (cur.indexOf('{}') !== -1) {
    cur = cur.replace(/\{\}/g, "{'{'}{'}'}")
  }
  return cur
}

function deepReplaceI18n (obj, localeRoot) {
  if (typeof obj === 'string') return replaceI18nPlaceholders(obj, localeRoot)
  if (Array.isArray(obj)) return obj.map(v => deepReplaceI18n(v, localeRoot))
  if (obj && typeof obj === 'object') {
    const res = {}
    Object.keys(obj).forEach(k => {
      res[k] = deepReplaceI18n(obj[k], localeRoot)
    })
    return res
  }
  return obj
}

const loadedCoreByLang = {}
const messages = {}

// 同步启动路径需要 messages 就绪：用顶层 await（Vite 支持）
await Promise.all(langsToLoad.map(async (lang) => {
  const bundle = await loadLocaleBundle(lang)
  loadedCoreByLang[lang] = bundle
  messages[lang] = deepReplaceI18n(bundle, bundle)
}))

// 兼容 cookie / navigator 可能留下的 zh、ja 等短码
if (messages['zh-CN'] && !messages.zh) messages.zh = messages['zh-CN']
if (messages['ja-JP'] && !messages.ja) messages.ja = messages['ja-JP']

const i18nBridge = createI18n({
  legacy: true,
  locale: getLanguage(),
  messages,
  fallbackLocale: currentLang,
  missingWarn: false,
  fallbackWarn: false,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
})
// legacy 模式下，i18nBridge 作为插件用于 app.use(i18nBridge)，
// i18nBridge.global 则是实际的全局实例（提供 $t 等）
const i18n = i18nBridge.global

i18n.getI18n = (key, defaultValue) => {
  const keys = R.is(Array, key) ? key : [key]
  let value = defaultValue === undefined ? keys[0] : defaultValue
  for (let i = 0; i < keys.length; i++) {
    if (i18n.te(keys[i])) {
      value = i18n.t(keys[i])
      return value
    }
  }
  return value
}

i18n.setOriginDictionary = () => {
  const lang = normalizeLang(getLanguage())
  const core = loadedCoreByLang[lang]
  if (!core || !core.dictionary) return
  if (!i18n.te('originDictionary.agent')) {
    i18n.mergeLocaleMessage(lang, {
      originDictionary: R.clone(core.dictionary),
    })
  }
}

i18n.getOriginDictionaryI18n = (key, defaultValue) => {
  const lang = normalizeLang(getLanguage())
  const core = loadedCoreByLang[lang]
  const dict = core && core.dictionary
  return (dict && dict[key]) || defaultValue
}

i18n.deepReplaceDictionary = () => {
  const l = normalizeLang(getLanguage())
  if (messages[l]) {
    i18n.setLocaleMessage(l, messages[l])
  }
}

i18n.getOemDictionaryI18n = (key, defaultValue) => {
  const l = normalizeLang(getLanguage())
  if (l === 'en') {
    return (setting.oemDictionary && setting.oemDictionary.en && setting.oemDictionary.en[key]) || defaultValue
  } else if (l === 'zh-CN') {
    return (setting.oemDictionary && setting.oemDictionary['zh-CN'] && setting.oemDictionary['zh-CN'][key]) || defaultValue
  } else if (l === 'ja-JP') {
    return (setting.oemDictionary && setting.oemDictionary['ja-JP'] && setting.oemDictionary['ja-JP'][key]) || defaultValue
  }
  return defaultValue
}

// 默认导出全局实例，供业务代码直接使用（i18n.t 等）
export default i18n

// 额外导出插件实例，供 createApp(App).use(i18nPlugin) 安装到应用
export const i18nPlugin = i18nBridge
