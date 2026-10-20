<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('monitor.alerts.shield.shield') }}</div>
    <div slot="body" class="alertrecord-detail">
      <dialog-selected-tips :name="$t('monitor.text_1')" :count="params.data.length" :action="$t('monitor.alerts.shield.shield')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 4)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <a-form-model-item :label="$t('monitor.alerts.shield.time')" prop="time">
          <a-radio-group class="mr-3" v-model:value="form.time">
            <a-radio-button key="unset" value="unset">{{ $t('compute.text_138') }}</a-radio-button>
            <a-radio-button v-for="item in timeOpts" v-show="!item.hidden" :key="item.key" :value="item.key">{{ item.label }}</a-radio-button>
            <custom-date v-model:customTime="customTime" @click="handleSelected" v-model:time="time" :startTime="moment()" :endTime="moment().add(1, 'days')" :allow-future-time="true" />
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('monitor.alerts.shield.reason')">
          <a-input v-model:value="form.description" :placeholder="$t('common.tips.optional_input', [$t('monitor.alerts.shield.reason')])" />
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
import moment from 'moment'
import { timeOpts } from '@/constants/monitor'
import CustomDate from '@/sections/CustomDate'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ShieldAlertrecord',
  components: { CustomDate },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      moment: moment,
      loading: false,
      timeOpts,
      customTime: null,
      time: '',
      form: {
        time: 'unset',
        description: '',
      },
      rules: {
        time: [
          { required: true, message: `${this.$t('common.select')}` },
        ],
      },
    }
  },
  methods: {
    handleSelected (v) {
      this.form.time = v
    },
    parseTime (v) {
      let hours = 0
      if (v) {
        hours = parseInt(v.replace('now', ''))
      }

      return moment().add(hours, 'Hours').toISOString()
    },
    parseTimeStr (timeStr) {
      const t = { start_time: undefined, end_time: undefined }
      if (timeStr === 'unset') {
        return t
      } else if (timeStr === 'custom') {
        t.start_time = this.parseTime(this.customTime.from)
        t.end_time = this.parseTime(this.customTime.to)
      } else {
        t.start_time = this.parseTime()
        t.end_time = this.parseTime(timeStr)
      }

      return t
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { start_time, end_time } = this.parseTimeStr(this.form.time)
        const params = {
          alert_id: this.params.data[0].alert_id,
          res_name: this.params.data[0].res_name,
          res_id: this.params.data[0].monitor_resource_id,
          start_time: start_time,
          end_time: end_time,
          description: this.form.description,
        }
        await new this.$Manager('alertrecordshields', 'v1').create({ data: params })
        if (this.params.refresh && typeof this.params.refresh === 'function') {
          this.params.refresh()
        }
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
</style>
