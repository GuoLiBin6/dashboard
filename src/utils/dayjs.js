import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/ja'
import localeData from 'dayjs/plugin/localeData'
import setting from '@/config/setting'

// antdv4 DatePicker/RangePicker 基于 dayjs；需与 antd 共用同一实例并加载 locale，
// 否则会出现「2026年 Aug」中英混排
dayjs.extend(localeData)

const DAYJS_LOCALE_MAP = {
  'zh-CN': 'zh-cn',
  'ja-JP': 'ja',
  en: 'en',
}

export function syncDayjsLocale (d = dayjs) {
  const locale = DAYJS_LOCALE_MAP[setting.language] || 'zh-cn'
  d.locale(locale)
  return d
}

syncDayjsLocale(dayjs)

export default dayjs
