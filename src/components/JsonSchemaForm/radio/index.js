import JRadio from './Radio'
import RadioRule from '../core/rules/radio'
/* istanbul ignore next */
JRadio.install = function (Vue) {
  Vue.prototype.$generator.addRule('a-radio', RadioRule)
  // 主入口已 app.use(Antd)，勿再 Vue.use(Radio)
  if (!Vue.component(JRadio.name)) {
    Vue.component(JRadio.name, JRadio)
  }
}

export default JRadio
