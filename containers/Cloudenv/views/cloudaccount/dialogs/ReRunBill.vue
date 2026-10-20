<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('cloudenv.action.update_credential')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.cloudaccount')" :count="params.data.length" :action="$t('cloudenv.action.update_credential')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form.fd"
        :rules="rules">
        <a-form-model-item :label="$t('cloudenv.text_212')">
          <span slot="extra">
            <span>{{$t('cloudenv.text_213')}}</span>
          </span>
          <a-form-model-item prop="start_day" style="display:inline-block; margin-bottom: 0">
            <a-month-picker :disabled-date="dateDisabledStart" v-model:value="form.fd.start_day" @change="startChange" />
          </a-form-model-item>
          <span class="ml-2 mr-2">~</span>
          <a-form-model-item prop="end_day" style="display:inline-block; margin-bottom: 0">
            <a-month-picker :disabled-date="dateDisabledEnd" v-model:value="form.fd.end_day" />
          </a-form-model-item>
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

export default {
  name: 'CloudaccountRerunBillDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        fd: {
          start_day: this.$moment().startOf('month').subtract('month', 1),
          end_day: this.$moment().subtract('month', 1),
        },
      },
      rules: {
        start_day: [
          { required: true, message: this.$t('common.tips.select', [this.$t('bill.text_40')]) },
        ],
        end_day: [
          { required: true, message: this.$t('common.tips.select', [this.$t('bill.text_41')]) },
        ],
      },
    }
  },
  computed: {
    provider () {
      return this.params.provider
    },
    start () {
      return this.$moment(this.form.fd.start_day).format('YYYY-MM')
    },
    end () {
      return this.$moment(this.form.fd.end_day).format('YYYY-MM')
    },
    selectedMonths () {
      const list = []
      const start = this.$moment(this.start)
      const end = this.$moment(this.end)
      // eslint-disable-next-line
      while (end > start || start.format('M') === end.format('M')) {
        list.push(start.format('YYYYMM'))
        start.add(1, 'month')
      }
      return list
    },
  },
  methods: {
    startChange (value) {
      const dateEnd = this.form.fd.end_day
      if (dateEnd && value > dateEnd) {
        this.form.fd.end_day = value
      }
    },
    dateDisabledStart (value) {
      if (this.params.data.every(item => item.provider === 'extdb')) return false
      if (value > this.$moment()) return true
      return false
    },
    dateDisabledEnd (value) {
      const dateStart = this.form.fd.start_day
      if (dateStart && value < dateStart) return true
      if (this.params.data.every(item => item.provider === 'extdb')) return false
      if (value > this.$moment()) return true
      return false
    },
    async postBillTasks (ids, values) {
      const manager = new this.$Manager('billtasks/submit', 'v1')
      try {
        const { start_day, end_day } = values
        const data = {
          task_type: 'pull_bill',
          account_id: ids,
          start_day: this.$moment(start_day).startOf('month').format('YYYYMMDD'),
          end_day: this.$moment(end_day).endOf('month').format('YYYYMMDD'),
        }
        await manager.create({
          data,
        })
      } catch (err) {
        throw err
      }
    },
    async handleConfirm () {
      try {
        this.loading = false
        await this.$refs.formRef.validate()
        this.postBillTasks(this.params.data.map(item => item.id), this.form.fd)
        this.loading = false
        this.$message.success(this.$t('common.success'))
        this.cancelDialog()
      } catch (err) {
        this.loading = false
        throw err
      }
    },
  },
}
</script>
