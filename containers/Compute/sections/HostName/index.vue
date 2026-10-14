<template>
  <a-input
    v-model:value="model[field]"
    :placeholder="isWindows ? $t('compute.validate.windows') : $t('compute.validate.others')"
    @change="handleHostNameChange" />
</template>

<script>
export default {
  name: 'HostName',
  props: {
    model: {
      type: Object,
      required: true,
    },
    /** fd 字段名，默认 hostName */
    field: {
      type: String,
      default: 'hostName',
    },
    isWindows: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['change', 'update:value'],
  methods: {
    handleHostNameChange (e) {
      const val = e && e.target ? e.target.value : e
      this.$emit('update:value', val)
      this.$emit('change', val)
    },
    /** 父页仍会 await hostNameRef.validate()；格式校验在父页 hostNameValidate */
    async validate () {
      return true
    },
  },
}
</script>
