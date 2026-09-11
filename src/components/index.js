/**
 * We register all the components so future yunion plugins
 * author: houjiazong <houjiazong@gmail.com>
 * date: 2019/08/07
 */
/**
 * Vue3 + @vue/compat：不要再用 Vue.component 写到 singletonApp。
 * createApp 会继承 singleton，随后 app.use / app.component 再注册就会刷
 * “Component X has already been registered”。
 * 统一只在 createApp 实例上注册一次。
 *
 * 重型组件（图表/终端/编辑器）改为异步注册，避免拖慢首屏。
 */
import { defineAsyncComponent } from 'vue'

const HEAVY_ASYNC_COMPONENTS = {
  EChart: () => import('./EChart/index.vue'),
  Xterm: () => import('./Xterm/index.vue'),
  CodeMirror: () => import('./CodeMirror/index.vue'),
  RichEditor: () => import('./RichEditor/index.vue'),
  LiquidFill: () => import('./LiquidFill/index.vue'),
  Uchart: () => import('./Uchart/index.vue'),
  BaseChart: () => import('./BaseChart/index.vue'),
}

const HEAVY_PATH_RE = /\/(EChart|Xterm|CodeMirror|RichEditor|LiquidFill|Uchart|BaseChart)\//

const componentModules = import.meta.glob([
  './**/index.@(js|jsx|vue)',
  '!./EChart/**',
  '!./Xterm/**',
  '!./CodeMirror/**',
  '!./RichEditor/**',
  '!./LiquidFill/**',
  '!./Uchart/**',
  '!./BaseChart/**',
], {
  eager: true,
})

function normalizeComponent (componentConfig) {
  if (!componentConfig) return null
  return componentConfig.default || componentConfig
}

/** JsonSchemaForm 子模块在自身 index 里 Vue.use 自注册（含 $generator 副作用） */
function shouldRegisterPath (path) {
  return !path.includes('/JsonSchemaForm/') && !HEAVY_PATH_RE.test(path)
}

const ComponentsPlugin = {
  install (app) {
    Object.entries(componentModules).forEach(([path, componentConfig]) => {
      if (!shouldRegisterPath(path)) return
      const component = normalizeComponent(componentConfig)
      if (!component || !component.name) return
      if (app.component(component.name)) return
      app.component(component.name, component)
    })

    Object.entries(HEAVY_ASYNC_COMPONENTS).forEach(([name, loader]) => {
      if (app.component(name)) return
      app.component(name, defineAsyncComponent(loader))
    })
  },
}

export default ComponentsPlugin
