/**
 * 兼容桩：历史构建/HMR 可能仍请求 `/src/patches/antd-pickertrigger.js`。
 * 直接透传 ant-design-vue 官方实现，避免 404；不再做自定义补丁。
 */
export { default } from 'ant-design-vue/es/vc-picker/PickerTrigger.js'
