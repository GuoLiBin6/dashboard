import JStorageBackendList from './JStorageBackendList'

/* istanbul ignore next */
JStorageBackendList.install = function (Vue) {
  if (!Vue.component(JStorageBackendList.name)) Vue.component(JStorageBackendList.name, JStorageBackendList)
}

export default JStorageBackendList
