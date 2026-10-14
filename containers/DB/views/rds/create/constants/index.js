import validateForm from '@/utils/validate'
import i18n from '@/locales'

/** RDS 创建 field-map（initialValue 唯一来源） */
export const RDS_CREATE_FIELD_MAP = {
  duration: {
    durationStandard: { name: 'durationStandard', initialValue: 'none' },
    duration: { name: 'duration', initialValue: '1h' },
  },
  projectDomain: {
    project: {
      name: 'project',
      initialValue: undefined,
      rules: [
        { required: true, message: i18n.t('db.text_134'), trigger: 'change' },
      ],
    },
    domain: {
      name: 'domain',
      initialValue: undefined,
      rules: [
        { required: true, message: i18n.t('db.text_135'), trigger: 'change' },
      ],
    },
  },
  generate_name: {
    name: 'generate_name',
    initialValue: '',
    validateTrigger: ['change', 'blur'],
    validateFirst: true,
    rules: [
      { required: true, message: i18n.t('db.text_136') },
      { validator: validateForm('resourceCreateName') },
    ],
  },
  description: { name: 'description' },
  loginConfig: {
    loginType: { name: 'loginType', initialValue: 'random' },
    keypair: {
      name: 'loginKeypair',
      initialValue: undefined, // { key: '', label: '' }
      rules: [
        { validator: true, message: i18n.t('db.text_137') },
      ],
    },
  },
  secgroup: {
    type: { name: 'secgroup_type', initialValue: 'default' },
    secgroup: {
      name: 'secgroup',
      rules: [
        { required: true, message: i18n.t('db.text_138') },
      ],
    },
  },
  __count__: { name: '__count__', initialValue: 1 },
  __meta__: {
    name: '__meta__',
    rules: [
      { validator: validateForm('tagName') },
    ],
  },
}
