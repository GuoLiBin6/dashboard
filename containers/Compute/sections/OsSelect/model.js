/**
 * a-form-model 用法入口（end-state）。
 *
 * @example
 * import OsSelect from '@Compute/sections/OsSelect/model'
 * <a-form-model :model="form.fd">
 *   <os-select :model="form.fd" :form="form" type="idc" />
 * </a-form-model>
 *
 * 有 `:model` 时：仅写 model.imageType / os / image / prefer_manager + 组件 validate()；
 * 同步 form.fi.imageType（SKU/disk 仍读 fi）。
 * 无 model：读写 form.fd。
 */
export { default } from './index.vue'
