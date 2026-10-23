/**
 * Shared field-map helpers for end-state sections.
 * 优先把 meta.rules 绑到 a-form-item :rules，由父 Form.validate 展示红字。
 * runFieldMapRules 仅留给 Form 管不到的动态项兜底。
 */
import { resolveFieldMeta } from '@/utils/common/ant'
import { parseBracketName } from '@/utils/bracketModel'

/** decorator / bracket 名 → Form.Item namePath */
function toFieldNamePath (name) {
  if (name == null || name === '') return undefined
  if (Array.isArray(name)) return name
  if (typeof name !== 'string') return name
  const parsed = parseBracketName(name)
  if (!parsed) return name
  if (!parsed.path.length) return parsed.root
  return [parsed.root, ...parsed.path]
}

export default {
  methods: {
    /** Form.Item :name（bracket → 路径数组，对齐嵌套 model） */
    fieldName (fieldDef, key = '') {
      return toFieldNamePath(resolveFieldMeta(fieldDef, key)?.name)
    },
    /** Form.Item :rules */
    fieldRules (fieldDef, key = '') {
      return resolveFieldMeta(fieldDef, key)?.rules || []
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length)
          if (empty) {
            reject(new Error(rule.message || 'required'))
            return
          }
        }
        if (typeof rule.validator === 'function') {
          let settled = false
          const finish = (err) => {
            if (settled) return
            settled = true
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          }
          let ret
          try {
            ret = rule.validator(rule, value, finish)
          } catch (e) {
            finish(e)
            return
          }
          if (ret && typeof ret.then === 'function') {
            ret.then(() => finish()).catch(finish)
          }
          return
        }
        resolve()
      })
    },
    async runFieldMapRules (fieldDef, value, key = '') {
      const meta = resolveFieldMeta(fieldDef, key)
      if (!meta) return
      const rules = meta.rules || []
      for (const rule of rules) {
        await this.runFieldRule(rule, value)
      }
    },
  },
}
