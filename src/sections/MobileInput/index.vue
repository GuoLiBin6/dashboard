<template>
  <a-input-group compact>
    <a-select
      :value="area_code"
      :filter-option="filterOption"
      show-search
      style="width: 40%"
      @change="handleCountryChange">
      <a-select-option
        v-for="c in countries"
        :key="c.value"
        :value="c.value"
        :label="c.label">
        {{ `${c.label}(+${c.value})` }}
      </a-select-option>
    </a-select>
    <a-input
      :value="mobile"
      style="width: 60%"
      @update:value="handleMobileInput" />
  </a-input-group>
</template>

<script>
export default {
  name: 'MobileInput',
  props: {
    value: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    const value = this.value || {}
    // vue-i18n v9+：$t 对对象文案返回 key 字符串，需用 $tm
    const countriesMap = this.$tm('countries') || {}
    const countries = Object.entries(countriesMap)
      .map(([code, label]) => ({ value: code, label }))
      .sort((a, b) => Number(a.value) - Number(b.value))
    return {
      area_code: value.area_code || '86',
      mobile: value.mobile || '',
      countries,
    }
  },
  watch: {
    value (val) {
      // 忽略被 DOM 捕获误写成的字符串，避免把已输入手机号清空
      if (!val || typeof val !== 'object' || Array.isArray(val)) return
      if (val.area_code !== undefined && val.area_code !== this.area_code) {
        this.area_code = val.area_code || '86'
      }
      if (val.mobile !== undefined && val.mobile !== this.mobile) {
        this.mobile = val.mobile || ''
      }
    },
  },
  methods: {
    filterOption (input, option) {
      const text = `${option.label || ''}(+${option.value || ''})`
      return text.toLowerCase().includes((input || '').toLowerCase())
    },
    handleMobileInput (val) {
      this.mobile = val
      this.emitValue()
    },
    handleCountryChange (val) {
      this.area_code = val
      this.emitValue()
    },
    emitValue () {
      const payload = {
        area_code: this.area_code,
        mobile: this.mobile,
      }
      // 只发 change：v-decorator 会同时监听 change/update:value，避免重复写 fd
      this.$emit('change', payload)
    },
  },
}
</script>
