import JVPCList from './JVPCList'

/* istanbul ignore next */
JVPCList.install = function (Vue) {
  if (!Vue.component(JVPCList.name)) Vue.component(JVPCList.name, JVPCList)
}

export default JVPCList
