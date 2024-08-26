import Vue from 'vue'
import VueI18n from 'vue-i18n'
import * as R from 'ramda'
import vxeTableCN from 'vxe-table/lib/locale/lang/zh-CN'
import vxeTableEN from 'vxe-table/lib/locale/lang/en-US'
import vxeTableJP from 'vxe-table/lib/locale/lang/ja-JP'
import setting from '@/config/setting'
import { getLanguage } from '@/utils/common/cookie'
import en from './en'
import zhCN from './zh-CN'
import jaJP from './ja-JP'
import helpEN from './help-en'
import helpZhCN from './help-zh-CN'
import helpJaJP from './help-ja-JP'

Vue.use(VueI18n)

const messages = {
  en: Object.assign(en, helpEN, vxeTableEN, { brand: setting.brand.en }),
  'zh-CN': Object.assign(zhCN, helpZhCN, vxeTableCN, { brand: setting.brand['zh-CN'] }),
  'ja-JP': Object.assign(jaJP, helpJaJP, vxeTableJP, { brand: setting.brand['ja-JP'] }),
}

const moduleCtx = require.context('../../containers', true, /^((?![\\/]node_modules).)*.\/locales\/.*(json)$/)
const scopeCtx = require.context('../..', true, /^((?![\\/]node_modules).)*.\/scope\/locales\/.*(json)/)

const register = (ctx) => {
  const keys = ctx.keys()
  for (let i = 0, len = keys.length; i < len; i++) {
    const lang = keys[i].match(/([^\\/]+)(?=\.\w+$)/)[0]
    const msg = ctx(keys[i])
    messages[lang] = Object.assign(messages[lang], msg)
  }
}

register(moduleCtx)
register(scopeCtx)

const i18n = new VueI18n({
  locale: getLanguage(),
  messages,
  fallbackLocale: 'en',
  // silentTranslationWarn: true,
})

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
  if (!i18n.te('originDictionary.agent')) {
    i18n.mergeLocaleMessage('en', {
      originDictionary: R.clone(en.dictionary),
    })
    i18n.mergeLocaleMessage('zh-CN', {
      originDictionary: R.clone(zhCN.dictionary),
    })
    i18n.mergeLocaleMessage('ja-JP', {
      originDictionary: R.clone(jaJP.dictionary),
    })
  }
}

export default i18n
