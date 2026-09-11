import JZoneList from './JZoneList'

/* istanbul ignore next */
JZoneList.install = function (Vue) {
  if (!Vue.component(JZoneList.name)) Vue.component(JZoneList.name, JZoneList)
}

export default JZoneList
