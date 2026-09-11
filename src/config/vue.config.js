import Vue from 'vue'

Vue.config.productionTip = false
Vue.config.devtools = process.env.NODE_ENV === 'development'

// import scope vue全局配置
// Vite 使用 import.meta.glob 替代 webpack 的 require.context
const scopeConfigModules = import.meta.glob('../../scope/**/vue.scope.config.js', { eager: true })
Object.keys(scopeConfigModules).forEach(key => {
  const module = scopeConfigModules[key]
  if (module && typeof module.default === 'function') {
    module.default()
  } else if (module && typeof module === 'function') {
    module()
  }
})
