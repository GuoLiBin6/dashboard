import validateForm from '@/utils/validate'
import { checkIpInSegment, checkIpV6 } from '@Compute/utils/createServer'

/** VM create network — field names aligned with createServer.js / form.fd */

export const NETWORK_TYPE_FIELD = 'networkType'

export function networkVpcField (i) {
  return `vpcs[${i}]`
}
export function networkNetworksField (i) {
  return `networks[${i}]`
}
export function networkIpsField (i) {
  return `networkIps[${i}]`
}
export function networkIps6Field (i) {
  return `networkIpsAddress6[${i}]`
}
export function networkIpv6ModeField (i) {
  return `networkIPv6Modes[${i}]`
}
export function networkMacsField (i) {
  return `networkMacs[${i}]`
}
export function networkIpv6sField (i) {
  return `networkIPv6s[${i}]`
}
export function networkDevicesField (i) {
  return `networkDevices[${i}]`
}
export function networkSecgroupsField (i) {
  return `networkSecgroups[${i}]`
}
export function networkSchedtagsField (i) {
  return `networkSchedtags[${i}]`
}
export function networkPolicysField (i) {
  return `networkPolicys[${i}]`
}

export function resolveNetworkConfigFieldMap () {
  return {
    vpcs: (uid) => [networkVpcField(uid), {}],
    networks: (uid) => [networkNetworksField(uid), {}],
    ips: (uid, _net) => [networkIpsField(uid), {}],
    ips6: (uid, _net) => [networkIps6Field(uid), {}],
    ipv6_mode: (uid, _net) => [networkIpv6ModeField(uid), {}],
    macs: (uid, _net) => [networkMacsField(uid), {}],
    ipv6s: (uid, _net) => [networkIpv6sField(uid), {}],
    devices: (uid) => [networkDevicesField(uid), {}],
    secgroups: (uid) => [networkSecgroupsField(uid), {}],
  }
}

export function resolveNetworkSchedtagFieldMap () {
  return {
    schedtags: (uid) => [networkSchedtagsField(uid), {}],
    policys: (uid, _net) => [networkPolicysField(uid), {}],
    devices: (uid) => [networkDevicesField(uid), {}],
  }
}

export function resolveServerNetworkFieldMap () {
  return {
    networkType: { name: NETWORK_TYPE_FIELD },
    networkConfig: resolveNetworkConfigFieldMap(),
    networkSchedtag: resolveNetworkSchedtagFieldMap(),
  }
}

/** 虚拟机改网卡对话框 — 原 SetNetwork.vue networkConfig */
export function buildSetNetworkDialogFieldMap (vm) {
  const t = key => vm.$t(key)
  const v = name => vm.$validate(name)
  return {
    vpcs: i => ({
      name: `vpcs[${i}]`,
      validateTrigger: ['change', 'blur'],
      rules: [{ required: true, message: t('compute.text_194') }],
    }),
    networks: i => ({
      name: `networks[${i}]`,
      validateTrigger: ['change', 'blur'],
      rules: [{ required: true, message: t('compute.text_217') }],
    }),
    ips: (i, networkData) => ({
      name: `networkIps[${i}]`,
      validateFirst: true,
      validateTrigger: ['blur', 'change'],
      rules: [
        { required: true, message: t('compute.text_218') },
        { validator: v('IPv4') },
        { validator: checkIpInSegment(i, networkData) },
      ],
    }),
    ips6: (i, networkData) => ({
      name: `networkIpsAddress6[${i}]`,
      validateFirst: true,
      validateTrigger: ['blur', 'change'],
      rules: [
        { required: true, message: t('compute.complete_ipv6_address') },
        { validator: checkIpV6(i, networkData) },
      ],
    }),
    ipv6_mode: (i) => ({ name: `networkIPv6Modes[${i}]`, validateTrigger: ['change', 'blur'] }),
    macs: (i) => ({
      name: `networkMacs[${i}]`,
      validateFirst: true,
      validateTrigger: ['blur', 'change'],
      rules: [
        { required: true, message: t('compute.text_806') },
        { validator: validateForm('mac') },
      ],
    }),
    ipv6s: (i) => ({ name: `networkIPv6s[${i}]`, validateFirst: true, validateTrigger: ['blur', 'change'] }),
    devices: i => ({
      name: `networkDevices[${i}]`,
      validateTrigger: ['change', 'blur'],
      rules: [{ required: true, message: t('compute.sriov_device_tips') }],
    }),
    secgroups: (i) => ({
      name: `networkSecgroups[${i}]`,
      validateTrigger: ['change', 'blur'],
      rules: [{ required: true, message: t('compute.text_193') }],
    }),
  }
}
