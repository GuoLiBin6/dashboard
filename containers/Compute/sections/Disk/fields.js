/** VM create disk field names — aligned with createServer.js / form.fd */

import i18n from '@/locales'
import { diskValidator } from '@Compute/utils/createServer'
import { isRequired } from '@/utils/validate'

export const SYSTEM_DISK_FIELDS = {
  type: 'systemDiskType',
  size: 'systemDiskSize',
  schedtag: 'systemDiskSchedtag',
  policy: 'systemDiskPolicy',
  storage: 'systemDiskStorage',
  iops: 'systemDiskIops',
  throughput: 'systemDiskThroughput',
  preallocation: 'systemDiskPreallocation',
  auto_reset: 'systemDiskAutoReset',
  snapshot: 'systemDiskSnapshot',
  filetype: 'systemDiskFiletype',
  mountPath: 'systemDiskMountPath',
}

const SYSTEM_DISK_FIELD_OPTS = {
  type: {
    rules: [
      { validator: isRequired(), message: i18n.t('compute.text_121') },
    ],
  },
  size: {
    rules: [
      { required: true, message: i18n.t('compute.text_122') },
    ],
  },
  schedtag: {
    validateTrigger: ['change', 'blur'],
    rules: [{
      required: true,
      message: i18n.t('compute.text_123'),
    }],
  },
  policy: {
    initialValue: '',
    validateTrigger: ['blur', 'change'],
    rules: [{
      required: true,
      message: i18n.t('compute.text_123'),
    }],
  },
  storage: {
    rules: [{
      required: true,
      message: i18n.t('compute.text_1351'),
    }],
  },
  iops: {
    rules: [{
      required: true,
      message: i18n.t('compute.iops_input_tip'),
    }],
  },
  throughput: {
    rules: [{
      required: true,
      message: i18n.t('compute.throuthput_input_tip'),
    }],
  },
  preallocation: {},
  auto_reset: {
    valuePropName: 'checked',
    initialValue: false,
  },
  snapshot: {
    validateTrigger: ['blur', 'change'],
    rules: [{
      required: true,
      message: i18n.t('compute.text_124'),
    }],
  },
  filetype: {
    validateTrigger: ['blur', 'change'],
    rules: [{
      required: true,
      message: i18n.t('compute.text_125'),
    }],
  },
  mountPath: {
    validateTrigger: ['blur', 'change'],
    rules: [{
      required: true,
      message: i18n.t('compute.text_126'),
    }, {
      validator: diskValidator,
    }],
  },
}

const DATA_DISK_ROOTS = {
  type: 'dataDiskTypes',
  size: 'dataDiskSizes',
  schedtag: 'dataDiskSchedtags',
  policy: 'dataDiskPolicys',
  snapshot: 'dataDiskSnapshots',
  filetype: 'dataDiskFiletypes',
  mountPath: 'dataDiskMountPaths',
  storage: 'dataDiskStorages',
  iops: 'dataDiskIops',
  throughput: 'dataDiskThroughputs',
  preallocation: 'dataDiskPreallocation',
  auto_reset: 'dataDiskAutoReset',
}

const DATA_DISK_FIELD_OPTS = {
  type: {
    rules: [
      { validator: isRequired(), message: i18n.t('compute.text_121') },
    ],
  },
  size: {
    rules: [
      { required: true, message: i18n.t('compute.text_122') },
    ],
  },
  schedtag: {
    validateTrigger: ['change', 'blur'],
    rules: [{
      required: true,
      message: i18n.t('compute.text_123'),
    }],
  },
  policy: {
    initialValue: '',
    validateTrigger: ['blur', 'change'],
    rules: [{
      required: true,
      message: i18n.t('compute.text_123'),
    }],
  },
  snapshot: {
    validateTrigger: ['blur', 'change'],
    rules: [{
      required: true,
      message: i18n.t('compute.text_124'),
    }],
  },
  filetype: {
    validateTrigger: ['blur', 'change'],
    rules: [{
      required: true,
      message: i18n.t('compute.text_125'),
    }],
  },
  mountPath: {
    validateTrigger: ['blur', 'change'],
    rules: [{
      required: true,
      message: i18n.t('compute.text_126'),
    }, {
      validator: diskValidator,
    }],
  },
  storage: {
    rules: [{
      required: true,
      message: i18n.t('compute.text_1351'),
    }],
  },
  iops: {
    rules: [{
      required: true,
      message: i18n.t('compute.iops_input_tip'),
    }],
  },
  throughput: {
    rules: [{
      required: true,
      message: i18n.t('compute.throughput_input_tip'),
    }],
  },
  preallocation: {},
  auto_reset: {
    valuePropName: 'checked',
    initialValue: false,
  },
}

export function dataDiskFieldName (kind, uid) {
  const root = DATA_DISK_ROOTS[kind]
  if (!root) return undefined
  return `${root}[${uid}]`
}

function systemDiskFieldOpts (key, fromOpts) {
  const defaults = SYSTEM_DISK_FIELD_OPTS[key] || {}
  if (!fromOpts || typeof fromOpts !== 'object') return defaults
  return { ...defaults, ...fromOpts }
}

export function resolveSystemDiskFieldMap () {
  const ret = {}
  Object.keys(SYSTEM_DISK_FIELDS).forEach((key) => {
    ret[key] = [SYSTEM_DISK_FIELDS[key], systemDiskFieldOpts(key)]
  })
  return ret
}

/** K8S serverConfig 等：`systemDiskType[uuid]` 嵌套字段 */
export function resolveSystemDiskFieldMapForKey (uid) {
  const ret = {}
  Object.keys(SYSTEM_DISK_FIELDS).forEach((key) => {
    const root = SYSTEM_DISK_FIELDS[key]
    ret[key] = [`${root}[${uid}]`, systemDiskFieldOpts(key)]
  })
  return ret
}

export function resolveDataDiskFieldFactories () {
  const ret = {}
  Object.keys(DATA_DISK_ROOTS).forEach((key) => {
    const root = DATA_DISK_ROOTS[key]
    const opts = DATA_DISK_FIELD_OPTS[key] || {}
    ret[key] = (uid) => [`${root}[${uid}]`, opts]
  })
  return ret
}

export function buildDataDiskFieldMap (uid) {
  const factories = resolveDataDiskFieldFactories()
  const ret = {}
  Object.keys(factories).forEach((key) => {
    ret[key] = factories[key](uid)
  })
  return ret
}
