<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.perform_create')}}</div>
    <div slot="body">
       <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.text_228')" prop="name">
          <a-input :placeholder="$t('validator.serverCreateName')" v-model:value="form.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_913')" prop="trigger_type">
          <a-radio-group v-model:value="form.trigger_type">
            <a-radio-button v-for="(v, k) in $t('flexGrouTriggerType')" :key="k" :value="k">{{v}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <!-- 告警策略 -->
        <template v-if="form.trigger_type === 'alarm' || !form.trigger_type">
          <a-form-model-item :label="$t('compute.text_914')" prop="alarm.indicator">
            <a-input-group compact>
              <a-select style="width: 50%" v-model:value="form.alarm.indicator">
                <a-select-option  v-for="(v, k) in $t('flexGroupIndicator')" :key="k" :value="k">{{v}}</a-select-option>
              </a-select>
              <a-select style="width: 25%" v-model:value="form.alarm.operator">
                <a-select-option value="lt">{{$t('compute.text_915')}}</a-select-option>
                <a-select-option value="gt">{{$t('compute.text_916')}}</a-select-option>
              </a-select>
              <a-input-number v-model:value="form.alarm.value" :min="0" :max="form.alarm.indicator && form.alarm.indicator !== 'cpu' ? 999999999 : 100" />
              <span style="margin:5px 0 0 5px">
                {{ form.alarm.indicator && form.alarm.indicator !== 'cpu' ? 'b/s' : '%' }}
              </span>
            </a-input-group>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_917')" prop="alarm.cycle">
            <a-select style="width: 50%" v-model:value="form.alarm.cycle">
              <a-select-option  v-for="(v, k) in $t('flexGroupCycles')" :key="k" :value="parseInt(k)">{{v}}</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_918')" prop="alarm.cumulate">
            <a-tooltip placement="top" :title="$t('compute.text_919')">
              <a-input-number  v-model:value="form.alarm.cumulate" :min="1" :max="1000" />
            </a-tooltip>
            <div slot="extra">
              {{ $t('compute.text_920', [form.alarm.cumulate || 3, form.alarm.cumulate || 3]) }}
            </div>
          </a-form-model-item>
        </template>
        <!-- 定时策略 -->
        <template v-if="form.trigger_type === 'timing'">
          <a-form-model-item :label="$t('compute.text_923')" prop="timer.execTime">
            <a-date-picker
              :showTime="{
                format: 'HH:mm',
              }"
              :disabledDate="disabledDate"
              :disabledTime="disabledDateTime"
              v-model:value="form.timer.execTime"
              format="YYYY-MM-DD HH:mm" />
          </a-form-model-item>
        </template>
        <!-- 周期策略 -->
        <template v-if="form.trigger_type === 'cycle'">
          <a-form-model-item :label="$t('compute.text_924')" prop="cycleTimer.cycle_type">
            <a-select v-model:value="form.cycleTimer.cycle_type">
              <a-select-option v-for="(v, k) in $t('flexGroupCycleType')" :key="k" :value="k">{{v}}</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_925')" v-if="form.cycleTimer.cycle_type === 'week'" prop="cycleTimer.week_days">
            <a-select v-model:value="form.cycleTimer.week_days" mode="multiple">
              <a-select-option v-for="(v, k) in $t('flexGroupSubCycleTypeWeek')" :key="k" :value="parseInt(k)">{{v}}</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_926')" v-if="form.cycleTimer.cycle_type === 'month'" prop="cycleTimer.month_days">
            <a-select v-model:value="form.cycleTimer.month_days" mode="multiple">
              <a-select-option v-for="i in 31" :key="i" :value="parseInt(i)">{{$t('compute.text_927', [i])}}</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_923')" prop="hourMinute">
            <a-time-picker v-model:value="form.hourMinute" format="HH:mm" />
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_928')" prop="startEndTime">
            <a-range-picker
              v-model:value="form.startEndTime"
              :disabledDate="disabledDate"
              format="YYYY-MM-DD" />
          </a-form-model-item>
        </template>
        <a-form-model-item :label="$t('compute.text_929')" prop="action">
          <a-input-group compact>
            <a-select style="width: 50%" v-model:value="form.action">
              <a-select-option v-for="(v, k) in $t('flexGroupRuleAction')" :key="k" :value="k">{{v}}</a-select-option>
            </a-select>
            <a-tooltip>
              <span slot="title">
                {{actionConfig(form.action).tooltip}}
              </span>
              <a-input-number v-bind="actionConfig(form.action).number" v-model:value="form.number" />
            </a-tooltip>
            <span style="margin:5px 0 0 5px">{{$t('compute.text_930')}}</span>
          </a-input-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_931')" prop="cooling_time">
          <a-tooltip placement="top" :title="$t('compute.text_932')">
            <a-input-number v-model:value="form.cooling_time" :min="0" :max="1000" />
          </a-tooltip>
          <span style="margin:5px 0 0 5px">{{$t('compute.text_767')}}</span>
          <div slot="extra">
            {{$t('compute.text_933', [form.cooling_time || 180])}}
          </div>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import validateForm from '@/utils/validate'

