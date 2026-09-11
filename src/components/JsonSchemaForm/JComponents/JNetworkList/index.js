import JNetworkList from './JNetworkList'

/* istanbul ignore next */
JNetworkList.install = function (Vue) {
  if (!Vue.component(JNetworkList.name)) Vue.component(JNetworkList.name, JNetworkList)
}

export default JNetworkList
