/**
 * a-form-model 用法入口（end-state）。
 *
 * @example
 * import ServerNetwork from '@Compute/sections/ServerNetwork/model'
 * <a-form-model :model="form.fd">
 *   <server-network :model="form.fd" :form="form" />
 * </a-form-model>
 *
 * 有 `:model` 时：仅写嵌套 maps（fd.networks[uuid] 等）+ 组件 validate()。
 * 无 model：读写 form.fd（与创建页 inject form 对齐）。
 */
export { default } from './index.vue'
