<template>
  <a-form-model-item :label="$t('cloudenv.skip_duplicate_account_check')">
    <a-switch
      :checkedChildren="$t('cloudenv.text_84')"
      :unCheckedChildren="$t('cloudenv.text_85')"
      v-model:checked="skipDuplicate"
      @change="onSkipDuplicateChange" />
  </a-form-model-item>
</template>

<script>
export default {
  name: 'SkipDuplicateAccountCheck',
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
    const { skip_duplicate_account_check = false } = this.cloneData
    return {
      skipDuplicate: skip_duplicate_account_check,
    }
  },
  watch: {
    checked: {
      handler (val) {
        this.skipDuplicate = !!val
        this.$nextTick(() => this.syncSkipDuplicateToForm(this.skipDuplicate))
      },
      immediate: true,
    },
  },
  mounted () {
    this.syncSkipDuplicateToForm(this.skipDuplicate)
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
    syncSkipDuplicateToForm (v) {
      const fd = this.getFormFd()
      if (!fd) return
      this.$set(fd, 'skip_duplicate_account_check', v)
    },
    onSkipDuplicateChange (v) {
      this.skipDuplicate = v
      this.syncSkipDuplicateToForm(v)
    },
  },
}
</script>
