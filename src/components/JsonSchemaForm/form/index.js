import JForm from './Form'
import Generator from '../core/schema'
import validator from '../validate'
/* istanbul ignore next */
JForm.install = function (Vue) {
  if (!Vue.prototype.$generator) {
    Vue.prototype.$generator = new Generator()
    Vue.prototype.$validator = validator()
  }

  if (!Vue.component(JForm.name)) Vue.component(JForm.name, JForm)
}

export default JForm
