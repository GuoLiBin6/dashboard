<template>
  <div class="d-flex">
    <a-form-model-item :extra="extra" :prop="field">
      <a-radio-group
        v-model:value="model[field]"
        :disabled="disabled"
        @change="onChange">
        <a-radio-button v-show="showUnlimited" :key="0" :value="0">{{ $t('compute.unlimited') }}</a-radio-button>
        <a-radio-button
          v-for="item in realOptions"
          :key="item"
          :value="item"
          v-show="item < max || !showMore"
          :disabled="disableOptionHandle(item)">{{ $t('compute.text_120', [item]) }}</a-radio-button>
        <a-radio-button v-if="showMore" @click="showMore = !showMore">...</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="showCpuSockets" :extra="cpuSocketsExtra">
      <a-tooltip :title="isServerRunning ? $t('compute.hot_action_notsupport') : ''">
        <base-select
          :disabled="isServerRunning"
          :value="cpuSockets"
          class="ml-1"
          :options="getCpuSocketsOptions(cpuSocketsOptions, cpuValue)"
          @change="cpuSocketsChangeHandle" />
      </a-tooltip>
    </a-form-model-item>
    <a-button
      v-if="isVMware && !isServerRunning"
      class="mt-1"
      type="link"
      @click="showCpuSocketsHandle">{{ showCpuSockets ? $t('common.cancel') : $t('compute.set_cpu_sockets') }}</a-button>
  </div>
</template>

<script>
import * as R from 'ramda'
import { HYPERVISORS_MAP } from '@/constants'
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'CpuRadio',
  mixins: [createFormFieldDraftMixin],
  props: {
    model: {
      type: Object,
      required: true,
    },
    /** fd 字段名，默认 vcpu */
    field: {
      type: String,
      default: 'vcpu',
    },
    options: {
      type: Array,
      required: true,
    },
    disableOptions: {
      type: Array,
      default: () => [],
    },
    max: {
      type: Number,
      default: 32,
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
    form: {
      type: Object,
    },
    hypervisor: {
      validator: val => {
        if (val) return R.is(String, val)
        return true
      },
    },
    serverStatus: {
      type: String,
    },
    cpuSocketsInit: {
      type: Number,
    },
    showCpuSocketsInit: {
      type: Boolean,
    },
    formDraftKind: {
      type: String,
      default: 'selection',
    },
  },
  emits: ['update:value', 'change'],
  data () {
    const max = Math.max.apply(null, this.options || [0])
    return {
      showMore: max > this.max,
      cpuSockets: 0,
      cpuSocketsOptions: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '4', value: 4 },
      ],
      showCpuSockets: this.showCpuSocketsInit || false,
    }
  },
  computed: {
    cpuValue () {
      return this.model[this.field]
    },
    isVMware () {
      return this.hypervisor === HYPERVISORS_MAP.esxi.key
    },
    cpuSocketsExtra () {
      if (this.isServerRunning) {
        return `${this.$t('compute.core_per_sockets')}: ` + (this.cpuSocketsInit)
      }
      const cpu = Number(this.cpuValue) || 0
      return `${this.$t('compute.core_per_sockets')}: ` + (cpu / (this.cpuSockets || 1))
    },
    isServerRunning () {
      return this.serverStatus === 'running'
    },
    realOptions () {
      if (this.isServerRunning && this.showCpuSockets) {
        return this.options.filter(v => v % this.cpuSocketsInit === 0)
      }
      return this.options
    },
  },
  watch: {
    options: {
      immediate: true,
      handler (opts) {
        const max = Math.max.apply(null, opts || [0])
        this.showMore = max > this.max
        this.$nextTick(() => this.tryRestoreCpuDraft(opts))
      },
    },
    cpuSockets (v) {
      if (this.form?.fi) {
        this.form.fi.cpuSockets = v
      }
    },
    showCpuSocketsInit (v) {
      this.showCpuSockets = v
    },
    cpuSocketsInit: {
      handler (v) {
        const cpu = Number(this.cpuValue) || 0
        if (this.isServerRunning && v) {
          this.cpuSockets = cpu / v
        } else {
          this.cpuSockets = v
        }
      },
      immediate: true,
    },
    cpuValue (cpu) {
      const n = Number(cpu) || 0
      this.cpuSockets = this.isServerRunning && this.cpuSocketsInit
        ? n / this.cpuSocketsInit
        : (this.cpuSockets || 1)
    },
  },
  methods: {
    onChange (e) {
      const cpu = e && e.target ? e.target.value : e
      this.cpuSockets = this.isServerRunning ? cpu / this.cpuSocketsInit : 1
      this.$emit('change', cpu)
    },
    disableOptionHandle (item) {
      return this.disableOptions.includes(item)
    },
    showCpuSocketsHandle () {
      this.showCpuSockets = !this.showCpuSockets
      if (this.form?.fi) {
        this.form.fi.showCpuSockets = this.showCpuSockets
      }
    },
    cpuSocketsChangeHandle (v) {
      this.cpuSockets = v
    },
    getCpuSocketsOptions (cpuSocketsOptions, cpu) {
      const n = Number(cpu) || 0
      return cpuSocketsOptions.filter(item => n % item.value === 0)
    },
    tryRestoreCpuDraft (opts) {
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
        else if (opts.some(item => Number(item) === 2)) next = opts.find(item => Number(item) === 2)
        else next = opts[0]
      }
      if (next == null) return
      if (next !== 0 && Number(next) >= this.max) {
        this.showMore = false
      }
      if (this.cpuValue === next || String(this.cpuValue) === String(next)) return
      this.$set(this.model, this.field, next)
      this.$emit('update:value', next)
      this.$emit('change', next)
    },
    serializeFormFieldDraft () {
      return this.cpuValue != null && this.cpuValue !== '' ? this.cpuValue : undefined
    },
  },
}
</script>
