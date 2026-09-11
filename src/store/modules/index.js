/**
 * Get Store Modules
 * author: houjiazong <houjiazong@gmail.com>
 * date: 2019/08/09
 */
const modules = {}

const storeModules = import.meta.glob('./*.js', { eager: true })
const scopeStoreModules = import.meta.glob('/scope/store/modules/*.js', { eager: true })

function registerModules (mods) {
  Object.keys(mods).forEach((path) => {
    if (path.endsWith('/index.js')) return
    const moduleName = path.replace(/^.*\//, '').replace(/\.js$/, '')
    const data = mods[path].default || mods[path]
    if (!data) return
    data.namespaced = true
    modules[moduleName] = data
  })
}

registerModules(storeModules)
registerModules(scopeStoreModules)

export default modules
