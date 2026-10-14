/**
 * a-form-model 用法入口。
 * 优先走 index.vue 双协议（传 :model）；亦可直接用 model.vue。
 *
 * @example
 * import EncryptKeys from '@Compute/sections/encryptkeys/model'
 * <a-form-model :model="form">
 *   <encrypt-keys :model="form.fd" />
 * </a-form-model>
 */
export { default } from './index.vue'
