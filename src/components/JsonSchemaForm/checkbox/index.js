import Checkbox from './Checkbox'
import checkboxRule from '../core/rules/checkbox'
/* istanbul ignore next */
Checkbox.install = function (Vue) {
  Vue.prototype.$generator.addRule('a-checkbox', checkboxRule)
  if (!Vue.component(Checkbox.name)) Vue.component(Checkbox.name, Checkbox)
}

export default Checkbox
