import fieldMapValidateMixin from '@Compute/mixins/fieldMapValidateMixin'
import { resolveFieldMeta } from '@/utils/common/ant'
/**
 * End-state model helpers for disk dynamic fields.
 * Bracket field names like `dataDiskSizes[uuid]` → model.dataDiskSizes[uuid] (nested), never flat keys.
 */
export function parseDiskFieldName (name) {
  if (!name || typeof name !== 'string') return null
  const m = name.match(/^([^[\]]+)\[([^[\]]+)\]$/)
  if (m) return { root: m[1], key: m[2] }
  return { root: name, key: null }
}

export default {
  mixins: [fieldMapValidateMixin],
  methods: {
    ensureMap (root) {
      if (!this.model) return
      if (!this.model[root] || typeof this.model[root] !== 'object') {
        this.$set(this.model, root, {})
      }
    },
    diskMapField (root, key) {
      if (!this.model) return undefined
      return this.model[root]?.[key]
    },
    setDiskMapField (root, key, val) {
      if (!this.model) return
      this.ensureMap(root)
      if (val === undefined) {
        if (Object.prototype.hasOwnProperty.call(this.model[root], key)) {
          this.$delete(this.model[root], key)
        }
        return
      }
      this.$set(this.model[root], key, val)
    },
    /** Read by field def — model nested only */
    diskFieldVal (fieldDef) {
      const meta = resolveFieldMeta(fieldDef)
      if (!meta) return undefined
      const { name, initialValue } = meta
      if (!name || !this.model) return initialValue
      const parsed = parseDiskFieldName(name)
      if (parsed?.key) {
        const v = this.diskMapField(parsed.root, parsed.key)
        return v !== undefined ? v : initialValue
      }
      const v = this.model[name]
      return v !== undefined ? v : initialValue
    },
    /** Write by field def — model nested only */
    diskFieldSet (fieldDef, value) {
      const meta = resolveFieldMeta(fieldDef)
      if (!meta || !this.model) return
      const { name } = meta
      if (!name) return
      const parsed = parseDiskFieldName(name)
      if (parsed?.key) {
        this.setDiskMapField(parsed.root, parsed.key, value)
      } else if (value === undefined) {
        if (Object.prototype.hasOwnProperty.call(this.model, name)) this.$delete(this.model, name)
      } else {
        this.$set(this.model, name, value)
      }
    },
    /** Batch write: nested-only */
    diskWriteFields (vals) {
      if (!vals || typeof vals !== 'object' || !this.model) return
      Object.keys(vals).forEach((key) => {
        const parsed = parseDiskFieldName(key)
        if (parsed?.key) {
          this.setDiskMapField(parsed.root, parsed.key, vals[key])
        } else if (vals[key] === undefined) {
          if (Object.prototype.hasOwnProperty.call(this.model, key)) this.$delete(this.model, key)
        } else {
          this.$set(this.model, key, vals[key])
        }
      })
    },
  },
}
