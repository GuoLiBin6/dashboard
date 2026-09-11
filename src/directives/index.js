
import Vue from 'vue'
import loading from './loading'

const directiveModules = import.meta.glob('./*.js', { eager: true })

Object.keys(directiveModules).forEach((path) => {
  if (path.endsWith('/index.js')) return
  const config = directiveModules[path]
  const name = path.replace(/^\.\/(.*)\.\w+$/, '$1')
  const directive = config.default || config
  if (!directive) return
  Vue.directive(name, directive)
})

Vue.directive('loading', loading)
