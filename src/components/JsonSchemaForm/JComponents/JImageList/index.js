import JImageList from './JImageList'

/* istanbul ignore next */
JImageList.install = function (Vue) {
  if (!Vue.component(JImageList.name)) Vue.component(JImageList.name, JImageList)
}

export default JImageList
