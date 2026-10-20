<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.server.quick.recovery')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.server.quick.recovery')" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <!-- 自动启动 -->
        <a-form-model-item :label="$t('compute.text_494')" v-if="isSingle && firstData.status === 'ready'" :extra="$t('compute.text_1263')" prop="auto_start">
          <a-switch
            v-model:checked="form.auto_start"
            :checkedChildren="$t('compute.text_115')"
            :unCheckedChildren="$t('compute.text_116')" />
        </a-form-model-item>
        <a-form-model-item
          :label="$t('compute.text_111')"
          :validate-status="message ? 'warning' : hostValidateStatus"
          :help="message || hostValidateMsg"
          prop="host">
          <list-select
            v-model:value="form.host"
            :list-props="resourceProps"
            :formatter="v => v.name"
            :multiple="false"
            :placeholder="$t('compute.text_314')"
            :dialog-params="{ title: $t('compute.text_111'), width: 1060 }"
            @change="hostChangeHandle" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading" :disabled="handleConfirmDisabled">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import ListSelect from '@/sections/ListSelect'
import ResourceProps from '../mixins/resourceProps'

export default {
  name: 'VmQuickRecoveryDialog',
  components: {
    ListSelect,
  },
  mixins: [DialogMixin, WindowsMixin, ResourceProps],
  data () {
    return {
      loading: false,
      form: {
        host: undefined,
        auto_start: true,
      },
      forcastData: null,
      hosts: [],
      message: '',
      rules: {
        host: [
          { required: false, message: this.$t('compute.text_314'), trigger: 'change' },
        ],
      },
    }
  },
  computed: {
    ...mapGetters(['scope', 'isAdminMode']),
    firstData () {
      return this.params.data[0]
    },
    isSingle () {
      return this.params.data.length === 1
    },
    hostsParams () {
      let hostType = 'hypervisor'
      const hostIds = this.forcastData?.filtered_candidates?.map(v => v.id) || []

      if (this.firstData.hypervisor !== 'kvm') {
        hostType = this.firstData.hypervisor
      }
      const ret = {
        scope: this.scope,
        host_type: hostType,
        limit: 10,
        enabled: 1,
        host_status: 'online',
        server_id_for_network: this.firstData.id,
        os_arch: this.firstData.os_arch,
      }
      if (this.isAdminMode && this.isSingle) {
        ret.project_domain = this.params.data[0].domain_id
      }
      if (hostIds && hostIds.length > 0) {
        ret.filter = `id.notin(${hostIds.join(',')})`
      }
      return ret
    },
    hostsOptions () {
      const hostIds = this.forcastData?.filtered_candidates?.map(v => v.id) || []
      if (this.forcastData?.can_create === false) {
        return []
      }
      return this.hosts.filter(v => {
        return !hostIds.includes(v.id) && v.id !== this.firstData.host_id
      }).map(v => {
        return {
          key: v.id,
          label: v.name,
        }
      })
    },
    hostValidateStatus () {
      if (this.forcastData && this.hostsOptions?.length === 0) {
        return 'error'
      }
      return 'success'
    },
    hostValidateMsg () {
      if (this.forcastData && this.hostsOptions?.length === 0) {
        return this.$t('compute.transfer_host')
      }
      return this.$t('compute.text_1384')
    },
    handleConfirmDisabled () {
      return this.forcastData && this.hostsOptions?.length === 0
    },
    columns () {
      const fields = ['name', 'status', 'host']
      return this.params.columns.filter(item => {
        const { field } = item
        return fields.indexOf(field) > -1
      })
    },
  },
  created () {
    this.isSingle && this.queryForcastData()
    this.queryHosts()
  },
  methods: {
    doSingleTransfer () {
      const data = {
        prefer_host: this.form.host,
        rescue_mode: true,
      }
      if (this.firstData.status === 'ready') {
        data.auto_start = this.form.auto_start
      }
      return this.params.onManager('performAction', {
        id: this.firstData.id,
        steadyStatus: ['running', 'ready'],
        managerArgs: {
          action: 'migrate',
          data,
        },
      })
    },
    doBatchTransfer (ids) {
      const data = {
        guest_ids: ids,
        prefer_host: this.form.host,
        rescue_mode: true,
      }
      return this.params.onManager('performClassAction', {
        id: ids,
        steadyStatus: ['running', 'ready'],
        managerArgs: {
          action: 'batch-migrate',
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const ids = this.params.data.map(item => item.id)
        if (this.isSingle) {
          await this.doSingleTransfer()
        } else {
          await this.doBatchTransfer(ids)
        }
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
    doForecast (prefer_host_id) {
      const manager = new this.$Manager('servers')
      const params = {
        live_migrate: false,
        is_rescue_mode: true,
      }
      if (prefer_host_id) {
        params.prefer_host_id = prefer_host_id
      }
      return manager.performAction({
        id: this.params.data[0].id,
        action: 'migrate-forecast',
        data: params,
      })
    },
    queryForcastData (prefer_host_id) {
      this.doForecast(prefer_host_id).then((res) => {
        this.forcastData = res.data
      }).catch((err) => {
        console.log(err)
        throw err
      })
    },
    queryHosts () {
      const hostsManager = new this.$Manager('hosts')
      hostsManager.list({ params: this.hostsParams }).then((res) => {
        this.hosts = res.data.data || []
      }).catch((err) => {
        console.log(err)
        throw err
      })
    },
    hostChangeHandle (hostId) {
      const hostArr = this.params.data.filter(v => v.host_id === hostId)
      if (hostArr.length > 0) {
        this.message = this.$t('compute.transfer_mutiple_dialog_alert', [hostArr.length])
      } else {
        this.message = ''
      }
    },
  },
}
</script>
