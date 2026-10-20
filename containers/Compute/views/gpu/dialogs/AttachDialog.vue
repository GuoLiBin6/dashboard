<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('compute.text_113')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('compute.text_492', [params.resourceType === 'server_container' ? this.$t('dictionary.server_container') : this.$t('dictionary.server')])" :extra="$t('compute.text_493')" prop="guest">
          <a-select v-model:value="form.guest">
            <a-select-option v-for="item in guestesOpts" :key="item.id">
              {{item.name}}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item v-if="showGpuType" :label="$t('gpu.device_type')" prop="gpu_type">
          <base-select v-model:value="form.gpu_type" :options="gpuTypeOptions" />
        </a-form-model-item>
        <a-form-model-item
          v-if="showMemoryRequest"
          :label="$t('compute.pci.memory_request')"
          prop="memory_request">
          <a-tooltip
            :title="memoryRangeTooltip"
            placement="top"
            :get-popup-container="getTooltipContainer">
            <disk-size-input
              v-model:value="form.memory_request"
              :min="1"
              :max="memorySizeMb || Infinity"
              :step="1"
              :units="['MB', 'GB']"
              value-unit="MB"
              default-unit="GB"
              @change="onMemoryRequestChange"
              @unitChange="onMemoryUnitChange" />
          </a-tooltip>
        </a-form-model-item>
        <a-form-model-item v-if="isShowAutoStart" :label="$t('compute.text_494')" :extra="$t('compute.text_495')" prop="autoStart">
          <a-switch v-model:checked="form.autoStart" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" />
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
import {
  GPU_TYPE_OPTION_MAP,
  getGpuTypeSelectOptions,
  resolveGpuTypeBySharingMode,
} from '@Compute/constants'
import DiskSizeInput from '@/sections/DiskSizeInput'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'GpuAttachServerDialog',
  components: {
    DiskSizeInput,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      scope: this.$store.getters.scope,
      form: {
        guest: undefined,
        gpu_type: resolveGpuTypeBySharingMode(
          GPU_TYPE_OPTION_MAP.HPC.value,
          this.params.data[0]?.sharing_mode,
        ),
        memory_request: undefined,
        autoStart: true,
      },
      rules: {
        guest: [
          {
            required: true,
            message: this.$t('compute.text_496', [
              this.$t('dictionary.server'),
            ]),
          },
        ],
        memory_request: [
          { required: true, message: this.$t('compute.pci.memory_request.required') },
          { validator: this.validateMemoryRequest },
        ],
      },
      guestesOpts: [],
      memoryUnit: 'GB',
    }
  },
  computed: {
    currentDevice () {
      return this.params.data[0] || {}
    },
    columns () {
      const ret = []
      this.params.columns.map(item => {
        if (['name', 'dev_type', 'model', 'host'].indexOf(item.field) !== -1) {
          ret.push(item)
        }
      })
      return ret
    },
    curGuest () {
      return this.guestesOpts.find(o => o.id === this.form.guest)
    },
    isGuestRunning () {
      return this.curGuest?.status === 'running'
    },
    isShowAutoStart () {
      return this.curGuest !== undefined && !this.isGuestRunning
    },
    gpuTypeOptions () {
      return getGpuTypeSelectOptions(this.currentDevice.sharing_mode)
    },
    showGpuType () {
      return this.currentDevice.dev_type === 'GPU'
    },
    showMemoryRequest () {
      return this.currentDevice.sharing_mode === 'HAMI'
    },
    memorySizeMb () {
      return this.currentDevice.memory_size_mb || this.currentDevice.memory_size || undefined
    },
    memoryRangeTooltip () {
      return this.getMemoryRangeText(this.memorySizeMb, this.memoryUnit || 'GB')
    },
  },
  created () {
    const params = {
      host_id: this.params.data[0].host_id,
      filter: this.params.resourceType === 'server_container' ? 'hypervisor.in(pod)' : 'hypervisor.in(kvm)',
      scope: this.scope,
      limit: 0,
    }
    new this.$Manager('servers').list({ params })
      .then((res) => {
        this.guestesOpts = res.data.data.filter(val => this.params.resourceType === 'server_container' ? val.status === 'ready' : val.status === 'ready' || val.status === 'running')
      })
  },
  methods: {
    getTooltipContainer () {
      return document.body
    },
    getMemoryRangeText (maxMb, unit = 'GB') {
      if (!maxMb) return ''
      const factor = unit === 'GB' ? 1024 : 1
      const min = 1 / factor
      const max = maxMb / factor
      const fmt = (n) => (Number.isInteger(n) ? n : Number(n.toFixed(3)))
      return this.$t('compute.pci.memory_request.range', [fmt(min), fmt(max), unit])
    },
    validateMemoryRequest (rule, value, callback) {
      if (value === undefined || value === null || value === '') {
        callback()
        return
      }
      const num = Number(value)
      if (!Number.isInteger(num) || num <= 0) {
        callback(new Error(this.$t('compute.pci.memory_request.invalid')))
        return
      }
      if (this.memorySizeMb && num > this.memorySizeMb) {
        callback(new Error(this.getMemoryRangeText(this.memorySizeMb, this.memoryUnit || 'GB')))
        return
      }
      callback()
    },
    clampMemoryRequest (val) {
      if (val === undefined || val === null || val === '') return val
      const num = Number(val)
      if (!Number.isFinite(num)) return val
      if (this.memorySizeMb && num > this.memorySizeMb) return this.memorySizeMb
      if (num < 1) return 1
      return Math.round(num)
    },
    onMemoryRequestChange (val) {
      this.form.memory_request = this.clampMemoryRequest(val)
    },
    onMemoryUnitChange (unit) {
      this.memoryUnit = unit
    },
    doAttach () {
      const attachData = {
        auto_start: this.isShowAutoStart ? this.form.autoStart : false,
        device: this.params.data[0].id,
      }
      if (this.currentDevice.sharing_mode) {
        attachData.sharing_mode = this.currentDevice.sharing_mode
      }
      if (this.showGpuType && this.form.gpu_type) {
        attachData.gpu_type = this.form.gpu_type
      }
      if (this.showMemoryRequest && this.form.memory_request) {
        attachData.memory_request = this.form.memory_request
      }
      return new this.$Manager('servers').performAction({
        id: this.form.guest,
        action: 'attach-isolated-device',
        data: attachData,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doAttach()
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        // validate or submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
