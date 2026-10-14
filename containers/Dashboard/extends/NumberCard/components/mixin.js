export default {
  props: {
    options: {
      type: Object,
      required: true,
    },
    params: Object,
    formItemLayout: {
      type: Object,
      required: true,
    },
    visible: {
      type: Boolean,
      default: false,
    },
    type: String,
  },
  methods: {
    setDefaultName (usage) {
      const usageKey = this.type === 'k8s' ? 'k8s_usage' : 'usage'
      if (!this.form?.fi?.nameTouched && this.form?.fd) {
        this.form.fd.name = this.$t(usageKey)[usage]
      }
      this.currentUsageKey = usage
    },
    cancel () {
      this.$emit('cancel')
    },
  },
}
