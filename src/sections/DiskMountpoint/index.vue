<template>
  <div class="d-flex">
    <a-form-item
      :wrapperCol="{ span: 24 }"
      class="mb-0 mr-1">
      <base-select
        :options="filetypeOpts"
        :value="filetypeVal"
        @change="onFiletypeChange"
        :select-props="{ allowClear: true, placeholder: $t('common_149') }" />
    </a-form-item>
    <a-form-item class="mb-0" v-if="filetypeVal !== 'swap'" :wrapperCol="{ span: 24 }">
      <a-input
        :value="mountPathVal"
        @update:value="onMountPathChange"
        :placeholder="$t('common_150')"
        style="min-width: 170px;" />
    </a-form-item>
  </div>
</template>

<script>
import { DISK_MOUNT_POINT_OPTIONS } from '@/constants/compute'

function parseBracketName (name) {
  if (!name || typeof name !== 'string') return null
  const m = name.match(/^([^[\]]+)\[([^[\]]+)\]$/)
  if (m) return { root: m[1], key: m[2] }
  return { root: name, key: null }
}

export default {
  name: 'DiskMountpoint',
  props: {
    filetypeField: {
      type: String,
      required: true,
    },
    mountPathField: {
      type: String,
      required: true,
    },
    form: {
      type: Object,
      default: null,
    },
    /** a-form-model end-state：bracket 名写入嵌套 map，不双写 fc */
    model: {
      type: Object,
      default: null,
    },
    schedtagParams: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    return {
      filetypeLocal: '',
      mountPathLocal: '',
      filetypeOpts: DISK_MOUNT_POINT_OPTIONS,
    }
  },
  computed: {
    filetypeVal () {
      const v = this.modelGet(this.filetypeField)
      return v !== undefined ? v : this.filetypeLocal
    },
    mountPathVal () {
      const v = this.modelGet(this.mountPathField)
      return v !== undefined ? v : this.mountPathLocal
    },
  },
  methods: {
    ensureMap (root) {
      if (!this.model[root] || typeof this.model[root] !== 'object') {
        this.$set(this.model, root, {})
      }
    },
    modelGet (name) {
      if (!this.model || !name) return undefined
      const parsed = parseBracketName(name)
      if (parsed?.key) return this.model[parsed.root]?.[parsed.key]
      return this.model[name]
    },
    modelSet (name, value) {
      if (!this.model || !name) return
      const parsed = parseBracketName(name)
      if (parsed?.key) {
        this.ensureMap(parsed.root)
        this.$set(this.model[parsed.root], parsed.key, value)
      } else {
        this.$set(this.model, name, value)
      }
    },
    onFiletypeChange (val) {
      this.filetypeLocal = val
      this.modelSet(this.filetypeField, val)
    },
    onMountPathChange (val) {
      this.mountPathLocal = val
      this.modelSet(this.mountPathField, val)
    },
  },
}
</script>
