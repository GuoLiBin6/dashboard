import Fieldset from './Fieldset'

/* istanbul ignore next */
Fieldset.install = function (Vue) {
  if (!Vue.component(Fieldset.name)) Vue.component(Fieldset.name, Fieldset)
}

export default Fieldset
