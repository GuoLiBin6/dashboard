import { resolveBaremetalCreateSeed } from '@Compute/utils/baremetalCreateDraft'
import { getInitialValue } from '@/utils/common/ant'
import validateForm, { isRequired } from '@/utils/validate'
import i18n from '@/locales'

/**
 * 裸金属创建 field-map（initialValue 唯一来源；校验 rules 同挂此 map）
 * @private
 */
function createBaremetalFieldMap ({
  initData = {},
  seed,
  routeQuery = {},
  isInitForm = false,
}) {
  const {
    initPreferZone,
    imageTypeInitValue,
    initImage,
    initLoginType,
    initNetworkType,
    initSchedPolicyType,
  } = seed

  return {
    domain: {
      name: 'domain',
      initialValue: initData.extraData?.domain_id || routeQuery.domain_id || '',
      rules: [
        { validator: isRequired(), message: i18n.t('rules.domain'), trigger: 'change' },
      ],
    },
    project: {
      name: 'project',
      initialValue: initData.project_id || {},
      rules: [
        { validator: isRequired(), message: i18n.t('rules.project'), trigger: 'change' },
      ],
    },
    name: {
      name: 'name',
      initialValue: initData.generate_name || '',
      validateTrigger: 'blur',
      validateFirst: true,
      rules: [
        { required: true, message: i18n.t('compute.text_210') },
        { validator: validateForm('resourceCreateName') },
      ],
    },
    description: {
      name: 'description',
      initialValue: initData.description || '',
    },
    count: {
      name: 'count',
      initialValue: initData.__count__ || initData.count || 1,
    },
    specifications: {
      name: 'specifications',
      initialValue: initData.extraData?.specifications || '',
      rules: [
        { required: true, message: i18n.t('compute.text_313') },
      ],
    },
    __meta__: {
      name: '__meta__',
      initialValue: initData.__meta__ || {},
      rules: [
        { validator: validateForm('tagName') },
      ],
    },
    regionZone: {
      cloudregion: {
        name: 'cloudregion',
        initialValue: { key: initData.prefer_region || '', label: '' },
        rules: [
          { required: true, message: i18n.t('compute.text_212') },
        ],
      },
      zone: {
        name: 'zone',
        initialValue: { key: initPreferZone || '', label: '' },
        rules: [
          { required: true, message: i18n.t('compute.text_213') },
        ],
      },
    },
    imageOS: {
      os: {
        name: 'os',
        initialValue: initData.extraData?.os || '',
        rules: [
          { required: true, message: i18n.t('compute.text_153') },
        ],
      },
      image: {
        name: 'image',
        initialValue: { key: initImage || '', label: '' },
        rules: [
          { validator: isRequired(), message: i18n.t('compute.text_214') },
        ],
      },
      imageType: {
        name: 'imageType',
        initialValue: imageTypeInitValue,
      },
    },
    loginConfig: {
      loginType: {
        name: 'loginType',
        initialValue: initLoginType,
      },
      keypair: {
        name: 'loginKeypair',
        initialValue: initData.keypair || '',
        rules: [
          { required: true, message: i18n.t('compute.text_203') },
        ],
      },
      password: {
        name: 'loginPassword',
        // 草稿不回填明文密码
        initialValue: (isInitForm && initData.password) || '',
        validateFirst: true,
        rules: [
          { required: true, message: i18n.t('compute.text_204') },
          { validator: validateForm('sshPassword') },
        ],
      },
    },
    network: {
      networkType: {
        name: 'networkType',
        initialValue: initNetworkType,
      },
    },
    schedPolicy: {
      schedPolicyType: {
        name: 'schedPolicyType',
        initialValue: initSchedPolicyType,
      },
      schedPolicyHost: {
        name: 'schedPolicyHost',
        initialValue: initData.prefer_host,
      },
    },
  }
}

/**
 * 裸金属创建页 form.fd 默认值（由 field-map initialValue 抽出，避免散落字面量）
 * @returns {{ defaults: Object, seed: Object, fieldMap: Object }}
 */
export function createBaremetalFormDefaults ({
  initFormData = {},
  isInitForm = false,
  routeQuery = {},
} = {}) {
  const initData = (isInitForm && initFormData) || {}
  const seed = resolveBaremetalCreateSeed(initData, { isInitForm })
  const fieldMap = createBaremetalFieldMap({
    initData,
    seed,
    routeQuery,
    isInitForm,
  })
  return {
    seed,
    fieldMap,
    defaults: getInitialValue(fieldMap),
  }
}
