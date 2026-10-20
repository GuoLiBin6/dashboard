<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{title}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning" v-if="tip">
        <template #message>{{tip}}</template>
      </a-alert>
      <dialog-selected-tips :name="params.name" :count="params.data.length" :action="title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form">
        <a-form-model-item :label="$t('db.text_54')">
          <a-radio-group v-model:value="form.duration">
              <a-radio-button
                :key="item.value"
                :value="item.value"
                v-for="item in durations">
                {{item.label}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button :loading="loading" @click="handleConfirm" type="primary">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'RenewDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const durations = []
    const months = [1, 2, 3, 4, 5, 6]
    months.forEach((month) => {
      durations.push({
        label: month + this.$t('common.unit.month.with.adj'),
        value: month + 'M',
        unit: 'M',
      })
    })
    const years = [1, 2, 3]
    years.forEach((year) => {
      durations.push({
        label: year + this.$t('common.unit.year'),
        value: year + 'Y',
        unit: 'Y',
      })
    })
    const initialDuration = (this.params.data && this.params.data.length > 0)
      ? (this.params.data[0].duration || '1M')
      : '1M'
    return {
      durations,
      loading: false,
      title: this.$t('common.renew'),
      form: {
        duration: initialDuration,
      },
    }
  },
  computed: {
    tip () {
      return this.params.alert
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        const ids = this.params.data.map(item => item.id)
        await this.params.onManager('batchPerformAction', {
          id: ids,
          steadyStatus: 'running',
          managerArgs: {
            data: this.form,
            action: 'renew',
          },
        })
        this.loading = false
        this.$message.success(this.$t('common.success'))
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
