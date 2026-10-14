/**
 * a-form-model 用法入口（end-state）。
 *
 * @example
 * import SecgroupConfig from '@Compute/sections/SecgroupConfig/model'
 * <a-form-model :model="form.fd">
 *   <secgroup-config ref="secgroupRef" :model="form.fd" />
 * </a-form-model>
 *
 * 有 `:model` 时：仅写 secgroup_type / secgroup / network_tags + 组件 validate()。
 * 无 model：读写 form.fd。
 */
export { default } from './index.vue'
