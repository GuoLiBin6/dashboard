<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.add_tap_flow')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.text_228')" prop="name">
          <a-input :placeholder="$t('validator.serverCreateName')" v-model:value="form.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-input :placeholder="$t('scope.text_55')" v-model:value="form.description" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.tap')">
          {{params.tapService.name}}
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.tap_direction')" prop="direction">
          <a-radio-group v-model:value="form.direction">
            <a-radio-button value="BOTH">{{ $t('compute.direction_both') }}</a-radio-button>
            <a-radio-button value="IN">{{ $t('compute.direction_in') }}</a-radio-button>
            <a-radio-button value="OUT">{{ $t('compute.direction_out') }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_175')" prop="type">
          <a-radio-group v-model:value="form.type">
            <a-radio-button value="vnic">{{ $t('compute.vnic') }}</a-radio-button>
            <a-radio-button value="vswitch">{{ $t('compute.vswitch') }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <template v-if="form.type === 'vswitch'">
          <a-form-model-item :label="$t('compute.text_111')" prop="host_id">
            <base-select
                v-model:value="form.host_id"
                class="w-100"
                remote
                resource="hosts"
                version="v1"
                needParams
                :params="hostParams"
                isDefaultSelect
                :select-props="{ placeholder: $t('compute.text_148', [$t('compute.text_111')]) }"
                @update:item="hostChange" />
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_844')" prop="wire_id">
            <base-select
                v-model:value="form.wire_id"
                class="w-100"
                :options="hostWires"
                idKey="wire_id"
                nameKey="wire"
                isDefaultSelect
                :select-props="{ placeholder: $t('compute.text_148', [$t('compute.text_844')]) }" />
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.vlan_id')" prop="vlan_id">
            <a-input-number :max="4095" :step="1" :min="0" v-model:value="form.vlan_id" />
          </a-form-model-item>
        </template>
        <template v-else>
          <a-form-model-item :label="$t('compute.text_91')" prop="guest_id">
            <base-select
                v-model:value="form.guest_id"
                class="w-100"
                remote
                resource="servers"
                version="v1"
                needParams
                :params="serverParams"
                isDefaultSelect
                :select-props="{ placeholder: $t('compute.text_148', [$t('compute.text_91')]) }"
                @update:item="serverChange" />
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.vm_mac')" prop="mac_addr">
            <base-select
                v-model:value="form.mac_addr"
                class="w-100"
                :options="vmMac"
                idKey="mac"
                nameKey="macLabel"
                isDefaultSelect
                :select-props="{ placeholder: $t('compute.text_148', [$t('compute.vm_mac')]) }" />
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
import { mapGetters } from 'vuex'
import validateForm from '@/utils/validate'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'TapFlowCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
        description: undefined,
        direction: 'BOTH',
        type: 'vnic',
        host_id: undefined,
        wire_id: undefined,
        vlan_id: undefined,
        guest_id: undefined,
        mac_addr: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_210') },
          { validator: validateForm('serverCreateName') },
        ],
        host_id: [
          { required: true, message: this.$t('compute.text_148', [this.$t('compute.text_111')]) },
        ],
        wire_id: [
          { required: true, message: this.$t('compute.text_148', [this.$t('compute.text_844')]) },
        ],
        guest_id: [
          { required: true, message: this.$t('compute.text_148', [this.$t('compute.text_91')]) },
        ],
        mac_addr: [
          { required: true, message: this.$t('compute.text_148', [this.$t('compute.vm_mac')]) },
        ],
      },
      currentHost: {},
      currentServer: {},
      formItemLayout: {
        wrapperCol: {
          span: 18,
        },
        labelCol: {
          span: 4,
        },
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'isDomainMode', 'scope']),
    hostWires () {
      const { nic_info = [] } = this.currentHost
      return nic_info.filter(item => item.wire_id)
    },
    vmMac () {
      const { nics = [] } = this.currentServer
      return nics.filter(item => item.mac).map(item => {
        return {
          ...item,
          macLabel: `${item.mac}${item.ip_addr ? ` (${item.ip_addr})` : ''}`,
        }
      })
    },
    hostParams () {
      const ret = {
        scope: this.scope,
        filter: 'hypervisor.notin(baremetal,container)',
        brand: 'OneCloud',
        limit: 20,
        system: this.isAdminMode,
      }
      const { type, target_id } = this.params.tapService
      if (type === 'host') {
        ret.filter = ['hypervisor.notin(baremetal,container)', `id.notin(${target_id})`]
      }
      return ret
    },
    serverParams () {
      const ret = {
        scope: this.scope,
        filter: 'hypervisor.notin(baremetal,container)',
        brand: 'OneCloud',
        limit: 20,
        system: this.isAdminMode,
      }
      const { type, target_id } = this.params.tapService
      if (type === 'guest') {
        ret.filter = ['hypervisor.notin(baremetal,container)', `id.notin(${target_id})`]
      }
      return ret
    },
  },
  watch: {
    'form.guest_id' (val, oldVal) {
      if (val !== oldVal) {
        this.form.mac_addr = undefined
      }
    },
    'form.host_id' (val, oldVal) {
      if (val !== oldVal && !this.hostWires.some(item => item.wire_id === this.form.wire_id)) {
        this.form.wire_id = undefined
      }
    },
  },
  created () {
    this.$m = new this.$Manager('tap_flows', 'v1')
  },
  methods: {
    hostChange (data) {
      if (this.form.type === 'vswitch') {
        this.currentHost = data
      } else {
        this.currentHost = {}
      }
    },
    serverChange (data) {
      if (this.form.type === 'vnic') {
        this.currentServer = data
      } else {
        this.currentServer = {}
      }
    },
    doCreate (data) {
      return this.$m.create({
        data,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        values.tap_id = this.params.tapService.id
        await this.doCreate(values)
        this.$bus.$emit('tap-service-refresh')
        this.params.success && this.params.success()
        this.cancelDialog()
      } catch (error) {
        // validation / request error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
