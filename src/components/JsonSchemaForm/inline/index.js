import Inline from './Inline'

/* istanbul ignore next */
Inline.install = function (Vue) {
  if (!Vue.component(Inline.name)) Vue.component(Inline.name, Inline)
}

export default Inline
