import fieldMapValidateMixin from '@Compute/mixins/fieldMapValidateMixin'
import { resolveFieldMeta } from '@/utils/common/ant'
/**
 * End-state model helpers for NIC dynamic fields.
 * Bracket field names like `networks[uuid]` → model.networks[uuid] (nested), never flat `networks[uuid]` keys.
 */
export function parseNicFieldName (name) {
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
    nicField (root, key) {
      if (!this.model) return undefined
      return this.model[root]?.[key]
    },
    setNicField (root, key, val) {
      if (!this.model) return
      this.ensureMap(root)
      this.$set(this.model[root], key, val)
    },
    /** Read by field def — model nested only */
    nicFieldVal (fieldDef) {
      const meta = resolveFieldMeta(fieldDef)
      if (!meta) return undefined
      const { name, initialValue } = meta
      if (!name || !this.model) return initialValue
      const parsed = parseNicFieldName(name)
      if (parsed?.key) {
        const v = this.nicField(parsed.root, parsed.key)
        return v !== undefined ? v : initialValue
      }
      const v = this.model[name]
      return v !== undefined ? v : initialValue
    },
    /** Write by field def — model nested only */
    nicFieldSet (fieldDef, value) {
      const meta = resolveFieldMeta(fieldDef)
      if (!meta || !this.model) return
      const { name } = meta
      if (!name) return
      const parsed = parseNicFieldName(name)
      if (parsed?.key) {
        this.setNicField(parsed.root, parsed.key, value)
      } else {
        this.$set(this.model, name, value)
      }
    },
    /** Batch write: nested-only */
    nicWriteFields (vals) {
      if (!vals || typeof vals !== 'object' || !this.model) return
      Object.keys(vals).forEach((key) => {
        const parsed = parseNicFieldName(key)
        if (parsed?.key) {
          this.setNicField(parsed.root, parsed.key, vals[key])
        } else if (vals[key] !== null && typeof vals[key] === 'object' && !Array.isArray(vals[key])) {
          // already nested map fragment e.g. { vpcs: { [k]: id } }
          this.ensureMap(key)
          Object.keys(vals[key]).forEach((k) => {
            this.$set(this.model[key], k, vals[key][k])
          })
        } else {
          this.$set(this.model, key, vals[key])
        }
      })
    },
  },
}
