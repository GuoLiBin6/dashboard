/**
 * a-form-model 用法入口。
 *
 * @example
 * import DomainProject from '@/sections/DomainProject/model'
 * <domain-project :form="form.fd" :form-draft-key="..." />
 * // 或 :model="form.fd"
 *
 * 与 index 同一组件：有 model/form 时只写 fd，不依赖 createForm；草稿读 model。
 */
export { default } from './index.vue'
