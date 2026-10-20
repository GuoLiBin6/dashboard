<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('common.save')}}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('compute.text_228')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('common.placeholder')"  @change="handleNameChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('monitor.dashboard.title')" prop="dashboard_id">
          <base-select
              filterable
              v-model:value="form.dashboard_id"
              :loading="loading"
              resource="alertdashboards"
              :options="dashboards" />
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
import _ from 'lodash'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'CreateMonitorDashboardChart',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    this.handleNameChange = _.debounce(this._handleNameChange, 500)
    return {
      loading: false,
      scope: this.$store.getters.scope,
      manager: new this.$Manager('alertdashboards', 'v1'),
      name: '',
      dashboards: [],
      form: {
        name: this.params.name || '',
        dashboard_id: undefined,
      },
      rules: {
        dashboard_id: [
          { required: true, message: this.$t('monitor.dashboard.create.chart.dashboard.tips') },
        ],
        name: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
        ],
      },
    }
  },
  created () {
    this.fetchDashboards()
  },
  methods: {
    async fetchDashboards () {
      this.loading = true
      this.dashboards = []
      try {
        const params = {
          scope: this.scope,
        }
        const { data: { data } } = await this.manager.list({ params })
        this.dashboards = data
        this.loading = false
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    _handleNameChange (e) {
      this.name = e.target.value
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const data = {
          dashboard_id: this.form.dashboard_id,
          name: this.form.name,
          metric_query: this.params.metric_query,
          interval: this.params.timeGroup,
          scope: this.$store.getters.scope,
          ...this.params.timeRangeParams,
        }
        if (!data.metric_query || !data.metric_query.length || !data.from || !data.dashboard_id) return
        const manager = new this.$Manager('alertpanels', 'v1')
        const { data: panel } = await manager.create({ data })
        if (this.params.message && panel && panel.id) {
          await manager.update({ id: panel.id, data: { message: this.params.message } })
        }
        this.loading = false
        this.$message.success(this.$t('cloudenv.text_381'))
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
