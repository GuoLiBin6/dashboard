<template>
  <a-form-item class="mb-0">
    <a-radio-group :value="strategyValue" @change="changeHandle">
      <a-radio-button
        v-for="item in opts"
        :value="item.key"
        :key="item.key">{{ item.label }}</a-radio-button>
    </a-radio-group>
  </a-form-item>
</template>

<script>
// description：偏好设置 组件
import { STRATEGY_OPT } from '@Cloudenv/constants/sched'

export default {
  name: 'SrategyRadio',
  props: {
    /** a-form-model：受控值；有 value 时不依赖 inject form */
    value: {
      type: String,
      default: undefined,
    },
    /** 可选字段名；优先用 v-model:value */
    field: {
      type: String,
      default: 'strategy',
    },
    initialValue: {
      default: undefined,
    },
    isNone: {
      type: Boolean,
      default: true,
    },
  },
  inject: {
    form: { default: undefined },
  },
  computed: {
    fieldName () {
      return this.field
    },
    strategyValue () {
      if (this.value !== undefined) return this.value
      const fd = this.form?.fd
      if (fd && this.fieldName in fd) return fd[this.fieldName]
      return this.initialValue
    },
    opts () {
      const _opts = [...STRATEGY_OPT]
      if (!this.isNone) {
        return _opts.filter(opt => opt.key)
      }
      return _opts
    },
  },
  created () {
    if (this.value !== undefined) return
    const fd = this.form?.fd
    if (!fd) return
    if (fd[this.fieldName] === undefined) {
      if (this.initialValue !== undefined) this.$set(fd, this.fieldName, this.initialValue)
    }
  },
  methods: {
    changeHandle (e) {
      const val = e?.target?.value
      this.$emit('update:value', val)
      this.$emit('change', val)
      if (this.value !== undefined) return
      if (this.form?.fd) {
        this.$set(this.form.fd, this.fieldName, val)
      }
    },
  },
}
</script>
