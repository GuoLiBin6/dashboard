/**
 * a-form-model 用法入口（与 AreaSelects/model、CloudProviderRegion/model 对齐）。
 *
 * @example
 * import NetworkSelects from '@/sections/NetworkSelects/model'
 * <a-form-model :model="form">
 *   <network-selects :model="form" />
 * </a-form-model>
 *
 * 底层与 `@/sections/NetworkSelects` 同一组件，靠 prop `model` 走受控对象，不创建 createForm。
 */
export { default } from './index.js'
