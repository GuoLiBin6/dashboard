import i18n from '@/locales'
import validateForm, { isRequired } from '@/utils/validate'
import { diskValidator } from '@Compute/utils/createServer'

const validateValidPath = (rule, value, callback) => {
  if (!value) {
    callback()
    return
  }
  if (value.startsWith('/')) {
    if (value === '/') {
      callback(new Error(i18n.t('compute.repo.mount_point.check_content')))
    } else {
      callback()
    }
  } else {
    callback(new Error(i18n.t('compute.repo.mount_point.check_start')))
  }
}

const validateMountNames = (rule, value, callback) => {
  if (value === undefined) {
    callback(new Error(i18n.t('common.tips.select', [i18n.t('compute.repo.storage_statement')])))
    return
  }
  callback()
}

export function containerFieldFactories () {
  return {
    name: i => ({
      name: `containerNames[${i}]`,
      rules: [
        { required: true, message: `${i18n.t('common.placeholder')}${i18n.t('common.name')}` },
        { validator: validateForm('k8sLabel') },
      ],
    }),
    source: i => ({ name: `containerSources[${i}]`, initialValue: 'custom' }),
    registryImage: i => ({ name: `registryImages[${i}]`, rules: [{ required: true, message: i18n.t('common.tips.select', [i18n.t('compute.eci.repo.image.registry')]) }] }),
    imageCredentialId: i => [`imageCredentialIds[${i}]`],
    containerImageId: i => ({ name: `containerImageIds[${i}]`, rules: [{ required: true, message: i18n.t('common.tips.select', [i18n.t('compute.repo.image.container_image')]) }] }),
    image: i => ({ name: `containerimages[${i}]`, rules: [{ required: true, message: `${i18n.t('common.placeholder')}${i18n.t('compute.repo.container_image')}` }] }),
    cpu: i => [`containerCpus[${i}]`],
    memory: i => [`containerMemorys[${i}]`],
    command: i => [`containerCommands[${i}]`],
    arg: i => [`containerArgs[${i}]`],
    volumeMount: i => ({
      key: j => ({ name: `containerVolumeMountNames[${i}][${j}]`, rules: [{ validator: validateMountNames, trigger: 'blur' }] }),
      value: j => ({
        name: `containerVolumeMountPaths[${i}][${j}]`,
        rules: [
          { required: true, message: i18n.t('common.tips.input', []) },
          { validator: validateValidPath, trigger: 'blur' },
        ],
      }),
    }),
    env: i => ({
      key: j => ({ name: `containerEnvNames[${i}][${j}]`, rules: [{ required: true, message: i18n.t('common.tips.input', [i18n.t('compute.repo.variables')]) }] }),
      value: j => ({ name: `containerEnvValues[${i}][${j}]`, rules: [{ required: true, message: i18n.t('common.tips.input', [i18n.t('compute.repo.value')]) }] }),
    }),
    privileged: i => ({ name: `containerPrivilegeds[${i}]`, valuePropName: 'checked', initialValue: false }),
    capAdd: i => ({ name: `containerCapAdd[${i}]`, initialValue: [] }),
    capDrop: i => ({ name: `containerCapDrop[${i}]`, initialValue: [] }),
    enableLxcfs: i => ({ name: `containerEnableLxcfs[${i}]`, valuePropName: 'checked', initialValue: true }),
    enableSysDiskOverlay: i => ({ name: `containerEnableSysDiskOverlay[${i}]`, valuePropName: 'checked', initialValue: false }),
    rootfsPersistent: i => ({ name: `containerRootfsPersistent[${i}]`, valuePropName: 'checked', initialValue: false }),
    overlayDisk: i => ({
      type: j => ({ name: `overlayDiskTypes[${i}][${j}]`, rules: [{ validator: isRequired(), message: i18n.t('compute.text_121') }] }),
      size: j => ({ name: `overlayDiskSizes[${i}][${j}]`, rules: [{ required: true, message: i18n.t('compute.text_122') }] }),
      schedtag: j => ({
        name: `overlayDiskSchedtags[${i}][${j}]`,
        validateTrigger: ['change', 'blur'],
        rules: [{ required: true, message: i18n.t('compute.text_123') }],
      }),
      policy: j => ({
        name: `overlayDiskPolicys[${i}][${j}]`,
        initialValue: '',
        validateTrigger: ['blur', 'change'],
        rules: [{ required: true, message: i18n.t('compute.text_123') }],
      }),
      snapshot: j => ({
        name: `overlayDiskSnapshots[${i}][${j}]`,
        validateTrigger: ['blur', 'change'],
        rules: [{ required: true, message: i18n.t('compute.text_124') }],
      }),
      filetype: j => ({
        name: `overlayDiskFiletypes[${i}][${j}]`,
        validateTrigger: ['blur', 'change'],
        rules: [{ required: true, message: i18n.t('compute.text_125') }],
      }),
      mountPath: j => ({
        name: `overlayDiskMountPaths[${i}][${j}]`,
        validateTrigger: ['blur', 'change'],
        rules: [{ required: true, message: i18n.t('compute.text_126') }, { validator: diskValidator }],
      }),
      storage: j => ({ name: `overlayDiskStorages[${i}][${j}]`, rules: [{ required: true, message: i18n.t('compute.text_1351') }] }),
      iops: j => ({ name: `overlayDiskIops[${i}][${j}]`, rules: [{ required: true, message: i18n.t('compute.iops_input_tip') }] }),
      throughput: j => ({ name: `overlayDiskThroughputs[${i}][${j}]`, rules: [{ required: true, message: i18n.t('compute.throuthput_input_tip') }] }),
      preallocation: j => [`overlayDiskPreallocation[${i}][${j}]`],
    }),
  }
}

export function resolveContainerPaneFieldMap (paneKey) {
  const factories = containerFieldFactories()
  const ret = {}
  Object.keys(factories).forEach((key) => {
    const item = factories[key]
    if (typeof item === 'function') {
      ret[key] = item(paneKey)
    }
  })
  return ret
}
