import i18n from '@/locales'
import { isRequired } from '@/utils/validate'
import { checkIpInSegment } from '@Compute/utils/createServer'
import { resolveImageOsFieldMapForKey } from '@Compute/sections/OsSelect/fields'
import { resolveSystemDiskFieldMapForKey } from '@Compute/sections/Disk/fields'

export const serverConfigField = {
  network: i => `network[${i}]`,
  ip: i => `ip[${i}]`,
  sku: i => `sku[${i}]`,
  role: i => `role[${i}]`,
  num: i => `num[${i}]`,
  hypervisor: i => `hypervisors[${i}]`,
}

export function serverConfigImageOSFieldMap (i) {
  return resolveImageOsFieldMapForKey(i)
}

export function serverConfigDiskFieldMap (i) {
  return resolveSystemDiskFieldMapForKey(i)
}

export function serverConfigNetworkRules () {
  return [{ required: true, message: i18n.t('k8s.text_122') }]
}

export function serverConfigIpRules (i, networkData) {
  return [
    { required: true, message: i18n.t('k8s.text_169') },
    { validator: checkIpInSegment(i, networkData) },
  ]
}

export function serverConfigSkuRules () {
  return [{ validator: isRequired(true, 'id'), message: i18n.t('compute.text_216') }]
}

export function serverConfigNumRules () {
  return [{ required: true, message: i18n.t('k8s.text_170') }]
}

export function serverConfigRoleRules () {
  return [{ required: true }]
}
