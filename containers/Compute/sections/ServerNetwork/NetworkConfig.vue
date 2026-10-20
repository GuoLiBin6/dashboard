<template>
  <div class="network-config">
    <div
      class="network-config-row"
      v-for="(item, i) in networkList"
      :key="item.key">
      <div class="network-config-row__top d-flex align-items-start">
        <a-tag class="network-nic-tag">{{ isBonding ? 'bond' : $t('compute.text_193')}}{{i + count}}</a-tag>
        <a-form-item
          v-show="showVpc"
          class="mb-0 network-vpc-item">
          <oc-select
            v-if="i === 0"
            :value="fieldVal(networkFieldMap.vpcs(item.key))"
            show-status
            show-group
            :status-desc="$t('compute.vpc_status_desc')"
            :resource="vpcResource"
            :formatter="vpcFormatter"
            :params="vpcParams"
            :mapper="vpcResourceMapper"
            :sort="(arr) => arr.sort((a, b) => a.network_count > b.network_count ? -1 : 1)"
            :placeholder="$t('compute.text_194')"
            @selectChange="(curObjArr) => { fieldSet(networkFieldMap.vpcs(item.key), curObjArr?.[0]?.id); vpcSelectChange(curObjArr, i, item) }"
            @fetchSuccess="(data) => fetchVpcSuccessHandle(data, item)" />
          <a-tag v-else class="network-vpc-tag">{{ getVpcTag(networkList[0].vpc) }}</a-tag>
        </a-form-item>
        <a-form-item
          :style="isDialog ? { flex: 1 } : ''"
          class="mb-0 network-item">
          <base-select
            class="w-100"
            :value="fieldVal(networkFieldMap.networks(item.key))"
            @change="v => { fieldSet(networkFieldMap.networks(item.key), v); networkChange(v, item, i) }"
            resource="networks"
            remote
            show-sync
            v-model:item="item.network"
            :isDefaultSelect="canDefaultSelect && i === 0"
            :need-params="true"
            :params="{ ...networkParamsC, $t: item.key }"
            :mapper="networkResourceMapper"
            :remote-fn="q => ({ search: q })"
            :beforeDefaultSelectCallBack="beforeDefaultSelectCallBack"
            @update:resList="list => resolveNetworkFromFetchedList(list, item)"
            :select-props="{ allowClear: true, placeholder: $t('compute.text_195') }"
            :min-width="isDialog ? '200px' : '500px'" />
          <template v-if="i === 0" #extra>
            {{$t('compute.text_196')}}<help-link href="/network">{{$t('compute.perform_create')}}</help-link>
          </template>
        </a-form-item>
        <!-- 贴着子网内容，不靠右拉开 -->
        <div class="network-config-aside">
          <a-button type="link" size="small" @click="toggleAdvanced">
            {{ showAdvanced ? $t('compute.hide_advanced') : $t('compute.advanced') }}
          </a-button>
          <span v-if="i !== 0" class="network-row-remove-wrap">
            <a-button shape="circle" icon="minus" size="small" @click="decrease(item.key, i)" />
          </span>
        </div>
      </div>

      <!-- 与磁盘高级区一致：展开后 checkbox 开关，勾选后再出表单项 -->
      <div v-if="showAdvanced" class="network-advanced-panel">
        <div class="network-advanced-panel__toggles">
          <template v-if="canShowIpConfig(item)">
            <a-tooltip :title="ipBtnTooltip || undefined">
              <span class="network-advanced-panel__toggle">
                <a-checkbox
                  :checked="item.ipShow"
                  :disabled="ipsDisabled"
                  @change="() => triggerShowIp(item)">
                  {{ $t('compute.text_198') }}
                </a-checkbox>
              </span>
            </a-tooltip>
          </template>
          <template v-if="showMacConfig">
            <a-tooltip :title="ipBtnTooltip || undefined">
              <span class="network-advanced-panel__toggle">
                <a-checkbox
                  :checked="item.macShow"
                  :disabled="ipsDisabled"
                  @change="() => triggerShowMac(item)">
                  {{ $t('compute.mac_config') }}
                </a-checkbox>
              </span>
            </a-tooltip>
          </template>
          <template v-if="showDeviceConfig">
            <span class="network-advanced-panel__toggle">
              <a-checkbox
                :checked="item.deviceShow"
                @change="() => triggerShowDevice(item)">
                {{ $t('compute.config_transparent_net') }}
              </a-checkbox>
            </span>
          </template>
          <template v-if="showSecgroupConfig">
            <span class="network-advanced-panel__toggle">
              <a-checkbox
                :checked="item.secgroupShow"
                @change="() => triggerShowSecgroup(item)">
                {{ $t('compute.config_secgroup') }}
              </a-checkbox>
            </span>
          </template>
          <template v-if="canShowIpv6Require(item)">
            <span class="network-advanced-panel__toggle network-advanced-panel__toggle--ipv6">
              <a-checkbox
                :checked="fieldVal(networkFieldMap.ipv6s(item.key, item.network))"
                @change="(e) => { fieldSet(networkFieldMap.ipv6s(item.key, item.network), e.target.checked); triggerRequireIpv6(item, e) }" />
              <a-dropdown :trigger="['click']">
                <a class="ant-dropdown-link network-ipv6-dropdown-link" @click.prevent>
                  {{ item.ipv6Mode === 'only' ? $t('compute.server_create.require_ipv6_only') : $t('compute.server_create.require_ipv6_all') }}
                  <icon type="pull-down" />
                </a>
                <template #overlay>
                  <a-menu @click="(e) => triggerIpv6Mode(item, e, i)">
                    <a-menu-item key="all">{{ $t('compute.server_create.require_ipv6_all') }}</a-menu-item>
                    <a-menu-item key="only">{{ $t('compute.server_create.require_ipv6_only') }}</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
              <a-input type="hidden" :value="fieldVal(networkFieldMap.ipv6_mode(item.key, item.network))" />
            </span>
          </template>
          <template v-if="canShowIpv6Address(item)">
            <span class="network-advanced-panel__toggle">
              <a-checkbox
                :checked="item.ipv6Show"
                @change="() => triggerShowIpv6(item)">
                {{ $t('compute.ipv6_config') }}
              </a-checkbox>
            </span>
          </template>
          <template v-if="showPortMapping">
            <span class="network-advanced-panel__toggle">
              <a-checkbox
                :checked="item.portMappingShow"
                @change="() => triggerShowPortMapping(item)">
                {{ $t('compute.port_mappings.set') }}
              </a-checkbox>
            </span>
          </template>
        </div>

        <div v-if="hasExpandedBasicFields(item)" class="network-advanced-panel__fields">
          <div v-if="canShowIpConfig(item) && item.ipShow" class="network-advanced-panel__field">
            <div class="network-advanced-panel__field-label">IP</div>
            <a-form-item class="mb-0">
              <ip-select
                :value="fieldVal(networkFieldMap.ips(item.key, item.network))"
                :network="item.network"
                @change="e => { fieldSet(networkFieldMap.ips(item.key, item.network), e); ipChange(e, i) }" />
            </a-form-item>
          </div>
          <div v-if="showMacConfig && item.macShow" class="network-advanced-panel__field">
            <div class="network-advanced-panel__field-label">{{ $t('compute.text_385') }}</div>
            <a-form-item class="mb-0">
              <a-input
                class="network-advanced-panel__control"
                :placeholder="$t('compute.text_806')"
                :value="fieldVal(networkFieldMap.macs(item.key, item.network))"
                @change="e => { fieldSet(networkFieldMap.macs(item.key, item.network), e.target.value); macChange(e, i) }" />
            </a-form-item>
          </div>
          <div v-if="showDeviceConfig && item.deviceShow" class="network-advanced-panel__field">
            <div class="network-advanced-panel__field-label">{{ $t('compute.text_113') }}</div>
            <a-form-item class="mb-0">
              <oc-select
                class="network-advanced-panel__control"
                :value="fieldVal(networkFieldMap.devices(item.key))"
                @change="v => fieldSet(networkFieldMap.devices(item.key), v)"
                :data="gpuOptions"
                :placeholder="$t('compute.sriov_device_tips')" />
            </a-form-item>
          </div>
          <div v-if="showSecgroupConfig && item.secgroupShow" class="network-advanced-panel__field network-advanced-panel__field--wide">
            <div class="network-advanced-panel__field-label">{{ $t('compute.text_105') }}</div>
            <a-form-item class="mb-0">
              <base-select
                :value="fieldVal(networkFieldMap.secgroups(item.key))"
                @change="v => fieldSet(networkFieldMap.secgroups(item.key), v)"
                resource="secgroups"
                :params="secgroupParams"
                :select-props="{ allowClear: true, placeholder: $t('compute.secgroup_tips'), mode: 'multiple' }" />
            </a-form-item>
          </div>
          <div v-if="canShowIpv6Address(item) && item.ipv6Show" class="network-advanced-panel__field network-advanced-panel__field--ipv6">
            <div class="network-advanced-panel__field-label">{{ $t('compute.ipv6_config') }}</div>
            <a-form-item class="mb-0 network-ipv6-address-item">
              <div class="network-ipv6-address">
                <span class="network-ipv6-prefix">{{ getIpv6Prefix(item.network?.guest_ip6_start) }}</span>
                <a-form-item class="mb-0 network-ipv6-input-item">
                  <a-input
                    class="network-advanced-panel__control"
                    :placeholder="$t('compute.complete_ipv6_address')"
                    :value="fieldVal(networkFieldMap.ips6(item.key, item.network))"
                    @change="e => { fieldSet(networkFieldMap.ips6(item.key, item.network), e.target.value); ipv6Change(e, i) }" />
                </a-form-item>
              </div>
            </a-form-item>
          </div>
        </div>

        <!-- 端口映射始终独占一行；条目与「添加」可同行排列 -->
        <div v-if="showPortMapping && item.portMappingShow" class="network-advanced-panel__port">
          <div class="network-advanced-panel__field-label">{{ $t('compute.port_mappings.title') }}</div>
          <div class="network-port-mapping">
            <labels
              class="network-port-mapping__labels"
              :ref="'portMappingRef_' + item.key"
              :model="model"
              :fields="getPortMappingFields(item.key)"
              :init-pairs="item.port_mappings || []"
              :title="$t('compute.repo.port_mapping')"
              :keyLabel="$t('compute.repo.container_port')"
              :valueLabel="$t('compute.repo.host_port')"
              :keyPlaceholder="$t('compute.repo.example', ['443'])"
              :valuePlaceholder="$t('compute.repo.example', ['443'])"
              :valueTooltip="$t('compute.port_mappings.host_port_tip', [20000, 25000])"
              show-protocol
              @label-change="list => onPortMappingLabelChange(item, list)" />
          </div>
        </div>
      </div>
    </div>
    <div class="d-flex align-items-center" v-if="networkCountRemaining > 0">
      <a-button type="primary" shape="circle" icon="plus" size="small" @click="add" />
      <a-button type="link" @click="add">{{$t('compute.text_199')}}</a-button>
      <span class="network-count-tips">{{$t('compute.text_130')}}<span class="remain-num">{{ networkCountRemaining }}</span>{{$t('compute.text_200')}}</span>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import ipaddr from 'ipaddr.js'
