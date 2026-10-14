<template>
  <base-dialog :width="900" @cancel="cancelDialog">
    <div slot="header">{{ $t('aice.llm_update_config') }}</div>
    <div slot="body">
      <dialog-selected-tips :name="instanceLabel" :count="1" :action="$t('aice.llm_update_config')" />
      <a-form-model ref="formRef" :model="form" v-bind="formItemLayout" hideRequiredMark>
        <a-form-model-item v-if="supportMountedModels" :label="$t('aice.model')" :extra="$t('aice.llm_override_sku_extra')">
          <base-select
            v-model:value="form.mounted_models"
            resource="llm_instant_models"
            remote
            :params="mountedModelParams"
            :selectProps="{ mode: 'multiple', placeholder: $t('common.tips.select', [$t('aice.model')]), allowClear: true }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('aice.devices')" :extra="$t('aice.llm_override_sku_extra')">
          <base-select
            v-model:value="form.device"
            :options="specList"
            :selectProps="{ mode: 'multiple', placeholder: $t('common.tips.select', [$t('aice.devices')]), allowClear: true }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('aice.host_paths')" :extra="$t('aice.llm_override_sku_extra')">
          <div v-for="hp in hostPathRows" :key="hp.key" style="display: flex; align-items: stretch; gap: 10px; margin-bottom: 12px;">
            <div style="flex: 1; border: 1px solid #e8e8e8; border-radius: 4px; padding: 12px;">
              <a-row :gutter="8">
                <a-col :span="8">
                  <a-form-item>
                    <fixed-label-filter :label="$t('aice.host_paths.type')">
                      <a-select v-model:value="hp.type" :placeholder="$t('common.tips.select', [$t('aice.host_paths.type')])">
                        <a-select-option value="directory">directory</a-select-option>
                        <a-select-option value="file">file</a-select-option>
                      </a-select>
                    </fixed-label-filter>
                  </a-form-item>
                </a-col>
                <a-col :span="16">
                  <a-form-item>
                    <fixed-label-filter :label="$t('aice.host_paths.path')">
                      <a-input v-model:value="hp.path" :placeholder="$t('aice.host_paths.path.placeholder')" />
                    </fixed-label-filter>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="8">
                <a-col :span="24">
                  <a-form-item>
                    <a-checkbox v-model:checked="hp.auto_create">{{ $t('aice.host_paths.auto_create') }}</a-checkbox>
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="8" v-if="hp.auto_create">
                <a-col :span="8">
                  <a-form-item>
                    <fixed-label-filter :label="$t('aice.host_paths.auto_create_config.uid')">
                      <a-input v-model:value="hp.auto_create_config.uid" :placeholder="$t('aice.host_paths.auto_create_config.uid.placeholder')" />
                    </fixed-label-filter>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item>
                    <fixed-label-filter :label="$t('aice.host_paths.auto_create_config.gid')">
                      <a-input v-model:value="hp.auto_create_config.gid" :placeholder="$t('aice.host_paths.auto_create_config.gid.placeholder')" />
                    </fixed-label-filter>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item>
                    <fixed-label-filter :label="$t('aice.host_paths.permissions')">
                      <a-input v-model:value="hp.auto_create_config.permissions" :placeholder="$t('aice.host_paths.permissions.placeholder')" />
                    </fixed-label-filter>
                  </a-form-item>
                </a-col>
              </a-row>

              <div style="margin: 8px 0; font-weight: 500;">{{ $t('aice.host_paths.containers') }}</div>
              <div v-for="c in hp.containerRows" :key="c.key">
                <a-row :gutter="8">
                  <a-col :span="12">
                    <a-form-item>
                      <fixed-label-filter :label="$t('aice.host_paths.mount_path')">
                        <a-input v-model:value="c.mount_path" :placeholder="$t('aice.host_paths.mount_path.placeholder')" />
                      </fixed-label-filter>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item>
                      <fixed-label-filter :label="$t('aice.host_paths.propagation')">
                        <a-select v-model:value="c.propagation" :placeholder="$t('common.tips.select', [$t('aice.host_paths.propagation')])" optionLabelProp="label" :dropdownMatchSelectWidth="false">
                          <a-select-option value="private" label="private">private - {{ $t('aice.host_paths.propagation.private') }}</a-select-option>
                          <a-select-option value="rslave" label="rslave">rslave - {{ $t('aice.host_paths.propagation.rslave') }}</a-select-option>
                          <a-select-option value="rshared" label="rshared">rshared - {{ $t('aice.host_paths.propagation.rshared') }}</a-select-option>
                        </a-select>
                      </fixed-label-filter>
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="8">
                  <a-col :span="4">
                    <a-form-item>
                      <a-checkbox v-model:checked="c.read_only">{{ $t('aice.host_paths.read_only') }}</a-checkbox>
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
            </div>

            <div style="width: 34px; display: flex; align-items: center; justify-content: center;">
              <a-button shape="circle" icon="minus" size="small" @click="delHostPath(hp)" />
            </div>
          </div>

          <div class="d-flex align-items-center">
            <a-button type="primary" shape="circle" icon="plus" size="small" @click="addHostPath" />
            <a-button type="link" @click="addHostPath">{{ $t('aice.host_paths.add') }}</a-button>
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
import { parseLlmRoute } from '@Ai/utils/llmRouteContext'
import { devicesFromModelKeys } from '@Ai/utils/deviceFormUtils'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { uuid } from '@/utils/utils'
import { getParamsForType } from '../../llm-sku/constants/llmTypeConfig'

