import Control from './Control'

/* istanbul ignore next */
Control.install = function (Vue) {
  if (!Vue.component(Control.name)) Vue.component(Control.name, Control)
}

export default Control
