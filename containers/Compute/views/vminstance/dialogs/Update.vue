<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_247')}}</div>
    <div slot="body">
      <a-alert class="mb-2" :message="$t('compute.need_reboot_prompt')" banner />
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_247')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <template v-if="isKvm">
          <a-form-model-item :label="$t('compute.text_1155')" prop="bios">
            <a-radio-group v-model:value="form.bios">
              <a-tooltip :title="$t('compute.text_1362')" v-if="isArm">
                <a-radio-button value="BIOS" :disabled="isArm">BIOS</a-radio-button>
              </a-tooltip>
              <a-radio-button v-else value="BIOS">BIOS</a-radio-button>
              <a-radio-button value="UEFI">UEFI</a-radio-button>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.vdi_protocol')" prop="vdi">
            <a-radio-group v-model:value="form.vdi" @change="handleVdiChange">
              <a-radio-button value="vnc">VNC</a-radio-button>
              <a-radio-button value="spice">SPICE</a-radio-button>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.vga')" prop="vga">
            <a-radio-group v-model:value="form.vga">
              <a-radio-button :value="opt.value" v-for="opt in vgaOptions" :key="opt.value">{{ opt.text }}</a-radio-button>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.machine')" prop="machine">
            <a-radio-group v-model:value="form.machine">
              <a-radio-button :value="opt.value" v-for="opt in machineOptions" :key="opt.value">{{ opt.text }}</a-radio-button>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.usb_kbd')" prop="disable_usb_kbd">
            <a-switch v-model:checked="form.disable_usb_kbd" />
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_494')" :extra="$t('compute.daemon.tooltip')" v-if="canAdminUpdate">
            <a-switch v-model:checked="form.is_daemon" />
          </a-form-model-item>
        </template>
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
import { hasPermission } from '@/utils/auth'
export default {
  name: 'VmUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const data = this.params.data[0] || {}
    const isArm = data.os_arch === 'arm' || data.os_arch === 'aarch64'
    const vdi = data.vdi || 'vnc'
    return {
      loading: false,
      form: {
        bios: data.bios || (isArm ? 'UEFI' : 'BIOS'),
        vdi,
        vga: data.vga || 'std',
        machine: data.machine || (isArm ? 'virt' : 'pc'),
        disable_usb_kbd: data?.metadata?.disable_usb_kbd === 'true',
        is_daemon: !!data.is_daemon,
      },
      rules: {
        bios: [
          { required: true, message: this.$t('compute.text_1272') },
        ],
        vdi: [
          { required: true, message: this.$t('compute.prompt_vdi') },
        ],
        vga: [
          { required: true, message: this.$t('compute.prompt_vga') },
        ],
        machine: [
          { required: true, message: this.$t('compute.prompt_machine') },
        ],
      },
    }
  },
  computed: {
    isKvm () {
      return this.params.data.length >= 1 && this.params.data[0].hypervisor === 'kvm'
    },
    isArm () {
      return this.params.data.length >= 1 && (this.params.data[0].os_arch === 'arm' || this.params.data[0].os_arch === 'aarch64')
    },
    canAdminUpdate () {
      return hasPermission({ key: 'server_update', resourceData: this.params.data[0] }) && this.$store.getters.isAdminMode
    },
    vgaOptions () {
      const options = []
      if (this.form.vdi === 'vnc') {
        options.push({ text: 'Standard', value: 'std' })
      }
      options.push({ text: 'QXL', value: 'qxl' })
      return options
    },
    machineOptions () {
      if (this.isArm) {
        return [{ text: 'VIRT', value: 'virt' }]
      }
      return [
        { text: 'PC', value: 'pc' },
        { text: 'Q35', value: 'q35' },
      ]
    },
  },
  watch: {
    vgaOptions: {
      immediate: true,
      handler (opts) {
        const values = opts.map(o => o.value)
        if (!values.includes(this.form.vga) && values.length) {
          this.form.vga = values[0]
        }
      },
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        const ids = this.params.data.map(item => item.id)
        await this.params.onManager('batchUpdate', {
          id: ids,
          managerArgs: {
            data: values,
          },
        })
        const syncIds = this.params.data.filter(item => item.status === 'ready').map(item => item.id)
        if (syncIds && syncIds.length > 0) {
          await this.params.onManager('batchPerformAction', {
            id: syncIds,
            managerArgs: {
              action: 'sync',
            },
          })
        }
        if (this.isKvm) {
          await this.params.onManager('batchPerformAction', {
            id: ids,
            managerArgs: {
              action: 'set-qemu-params',
              data: {
                disable_usb_kbd: values.disable_usb_kbd,
              },
            },
          })
        }
        this.cancelDialog()
      } catch (error) {
        // validation / request error
      } finally {
        this.loading = false
      }
    },
    handleVdiChange (e) {
      this.form.vdi = e.target.value
    },
  },
}
</script>
