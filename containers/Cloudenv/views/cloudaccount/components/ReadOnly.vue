<template>
  <a-form-model-item :label="$t('cloudenv.read_only')">
    <a-switch
      :checkedChildren="$t('cloudenv.text_84')"
      :unCheckedChildren="$t('cloudenv.text_85')"
      v-model:checked="readOnly"
      @change="onReadOnlyChange" />
    <template #extra>
      {{ $t('cloudenv.read_only_extra') }}
    </template>
  </a-form-model-item>
</template>

<script>
export default {
  name: 'ReadOnly',
  props: {
    checked: {
      type: Boolean,
      default: false,
    },
    form: {
      type: Object,
    },
    cloneData: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    return {
      readOnly: !!(this.cloneData.read_only || this.checked),
    }
  },
  watch: {
    checked (val) {
      this.readOnly = !!val
      this.syncReadOnlyToForm(this.readOnly)
    },
  },
  mounted () {
    this.syncReadOnlyToForm(this.readOnly)
  },
  methods: {
    getFormFd () {
      if (this.form?.fd) return this.form.fd
      if (this.form && typeof this.form === 'object' && !this.form.fd) return this.form
      let cur = this.$parent
      while (cur) {
        if (cur.form?.fd) return cur.form.fd
        cur = cur.$parent
      }
      return null
    },
    syncReadOnlyToForm (v) {
      const fd = this.getFormFd()
      if (!fd) return
      this.$set(fd, 'read_only', v)
    },
    onReadOnlyChange (v) {
      this.readOnly = v
      this.syncReadOnlyToForm(v)
    },
  },
}
</script>
