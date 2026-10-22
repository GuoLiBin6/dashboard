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

export function numberRange (start, end) {
  const result = []
  for (let i = start; i < end; i++) result.push(i)
  return result
}

/** 禁用 bound 之前的时分（不含 bound 本身） */
export function disabledTimeBefore (bound) {
  const d = toDayjs(bound)
  if (!d) return {}
  const h = d.hour()
  const m = d.minute()
  return {
    disabledHours: () => numberRange(0, h),
    disabledMinutes: (selectedHour) => (selectedHour === h ? numberRange(0, m) : []),
  }
}

/** 禁用 bound 之后的时分；inclusive=true 时 bound 这一分钟也禁用 */
export function disabledTimeAfter (bound, inclusive = false) {
  const d = toDayjs(bound)
  if (!d) return {}
  const h = d.hour()
  const m = d.minute()
  const minuteFrom = inclusive ? m : m + 1
  return {
    // 该小时仍有可选分钟时，只禁 h+1 及之后；分钟用 disabledMinutes 收紧
    disabledHours: () => numberRange(minuteFrom >= 60 ? h : h + 1, 24),
    disabledMinutes: (selectedHour) => {
      if (selectedHour !== h) return []
      if (minuteFrom >= 60) return numberRange(0, 60)
      return numberRange(minuteFrom, 60)
    },
  }
}

function mergeDisabledTimeConf (...confs) {
  const list = confs.filter(c => c && (c.disabledHours || c.disabledMinutes || c.disabledSeconds))
  if (!list.length) return {}
  return {
    disabledHours: () => {
      const set = new Set()
      list.forEach((c) => {
        if (typeof c.disabledHours === 'function') c.disabledHours().forEach(v => set.add(v))
      })
      return [...set]
    },
    disabledMinutes: (selectedHour) => {
      const set = new Set()
      list.forEach((c) => {
        if (typeof c.disabledMinutes === 'function') c.disabledMinutes(selectedHour).forEach(v => set.add(v))
      })
      return [...set]
    },
  }
}

/**
 * 日期时间范围规则（OcDateTimeRangePicker 模式）：
 * - allowPast：是否允许早于「当前时刻」
 * - allowEqual：结束是否允许等于开始
 */
export function createDateTimeRangeRules ({
  getStart,
  getEnd,
  allowPast = false,
  allowEqual = false,
  getNow = () => dayjs(),
} = {}) {
  const resolve = (getter) => toDayjs(typeof getter === 'function' ? getter() : getter)

  return {
    disabledStartDate (current) {
      if (!current) return false
      const cur = dayjs(current).startOf('day')
      const now = getNow().startOf('day')
      if (!allowPast && cur.isBefore(now, 'day')) return true
      const end = resolve(getEnd)
      return !!(end && cur.isAfter(end, 'day'))
    },
    disabledEndDate (current) {
      if (!current) return false
      const cur = dayjs(current).startOf('day')
      const now = getNow().startOf('day')
      if (!allowPast && cur.isBefore(now, 'day')) return true
      const start = resolve(getStart)
      return !!(start && cur.isBefore(start, 'day'))
    },
    disabledStartTime (current) {
      const cur = toDayjs(current) || getNow()
      const end = resolve(getEnd)
      const now = getNow()
      const confs = []
      if (!allowPast && cur.isSame(now, 'day')) {
        confs.push(disabledTimeBefore(now))
      }
      if (end && cur.isSame(end, 'day')) {
        confs.push(disabledTimeAfter(end, !allowEqual))
      }
      return mergeDisabledTimeConf(...confs)
    },
    disabledEndTime (current) {
      const cur = toDayjs(current) || getNow()
      const start = resolve(getStart)
      const now = getNow()
      const confs = []
      if (!allowPast && cur.isSame(now, 'day')) {
        confs.push(disabledTimeBefore(now))
      }
      if (start && cur.isSame(start, 'day')) {
        // 结束须晚于开始：禁用 start 及之前（allowEqual 时仅禁用 start 之前）
        const bound = allowEqual ? start : start.add(1, 'minute')
        confs.push(disabledTimeBefore(bound))
      }
      return mergeDisabledTimeConf(...confs)
    },
    isValidRange (startVal, endVal) {
      const start = toDayjs(startVal)
      const end = toDayjs(endVal)
      if (!start || !end) return true
      return allowEqual ? !end.isBefore(start) : end.isAfter(start)
    },
  }
}

export { dayjs }
