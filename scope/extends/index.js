// Vite 的 import.meta.glob 暂不支持 webpack 的 '@(js|jsx|vue)' 这种 extglob 写法，
// 拆成多个模式，确保能够正确加载所有扩展组件。
const componentModules = {
  ...import.meta.glob('./**/index.js', { eager: true }),
  ...import.meta.glob('./**/index.jsx', { eager: true }),
  ...import.meta.glob('./**/index.vue', { eager: true }),
}
const commonComponentModules = {
  // 注意：这里的组件真实路径在 `dashboard/containers/Dashboard/extends/**`
  // 之前指向了不存在的 `/src/containers/...`，会导致 extendsComponents 为空，从而控制面板组件不渲染内容。
  ...import.meta.glob('/containers/Dashboard/extends/**/index.js', { eager: true }),
  ...import.meta.glob('/containers/Dashboard/extends/**/index.jsx', { eager: true }),
  ...import.meta.glob('/containers/Dashboard/extends/**/index.vue', { eager: true }),
}

const extendsComponents = {}

Object.values(commonComponentModules).forEach((componentConfig) => {
  if (!componentConfig || !componentConfig.default) return
  const componentName = componentConfig.default.name
  if (!extendsComponents[componentName]) {
    extendsComponents[componentName] = componentConfig.default
  }
})

Object.values(componentModules).forEach((componentConfig) => {
  if (!componentConfig || !componentConfig.default) return
  const componentName = componentConfig.default.name
  extendsComponents[componentName] = componentConfig.default
})

export default extendsComponents