export default {
  name: 'FiexRuleListCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      scope: this.$store.getters.scope,
      form: {
        name: undefined,
        trigger_type: 'alarm',
        alarm: {
          indicator: 'cpu',
          operator: 'gt',
          value: 80,
          cumulate: 3,
          cycle: 300,
        },
        cooling_time: 180,
        action: 'add',
        number: 1,
        cycleTimer: {
          cycle_type: 'day',
          week_days: [1, 2, 3, 4, 5],
          month_days: [1],
        },
        hourMinute: this.$moment().startOf('day').add(2, 'h'),
        startEndTime: undefined,
        timer: {
          execTime: this.$moment().add(1, 'h'),
        },
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_210') },
          { validator: validateForm('serverCreateName') },
        ],
        trigger_type: [
          { required: true, message: this.$t('compute.text_935') },
        ],
        'alarm.indicator': [
          { required: true, message: this.$t('compute.text_936') },
        ],
        'alarm.cumulate': [
          { required: true, message: this.$t('compute.text_937') },
        ],
        cooling_time: [
          { required: true, message: this.$t('compute.text_938') },
        ],
        action: [
          { required: true, message: this.$t('compute.text_939') },
        ],
        number: [
          { required: true, message: this.$t('compute.text_940') },
        ],
        'cycleTimer.cycle_type': [
          { required: true, message: this.$t('compute.text_941') },
        ],
        'cycleTimer.week_days': [
          { required: true, message: this.$t('compute.text_942') },
        ],
        'cycleTimer.month_days': [
          { required: true, message: this.$t('compute.text_943') },
        ],
        hourMinute: [
          { required: true, message: this.$t('compute.text_944') },
        ],
        startEndTime: [
          { required: true, message: this.$t('compute.text_945') },
        ],
        'timer.execTime': [
          { required: true, message: this.$t('compute.text_923') },
        ],
        'alarm.cycle': [
          { required: true, message: this.$t('compute.text_946') },
        ],
      },
      formItemLayout: {
        wrapperCol: { span: 15 },
        labelCol: { span: 9 },
      },
    }
  },
  methods: {
    actionConfig (type) {
      const { resData } = this.params
      if (type === 'set') {
        const number = {
          min: resData.min_instance_number,
          max: resData.max_instance_number,
        }
        const tooltip = this.$t('compute.text_947', [number.min, number.max])
        return {
          number,
          tooltip,
        }
      } else {
        const number = {
          min: 1,
          max: resData.max_instance_number,
        }
        const tooltip = this.$t('compute.text_948', [number.max])
        return {
          number,
          tooltip,
        }
      }
    },
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
    formatValues (values) {
      if (values.hourMinute) {
        // 转换为utc hour
        const time = this.$moment(values.hourMinute)
        values.cycleTimer.hour = time.subtract(time.utcOffset(), 'minutes').hour()
        values.cycleTimer.minute = values.hourMinute.minutes()
        delete values.hourMinute
      }
      if (values.startEndTime && values.startEndTime.length > 0) {
        values.cycleTimer.startTime = values.startEndTime[0].set({
          hour: 0,
          minute: 0,
          second: 0,
        })
        values.cycleTimer.endTime = values.startEndTime[1].set({
          hour: 23,
          minute: 59,
          second: 59,
        })
        delete values.startEndTime
      }
      if (values.alarm) {
        values.alarm.wrapper = 'average'
      }
      return values
    },
    async handleConfirm () {
      const manager = new this.$Manager('scalingpolicies', 'v1')
      const defaultParams = {
        unit: 's',
        scaling_group: this.params.resData.id,
      }
      try {
        await this.$refs.formRef.validate()
        const raw = {
          name: this.form.name,
          trigger_type: this.form.trigger_type,
          alarm: { ...this.form.alarm },
          cooling_time: this.form.cooling_time,
          action: this.form.action,
          number: this.form.number,
          cycleTimer: { ...this.form.cycleTimer },
          hourMinute: this.form.hourMinute,
          startEndTime: this.form.startEndTime,
          timer: { ...this.form.timer },
        }
        this.loading = true
        await manager.create({
          data: Object.assign({}, defaultParams, this.formatValues(raw)),
        })
        this.params.refresh()
        this.cancelDialog()
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
