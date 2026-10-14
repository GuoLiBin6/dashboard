/**
 * a-form-model 用法入口（与 DomainProject/model 对齐）。
 *
 * @example
 * import AreaSelects from '@/sections/AreaSelects/model'
 * <a-form-model :model="form">
 *   <area-selects :model="form" :names="['provider', 'cloudregion']" />
 * </a-form-model>
 *
 * 底层与 `@/sections/AreaSelects` 同一组件，靠 prop `model` 走受控对象，不创建 createForm。
 */
export { default } from './index.vue'
