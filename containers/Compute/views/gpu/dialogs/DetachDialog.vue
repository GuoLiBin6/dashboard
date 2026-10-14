<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :name="params.name || $t('dictionary.server')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item :label="$t('compute.force_detach')" v-if="isGuestHasUnknown || isGuestHasReady" v-bind="formItemLayout" prop="is_force">
          <a-tooltip v-if="isGuestHasUnknown" :title="$t('compute.force_detach_tooltip')">
            <a-switch v-model:checked="form.is_force" :checkedChildren="$t('compute.text_115')" disabled :unCheckedChildren="$t('compute.text_116')" />
          </a-tooltip>
          <a-switch v-else v-model:checked="form.is_force" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" @change="onForceChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_494')" v-if="isShowAutoStart" v-bind="formItemLayout" :extra="$t('compute.text_495')" prop="autoStart">
          <a-switch v-model:checked="form.autoStart" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" :disabled="isForceChecked" />
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
  name: 'DetachGpuDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      isForceChecked: this.params.data.some(o => o.guest_status === 'unknown'),
      autoStartSnapshot: null,
      form: {
        autoStart: true,
        is_force: this.params.data.some(o => o.guest_status === 'unknown'),
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  computed: {
    isShowAutoStart () {
      return !this.params.data.every(o => o.guest_status === 'running')
    },
    isGuestHasUnknown () {
      return this.params.data.some(o => o.guest_status === 'unknown')
    },
    isGuestHasReady () {
      return this.params.data.some(o => o.guest_status === 'ready')
    },
  },
  mounted () {
    if (this.isForceChecked) {
      this.form.autoStart = false
    }
  },
  methods: {
    onForceChange (checked) {
      if (checked) {
        this.autoStartSnapshot = this.form.autoStart
        this.form.autoStart = false
      } else {
        this.form.autoStart = this.autoStartSnapshot ?? true
        this.autoStartSnapshot = null
      }
      this.isForceChecked = checked
    },
    async fetchGuestIsolatedDeviceIndexs (bind) {
      const guestId = bind.server_id
      const deviceId = bind.gpu_ids.length
      if (!guestId || !deviceId) return undefined
      try {
        const res = await new this.$Manager('guestisolateddevices').list({
          params: {
            limit: 0,
            guest_id: guestId,
            scope: this.$store.getters.scope,
          },
        })
        const record = (res.data.data || []).filter(item => bind.gpu_ids.includes(item.id) || bind.gpu_ids.includes(item.isolated_device_id))
        return record.map(item => {
          return {
            device: item.id || item.isolated_device_id,
            index: item.index,
          }
        })
      } catch (e) {
        // ignore
      }
      return undefined
    },
    async doUpdate (bind) {
      const data = {
        auto_start: this.isShowAutoStart ? this.form.autoStart : false,
      }
      if (this.form.is_force) {
        data.is_force = true
      }
      const index = await this.fetchGuestIsolatedDeviceIndexs(bind)
      if (index !== undefined) {
        data.devices = index
      }
      return new this.$Manager('servers').performAction({
        id: bind.server_id,
        action: 'detach-isolated-device',
        data,
      })
    },
    async handleConfirm () {
      try {
        this.loading = true
        await this.$refs.formRef.validate()
        if (this.params.binds) {
          for (let i = 0; i < this.params.binds.length; i++) {
            await this.doUpdate(this.params.binds[i])
          }
        }
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
