import i18n from '@/locales'

const BILL_TYPES_MAP = {
  postpaid: {
    label: i18n.t('billingType.postpaid'),
    key: 'postpaid',
  },
  prepaid: {
    label: i18n.t('billingType.prepaid'),
    key: 'prepaid',
  },
}

export default {
  name: 'ClearingRadios',
  inject: ['form'],
  props: {
    billing_type: {
      type: String,
      default: 'postpaid',
    },
    duration: {
      type: String,
      default: '1M',
    },
    auto_renew: {
      type: Boolean,
      default: true,
    },
    labelCol: {
      type: Object,
      default: () => {
        return {
          span: 24,
        }
      },
    },
    wrapperCol: {
      type: Object,
      default: () => {
        return {
          span: 24,
        }
      },
    },
  },
  computed: {
    FC () {
      if (this.form && this.form.fc) {
        return this.form.fc
      }
      return this.$form.createForm(this)
    },
    formItemLayout () {
      return {
        labelCol: this.labelCol,
        wrapperCol: this.wrapperCol,
      }
    },
  },
  render (h) {
    const { getFieldDecorator, getFieldValue } = this.FC
    const isPrepaid = getFieldValue('billing_type') === 'prepaid'
    const RenderDuration = () => {
      if (!isPrepaid) return null
      const durationOptions = Object.keys(this.$t('buyDurations')).map(k => {
        return h('a-radio-button', { key: k, attrs: { value: k } }, [this.$t('buyDurations')[k]])
      })
      const durationGroup = h('a-radio-group', durationOptions)
      const durationField = getFieldDecorator('duration', {
        initialValue: this.duration,
      })(durationGroup)
      const autoRenewField = getFieldDecorator('auto_renew', {
        initialValue: this.auto_renew,
      })(h('a-checkbox', {
        class: 'ml-4',
        attrs: { defaultChecked: this.auto_renew },
      }, [this.$t('common_728')]))
      return h('div', [durationField, autoRenewField])
    }
    const billingOptions = Object.keys(BILL_TYPES_MAP).map(k => {
      return h('a-radio-button', { key: k, attrs: { value: k } }, [BILL_TYPES_MAP[k].label])
    })
    const billingGroup = h('a-radio-group', billingOptions)
    const billingField = getFieldDecorator('billing_type', {
      initialValue: this.billing_type,
    })(billingGroup)
    return h('div', [
      h('a-form-item', {
        attrs: {
          labelCol: this.labelCol,
          wrapperCol: this.wrapperCol,
          label: i18n.t('table.title.bill_type'),
        },
      }, [billingField, RenderDuration()]),
    ])
  },
}
