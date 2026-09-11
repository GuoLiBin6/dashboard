/**
 * ant-design-vue vc-picker 在 @vue/compat 下：
 * 原版 ` { ...props, ...attrs } ` 会让错误 attrs.onSelect 盖掉面板 props.onSelect；
 * 若完全不合并 attrs，Header/DateHeader 的 onMonthClick/onPrevMonth 等（未声明 props，走 attrs）会丢失，
 * 导致月份/年份切换、左右翻页按钮全部失效。
 *
 * 策略：先 attrs 再 props（props 优先），并规范化 onXxx。
 */
import { getCurrentInstance } from 'vue'

function normalizeListener (val) {
  if (typeof val === 'function') return val
  if (!Array.isArray(val)) return val
  const fns = val.filter((v) => typeof v === 'function')
  if (!fns.length) return undefined
  if (fns.length === 1) return fns[0]
  return (...args) => {
    for (let i = 0; i < fns.length; i++) fns[i](...args)
  }
}

export default function useMergeProps (props) {
  const instance = getCurrentInstance()
  const attrs = (instance && instance.attrs) || {}
  // props 覆盖 attrs，避免错误 attrs 盖掉面板传入的 onSelect
  const merged = { ...attrs, ...(props || {}) }
  Object.keys(merged).forEach((key) => {
    if (key.startsWith('on')) {
      merged[key] = normalizeListener(merged[key])
    }
  })
  return merged
}
