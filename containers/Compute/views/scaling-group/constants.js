import validateForm from '@/utils/validate'
import i18n from '@/locales'

export const BRANDS = ['OneCloud', 'Azure']

/** 伸缩组 field-map（initialValue 唯一来源；fd 用 getInitialValue） */
export const SCALING_GROUP_FIELD_MAP = {
  projectDomain: {
    project: { name: 'project', initialValue: undefined },
    domain: { name: 'domain', initialValue: undefined },
  },
  generate_name: {
    name: 'generate_name',
    initialValue: '',
    validateTrigger: ['change', 'blur'],
    validateFirst: true,
    rules: [
      { required: true, message: i18n.t('compute.text_210') },
      { validator: validateForm('serverCreateName') },
    ],
  },
  description: { name: 'description' },
  guest_template_id: {
    name: 'guest_template_id',
    rules: [
      { required: true, message: i18n.t('compute.text_878') },
    ],
  },
  min_instance_number: {
    name: 'min_instance_number',
    initialValue: 0,
    rules: [
      { required: true, message: i18n.t('compute.text_879') },
    ],
  },
  max_instance_number: {
    name: 'max_instance_number',
    initialValue: 2,
    rules: [
      { required: true, message: i18n.t('compute.text_880') },
    ],
  },
  desire_instance_number: {
    name: 'desire_instance_number',
    initialValue: 0,
    rules: [
      { required: true, message: i18n.t('compute.text_881') },
    ],
  },
  brand: {
    name: 'brand',
    rules: [
      { required: true, message: i18n.t('compute.text_882') },
    ],
  },
  servertemplate: { name: 'servertemplate', initialValue: undefined },
  health_check_gov: {
    name: 'health_check_gov',
    initialValue: 180,
    rules: [
      { required: true, message: i18n.t('compute.text_883') },
    ],
  },
  health_check_mode: {
    name: 'health_check_mode',
    initialValue: 'normal',
    rules: [
      { required: true, message: i18n.t('compute.text_884') },
    ],
  },
  loadbalancer_id: {
    name: 'loadbalancer_id',
    rules: [
      { required: true, message: i18n.t('compute.text_885') },
    ],
  },
  lb_backend_group: {
    name: 'lb_backend_group',
    rules: [
      { required: true, message: i18n.t('compute.text_886') },
    ],
  },
  loadbalancer_backend_port: {
    name: 'loadbalancer_backend_port',
    rules: [
      { required: true, message: i18n.t('compute.text_887') },
    ],
  },
  loadbalancer_backend_weight: {
    name: 'loadbalancer_backend_weight',
    initialValue: 50,
    rules: [
      { required: true, message: i18n.t('compute.text_888') },
    ],
  },
  shrink_principle: {
    name: 'shrink_principle',
    initialValue: 'earliest',
    rules: [
      { required: true, message: i18n.t('compute.text_889') },
    ],
  },
  health_check_cycle: {
    name: 'health_check_cycle',
    initialValue: 300,
    rules: [
      { required: true, message: i18n.t('compute.text_890') },
    ],
  },
}

/** BindLb 校验：取自 field-map，避免与 initialValue 分两处维护 */
export const BIND_LB_RULES = {
  loadbalancer_id: SCALING_GROUP_FIELD_MAP.loadbalancer_id.rules,
  lb_backend_group: SCALING_GROUP_FIELD_MAP.lb_backend_group.rules,
  loadbalancer_backend_port: SCALING_GROUP_FIELD_MAP.loadbalancer_backend_port.rules,
  loadbalancer_backend_weight: SCALING_GROUP_FIELD_MAP.loadbalancer_backend_weight.rules,
}
