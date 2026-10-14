import i18n from '@/locales'

const validateValidPath = (rule, value, callback) => {
  if (!value) {
    callback()
    return
  }
  if (value.startsWith('/')) {
    if (value === '/') {
      callback(new Error(i18n.t('k8s.text_130')))
    } else {
      callback()
    }
  } else {
    callback(new Error(i18n.t('k8s.text_131')))
  }
}

export function containerScalarField (field, paneKey) {
  const map = {
    name: `containerNames[${paneKey}]`,
    source: `containerSources[${paneKey}]`,
    registryImage: `registryImages[${paneKey}]`,
    containerImageId: `containerImageIds[${paneKey}]`,
    image: `containerimages[${paneKey}]`,
    cpu: `containerCpus[${paneKey}]`,
    memory: `containerMemorys[${paneKey}]`,
    command: `containerCommands[${paneKey}]`,
    arg: `containerArgs[${paneKey}]`,
    privileged: `containerPrivilegeds[${paneKey}]`,
  }
  return map[field]
}

export const CONTAINER_SCALAR_INITIAL = {
  source: 'custom',
  privileged: false,
}

export function containerEnvFields (paneKey) {
  return {
    key: j => `containerEnvNames[${paneKey}][${j}]`,
    value: j => `containerEnvValues[${paneKey}][${j}]`,
  }
}

export function containerVolumeMountFields (paneKey) {
  return {
    key: j => `containerVolumeMountNames[${paneKey}][${j}]`,
    value: j => `containerVolumeMountPaths[${paneKey}][${j}]`,
  }
}

export function containerScalarRules (vm, field) {
  const k8sName = vm.$validate('k8sLabel')
  const map = {
    name: [
      { required: true, message: i18n.t('k8s.text_60') },
      { validator: k8sName },
    ],
    registryImage: [
      { required: true, message: i18n.t('common.tips.select', [i18n.t('k8s.repo.image.registry')]) },
    ],
    containerImageId: [
      { required: true, message: i18n.t('common.tips.select', [i18n.t('k8s.repo.image.container_image')]) },
    ],
    image: [
      { required: true, message: i18n.t('k8s.text_67') },
    ],
  }
  return map[field] || []
}

export const CONTAINER_ENV_KEY_RULES = [
  { required: true, message: i18n.t('k8s.text_140') },
]

export const CONTAINER_ENV_VALUE_RULES = [
  { required: true, message: i18n.t('k8s.text_140') },
]

export const CONTAINER_VOLUME_KEY_RULES = [
  { required: true, message: i18n.t('k8s.text_77') },
]

export const CONTAINER_VOLUME_VALUE_RULES = [
  { required: true, message: i18n.t('k8s.text_140') },
  { validator: validateValidPath, trigger: 'blur' },
]
