<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{action}}</template>
    <template #body>
      <a-alert class="mb-2" type="warning">
        <template #message>
          {{tip}}
        </template>
      </a-alert>
      <dialog-selected-tips :name="name" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('common.text00061')">
          <a-switch
            v-model:checked="form.durationEnable"
            :checkedChildren="$t('common.text00062')"
            :unCheckedChildren="$t('common.text00063')" />
        </a-form-model-item>
        <a-form-model-item
          v-if="form.durationEnable"
          :label="$t('common.text00064')"
          prop="durationDate"
          :help="help">
          <!-- 自研 OcDateTimePicker combined：单输入 + 面板内快捷时长，对齐旧交互 -->
          <div class="d-flex" @click="openDatePicker">
            <oc-date-time-picker
              v-model:value="form.durationDate"
              v-model:open="open"
              layout="combined"
              class="duration-datetime"
              :allow-clear="false"
              format="YYYY-MM-DD HH:mm"
              :disabled-date="disabledDate"
              :disabled-time="disabledDateTime"
              @change="dateChangeHandle"
              @ok="closeDatePicker">
              <template #renderExtraFooter>
                <span class="duration-footer-label">{{$t('common.text00065')}}</span>
                <a-tag
                  v-for="v in durationArrs"
                  :key="v.value"
                  color="blue"
                  class="duration-tag"
                  :class="{ active: currentDuration === v.value }"
                  @click.stop="chooseDurationHandle(v)">{{v.text}}</a-tag>
              </template>
            </oc-date-time-picker>
          </div>
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import * as R from 'ramda'
import dayjs from 'dayjs'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'SetDurationDialog',
  compatConfig: { MODE: 3 },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const expiredAtSort = R.sortWith([
      R.descend(R.prop('release_at')),
    ])
    const datas = expiredAtSort(this.params.data)
    const expireDate = datas[0].release_at ? dayjs(datas[0].release_at) : dayjs().add(1, 'h')
    return {
      loading: false,
      action: this.$t('common.text00061'),
      form: {
        durationEnable: false,
        durationDate: expireDate,
      },
      rules: {
        durationDate: [
          { required: true, message: this.$t('common.text00066') },
        ],
      },
      currentDuration: '',
      expireDate,
      open: false,
    }
  },
  computed: {
    tip () {
      return this.params.alert || this.$t('common.text00060')
    },
    help () {
      return this.$t('common.text00067')
    },
    durationArrs () {
      const map = this.$tm('durations') || {}
      return Object.keys(map).map(k => ({
        value: k,
        text: map[k],
      }))
    },
    name () {
      return this.params.name || this.$t('dictionary.server')
    },
  },
  watch: {
    'form.durationEnable' () {
      this.open = false
    },
  },
  created () {
    if (this.params.data[0].release_at !== undefined) {
      this.form.durationEnable = true
    }
  },
  methods: {
    async doUpdateSubmit (data) {
      const raw = data.durationDate
      const time = this.$moment.utc(dayjs.isDayjs(raw) ? raw.toDate() : raw).format()
      const params = {
        release_at: time,
      }
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: ['running', 'ready'],
        managerArgs: {
          action: 'postpaid-expire',
          data: params,
        },
      })
    },
    async doCancelExpireSubmit () {
      const params = {}
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: ['running', 'ready'],
        managerArgs: {
          action: 'cancel-expire',
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (this.form.durationEnable) {
          await this.$refs.formRef.validate()
          await this.doUpdateSubmit(this.form)
        } else {
          await this.doCancelExpireSubmit()
        }
        this.loading = false
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
    range (start, end) {
      const result = []
      for (let i = start; i < end; i++) {
        result.push(i)
      }
      return result
    },
    disabledDate (current) {
      if (!current) return false
      return current.isBefore(this.expireDate, 'day')
    },
    disabledDateTime (current) {
      if (!current || !current.isSame(this.expireDate, 'day')) return {}
      const h = this.expireDate.hour()
      const m = this.expireDate.minute()
      return {
        disabledHours: () => this.range(0, h),
        disabledMinutes: (selectedHour) => (selectedHour === h ? this.range(0, m) : []),
      }
    },
    chooseDurationHandle (v) {
      this.currentDuration = v.value
      const addMap = {
        '1h': [1, 'h'],
        '2h': [2, 'h'],
        '3h': [3, 'h'],
        '6h': [6, 'h'],
        '1d': [1, 'd'],
        '2d': [2, 'd'],
        '1w': [1, 'w'],
      }
      const pair = addMap[v.value]
      if (!pair) return
      this.form.durationDate = this.expireDate.add(pair[0], pair[1])
    },
    dateChangeHandle () {
      this.currentDuration = ''
    },
    openDatePicker () {
      this.open = true
    },
    closeDatePicker () {
      this.open = false
    },
  },
}
</script>

<style lang="less" scoped>
.duration-datetime {
  max-width: 360px;
}
.duration-footer-label {
  margin-right: 4px;
  white-space: nowrap;
}
.duration-tag {
  border-radius: 10px;
  cursor: pointer;
  background: none;
  margin: 2px 4px 2px 0;
  white-space: nowrap;
  &.active {
    background: #e6f7ff;
  }
}
</style>
