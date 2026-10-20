<template>
  <div>
    <!-- 策略类型 -->
    <a-form-model-item :label="$t('cloudenv.text_433')">
      <a-radio-group v-model:value="cycleTimer.cycle_type">
        <a-radio-button v-for="(v, k) in $tm('cloudenvScheduledtaskGroupCycleType')" :key="k" :value="k">{{v}}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <!-- 周期策略 -->
    <a-form-model-item :label="$t('cloudenv.frequency')" v-if="cycleTimer.cycle_type === 'cycle'">
      <div class="d-flex align-items-center">
        {{$t('cloudenv.each')}}
        <a-input-number class="ml-2" :min="1" v-model:value="cycleTimer.cycle_num" />
        <a-select class="mr-2" v-model:value="cycleTimer.cycle_type2" style="width: 100px">
          <a-select-option v-for="(item,index) in cycleTypeOpts" :key="index" :value="item.key">{{item.label}}</a-select-option>
        </a-select>
        {{$t('cloudenv.cycle_once')}}
      </div>
    </a-form-model-item>
    <!-- 周 -->
    <a-form-model-item :label="$t('cloudenv.text_434')" v-if="cycleTimer.cycle_type === 'week'">
      <a-select v-model:value="cycleTimer.week_days" mode="multiple">
        <a-select-option v-for="(v, k) in $tm('flexGroupSubCycleTypeWeek')" :key="k" :value="parseInt(k)">{{v}}</a-select-option>
      </a-select>
    </a-form-model-item>
    <!-- 月 -->
    <a-form-model-item :label="$t('cloudenv.text_435')" v-if="cycleTimer.cycle_type === 'month'">
      <a-select v-model:value="cycleTimer.month_days" mode="multiple">
        <a-select-option v-for="i in 31" :key="i" :value="parseInt(i)">{{$t('cloudenv.text_436', [i])}}</a-select-option>
      </a-select>
    </a-form-model-item>
    <!-- 单次策略 -->
    <template v-if="cycleTimer.cycle_type === 'one'">
      <a-form-model-item :label="$t('cloudenv.text_437')">
        <oc-date-time-picker
          v-model:value="timer.execTime"
          format="YYYY-MM-DD HH:mm"
          :disabled-date="disabledDate"
          :disabled-time="disabledDateTime" />
      </a-form-model-item>
    </template>
    <!-- 非单次策略 -->
    <template v-if="cycleTimer.cycle_type !== 'one'">
      <a-form-model-item :label="$t('cloudenv.text_437')" v-if="cycleTimer.cycle_type !== 'cycle'">
        <oc-time-picker v-model:value="hourMinute" format="HH:mm" />
      </a-form-model-item>
      <a-form-model-item :label="$t('cloudenv.text_438')" :help="$t('cloudenv.range_picker_help')">
        <oc-range-picker
          v-model:value="startEndTime"
          :disabled-date="disabledDate"
          format="YYYY-MM-DD" />
      </a-form-model-item>
    </template>
  </div>
</template>

<script>
export default {
  name: 'ScheduledTaskTime',
  props: {
    /** 直接传 form model（推荐） */
    model: {
      type: Object,
    },
    /** 兼容旧写法：{ fd } */
    form: {
      type: Object,
    },
  },
  data () {
    return {
      cycleTypeOpts: [
        { key: 'hour', label: this.$t('cloudenv.cycle_type.hour') },
        { key: 'day', label: this.$t('cloudenv.cycle_type.day') },
        { key: 'week', label: this.$t('cloudenv.cycle_type.week') },
        { key: 'month', label: this.$t('cloudenv.cycle_type.month') },
      ],
    }
  },
  computed: {
    fd () {
      return this.model || this.form?.fd || {}
    },
    cycleTimer () {
      return this.fd.cycleTimer
    },
    hourMinute: {
      get () {
        return this.fd.hourMinute
      },
      set (v) {
        this.fd.hourMinute = v
      },
    },
    startEndTime: {
      get () {
        return this.fd.startEndTime
      },
      set (v) {
        this.fd.startEndTime = v
      },
    },
    timer () {
      return this.fd.timer
    },
  },
  created () {
    if (!this.fd.cycleTimer) {
      this.fd.cycleTimer = {
        cycle_type: 'day',
        week_days: [1, 2, 3, 4, 5],
        month_days: [1],
        cycle_num: 1,
        cycle_type2: 'month',
      }
    }
    if (!this.fd.timer) {
      this.fd.timer = {
        execTime: this.$moment().add(1, 'h'),
      }
    }
    if (!this.fd.hourMinute) {
      this.fd.hourMinute = this.$moment().startOf('day').add(2, 'h')
    }
  },
  methods: {
    disabledDate (current) {
      return current && current < this.$moment().subtract(1, 'd').endOf('day')
    },
    range (start, end) {
      const result = []
      for (let i = start; i < end; i++) {
        result.push(i)
      }
      return result
    },
    disabledDateTime (_ = this.$moment(), type) {
      let disabledHours = []
      let disabledMinutes = []
      let disabledSeconds = []
      const dayDiff = _.diff(this.$moment(), 'days', true)
      const hourDiff = _.diff(this.$moment(), 'hours', true)
      const minutesDiff = _.diff(this.$moment(), 'minutes', true)
      // 当天
      if (dayDiff > -1 && dayDiff < 0) {
        disabledHours = this.range(0, this.$moment().hour())
        if (hourDiff > -1 && hourDiff < 0) {
          disabledMinutes = this.range(0, this.$moment().minute())
          if (minutesDiff > -1 && minutesDiff < 0) {
            disabledSeconds = this.range(0, this.$moment().second())
          }
        }
      }
      return {
        disabledHours: () => disabledHours,
        disabledMinutes: () => disabledMinutes,
        disabledSeconds: () => disabledSeconds,
      }
    },
    transformParams (params, values) {
      if (values.cycleTimer.cycle_type === 'one') {
        params.scheduled_type = 'timing'
        params.timer = values.timer
      } else {
        params.scheduled_type = 'cycle'
        params.cycle_timer = { ...values.cycleTimer }
      }
      // 触发时间
      if (values.hourMinute) {
        // 转换为utc hour
        const time = this.$moment(values.hourMinute)
        params.cycle_timer.hour = time.subtract(time.utcOffset(), 'minutes').hour()
        params.cycle_timer.minute = values.hourMinute.minutes()
      }
      // 有效时间
      if (values.startEndTime && values.startEndTime.length > 0) {
        params.cycle_timer.startTime = values.startEndTime[0].set({
          hour: 0,
          minute: 0,
          second: 0,
        })
        params.cycle_timer.endTime = values.startEndTime[1].set({
          hour: 23,
          minute: 59,
          second: 59,
        })
      } else {
        // 未设置有效时间时，有效时间为 今天-100年
        if (!params.cycle_timer) params.cycle_timer = {}
        params.cycle_timer.startTime = this.$moment()
        params.cycle_timer.endTime = this.$moment().add('year', 100)
      }
      if (params.cycle_timer && params.cycle_timer.cycle_type === 'cycle') {
        params.cycle_timer.cycle_type = params.cycle_timer.cycle_type2
        delete params.cycle_timer.cycle_type2
      }
    },
  },
}
</script>
