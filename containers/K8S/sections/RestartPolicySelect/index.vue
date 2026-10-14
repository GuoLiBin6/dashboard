<template>
  <a-form-item>
    <base-select
      :value="innerValue"
      @change="onChange"
      :options="options" />
  </a-form-item>
</template>

<script>
import * as R from 'ramda'
import { RESTART_POLICY_OPTS } from '@K8S/constants/index.js'

export default {
  name: 'K8SrestartPolicySelect',
  props: {
    type: {
      type: String,
      required: true,
      validator: type => R.is(Array, RESTART_POLICY_OPTS[type]),
    },
    form: {
      type: Object,
      default: null,
    },
  },
  data () {
    const opts = RESTART_POLICY_OPTS[this.type] || []
    return {
      options: opts,
      innerValue: opts[0]?.key,
    }
  },
  computed: {
    fieldName () {
      return 'restartPolicy'
    },
  },
  mounted () {
    const fd = this.getFormFd()
    if (fd && fd[this.fieldName] !== undefined) {
      this.innerValue = fd[this.fieldName]
    }
    this.syncToForm(this.innerValue)
  },
  methods: {
    getFormFd () {
      if (this.form?.fd) return this.form.fd
      if (this.form && typeof this.form === 'object') return this.form
      let cur = this.$parent
      while (cur) {
        if (cur.form?.fd) return cur.form.fd
        cur = cur.$parent
      }
      return null
    },
    syncToForm (v) {
      const fd = this.getFormFd()
      if (fd) this.$set(fd, this.fieldName, v)
    },
    onChange (v) {
      this.innerValue = v
      this.syncToForm(v)
    },
  },
}
</script>
