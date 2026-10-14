<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-spin :spinning="cpuCoresInfoLoading">
        <a-form-model ref="formRef" :model="form" hideRequiredMark v-bind="formItemLayout">
          <a-form-model-item :label="$t('compute.bind_physical_cpu')" prop="bindCpuCores">
            <a-switch
              v-model:checked="form.bindCpuCores"
              :checkedChildren="$t('compute.text_115')"
              :unCheckedChildren="$t('compute.text_116')" />
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_1058')" v-show="form.bindCpuCores" prop="cpuCores">
            <a-checkbox-group
              v-model:value="form.cpuCores"
              style="width: 100%; margin-top: 10px;">
              <a-row v-for="v in hostCores" :key="v">
                <a-col :span="4" v-for="c in v" :key="c">
                  <a-tooltip v-if="hostUsedCores.includes(c)">
                    <template slot="title">
                      {{ $t('compute.host_use_core_tips') }}
                    </template>
                    <a-checkbox disabled :value="c">{{ c }}</a-checkbox>
                  </a-tooltip>
                  <a-checkbox v-else :value="c">{{ c }}</a-checkbox>
                </a-col>
              </a-row>
            </a-checkbox-group>
          </a-form-model-item>
        </a-form-model>
      </a-spin>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import chunk from 'lodash/chunk'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'BindPhysicalCpuDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      action: this.$t('compute.bind_physical_cpu'),
      cpuCoresInfo: {},
      cpuCoresInfoLoading: false,
      form: {
        bindCpuCores: false,
        cpuCores: undefined,
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
    }
  },
  computed: {
    columns () {
      return this.params.columns.slice(0, 3)
    },
    hostCores () {
      const hostCores = (this.cpuCoresInfo.host_cores || []).sort((a, b) => a - b)
      return chunk(hostCores, 6)
    },
    hostUsedCores () {
      const hostUsedCores = this.cpuCoresInfo?.host_used_cores || []
      return hostUsedCores.filter(v => {
        const pinnedCores = this.cpuCoresInfo?.pinned_cores || []
        return !pinnedCores.includes(v)
      })
    },
  },
  created () {
    this.loadCpusetCores()
  },
  methods: {
    async loadCpusetCores () {
      try {
        const id = this.params.data[0].id
        const manager = new this.$Manager('servers')
        this.cpuCoresInfoLoading = true
        const { data } = await manager.getSpecific({ id, spec: 'cpuset-cores' })
        this.cpuCoresInfo = data
        this.form.cpuCores = data.pinned_cores
        this.form.bindCpuCores = data.pinned_cores?.length > 0
      } catch (error) {
        throw error
      } finally {
        this.cpuCoresInfoLoading = false
      }
    },
    doBindPhysicalSubmit () {
      const { bindCpuCores, cpuCores } = this.form
      const ids = this.params.data.map(item => item.id)
      const params = { cpus: cpuCores }
      if (bindCpuCores) {
        return this.params.onManager('performAction', {
          id: ids[0],
          steadyStatus: ['ready'],
          managerArgs: {
            action: 'cpuset',
            data: params,
          },
        })
      } else {
        return this.params.onManager('performAction', {
          id: ids[0],
          steadyStatus: ['ready'],
          managerArgs: {
            action: 'cpuset-remove',
            data: {},
          },
        })
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doBindPhysicalSubmit()
        this.params.refresh && this.params.refresh()
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
