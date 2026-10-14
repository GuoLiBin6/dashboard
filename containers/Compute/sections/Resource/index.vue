<template>
  <a-form-item>
    <a-radio-group :value="resourceValue" @change="changeHandle">
      <a-radio-button
        v-for="(item, key) in resourceTypesMap"
        :value="key"
        :key="key">{{ item.label }}</a-radio-button>
    </a-radio-group>
  </a-form-item>
</template>

<script>
import { RESOURCE_TYPES_MAP } from '@Compute/constants'

export default {
  name: 'Resource',
  props: {
    field: {
      type: String,
      default: 'resourceType',
    },
  },
  inject: {
    form: { default: undefined },
  },
  data () {
    return {
      resourceTypesMap: RESOURCE_TYPES_MAP,
    }
  },
  computed: {
    resourceValue () {
      return this.form?.fd?.[this.field]
    },
  },
  created () {
    const fd = this.form?.fd
    if (fd && fd[this.field] === undefined) {
      this.$set(fd, this.field, RESOURCE_TYPES_MAP.shared.key)
    }
  },
  methods: {
    changeHandle (e) {
      const val = e?.target?.value
      if (this.form?.fd) {
        this.form.fd[this.field] = val
      }
    },
  },
}
</script>

<style>

</style>
