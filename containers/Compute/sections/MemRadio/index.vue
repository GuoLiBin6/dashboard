<template>
  <a-form-model-item :extra="extra" :prop="field">
    <a-radio-group
      v-model:value="model[field]"
      :disabled="disabled"
      @change="onChange">
      <a-radio-button v-show="showUnlimited" :key="0" :value="0">{{ $t('compute.unlimited') }}</a-radio-button>
      <a-radio-button
        v-for="item in options"
        :key="item"
        :value="item"
        :disabled="disableOptionHandle(item)">{{ item | format }}</a-radio-button>
    </a-radio-group>
  </a-form-model-item>
</template>

<script>
import { sizestrWithUnit } from '@/utils/utils'
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'MemRadio',
  filters: {
    format (val) {
      return sizestrWithUnit(val, 'M', 1024)
    },
  },
  mixins: [createFormFieldDraftMixin],
  props: {
    model: {
      type: Object,
      required: true,
    },
    /** fd 字段名，默认 vmem */
    field: {
      type: String,
      default: 'vmem',
    },
    formDraftKind: {
      type: String,
      default: 'selection',
    },
    options: {
      type: Array,
      required: true,
    },
    disableOptions: {
      type: Array,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    extra: {
      type: String,
      default: '',
    },
    showUnlimited: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:value', 'change'],
  computed: {
    memValue () {
      return this.model[this.field]
    },
  },
  watch: {
    options: {
      immediate: true,
      handler (opts) {
        this.$nextTick(() => this.tryRestoreMemDraft(opts))
      },
    },
  },
  methods: {
    disableOptionHandle (item) {
      return this.disableOptions.includes(item)
    },
    onChange (e) {
      const val = e && e.target ? e.target.value : undefined
      this.$emit('change', val)
    },
    tryRestoreMemDraft (opts) {
      if (!this.formDraftKey || !Array.isArray(opts)) return
      const draft = this.readFormFieldDraft()
      if (draft === null || draft === undefined || draft === '') return
      let next
      if (this.showUnlimited && (draft === 0 || draft === '0')) {
        next = 0
      } else if (!opts.length) {
        return
      } else {
        const hit = this.matchFormFieldDraftInOptions(opts, draft, { getId: item => item })
        if (hit != null) next = hit
        else if (opts.some(item => Number(item) === 2048)) next = opts.find(item => Number(item) === 2048)
        else next = opts[0]
      }
      if (next == null) return
      if (this.memValue === next || String(this.memValue) === String(next)) return
      this.$set(this.model, this.field, next)
      this.$emit('update:value', next)
      this.$emit('change', next)
    },
    serializeFormFieldDraft () {
      return this.memValue != null && this.memValue !== '' ? this.memValue : undefined
    },
  },
}
</script>
