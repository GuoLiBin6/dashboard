<template>
  <a-input
    :value="displayValue"
    :disabled="disabled"
    @update:value="onInput"
    @change="onInput"
    @blur="onBlur">
    <template v-if="showUnitSelect" #addonAfter>
      <a-select
        :value="selectedUnit"
        :disabled="disabled"
        style="width: 80px"
        @change="handleUnitChange">
        <a-select-option
          v-for="item in unitOptions"
          :key="item.key"
          :value="item.value">
          {{ item.label }}
        </a-select-option>
      </a-select>
    </template>
    <template v-else-if="showUnitText" #addonAfter>
      <span>{{ unit }}</span>
    </template>
  </a-input>
</template>

<script>
const THRESHOLD_OPTIONS = {
  Bps: [
    { value: 'Bps', key: 'byte/s', label: 'byte/s', base: 1 },
    { value: 'KB/s', key: 'KB/s', label: 'KB/s', base: 1024 },
    { value: 'MB/s', key: 'MB/s', label: 'MB/s', base: 1024 * 1024 },
    { value: 'GB/s', key: 'GB/s', label: 'GB/s', base: 1024 * 1024 * 1024 },
  ],
  bps: [
    { value: 'bps', key: 'bit/s', label: 'bit/s', base: 1 },
    { value: 'Kb/s', key: 'Kb/s', label: 'Kb/s', base: 1000 },
    { value: 'Mb/s', key: 'Mb/s', label: 'Mb/s', base: 1000 * 1000 },
    { value: 'Gb/s', key: 'Gb/s', label: 'Gb/s', base: 1000 * 1000 * 1000 },
  ],
  byte: [
    { value: 'byte', key: 'byte', label: 'byte', base: 1 },
    { value: 'KB', key: 'KB', label: 'KB', base: 1024 },
    { value: 'MB', key: 'MB', label: 'MB', base: 1024 * 1024 },
    { value: 'GB', key: 'GB', label: 'GB', base: 1024 * 1024 * 1024 },
  ],
}

function pickOption (options, rawValue) {
  if (!options || !options.length) return null
  if (rawValue == null || rawValue === '') return options[0]
  const matched = options.filter(o => rawValue / o.base >= 1)
  return matched.length ? matched[matched.length - 1] : options[0]
}

export default {
  name: 'ThresholdInput',
  props: {
    value: {
      type: [Number, String],
      default: undefined,
    },
    unit: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['change'],
  data () {
    const unitOptions = THRESHOLD_OPTIONS[this.unit] || null
    const option = pickOption(unitOptions, this.value)
    let displayValue = this.value
    if (unitOptions && option && this.value != null && this.value !== '') {
      displayValue = this.value / option.base
    } else if (this.value == null) {
      displayValue = ''
    }
    return {
      unitOptions,
      option,
      displayValue,
    }
  },
  computed: {
    showUnitSelect () {
      return !!(this.unitOptions && this.unitOptions.length)
    },
    showUnitText () {
      return !!(this.unit && this.unit !== 'RMB' && this.unit !== 'NULL' && !this.showUnitSelect)
    },
    selectedUnit () {
      return this.option ? this.option.value : (this.unit || '')
    },
  },
  watch: {
    unit (val) {
      this.unitOptions = THRESHOLD_OPTIONS[val] || null
      this.option = pickOption(this.unitOptions, this.value)
      this.syncDisplayFromValue(this.value)
    },
    value (v) {
      this.syncDisplayFromValue(v)
    },
  },
  methods: {
    syncDisplayFromValue (v) {
      if (v == null || v === '') {
        this.displayValue = ''
        return
      }
      if (this.unitOptions && this.unitOptions.length) {
        this.option = pickOption(this.unitOptions, v)
        this.displayValue = v / this.option.base
      } else {
        this.displayValue = v
      }
    },
    handleUnitChange (v) {
      this.option = (this.unitOptions || []).find(o => o.value === v) || null
      this.emitChange()
    },
    onInput (e) {
      const raw = e && e.target ? e.target.value : e
      this.displayValue = raw
      this.emitChange()
    },
    onBlur (e) {
      const raw = e && e.target ? e.target.value : this.displayValue
      const num = raw === '' ? '' : Number(raw)
      if (raw !== '' && Number.isNaN(num)) return
      this.displayValue = num
      this.emitChange()
    },
    emitChange () {
      let out = this.displayValue
      if (out !== '' && out != null) {
        const num = Number(out)
        if (Number.isNaN(num)) return
        out = this.option ? this.option.base * num : num
      }
      this.$emit('change', out)
    },
  },
}
</script>