import Labels from '@Compute/sections/Labels'
import { buildNetworkPortMappingFields } from '@Compute/sections/Labels/fields'
import { uuid } from '@/utils/utils'
import { checkIpInSegment, checkIpV6 } from '@Compute/utils/createServer'
import validateForm from '@/utils/validate'
import { buildSetNetworkDialogFieldMap, resolveNetworkConfigFieldMap } from './fields'
import IpSelect from './IpSelect.vue'
import nicModelMixin, { parseNicFieldName } from './nicModelMixin'

const NIC_MAP_ROOTS = [
  'vpcs', 'networks', 'networkIps', 'networkMacs', 'networkIPv6s',
  'networkIPv6Modes', 'networkIpsAddress6', 'networkDevices',
  'networkSecgroups', 'networkExits', 'networkContainerPorts',
  'networkHostPorts', 'networkPortProtocols',
]

export default {
  name: 'NetworkConfig',
  components: {
    IpSelect,
    Labels,
  },
  mixins: [nicModelMixin],
  props: {
    count: {
      type: Number,
      default: () => 0,
    },
    networkParams: {
      type: Object,
      required: true,
    },
    limit: {
      type: Number,
      default: 8, // 默认支持最多 8 个ip子网
    },
    form: {
      type: Object,
      required: true,
    },
    /** a-form-model end-state：嵌套 maps 写在 form.fd（model）上 */
    model: {
      type: Object,
      default: null,
    },
    fieldMapPreset: {
      type: String,
      default: '',
    },
    isBonding: {
      type: Boolean,
      default: false,
    },
    networkResourceMapper: {
      type: Function,
      default: (data) => { return data },
    },
    vpcParams: {
      type: Object,
      required: true,
    },
    vpcResource: {
      type: String,
      default: 'vpcs', // 还可能是这样的resource cloudregions/{region_id}/vpcs
    },
    vpcResourceMapper: {
      type: Function,
      default: data => { return data },
    },
    vpcObj: {
      type: Object,
      validator: val => val.id && val.name,
    },
    ipsDisable: {
      type: Boolean,
      default: false,
    },
    showVpc: {
      type: Boolean,
      default: true,
    },
    isDialog: {
      type: Boolean,
    },
    showMacConfig: {
      type: Boolean,
      default: false,
    },
    showDeviceConfig: {
      type: Boolean,
      default: false,
    },
    showSecgroupConfig: {
      type: Boolean,
      default: false,
    },
    showPortMapping: {
      type: Boolean,
      default: false,
    },
    secgroupParams: {
      type: Object,
      default: () => ({}),
    },
    hiddenAdd: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      networkList: [],
      ipsDisabled: this.ipsDisable,
      networkLoading: false,
      networkOpts: [],
      showAdvanced: false,
      canDefaultSelect: true,
    }
  },
  computed: {
    networkFieldMap () {
      if (this.fieldMapPreset === 'setNetwork') return buildSetNetworkDialogFieldMap(this)
      return resolveNetworkConfigFieldMap()
    },
    networkCountRemaining () {
      if (this.hiddenAdd) return 0
      return this.limit - this.networkList.length
    },
    networkParamsC () {
      if (!this.networkList[0]?.vpc?.id) return {}
      return {
        limit: 20,
        ...this.networkParams,
        vpc: this.networkList[0].vpc.id,
      }
    },
    ipBtnTooltip () {
      return this.ipsDisabled ? this.$t('common_718') : null
    },
    gpuOptions () {
      const specs = this.form.fi.capability.specs || {}
      const data = specs.isolated_devices || {}
      const ret = []
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const item = data[key]
          if (item.dev_type.startsWith('NIC')) {
            ret.push({
              ...item,
              key: `${item.model}`,
              label: `${item.model}`,
            })
          }
        }
      }
      return ret
    },
  },
  watch: {
    vpcObj (val) {
      if (val && val.id && val.name) {
        this.networkList[0].vpc = val
        this.fieldSet(this.networkFieldMap.vpcs(this.networkList[0].key), this.vpcObj.id)
      }
    },
    networkList (val) {
      this.form.fi.networkList = val
    },
  },
  created () {
    NIC_MAP_ROOTS.forEach(root => this.ensureMap(root))
    this.add()
  },
  methods: {

    fieldVal (fieldTuple) {
      return this.nicFieldVal(fieldTuple)
    },
    fieldSet (fieldTuple, value) {
      this.nicFieldSet(fieldTuple, value)
    },
    readField (name) {
      if (!name) return undefined
      const parsed = parseNicFieldName(name)
      if (parsed?.key) return this.nicField(parsed.root, parsed.key)
      return this.model[name]
    },
    writeFields (vals) {
      this.nicWriteFields(vals)
    },
    clearNicMapsForKey (key) {
      if (!key) return
      NIC_MAP_ROOTS.forEach((root) => {
        if (this.model[root] && Object.prototype.hasOwnProperty.call(this.model[root], key)) {
          this.$delete(this.model[root], key)
        }
      })
    },
    toggleAdvanced () {
      this.showAdvanced = !this.showAdvanced
      this.$emit('advancedChange', this.showAdvanced)
    },
    async validate () {
      for (let i = 0; i < this.networkList.length; i++) {
        const item = this.networkList[i]
        const key = item.key
        if (this.showVpc) {
          const vpc = this.nicField('vpcs', key)
          if (!vpc) throw new Error(this.$t('compute.text_194'))
        }
        const networkId = this.nicField('networks', key)
        if (!networkId) throw new Error(this.$t('compute.text_217'))
        const networkData = item.network || {}
        if (item.ipShow) {
          const ip = this.nicField('networkIps', key)
          await this.runFieldRule({ required: true, message: this.$t('compute.text_218') }, ip)
          await this.runFieldRule({ validator: validateForm('IPv4') }, ip)
          await this.runFieldRule({ validator: checkIpInSegment(i, networkData) }, ip)
        }
        if (item.macShow) {
          const mac = this.nicField('networkMacs', key)
          await this.runFieldRule({ required: true, message: this.$t('compute.text_806') }, mac)
          await this.runFieldRule({ validator: validateForm('mac') }, mac)
        }
        if (item.ipv6Show) {
          const ipv6 = this.nicField('networkIpsAddress6', key)
          await this.runFieldRule({ required: true, message: this.$t('compute.complete_ipv6_address') }, ipv6)
          await this.runFieldRule({ validator: checkIpV6(i, networkData) }, ipv6)
        }
        if (item.deviceShow) {
          const device = this.nicField('networkDevices', key)
          await this.runFieldRule({ required: true, message: this.$t('compute.sriov_device_tips') }, device)
        }
        if (item.secgroupShow) {
          const secgroups = this.nicField('networkSecgroups', key)
          await this.runFieldRule({ required: true, message: this.$t('compute.secgroup_tips') }, secgroups)
        }
        if (this.showPortMapping && item.portMappingShow) {
          const ref = this.$refs[`portMappingRef_${key}`]
          const labelRef = Array.isArray(ref) ? ref[0] : ref
          if (labelRef?.validate) await labelRef.validate()
        }
      }
      return true
    },
    getPortMappingFields (netKey) {
      return buildNetworkPortMappingFields(netKey)
    },

    initData (data) {
      this.canDefaultSelect = false
      this.networkList = data.map(item => {
        // 工单/草稿都可能是 string id，或 { id } / 仅有 network_id
        const networkId = typeof item.network === 'object'
          ? (item.network && (item.network.id || item.network.key))
          : (item.network || item.network_id)
        const vpcId = typeof item.vpc === 'object'
          ? (item.vpc && (item.vpc.id || item.vpc.key))
          : item.vpc
        const obj = {
          ...item,
          key: uuid(),
          // 不预填 network id，避免 BaseSelect / 表单回填无效 id；偏好仅存 _draft*
          network: {},
          _draftNetworkId: networkId || '',
          _draftVpcId: vpcId || '',
          vpc: { id: vpcId },
          ipShow: !!item.address,
          ipv6Show: false,
          requireIpv6: false,
          ipv6Mode: 'all',
          macShow: false,
          deviceShow: false,
          secgroupShow: false,
          portMappingShow: false,
          port_mappings: [],
          ip: item.address,
        }
        if (item.address) {
          obj.ipShow = true
          this.showAdvanced = true
        }
        if (item.mac) {
          obj.macShow = true
          this.showAdvanced = true
        }
        if (item.require_ipv6) {
          obj.requireIpv6 = true
          obj.ipv6Mode = 'all'
          this.showAdvanced = true
        }
        if (item.strict_ipv6 && item.require_ipv6) {
          obj.ipv6Mode = 'only'
        }
        if (item.address6) {
          obj.ipv6Show = true
          this.showAdvanced = true
        }
        if (item.sriov_device && item.sriov_device.model) {
          obj.deviceShow = true
          this.showAdvanced = true
        }
        if (item.secgroups && item.secgroups.length > 0) {
          obj.secgroupShow = true
          this.showAdvanced = true
        }
        if (this.showPortMapping && Array.isArray(item.port_mappings) && item.port_mappings.length > 0) {
          obj.portMappingShow = true
          obj.port_mappings = item.port_mappings
          this.showAdvanced = true
        }
        return obj
      })
      // 多网卡共用第一块 VPC：补齐后续项 vpc，保证 networkParamsC 能拉子网列表
      const firstVpc = this.networkList[0] && this.networkList[0].vpc
      if (firstVpc && firstVpc.id) {
        this.networkList.forEach((item, idx) => {
          if (idx > 0 && (!item.vpc || !item.vpc.id)) {
            item.vpc = { ...firstVpc }
          }
        })
      }
      const applyAllNetworkFields = () => {
        if (!this.model || !this.networkList.length) return
        const first = this.networkList[0]
        if (first.vpc && first.vpc.id) {
          this.writeFields({
            [this.networkFieldMap.vpcs(first.key)[0]]: first.vpc.id,
          })
        }
        this.networkList.forEach((item) => {
          const value = {}
          // 子网：仅写已在列表中 resolve 且可用的 id，禁止盲种草稿无效 id
          const netId = item.network && item.network.id
          if (netId && this.isNetworkAvailable(item.network)) {
            value[this.networkFieldMap.networks(item.key)[0]] = netId
          }
          const netKeyForFields = (netId && this.isNetworkAvailable(item.network)) ? netId : null
          if (item.address && netKeyForFields) {
            value[this.networkFieldMap.ips(item.key, netKeyForFields)[0]] = item.address
          }
          if (item.mac && netKeyForFields) {
            value[this.networkFieldMap.macs(item.key, netKeyForFields)[0]] = item.mac
          }
          if (netKeyForFields) {
            value[this.networkFieldMap.ipv6s(item.key, netKeyForFields)[0]] = item.requireIpv6
            value[this.networkFieldMap.ipv6_mode(item.key, netKeyForFields)[0]] = item.ipv6Mode
          }
          if (item.address6 && netKeyForFields) {
            value[this.networkFieldMap.ips6(item.key, netKeyForFields)[0]] = item.address6.replace(this.getIpv6Prefix(item.address6), '')
          }
          if (item.sriov_device && item.sriov_device.model) {
            value[this.networkFieldMap.devices(item.key)[0]] = item.sriov_device.model
          }
          if (item.secgroups && item.secgroups.length > 0) {
            value[this.networkFieldMap.secgroups(item.key)[0]] = item.secgroups
          }
          this.writeFields(value)
        })
      }
      this.$nextTick(() => {
        applyAllNetworkFields()
        // 子网列表异步拉取后再次写入，避免最后一块网卡装饰器尚未挂上 / options 未就绪
        setTimeout(applyAllNetworkFields, 1500)
        setTimeout(applyAllNetworkFields, 3000)
        setTimeout(applyAllNetworkFields, 5000)
      })
    },
    getVpcTag (data) {
      if (!data.cidr_block) return data.name
      return `${data.name}（${data.cidr_block}）`
    },
    vpcLabelFormat (item) {
      if (!item.cidr_block) return item.name
      return `${item.name}（${item.account ? item.account + ', ' : ''}${item.cidr_block}）`
    },
    vpcFormatter (v) {
      return { key: v.id, label: this.vpcLabelFormat(v), disabled: v.network_count === 0, ...v }
    },
    networkFormatter (v) {
      let addrLabel = `${v.guest_ip_start} - ${v.guest_ip_end}/${v.guest_ip_mask}`
      if (v.guest_ip6_start && v.guest_ip6_end) {
        addrLabel += `,${v.guest_ip6_start} - ${v.guest_ip6_end}/${v.guest_ip6_mask}`
      }
      return {
        key: v.id,
        label: `${v.name}(${addrLabel}, vlan=${v.vlan_id})`,
        rightLabel: `${this.$t('common.text00001')}: ${v.ports - v.ports_used}`,
        disabled: v.ports <= v.ports_used,
        ...v,
      }
    },
    ipChange (e, i) {
      this.networkList[i].ip = e
    },
    macChange (e, i) {
      this.networkList[i].mac = e.target.value
    },
    ipv6Change (e, i) {
      this.networkList[i].ipv6 = e.target.value
    },
    getIpv6Prefix (ipv6 = '') {
      if (ipv6) {
        const list = ipaddr.parse(ipv6).toNormalizedString().split(':')
        return list.slice(0, 4).join(':') + ':'
      }
      return ''
    },
    add () {
      const uid = uuid()
      const data = {
        network: {},
        vpc: {},
        ipShow: false,
        ipv6Show: false,
        requireIpv6: false,
        ipv6Mode: 'all',
        macShow: false,
        deviceShow: false,
        key: uid,
        ip: '',
        secgroupShow: false,
        portMappingShow: false,
        port_mappings: [],
      }
      if (this.vpcObj) {
        data.vpc = this.vpcObj
      }
      NIC_MAP_ROOTS.forEach(root => this.ensureMap(root))
      this.networkList.push(data)
      this.$nextTick(() => {
        if (this.vpcObj) {
          this.fieldSet(this.networkFieldMap.vpcs(uid), this.vpcObj.id)
        }
      })
    },
    canShowIpConfig (item) {
      return this.isSupportIPv4(item) && !(this.isSupportIPv6(item) && item.ipv6Mode === 'only' && item.requireIpv6)
    },
    canShowIpv6Require (item) {
      return this.isSupportIPv6(item) && this.isSupportIPv4(item)
    },
    canShowIpv6Address (item) {
      return (this.isSupportIPv6(item) && item.requireIpv6) || (!this.isSupportIPv4(item) && this.isSupportIPv6(item))
    },
    hasExpandedBasicFields (item) {
      return !!(
        (this.canShowIpConfig(item) && item.ipShow) ||
        (this.showMacConfig && item.macShow) ||
        (this.showDeviceConfig && item.deviceShow) ||
        (this.showSecgroupConfig && item.secgroupShow) ||
        (this.canShowIpv6Address(item) && item.ipv6Show)
      )
    },
    triggerShowIp (item) {
      item.ipShow = !item.ipShow
      this.$emit('optionalChange', { flag: 'ip', key: item.key, show: item.ipShow })
    },
    triggerShowIpv6 (item) {
      item.ipv6Show = !item.ipv6Show
      this.$emit('optionalChange', { flag: 'ipv6', key: item.key, show: item.ipv6Show })
    },
    triggerIpv6Mode (item, e) {
      item.ipv6Mode = e.key
      this.$nextTick(() => {
        this.setNicField('networkIPv6Modes', item.key, e.key)
      })
    },
    triggerRequireIpv6 (item, e) {
      item.requireIpv6 = e.target.checked
      if (!item.requireIpv6) {
        item.ipv6Show = false
        this.$emit('optionalChange', { flag: 'ipv6', key: item.key, show: false })
      }
    },
    triggerShowMac (item) {
      item.macShow = !item.macShow
      this.$emit('optionalChange', { flag: 'mac', key: item.key, show: item.macShow })
    },
    triggerShowDevice (item) {
      item.deviceShow = !item.deviceShow
      this.$emit('optionalChange', { flag: 'device', key: item.key, show: item.deviceShow })
    },
    triggerShowSecgroup (item) {
      item.secgroupShow = !item.secgroupShow
      this.$emit('optionalChange', { flag: 'secgroup', key: item.key, show: item.secgroupShow })
    },
    clearPortMappingForNetKey (netKey) {
      if (!netKey || !this.model) return
      ;['networkContainerPorts', 'networkHostPorts', 'networkPortProtocols'].forEach((root) => {
        if (this.model[root] && Object.prototype.hasOwnProperty.call(this.model[root], netKey)) {
          this.$delete(this.model[root], netKey)
        }
      })
    },
    triggerShowPortMapping (item) {
      item.portMappingShow = !item.portMappingShow
      if (!item.portMappingShow) {
        item.port_mappings = []
        this.clearPortMappingForNetKey(item.key)
        const ref = this.$refs[`portMappingRef_${item.key}`]
        const labelRef = Array.isArray(ref) ? ref[0] : ref
        if (labelRef?.reset) labelRef.reset()
        return
      }
      this.$nextTick(() => {
        const ref = this.$refs[`portMappingRef_${item.key}`]
        const labelRef = Array.isArray(ref) ? ref[0] : ref
        if (labelRef && (!labelRef.labelList || !labelRef.labelList.length) && labelRef.add) {
          labelRef.add()
        }
      })
    },
    onPortMappingLabelChange (item, list) {
      if (!list || !list.length) {
        item.portMappingShow = false
        item.port_mappings = []
        this.clearPortMappingForNetKey(item.key)
      }
    },
    decrease (uid, index) {
      this.clearNicMapsForKey(uid)
      this.networkList.splice(index, 1)
    },
    reset (ipsDisabled) { // 重置成不可手动输入IP，并且仅保留1条数据
      if (this.networkList.length > 1) {
        const firstItem = this.networkList[0]
        this.networkList = [firstItem]
      }
      this.networkList[0].ipShow = false
      this.networkList[0].ipv6Show = false
      this.networkList[0].requireIpv6 = false
      this.networkList[0].ipv6Mode = 'all'
      this.networkList[0].macShow = false
      this.networkList[0].deviceShow = false
      this.networkList[0].secgroupShow = false
      this.networkList[0].portMappingShow = false
      this.networkList[0].port_mappings = []
      this.ipsDisabled = ipsDisabled
    },
    networkChange (val, item, i) {
      this.$nextTick(() => {
        this.setNicField('networkExits', item.key, item.network?.exit)
        if (item.network.guest_ip_start && item.network.guest_ip_end) {
          this.setNicField('networkIPv6Modes', item.key, 'all')
          this.setNicField('networkIPv6s', item.key, false)
          this.networkList[i].ipv6Mode = 'all'
          this.networkList[i].requireIpv6 = false
        }
      })
    },
    networkSelectChange (curObjArr, item) {
      item.network = curObjArr[0]
      this.$nextTick(() => {
        this.setNicField('networkExits', item.key, item.network?.exit)
      })
    },
    vpcChange (v, i) {
      this.$nextTick(() => {
        if (this.form.fi) {
          const networkVpcObj = this.networkList[i].vpc
          if (R.is(Object, networkVpcObj)) {
            this.form.fi.networkVpcObj = networkVpcObj
          }
        }
      })
    },
    vpcSelectChange (curObjArr, i, item) {
      item.vpc = curObjArr[0]
      this.$nextTick(() => {
        if (this.form.fi) {
          const networkVpcObj = item.vpc || {}
          if (R.is(Object, networkVpcObj)) {
            this.form.fi.networkVpcObj = networkVpcObj
          }
        }
      })
    },
    beforeDefaultSelectCallBack (data = []) {
      // BaseSelect 默认只取 list[0]，故仅当首项可用时允许默认选
      return this.isNetworkAvailable(data[0])
    },
    isNetworkAvailable (net) {
      if (!net || typeof net !== 'object') return false
      return Number(net.ports) > Number(net.ports_used)
    },
    findNetworkInList (list, id) {
      if (id == null || id === '' || !Array.isArray(list)) return null
      return list.find(i => i.id === id || i.key === id || String(i.id) === String(id)) || null
    },
    /**
     * 草稿/工单回填（canDefaultSelect=false）：数据驱动，opts/resList 每次变化都重算并写回。
     * 1) _draftNetworkId 在列表且可用 → 始终优先
     * 2) 草稿在列表但不可用 / 不在列表 / 无草稿 → 可用第一项
     * 3) 都没有可用项 → 清空无效 id，不写不存在的网络
     */
    resolveNetworkFromFetchedList (list, item) {
      if (this.canDefaultSelect) return
      if (!item || !Array.isArray(list) || !list.length) return
      // 供 VPC 稳定后再用同一份 opts 重跑回填（params clear 后可能不再 emit）
      item._lastNetworkResList = list

      const field = this.networkFieldMap.networks(item.key)[0]
      const preferId = item._draftNetworkId || ''
      const curId = this.readField(field) || item.network?.id || item.network?.key

      let target = null
      const preferHit = preferId ? this.findNetworkInList(list, preferId) : null
      if (preferHit && this.isNetworkAvailable(preferHit)) {
        target = preferHit
      } else {
        // 未命中 / 不可用 / 无草稿：绝不回填无效 id，改选列表内可用第一项
        target = list.find(n => this.isNetworkAvailable(n)) || null
      }

      if (!target) {
        const curHit = this.findNetworkInList(list, curId)
        if (curId && (!curHit || !this.isNetworkAvailable(curHit))) {
          item.network = {}
          this.writeFields({ [field]: undefined })
        }
        return
      }

      // opts 每次变化都写回，不因 curId===target 而跳过
      item.network = target
      this.$nextTick(() => {
        if (!this.model) return
        this.setNicField('networks', item.key, target.id)
        const idx = this.networkList.indexOf(item)
        if (idx >= 0) this.networkChange(target.id, item, idx)
      })
    },
    fetchVpcSuccessHandle (data = [], item) {
      let target = data[0] || {}
      if (item.vpc?.id && data.some(i => i.id === item.vpc?.id)) {
        target = data.filter(i => i.id === item.vpc?.id)[0]
      }
      item.vpc = target
      this.$nextTick(() => {
        this.setNicField('vpcs', item.key, target?.key || target?.id)
        // VPC 写回后 params 可能 clear 网卡：用最近一次子网 opts 再回填一次
        if (item._lastNetworkResList && item._lastNetworkResList.length) {
          this.resolveNetworkFromFetchedList(item._lastNetworkResList, item)
        }
      })
      this.vpcSelectChange([target], 0, item)
    },
    fetchNetworkSuccessHandle (data, item) {
      this.resolveNetworkFromFetchedList(data || [], item)
    },
    fetchNetworkOpts (params, item) {
      this.networkLoading = true
      // 未获取vpc时，network也不展示
      if (!params.vpc) {
        this.networkOpts = []
        item.network = {}
        this.writeFields({ [this.networkFieldMap.networks(item.key)[0]]: '' })
        this.networkLoading = false
      } else {
        this.networkOpts = []
        new this.$Manager('networks').list({ params }).then((res) => {
          this.networkOpts = res.data.data || []
          this.$nextTick(() => {
            this.writeFields({ [this.networkFieldMap.networks(item.key)[0]]: this.networkOpts?.[0]?.id })
          })
          item.network = this.networkOpts[0]
          this.networkLoading = false
        }).catch((err) => {
          this.networkLoading = false
          console.log(err)
          throw err
        })
      }
    },
    isSupportIPv6 (item) {
      return !!item.network?.guest_ip6_start && !!item.network?.guest_ip6_end
    },
    isSupportIPv4 (item) {
      return !!item.network?.guest_ip_start && !!item.network?.guest_ip_end
    },
  },
}
</script>

