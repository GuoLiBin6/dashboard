import Vue from 'vue'

const pluginModules = import.meta.glob('./*.js', { eager: true })

Object.entries(pluginModules).forEach(([path, mod]) => {
  if (path.includes('index.js')) return
  const plugin = mod.default || mod
  if (!plugin || plugin.autoRegister === false) return
  Vue.use(plugin)
})
