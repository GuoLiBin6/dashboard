
import validateForm from '@/utils/validate'
import i18n from '@/locales'

export const BILL_TYPES_MAP = {
  postpaid: {
    label: i18n.t('network.text_256'),
    key: 'postpaid',
  },
  prepaid: {
    label: i18n.t('network.text_257'),
    key: 'prepaid',
  },
}

/** NAT 创建 field-map（initialValue 唯一来源） */
export const NATS_CREATE_FIELD_MAP = {
  eip: {
    type: { name: 'type', initialValue: 'none' },
    charge_type: { name: 'charge_type', initialValue: 'traffic' },
    bgp_type: { name: 'bgp_type', initialValue: '' },
    bandwidth: {
      name: 'bandwidth',
      initialValue: 30,
      validateFirst: true,
    },
    eip: {
      name: 'eip',
      rules: [
        { required: true, message: i18n.t('compute.text_145'), trigger: 'change' },
      ],
    },
  },
  billing_type: { name: 'billing_type', initialValue: 'postpaid' },
  duration: {
    durationStandard: { name: 'durationStandard', initialValue: 'none' },
    duration: { name: 'duration', initialValue: '1h' },
  },
  project_domain: { name: 'project_domain', initialValue: undefined },
  name: {
    name: 'name',
    validateFirst: true,
    rules: [
      { required: true, message: i18n.t('network.text_218') },
      { validator: validateForm('serverName') },
    ],
  },
  description: { name: 'description' },
  __meta__: {
    name: '__meta__',
    rules: [
      { validator: validateForm('tagName') },
    ],
  },
}

// capbilit接口所需要的参数
export const CAPABILIT_PARAMS = ['city', 'provider', 'cloudregion']

export const SKU_PARAMS = [...CAPABILIT_PARAMS]