<style lang="less" scoped>
@import '../../../../src/styles/less/theme';

.network-config {
  .network-count-tips {
    .remain-num {
      color: @primary-color;
    }
  }

  .network-config-row {
    margin-bottom: 16px;
    width: 100%;
    padding: 12px 14px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    -webkit-font-smoothing: antialiased;

    &__top {
      flex-wrap: wrap;
      /* 统一间距：网卡序号 / VPC / 网络 / 高级，避免 tag margin + mr-1 + gap 叠加 */
      gap: 8px;
      column-gap: 8px;
      row-gap: 8px;
    }
  }

  .network-config-aside {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: 4px;
    height: 32px;
  }

  .network-nic-tag.ant-tag {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 32px !important;
    margin: 0 !important;
    padding: 0 10px !important;
    line-height: 30px !important;
    font-size: 14px;
    border-radius: 6px;
    flex: 0 0 auto;
    color: var(--ant-color-primary, #1890ff);
    background: color-mix(in srgb, var(--ant-color-primary, #1890ff) 10%, #fff);
    border-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 40%, #fff);
  }

  .network-vpc-item {
    flex: 0 0 200px;
    width: 200px;
    min-width: 200px;
    max-width: 200px;
    margin-right: 0 !important;
    :deep(.ant-form-item-control),
    :deep(.ant-form-item-control-input),
    :deep(.ant-form-item-control-input-content) {
      width: 100%;
    }
    :deep(.oc-select),
    :deep(.ant-select) {
      width: 200px !important;
      min-width: 200px !important;
      max-width: 200px !important;
    }
  }

  .network-vpc-tag.ant-tag {
    display: inline-flex !important;
    align-items: center;
    box-sizing: border-box;
    width: 200px !important;
    max-width: 200px;
    height: 32px !important;
    margin: 0 !important;
    padding: 0 11px !important;
    line-height: 30px !important;
    border-radius: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--ant-color-primary, #1890ff);
    background: color-mix(in srgb, var(--ant-color-primary, #1890ff) 10%, #fff);
    border-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 40%, #fff);
  }

  .network-item {
    flex: 0 0 auto;
    margin-right: 0 !important;
    :deep(.ant-form-item-extra) {
      margin-top: 4px;
    }
  }

  .network-row-remove-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    margin-left: 4px;
  }

  .network-advanced-panel {
    margin-top: 10px;
    padding: 8px 0 4px;
    border-top: 1px solid #f0f0f0;

    &__toggles {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      min-height: 32px;
      column-gap: 16px;
      row-gap: 4px;
    }

    &__toggle {
      display: inline-flex;
      align-items: center;
      height: 32px;
      margin: 0;
      color: rgba(0, 0, 0, 0.45);

      :deep(.ant-checkbox + span) {
        color: rgba(0, 0, 0, 0.45);
        padding-right: 0;
      }

      :deep(.ant-checkbox-wrapper) {
        margin: 0;
        color: rgba(0, 0, 0, 0.45);
      }

      &--ipv6 {
        gap: 4px;

        :deep(input[type='hidden']) {
          display: none;
        }
      }
    }

    &__fields {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 16px 20px;
      margin-top: 10px;
    }

    &__field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 0 0 auto;
      width: 300px;

      &-label {
        color: rgba(0, 0, 0, 0.45);
        font-size: 12px;
        line-height: 20px;
      }

      &--wide {
        width: 420px;
      }

      &--ipv6 {
        width: auto;
        min-width: 360px;
      }

      :deep(.ant-select),
      :deep(.base-select),
      :deep(.base-select-wrap),
      :deep(.oc-select) {
        width: 100% !important;
        min-width: 0 !important;
      }

      :deep(.ant-input) {
        width: 100%;
      }
    }

    &__control {
      width: 100%;
    }

    &__port {
      width: 100%;
      margin-top: 12px;
    }
  }

  .network-port-mapping {
    width: 100%;

    // Labels 根节点：映射行与「添加」同一行可排多个，彼此留间距
    :deep(> div) {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      column-gap: 16px;
      row-gap: 12px;
    }

    :deep(> div > .d-flex),
    :deep(> div > .labels-row) {
      flex: 0 0 auto;
      align-items: center;
      column-gap: 8px;
    }

    :deep(.ant-form-item) {
      margin-bottom: 0;
      flex: 0 0 auto;
    }

    // 端口输入整体收窄；勿单独压 .ant-input，否则 addonBefore 会叠在一起
    :deep(.ant-form-item:not(.labels-protocol)) {
      width: 200px;
    }

    :deep(.ant-form-item:not(.labels-protocol) .ant-input-group-wrapper) {
      width: 100%;
    }

    :deep(.ant-btn-circle) {
      flex-shrink: 0;
      align-self: center;
      margin-top: 0 !important;
    }

    :deep(.mx-3) {
      flex-shrink: 0;
      line-height: 32px;
      margin-left: 8px !important;
      margin-right: 8px !important;
    }
  }

  .network-ipv6-dropdown-link {
    display: inline-flex;
    align-items: center;
    height: 32px;
    padding-left: 4px;
    color: var(--ant-color-primary, #1890ff);
    white-space: nowrap;
    cursor: pointer;
  }

  .network-ipv6-address-item {
    :deep(.ant-form-item-control-input-content) {
      display: block;
    }
  }

  .network-ipv6-address {
    display: inline-flex;
    align-items: flex-start;
    flex-wrap: nowrap;
    min-height: 32px;
  }

  .network-ipv6-prefix {
    flex: 0 0 auto;
    margin-right: 8px;
    white-space: nowrap;
    height: 32px;
    line-height: 32px;
  }

  .network-ipv6-input-item {
    flex: 0 0 auto;
    margin: 0 !important;
    :deep(.ant-form-item-row) {
      display: block;
    }
    :deep(.ant-form-item-control-input) {
      min-height: 32px;
    }
    :deep(.ant-form-item-explain),
    :deep(.ant-form-item-extra) {
      min-height: 0;
      margin-top: 2px;
      line-height: 20px;
    }
  }
}
</style>
