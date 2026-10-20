<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{params.title || $t('cloudenv.text_364')}}</template>
    <template #body>
      <dialog-selected-tips :name="params.name" class="mt-3" :count="params.data.length" :action="params.action" />
      <dialog-table v-if="params.columns && params.columns.length" :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('common.sync_mode')" :help="$t('common.increment_sync_tip')">
          <a-radio-group v-model:value="form.sync_mode">
            <a-radio-button value="full">{{$t('common.full_sync')}}</a-radio-button>
            <a-radio-button value="increment">{{$t('common.increment_sync')}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('common.full_sync_resource_type')" prop="resource">
          <a-select
            mode="multiple"
            v-model:value="form.resource"
            @change="handleResourceChange">
            <a-select-option v-for="v in resources" :key="v" :value="v">
              {{ v === 'all' ? $t('cloudenv.text_297') : getResourceI18n(v) }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'FullSyncResourceDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      resources: ['all', 'network', 'compute', 'loadbalancer', 'objectstore', 'rds', 'cache', 'nat', 'nas', 'waf', 'mongodb', 'es', 'kafka', 'app', 'container', 'quota', 'intervpcnetwork', 'cdn', 'dnszone', 'image'],
      form: {
        sync_mode: 'full',
        resource: ['all'],
      },
      rules: {
        resource: [{ required: true, message: this.$t('cloudenv.text_284', [this.$t('common.full_sync_resource_type')]) }],
      },
    }
  },
  methods: {
    getResourceI18n (v) {
      if (v === 'image') return this.$t('compute.text_96')
      if (this.$te(`dictionary.${v}`)) {
        return this.$t(`dictionary.${v}`)
      }
      return v
    },
    handleResourceChange (v) {
      this.$nextTick(() => {
        if (v.join(',').endsWith('all')) {
          this.form.resource = ['all']
        } else if (v.includes('all') && v.length > 1) {
          this.form.resource = v.filter(item => item !== 'all')
        }
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        const ids = this.params.data.map(item => item.id)
        await this.$refs.formRef.validate()
        const values = this.form
        const data = {
          force: true,
          resources: values.resource,
        }
        if (values.resource[0] === 'all') {
          data.full_sync = true
          data.resources = []
        }
        if (values.sync_mode === 'increment') data.xor = true
        if (this.params.onManager) {
          await this.params.onManager('batchPerformAction', {
            id: ids,
            steadyStatus: this.params.steadyStatus || {},
            managerArgs: {
              action: 'sync',
              data,
            },
          })
        } else {
          const ids = this.params.data.map(item => item.cloudprovider_id)
          await new this.$Manager('cloudproviders').batchPerformAction({
            ids: ids,
            action: 'sync',
            data: {
              region: [
                this.params.data[0].cloudregion_id,
              ],
              ...data,
            },
          })
        }
        this.params.callback && this.params.callback()
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