function buildContainerRows (containers) {
  const obj = containers && typeof containers === 'object' ? containers : {}
  const containerRows = Object.keys(obj).map(k => ({
    key: uuid(),
    containerIndex: String(k),
    mount_path: obj[k]?.mount_path || '',
    read_only: !!obj[k]?.read_only,
    propagation: obj[k]?.propagation || 'rslave',
  }))
  return containerRows.length ? containerRows : [{
    key: uuid(),
    containerIndex: '0',
    mount_path: '',
    read_only: false,
    propagation: 'rslave',
  }]
}

function buildHostPathRow (hp = {}) {
  const autoCfg = hp.auto_create_config || {}
  return {
    key: hp.key || uuid(),
    type: hp.type || 'directory',
    path: hp.path || '',
    auto_create: !!hp.auto_create,
    auto_create_config: {
      uid: autoCfg.uid,
      gid: autoCfg.gid,
      permissions: autoCfg.permissions,
    },
    containerRows: buildContainerRows(hp.containers),
  }
}

export default {
  name: 'LlmUpdateConfigDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const row = (this.params.data && this.params.data[0]) || {}
    const { isApplyType, isDesktopType } = parseLlmRoute(this.$route.path)
    const devices = Array.isArray(row.devices) ? row.devices : []
    const mountedModels = Array.isArray(row.mounted_model_infos) ? row.mounted_model_infos : []
    const hostPaths = Array.isArray(row.host_paths) ? row.host_paths : []
    const hostPathRows = hostPaths.map(hp => buildHostPathRow(hp))
    return {
      row,
      isApplyType,
      isDesktopType,
      loading: false,
      hostPathRows,
      form: {
        device: devices.map(v => v.model),
        mounted_models: mountedModels.map(v => v.id),
      },
      formItemLayout: {
        wrapperCol: { span: 20 },
        labelCol: { span: 4 },
      },
    }
  },
  computed: {
    instanceLabel () {
      if (this.isDesktopType) return this.$t('aice.desktop_llm')
      if (this.isApplyType) return this.$t('aice.app_llm')
      return this.$t('aice.llm')
    },
    specList () {
      const list = Object.values(this.$store.getters.capability?.pci_model_types || {}).filter(item => item.hypervisor === 'pod')
      return list.map(item => ({ key: item.model, label: item.model }))
    },
    podPciModels () {
      return Object.values(this.$store.getters.capability?.pci_model_types || {}).filter(item => item.hypervisor === 'pod')
    },
    supportMountedModels () {
      return ['ollama', 'vllm'].includes((this.row.llm_type || '').toLowerCase())
    },
    mountedModelParams () {
      return {
        limit: 20,
        scope: this.$store.getters.scope,
        ...getParamsForType(this.row.llm_type),
      }
    },
  },
  methods: {
    addHostPath () {
      this.hostPathRows.push(buildHostPathRow())
    },
    delHostPath (hp) {
      const idx = this.hostPathRows.findIndex(v => v.key === hp.key)
      if (idx >= 0) this.hostPathRows.splice(idx, 1)
    },
    validateHostPaths () {
      for (const hp of this.hostPathRows) {
        if (hp.path == null || String(hp.path).trim() === '') {
          this.$message.error(this.$t('aice.host_paths.path.required'))
          return false
        }
      }
      return true
    },
    async handleConfirm () {
      if (!this.validateHostPaths()) return
      this.loading = true
      try {
        const data = {}
        data.devices = Array.isArray(this.form.device) ? devicesFromModelKeys(this.form.device, this.podPciModels) : []
        if (this.supportMountedModels) {
          data.mounted_models = Array.isArray(this.form.mounted_models) ? this.form.mounted_models : []
        }
        data.host_paths = this.hostPathRows.map(hp => {
          const type = hp.type
          const path = hp.path
          const autoCreate = !!hp.auto_create
          const out = { type, path }
          if (autoCreate) {
            out.auto_create = true
            const uid = hp.auto_create_config?.uid
            const gid = hp.auto_create_config?.gid
            const perm = hp.auto_create_config?.permissions
            const cfg = {}
            if (uid !== undefined && uid !== null && uid !== '') cfg.uid = uid
            if (gid !== undefined && gid !== null && gid !== '') cfg.gid = gid
            if (perm != null && String(perm).trim() !== '') cfg.permissions = String(perm).trim()
            if (Object.keys(cfg).length > 0) out.auto_create_config = cfg
          }
          const containers = {}
          ;(hp.containerRows || []).forEach(c => {
            const idx = c.containerIndex ?? 0
            const mountPath = c.mount_path
            if (idx == null || mountPath == null || String(mountPath).trim() === '') return
            const k = String(idx).trim()
            if (!k) return
            const m = { mount_path: String(mountPath).trim(), read_only: !!c.read_only }
            const prop = c.propagation
            if (prop != null && String(prop).trim() !== '') m.propagation = String(prop).trim()
            containers[k] = m
          })
          if (Object.keys(containers).length > 0) out.containers = containers
          return out
        }).filter(v => v && v.type && v.path)
        await this.params.onManager('update', {
          id: this.row.id,
          managerArgs: { data },
        })
        this.$message.success(this.$t('common.success'))
        this.cancelDialog()
        this.params.refresh && this.params.refresh()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
