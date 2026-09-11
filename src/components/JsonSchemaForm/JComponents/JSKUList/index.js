import JSKUList from './JSKUList'

/* istanbul ignore next */
JSKUList.install = function (Vue) {
  if (!Vue.component(JSKUList.name)) Vue.component(JSKUList.name, JSKUList)
}

export default JSKUList
