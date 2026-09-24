<template>
  <a-form-item :label="$t('cloudenv.read_only')">
    <a-switch
      :checkedChildren="$t('cloudenv.text_84')"
      :unCheckedChildren="$t('cloudenv.text_85')"
      v-model:checked="readOnly"
      @change="onReadOnlyChange" />
      <div slot="extra">
        {{ $t('cloudenv.read_only_extra') }}
      </div>
  </a-form-item>
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
      decorators: {
        read_only: [
          'read_only',
          {
            initialValue: this.cloneData.read_only || false,
            valuePropName: 'checked',
          },
        ],
      },
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
    getFormFc () {
      if (this.form && this.form.fc) return this.form.fc
      let cur = this.$parent
      while (cur) {
        if (cur.form && cur.form.fc) return cur.form.fc
        cur = cur.$parent
      }
      return null
    },
    syncReadOnlyToForm (v) {
      const fc = this.getFormFc()
      if (!fc) return
      const opts = this.decorators.read_only[1] || {}
      if (typeof fc.__registerField === 'function') fc.__registerField('read_only', opts)
      fc.setFieldsValue({ read_only: v })
    },
    onReadOnlyChange (v) {
      this.readOnly = v
      this.syncReadOnlyToForm(v)
    },
  },
}
</script>
