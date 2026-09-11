import DateTimePicker from './Datetime'

/* istanbul ignore next */
DateTimePicker.install = function (Vue) {
  // 主入口已 app.use(Antd)，勿再 Vue.use(DatePicker) 以免 ADatePicker 重复注册
  if (!Vue.component(DateTimePicker.name)) {
    Vue.component(DateTimePicker.name, DateTimePicker)
  }
}

export default DateTimePicker
