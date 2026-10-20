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
  props: {
    /**
     * a-form-model：父级 form 对象，读写 billing_type / duration / auto_renew（必传）。
     */
    model: {
      type: Object,
      required: true,
    },
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
    modelBillingType: {
      get () {
        return this.model?.billing_type ?? this.billing_type
      },
      set (v) {
        if (this.model) this.model.billing_type = v
      },
    },
    modelDuration: {
      get () {
        return this.model?.duration ?? this.duration
      },
      set (v) {
        if (this.model) this.model.duration = v
      },
    },
    modelAutoRenew: {
      get () {
        return this.model?.auto_renew ?? this.auto_renew
      },
      set (v) {
        if (this.model) this.model.auto_renew = v
      },
    },
  },
  created () {
    if (!this.model || typeof this.model !== 'object') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[ClearingRadios] prop `model` is required')
      }
      return
    }
    if (this.model.billing_type === undefined) this.model.billing_type = this.billing_type
    if (this.model.duration === undefined) this.model.duration = this.duration
    if (this.model.auto_renew === undefined) this.model.auto_renew = this.auto_renew
  },
  render (h) {
    const isPrepaid = this.modelBillingType === 'prepaid'
    const billingOptions = Object.keys(BILL_TYPES_MAP).map(k => {
      return h('a-radio-button', { key: k, props: { value: k } }, [BILL_TYPES_MAP[k].label])
    })
    const billingGroup = h('a-radio-group', {
      props: { value: this.modelBillingType },
      on: {
        change: (e) => {
          this.modelBillingType = e?.target?.value ?? e
        },
      },
    }, billingOptions)

    let durationNode = null
    if (isPrepaid) {
      const durationOptions = Object.keys(this.$t('buyDurations')).map(k => {
        return h('a-radio-button', { key: k, props: { value: k } }, [this.$t('buyDurations')[k]])
      })
      const durationGroup = h('a-radio-group', {
        props: { value: this.modelDuration },
        on: {
          change: (e) => {
            this.modelDuration = e?.target?.value ?? e
          },
        },
      }, durationOptions)
      const autoRenewField = h('a-checkbox', {
        class: 'ml-4',
        props: { checked: this.modelAutoRenew },
        on: {
          change: (e) => {
            this.modelAutoRenew = !!(e?.target?.checked ?? e)
          },
        },
      }, [this.$t('common_728')])
      durationNode = h('div', [durationGroup, autoRenewField])
    }

    return h('div', [
      h('a-form-item', {
        props: {
          labelCol: this.labelCol,
          wrapperCol: this.wrapperCol,
          label: i18n.t('table.title.bill_type'),
        },
      }, [billingGroup, durationNode]),
    ])
  },
}
