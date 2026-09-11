import moment from 'moment'
import setting from '@/config/setting'

// 不单独 import moment/locale/*：Vite 预打包会让 locale 挂到另一份 moment 实例上。
// 直接在当前（预打包）实例上 updateLocale，保证 fromNow 中文生效且有 default 导出。
moment.updateLocale('zh-cn', {
  relativeTime: {
    future: '%s内',
    past: '%s前',
    s: '几秒',
    ss: '%d 秒',
    m: '1 分钟',
    mm: '%d 分钟',
    h: '1 小时',
    hh: '%d 小时',
    d: '1 天',
    dd: '%d 天',
    M: '1 个月',
    MM: '%d 个月',
    y: '1 年',
    yy: '%d 年',
  },
})

moment.updateLocale('ja', {
  relativeTime: {
    future: '%s後',
    past: '%s前',
    s: '数秒',
    ss: '%d秒',
    m: '1分',
    mm: '%d分',
    h: '1時間',
    hh: '%d時間',
    d: '1日',
    dd: '%d日',
    M: '1ヶ月',
    MM: '%dヶ月',
    y: '1年',
    yy: '%d年',
  },
})

const MOMENT_LOCALE_MAP = {
  'zh-CN': 'zh-cn',
  'ja-JP': 'ja',
  en: 'en',
}

export function syncMomentLocale (m = moment) {
  const locale = MOMENT_LOCALE_MAP[setting.language] || 'zh-cn'
  m.locale(locale)
  return m
}

moment.defaultFormat = 'YYYY-MM-DD HH:mm:ss'
syncMomentLocale(moment)

export default moment
