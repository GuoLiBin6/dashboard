import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

/** 统一转 dayjs；moment / Date / 字符串均可 */
export function toDayjs (val, format) {
  if (val == null || val === '') return null
  if (dayjs.isDayjs(val)) return val.isValid() ? val : null
  if (val && typeof val.toDate === 'function') {
    const d = dayjs(val.toDate())
    return d.isValid() ? d : null
  }
  if (format && typeof val === 'string') {
    const d = dayjs(val, format)
    if (d.isValid()) return d
  }
  const d = dayjs(val)
  return d.isValid() ? d : null
}

/** 时间列用的 dayjs（仅 HH:mm[:ss]） */
export function toTimeDayjs (val, timeFormat = 'HH:mm') {
  const d = toDayjs(val)
  if (!d) return null
  return dayjs(d.format(timeFormat), timeFormat)
}

export function mergeDateTime (dateVal, timeVal, timeFormat = 'HH:mm') {
  const date = toDayjs(dateVal)
  if (!date) return null
  const time = toDayjs(timeVal)
  const hhmm = time && time.isValid() ? time.format(timeFormat) : timeFormat.includes('ss') ? '00:00:00' : '00:00'
  return dayjs(`${date.format('YYYY-MM-DD')} ${hhmm}`, `YYYY-MM-DD ${timeFormat}`)
}

export function formatOut (val, valueFormat) {
  const d = toDayjs(val)
  if (!d) return valueFormat ? '' : null
  if (valueFormat) return d.format(valueFormat)
  return d
}

export function formatRangeOut (vals, valueFormat) {
  if (!Array.isArray(vals)) return valueFormat ? [] : null
  return vals.map(v => formatOut(v, valueFormat))
}

export { dayjs }
