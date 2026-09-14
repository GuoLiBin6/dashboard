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
    let data
    try {
      data = mods[path].default || mods[path]
    } catch (e) {
      // 循环依赖未断干净时 default 会落在 TDZ；跳过避免整站白屏，便于定位
      console.error(`[store/modules] failed to register "${moduleName}"`, e)
      return
    }
    if (!data) return
    data.namespaced = true
    modules[moduleName] = data
  })
}

registerModules(storeModules)
registerModules(scopeStoreModules)

export default modules
