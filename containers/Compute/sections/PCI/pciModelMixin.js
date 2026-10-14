import fieldMapValidateMixin from '@Compute/mixins/fieldMapValidateMixin'
import { resolveFieldMeta } from '@/utils/common/ant'
/**
 * End-state model helpers for PCI dynamic fields.
 * Bracket field names like `pciDevType[uuid]` → model.pciDevType[uuid] (nested), never flat keys.
 */
export function parsePciFieldName (name) {
  if (!name || typeof name !== 'string') return null
  const m = name.match(/^([^[\]]+)\[([^[\]]+)\]$/)
  if (m) return { root: m[1], key: m[2] }
  return { root: name, key: null }
}

export default {
  mixins: [fieldMapValidateMixin],
  computed: {
    resolvedModel () {
      return this.model
    },
  },
  methods: {
    ensureMap (root) {
      const m = this.resolvedModel
      if (!m) return
      if (!m[root] || typeof m[root] !== 'object') {
        this.$set(m, root, {})
      }
    },
    pciMapField (root, key) {
      const m = this.resolvedModel
      if (!m) return undefined
      return m[root]?.[key]
    },
    setPciMapField (root, key, val) {
      const m = this.resolvedModel
      if (!m) return
      this.ensureMap(root)
      if (val === undefined) {
        if (Object.prototype.hasOwnProperty.call(m[root], key)) {
          this.$delete(m[root], key)
        }
        return
      }
      this.$set(m[root], key, val)
    },
    /** Read by field def — nested maps */
    pciFieldVal (fieldDef) {
      const meta = resolveFieldMeta(fieldDef)
      if (!meta) return undefined
      const { name, initialValue } = meta
      if (!name) return initialValue
      const parsed = parsePciFieldName(name)
      if (parsed?.key) {
        const v = this.pciMapField(parsed.root, parsed.key)
        return v !== undefined ? v : initialValue
      }
      const v = this.resolvedModel?.[name]
      return v !== undefined ? v : initialValue
    },
    /** Write by field def — nested only */
    pciFieldSet (fieldDef, value) {
      const meta = resolveFieldMeta(fieldDef)
      if (!meta) return
      const { name } = meta
      if (!name) return
      const parsed = parsePciFieldName(name)
      if (parsed?.key) {
        this.setPciMapField(parsed.root, parsed.key, value)
      } else if (value === undefined) {
        if (Object.prototype.hasOwnProperty.call(this.resolvedModel, name)) {
          this.$delete(this.resolvedModel, name)
        }
      } else {
        this.$set(this.resolvedModel, name, value)
      }
    },
    /** Batch write flat bracket keys → nested */
    pciWriteFields (vals) {
      if (!vals || typeof vals !== 'object') return
      Object.keys(vals).forEach((key) => {
        const parsed = parsePciFieldName(key)
        if (parsed?.key) {
          this.setPciMapField(parsed.root, parsed.key, vals[key])
        } else if (vals[key] === undefined) {
          if (Object.prototype.hasOwnProperty.call(this.resolvedModel, key)) {
            this.$delete(this.resolvedModel, key)
          }
        } else {
          this.$set(this.resolvedModel, key, vals[key])
        }
      })
    },
    readPciRowField (field, key) {
      return this.pciMapField(field, String(key))
    },
    removePciRow (id) {
      const key = String(id)
      ;['pciDevType', 'pciGpuType', 'pciModel', 'pciCount', 'memory_request'].forEach((root) => {
        this.setPciMapField(root, key, undefined)
      })
    },
  },
}
