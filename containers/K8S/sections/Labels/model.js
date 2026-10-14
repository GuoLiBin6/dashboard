/**
 * a-form-model 用法入口（纯 model，无 createForm 同步）。
 *
 * @example
 * import Labels from '@K8S/sections/Labels/model'
 * <a-form-model :model="form">
 *   <labels ref="labelsRef" />
 * </a-form-model>
 * // submit: this.$refs.labelsRef.getLabelMap()
 */
export { default } from './model.vue'
