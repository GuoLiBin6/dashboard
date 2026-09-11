<template>
  <a-select popupClassName="oc-select-dropdown" :value="valueC" allow-clear @change="handleChange" showSearch :filterOption="filterOption">
    <a-select-option v-for="item in options" :key="item.id">
      <span class="text-color-secondary option-prefix">{{ $t('dictionary.zone') }}: </span>{{ _$t(item) }}
    </a-select-option>
  </a-select>
</template>

<script>
import * as R from 'ramda'

export default {
  name: 'CloudregionZoneZone',
  inject: {
    form: { default: null },
  },
  props: {
    value: {
    },
    options: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    valueC () {
      // v-decorator 在 Vue3 下不一定能把 value 注入 props，回退读 form.fd
      const v = this.value || this.form?.fd?.zone
      if (R.is(Object, v)) {
        return v.key || undefined
      }
      return v || undefined
    },
  },
  methods: {
    handleChange (v) {
      const opt = this.options.find(val => val.id === v)
      const label = opt ? opt.name : ''
      this.$emit('change', { key: v, label })
    },
    filterOption (input, option) {
      return (
        option.componentOptions.children[1].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
  },
}
</script>
