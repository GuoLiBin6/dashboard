import i18n from '@/locales'

const validateValidPath = (rule, value, callback) => {
  if (!value) {
    callback()
    return
  }
  if (value.startsWith('/')) {
    callback()
  } else {
    callback(new Error(i18n.t('k8s.text_131')))
  }
}

export const ingressRuleField = {
  host: i => `hosts[${i}]`,
  serviceName: (i, j) => `serviceNames[${i}][${j}]`,
  servicePath: (i, j) => `servicePaths[${i}][${j}]`,
  servicePort: (i, j) => `servicePorts[${i}][${j}]`,
}

export function ingressHostRules () {
  return [{ required: false, message: i18n.t('k8s.text_205'), trigger: 'blur' }]
}

export function ingressServiceNameRules () {
  return [{ required: true, message: i18n.t('k8s.text_206') }]
}

export function ingressServicePathRules () {
  return [
    { required: true, message: i18n.t('k8s.text_237'), trigger: 'blur' },
    { validator: validateValidPath },
  ]
}

export function ingressServicePortRules () {
  return [
    { type: 'number', required: true, message: i18n.t('k8s.text_207'), trigger: 'blur' },
  ]
}
