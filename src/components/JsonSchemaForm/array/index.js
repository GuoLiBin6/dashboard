import List from './Array'
import './style/index.scss'

/* istanbul ignore next */
List.install = function (Vue) {
  if (!Vue.component(List.name)) Vue.component(List.name, List)
}

export default List
