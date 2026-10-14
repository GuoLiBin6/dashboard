<template>
  <base-dialog @cancel="cancelDialog" :width="1300">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <!-- <a-alert class="mb-2" type="warning" :message="message" /> -->
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_199')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model :model="form.fd">
        <network-config
          ref="networkConfigRef"
          :form="form"
          :model="form.fd"
          :count="params.total"
          field-map-preset="setNetwork"
          :networkParams="networkParams"
          :limit="networkLimit"
          :networkLimit="networkLimit"
          :vpcParams="vpcParams"
          :vpcResource="vpcResource"
          :vpcObj="vpcObj"
          :is-dialog="true"
          :showMacConfig="isKvm"
          :showDeviceConfig="isKvm"
          :showSecgroupConfig="isKvm" />
        <a-form-model-item>
          <a-checkbox v-model:checked="form.fd.syncConfigImmediately">
            {{ $t('compute.nics.sync_config_immediately') }}
          </a-checkbox>
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
import * as R from 'ramda'
import NetworkConfig from '@Compute/sections/ServerNetwork/NetworkConfig'
import { getIpv6Start } from '@Compute/utils/createServer'
import { HYPERVISORS_MAP, EXTRA_HYPERVISORS } from '@/constants'
import expectStatus from '@/constants/expectStatus'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
const hypervisorMap = Object.assign({}, HYPERVISORS_MAP, EXTRA_HYPERVISORS)

export default {
  name: 'VmSetNetworkDialog',
  components: {
    NetworkConfig,
  },
  mixins: [DialogMixin, WindowsMixin],
  provide () {
    return {
      form: this.form,
    }
  },
  data () {
    return {
      loading: false,
      form: {
        fd: {
          syncConfigImmediately: true,
        },
        fi: {
          capability: {}, // 可用区下的可用资源
          networkList: [],
        },
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
      secgroupsInitLoaded: false,
      bindedSecgroups: [],
      bindedSecgroupsLoaded: false,
      vpcObj: {
        id: this.params.data[0].vpc_id,
        name: this.params.data[0].vpc,
      },
    }
  },
  computed: {
    networkParams () {
      const { data } = this.params
      const resItem = data && data.length > 0 ? data[0] : {}
      const params = {
        filter: 'server_type.notin(ipmi, pxe, eip)',
        usable: true,
        cloudregion: resItem.cloudregion_id,
        zone: resItem.zone_id,
        // host: resItem.host,
        scope: this.$store.getters.scope,
        host_type: 'hypervisor',
      }
      if ([HYPERVISORS_MAP.esxi.key].includes(resItem.hypervisor)) {
        params.host_type = 'esxi'
      }
      return params
    },
    networkLimit () {
      return 8 - (this.params.total || 0)
    },
    vpcParams () {
      const scopeParams = {}
      if (this.$store.getters.isAdminMode) {
        scopeParams.project_domain = this.params.data[0].domain_id
      } else {
        scopeParams.scope = this.$store.getters.scope
      }
      const params = {
        usable: true,
        limit: 0,
        show_emulated: true,
        ...scopeParams,
      }
      return params
    },
    vpcResource () {
      return `cloudregions/${this.params.data[0].cloudregion_id}/vpcs`
    },
    curResData () {
      return this.params.data[0]
    },
    isKvm () {
      return this.curResData.hypervisor === hypervisorMap.kvm.key
    },
  },
  created () {
    this.fetchCapability()
  },
  methods: {
    fetchCapability () {
      const params = {
        show_emulated: true,
        resource_type: 'shared',
      }
      let id = this.curResData.cloudregion
      let resource = 'cloudregions'
      if (this.curResData.zone) {
        id = this.curResData.zone
        resource = 'zones'
      }
      const capabilityParams = { id, spec: 'capability', params }
      if (!id) return
      if (R.equals(this.capabilityParams, capabilityParams)) return // 和已有的参数一样则不发请求
      this.capabilityParams = capabilityParams
      new this.$Manager(resource).getSpecific(this.capabilityParams)
        .then(({ data }) => {
          this.form.fi.capability = {
            ...data,
          }
        })
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (typeof this.$refs.networkConfigRef?.validate === 'function') {
          await this.$refs.networkConfigRef.validate()
        }
        const nets = []
        const {
          networks,
          networkIps,
          networkMacs,
          networkIPv6s,
          networkDevices,
          networkIpsAddress6,
          networkIPv6Modes,
          networkSecgroups,
        } = this.form.fd
        if (!networks || R.isEmpty(networks)) {
          this.cancelDialog()
          return false
        }
        for (const key in networks) {
          const o = {
            network: networks[key],
          }
          if (networkIps && networkIps[key]) {
            o.address = networkIps[key]
          }
          if (networkMacs && networkMacs[key]) {
            o.mac = networkMacs[key]
          }
          if (networkIPv6s && networkIPv6s[key]) {
            o.require_ipv6 = true
          }
          const target = (this.form.fi.networkList || []).filter(item => item.key === key)
          if (networkIpsAddress6 && networkIpsAddress6[key]) {
            const ipv6Last = networkIpsAddress6[key]
            const ipv6First = getIpv6Start(target[0]?.network?.guest_ip6_start)
            o.address6 = ipv6First + ipv6Last
          }
          if (o.require_ipv6) {
            if (networkIPv6Modes && networkIPv6Modes[key] === 'only') {
              o.strict_ipv6 = true
            }
          }
          if (!target[0]?.network?.guest_ip_start && !target[0]?.network?.guest_ip_end && target[0]?.network?.guest_ip6_start) {
            o.strict_ipv6 = true
          }
          if (networkDevices && networkDevices[key]) {
            o.sriov_device = {
              model: networkDevices[key],
            }
          }
          if (networkSecgroups && networkSecgroups[key]) {
            o.secgroups = networkSecgroups[key]
          }
          nets.push(o)
        }
        const manager = new this.$Manager('servers')
        await manager.performAction({
          id: this.params.data[0].id,
          action: 'attachnetwork',
          data: {
            disable_sync_config: !this.form.fd.syncConfigImmediately,
            nets,
          },
        })
        this.params.refresh()
        this.$bus.$emit('VMInstanceListSingleRefresh', [this.params.resId, Object.values(expectStatus.server).flat()])
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="less" scoped>
/deep/ .network-item {
  width: 260px;
}
</style>
