<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ params.type === 'create_billtask' ? $t('common.create') : $t('bill.rerun_bill') }}</div>
    <div slot="body">
      <a-form-model
        ref="form"
        class="mt-3"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('cloudenv.task_type')" prop="task_type">
          <base-select
            v-model="form.task_type"
            :options="taskTypeOpts"
            :select-props="{placeholder: $t('common.tips.select', [$t('cloudenv.task_type')])}"
            :disabled-items="disabledActions" />
        </a-form-model-item>
        <a-form-model-item v-if="isMonthShow" :label="$t('cloudenv.text_212')" prop="month_range">
          <span slot="extra" style="color:red;">{{ blockTip }}</span>
          <div class="d-flex align-items-center flex-wrap">
            <month-range-picker
              class="billtasks-month-range"
              :class="{ 'is-all-history': ignore_time }"
              v-model="form.month_range"
              :teleport="true"
              :disabled="ignore_time"
              :placeholder="ignore_time ? $t('cloudenv.run_all_bills_selected') : $t('common.tips.select', [$t('cloudenv.text_212')])"
              :disabledDate="disabledMonth" />
            <a-checkbox class="ml-2" v-model:checked="ignore_time" @change="onIgnoreTimeChange">{{$t('cloudenv.run_all_bills')}}</a-checkbox>
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
import MonthRangePicker from '@/components/MonthRangePicker'

export default {
  name: 'BilltasksCreateDialog',
  components: {
    MonthRangePicker,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const TaskTypeList = ['pull_bill', 'prepaid_amortizing', 'project_sharing', 'recalculate', 'predict', 'delete_bill', 'sync_product'].filter(key => {
      const { cost_conversion_available, enable_prediction } = this.$store.state.common.bill?.globalConfig || {}
      if (key === 'recalculate' && !cost_conversion_available) return false
      if (key === 'predict' && !enable_prediction) return false
      return true
    })
    const { data = [] } = this.params
    const initDisabledActions = []
    if (data.some(item => item.status === 'deleted')) {
      initDisabledActions.push('pull_bill', 'prepaid_amortizing', 'project_sharing', 'recalculate', 'predict')
    }
    let initTaskType = 'pull_bill'
    for (let i = 0; i < TaskTypeList.length; i++) {
      if (!initDisabledActions.includes(TaskTypeList[i])) {
        initTaskType = TaskTypeList[i]
        break
      }
    }
    return {
      loading: false,
      accountLoading: false,
      form: {
        account_id: data.map(item => item.id),
        task_type: initTaskType,
        month_range: [this.$moment(), this.$moment()],
      },
      rules: {
        account_id: [{ required: true, message: this.$t('common.tips.select', [this.$t('dictionary.cloudaccount')]) }],
        task_type: [{ required: true, message: this.$t('common.tips.select', [this.$t('cloudenv.task_type')]) }],
        month_range: [{ required: true, validator: this.monthRangeValidate }],
      },
      taskTypeOpts: TaskTypeList.map(id => {
        return {
          id,
          name: this.$t(`cloudenv.task_type.${id}`),
        }
      }),
      accountParams: {
        scope: this.$store.getters.scope,
      },
      disabledActions: initDisabledActions,
      blockMonths: [],
      ignore_time: false,
    }
  },
  computed: {
    isMonthShow () {
      return !(this.form.task_type === 'delete_bill' && this.params.data.some(item => item.status === 'deleted'))
    },
    start () {
      const m = this.form.month_range && this.form.month_range[0]
      return m ? this.$moment(m).format('YYYY-MM') : ''
    },
    end () {
      const m = this.form.month_range && this.form.month_range[1]
      return m ? this.$moment(m).format('YYYY-MM') : ''
    },
    selectedMonths () {
      const list = []
      if (!this.start || !this.end) return list
      const start = this.$moment(this.start)
      const end = this.$moment(this.end)
      // eslint-disable-next-line
      while (end > start || start.format('M') === end.format('M')) {
        list.push(start.format('YYYYMM'))
        start.add(1, 'month')
      }
      return list
    },
    blockTip () {
      const blockMonths = []
      this.selectedMonths.map(month => {
        if (this.blockMonths.includes(month)) {
          blockMonths.push(`${month.slice(0, 4)}-${month.slice(4, 6)}`)
        }
      })
      return blockMonths.length ? this.$t('cloudenv.block_month_tip', [blockMonths.join('、')]) : ''
    },
  },
  watch: {
    'form.task_type': {
      handler (val, oldVal) {
        if (oldVal === 'predict') {
          this.form.month_range = [this.$moment(), this.$moment()]
        }
      },
    },
    start: {
      handler () {
        this.fetchBlockAccount()
      },
    },
    end: {
      handler () {
        this.fetchBlockAccount()
      },
    },
  },
  created () {
    this.$bM = new this.$Manager('billtasks/submit', 'v1')
    this.fetchBlockAccount()
  },
  methods: {
    onIgnoreTimeChange () {
      if (this.ignore_time) {
        this.form.month_range = [null, null]
        this.$nextTick(() => {
          this.$refs.form && this.$refs.form.clearValidate('month_range')
        })
        return
      }
      if (!this.form.month_range || !this.form.month_range[0] || !this.form.month_range[1]) {
        this.form.month_range = [this.$moment(), this.$moment()]
      }
    },
    monthRangeValidate (rule, value, callback) {
      if (this.ignore_time) {
        callback()
        return
      }
      if (value && value[0] && value[1]) {
        callback()
        return
      }
      callback(new Error(this.$t('common.tips.select', [this.$t('cloudenv.text_212')])))
    },
    fetchBlockAccount () {
      if (!this.selectedMonths.length) return
      new this.$Manager('blocking_accounts', 'v1').list({
        params: {
          enabled: true,
          filter: [`month.in(${this.selectedMonths.join(',')})`, `account_id.in(${this.params.account_id})`],
        },
      }).then(res => {
        const { data = [] } = res.data
        this.blockMonths = data.map(item => `${item.month}`)
      })
    },
    disabledMonth (value) {
      if (this.params.accountData?.provider === 'extdb' && this.form.task_type === 'pull_bill') return false
      if (value > this.$moment().endOf('month')) return this.form.task_type !== 'predict'
      return false
    },
    validateForm () {
      return this.$refs.form.validate().then(() => true)
    },
    async handleConfirm () {
      this.loading = true
      try {
        const validate = await this.validateForm()
        if (!validate) return
        const data = {
          account_id: this.params.data.map(item => item.id),
          task_type: this.form.task_type,
        }
        if (this.isMonthShow && !this.ignore_time) {
          data.start_day = parseInt(this.$moment(this.form.month_range[0]).startOf('month').format('YYYYMMDD'))
          data.end_day = parseInt(this.$moment(this.form.month_range[1]).endOf('month').format('YYYYMMDD'))
        }
        await this.$bM.create({
          data,
        })
        this.params.success && this.params.success()
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="less" scoped>
.billtasks-month-range {
  width: 260px;
  max-width: 100%;
  flex: none;
}
.billtasks-month-range.is-all-history {
  width: 320px;
}
.share-label {
  .share-text {
    width: 50px;
    text-align: center;
    display: inline-block;
    height: 32px;
    padding: 0 5px;
    border: 1px solid #d9d9d9;
    line-height: 31px;
  }
}
</style>
