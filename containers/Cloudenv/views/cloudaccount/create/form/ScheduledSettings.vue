<template>
  <div>
    <page-body>
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <a-form-model-item :label="$t('cloudenv.text_95')" prop="name">
          <a-input :placeholder="$t('cloudenv.text_190')" v-model:value="form.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_360')">
          {{ $t('cloudenv.sync_account') }}
        </a-form-model-item>
        <scheduled-task-time ref="taskTime" :model="form" />
      </a-form-model>
    </page-body>
  </div>
</template>

<script>
import ScheduledTaskTime from '@Cloudenv/sections/ScheduledTaskTime'

export default {
  name: 'ScheduledSettings',
  components: {
    ScheduledTaskTime,
  },
  props: {
    account: {
      type: Object,
      default: () => { return {} },
    },
  },
  data () {
    const initialName = this.account.name ? `aoto-sync-${this.account.name}-${this.$moment().format('YYYYMMDD')}` : ''
    return {
      loading: false,
      form: {
        name: initialName,
      },
      rules: {
        name: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
        ],
      },
    }
  },
  methods: {
    generateData (resId, values) {
      const params = {
        resource_type: 'cloudaccount',
        label_type: 'id',
        labels: [resId],
        operation: 'sync',
        generate_name: values.name,
      }
      this.$refs.taskTime.transformParams(params, values)
      return params
    },
    async validateForm () {
      await this.$refs.formRef.validate()
      return { ...this.form }
    },
    async handleConfirm (resId) {
      this.loading = true
      try {
        const values = await this.validateForm()
        const params = this.generateData(resId, values)
        await new this.$Manager('scheduledtasks', 'v1').create({ data: params })
        this.$router.push('/cloudaccount')
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
