import i18n from '@/locales'
import validateForm from '@/utils/validate'

const stripIpWhitespace = value => (typeof value === 'string' ? value.replace(/\s/g, '') : value)

function validateGateway (rule, value, callback) {
  value = stripIpWhitespace(value)
  if (!value) return callback()
  const ipItems = value.split('.')
  const msg = i18n.t('network.text_591')
  if (ipItems[ipItems.length - 1] === '0') return callback(msg)
  return callback()
}

function validateGateway6 (rule, value, callback) {
  value = stripIpWhitespace(value)
  if (!value) return callback()
  const ipItems = value.split(':')
  const msg = i18n.t('network.text_591')
  if (ipItems[ipItems.length - 1] === '0') return callback(msg)
  return callback()
}

const FIELD_KEYS = ['startip', 'endip', 'netmask', 'gateway', 'vlan', 'startip6', 'endip6', 'netmask6', 'gateway6', 'name']

/**
 * @param {'network'|'cloudenv'|'batchEdit'} preset
 * @param {{ validateIpv4?: Function, validateIpv6?: Function, validateResourceName?: Function }} hooks
 */
export function buildIpSubnetsFactories (preset = 'network', hooks = {}) {
  const ipv4 = hooks.validateIpv4 || validateForm('IPv4')
  const ipv6 = hooks.validateIpv6 || validateForm('IPv6')
  const resourceName = hooks.validateResourceName || validateForm('resourceName')

  const cloudenvRequired = {
    startip: i => ({
      name: `startip[${i}]`,
      validateTrigger: ['change', 'blur'],
      validateFirst: true,
      rules: [
        { required: true, message: i18n.t('cloudenv.text_191') },
        { validator: ipv4 },
      ],
    }),
    endip: i => ({
      name: `endip[${i}]`,
      validateTrigger: ['change', 'blur'],
      validateFirst: true,
      rules: [
        { required: true, message: i18n.t('cloudenv.text_192') },
        { validator: ipv4 },
      ],
    }),
    netmask: i => ({
      name: `netmask[${i}]`,
      initialValue: '24',
      validateTrigger: ['change', 'blur'],
      rules: [{ required: true, message: i18n.t('cloudenv.text_234') }],
    }),
    gateway: i => ({
      name: `gateway[${i}]`,
      validateTrigger: ['change', 'blur'],
      validateFirst: true,
      rules: [
        { required: true, message: i18n.t('cloudenv.text_235') },
        { validator: ipv4 },
        { validator: validateGateway },
      ],
    }),
    vlan: i => [`vlan[${i}]`],
  }

  const networkOptionalIpv4 = {
    startip: i => ({
      name: `startip[${i}]`,
      initialValue: '',
      validateFirst: true,
      normalize: stripIpWhitespace,
      rules: [{ validator: ipv4 }],
    }),
    endip: i => ({
      name: `endip[${i}]`,
      initialValue: '',
      validateFirst: true,
      normalize: stripIpWhitespace,
      rules: [{ validator: ipv4 }],
    }),
    netmask: i => ({
      name: `netmask[${i}]`,
      initialValue: '24',
      rules: [{ required: true, message: i18n.t('network.text_595') }],
    }),
    gateway: i => ({
      name: `gateway[${i}]`,
      initialValue: '',
      validateTrigger: ['change', 'blur'],
      validateFirst: true,
      normalize: stripIpWhitespace,
      rules: [{ validator: ipv4 }, { validator: validateGateway }],
    }),
    startip6: i => ({
      name: `startip6[${i}]`,
      initialValue: '',
      validateFirst: true,
      normalize: stripIpWhitespace,
      rules: [{ validator: ipv6 }],
    }),
    endip6: i => ({
      name: `endip6[${i}]`,
      initialValue: '',
      validateFirst: true,
      normalize: stripIpWhitespace,
      rules: [{ validator: ipv6 }],
    }),
    netmask6: i => ({
      name: `netmask6[${i}]`,
      initialValue: '64',
      rules: [{ required: true, message: i18n.t('network.text_595') }],
    }),
    gateway6: i => ({
      name: `gateway6[${i}]`,
      initialValue: '',
      validateTrigger: ['change', 'blur'],
      validateFirst: true,
      normalize: stripIpWhitespace,
      rules: [{ validator: ipv6 }, { validator: validateGateway6 }],
    }),
    vlan: i => ({ name: `vlan[${i}]`, initialValue: '' }),
  }

  const batchEdit = {
    ...networkOptionalIpv4,
    name: i => ({
      name: `name[${i}]`,
      initialValue: '',
      validateTrigger: ['change', 'blur'],
      validateFirst: true,
      rules: [
        { required: true, message: i18n.t('network.text_116') },
        { validator: resourceName },
      ],
    }),
  }

  const map = {
    cloudenv: cloudenvRequired,
    network: networkOptionalIpv4,
    batchEdit,
  }
  const factories = map[preset] || networkOptionalIpv4
  const ret = {}
  FIELD_KEYS.forEach((key) => {
    if (factories[key]) ret[key] = factories[key]
  })
  return ret
}

export const EIP_SUBNET_FIELDS = {
  vpc: ['vpc', {}],
  network: ['network', {}],
  ip_addr: ['ip_addr', {}],
}
