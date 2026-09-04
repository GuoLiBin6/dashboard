<template>
  <div class="network-config">
    <!-- 适配大、小屏幕 -->
    <div class="network-config-row" :class="{ 'd-flex align-items-start' : isBigScreen && !isDialog }" v-for="(item, i) in networkList" :key="item.key">
      <div class="d-flex align-items-start network-config-main">
        <a-tag class="network-nic-tag">{{ isBonding ? 'bond' : $t('compute.text_193')}}{{i + count}}</a-tag>
        <a-form-item
          v-show="showVpc"
          :wrapperCol="{ span: 24 }"
          class="mb-0 mr-1 network-vpc-item">
          <oc-select
            v-if="i === 0"
            v-decorator="decorator.vpcs(item.key)"
            show-status
            show-group
            :status-desc="$t('compute.vpc_status_desc')"
            :resource="vpcResource"
            :formatter="vpcFormatter"
            :params="vpcParams"
            :mapper="vpcResourceMapper"
            :sort="(arr) => arr.sort((a, b) => a.network_count > b.network_count ? -1 : 1)"
            :placeholder="$t('compute.text_194')"
            @selectChange="(curObjArr) => vpcSelectChange(curObjArr, i, item)"
            @fetchSuccess="(data) => fetchVpcSuccessHandle(data, item)" />
          <a-tag v-else class="network-vpc-tag">{{ getVpcTag(networkList[0].vpc) }}</a-tag>
        </a-form-item>
        <a-form-item
          :wrapperCol="{ span: 24 }"
          :style="isDialog ? { flex: 1 } : ''"
          class="mb-0 mr-1 network-item">
          <base-select
            class="w-100"
            v-decorator="decorator.networks(item.key)"
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
            @change="v => networkChange(v, item, i)"
            @update:resList="list => resolveNetworkFromFetchedList(list, item)"
            :select-props="{ allowClear: true, placeholder: $t('compute.text_195') }"
            :min-width="isDialog ? '200px' : '500px'" />
          <template v-if="i === 0" #extra>
            {{$t('compute.text_196')}}<help-link href="/network">{{$t('compute.perform_create')}}</help-link>
          </template>
        </a-form-item>
      </div>
      <div class="network-advanced" :class="{ 'network-advanced--inline' : isBigScreen && !isDialog }">
        <!-- 高级 -->
        <template v-if="showAdvanced">
          <!-- ip -->
          <template v-if="isSupportIPv4(item) && !(isSupportIPv6(item) && item.ipv6Mode === 'only' && item.requireIpv6)">
            <template v-if="item.ipShow">
              <a-form-item class="mb-0" style="display:inline-block" :wrapperCol="{ span: 24 }">
                <ip-select v-decorator="decorator.ips(item.key, item.network)" :value="item.ip" :network="item.network" @change="e => ipChange(e, i)" />
              </a-form-item>
              <a-button type="link" @click="triggerShowIp(item)">{{$t('compute.text_135')}}</a-button>
            </template>
            <a-tooltip v-else :title="ipBtnTooltip">
              <a-button type="link" class="mr-1" :disabled="ipsDisabled" @click="triggerShowIp(item)">{{$t('compute.text_198')}}</a-button>
            </a-tooltip>
          </template>
          <!-- mac -->
          <template v-if="showMacConfig">
            <template v-if="item.macShow">
              <a-form-item class="mb-0" style="display:inline-block" :wrapperCol="{ span: 24 }">
                <a-input
                  style="width: 164px"
                  :placeholder="$t('compute.text_806')"
                  @change="e => macChange(e, i)"
                  v-decorator="decorator.macs(item.key, item.network)" />
              </a-form-item>
              <a-button type="link" @click="triggerShowMac(item)">{{$t('compute.text_135')}}</a-button>
            </template>
            <a-tooltip v-else :title="ipBtnTooltip">
              <a-button type="link" class="mr-1" :disabled="ipsDisabled" @click="triggerShowMac(item)">{{$t('compute.mac_config')}}</a-button>
            </a-tooltip>
          </template>
          <!-- 透传设备 -->
          <template v-if="showDeviceConfig">
            <template v-if="item.deviceShow">
              <a-form-item class="mb-0" style="display:inline-block" :wrapperCol="{ span: 24 }">
                <oc-select
                  style="width: 164px"
                  v-decorator="decorator.devices(item.key)"
                  :data="gpuOptions"
                  :placeholder="$t('compute.sriov_device_tips')" />
              </a-form-item>
              <a-button type="link" @click="triggerShowDevice(item)">{{$t('compute.text_135')}}</a-button>
            </template>
            <a-button v-else type="link" class="mr-1" @click="triggerShowDevice(item)">{{ $t('compute.config_transparent_net') }}</a-button>
          </template>
          <!-- 安全组 -->
        <template v-if="showSecgroupConfig">
          <template v-if="item.secgroupShow">
            <a-form-item class="mb-0" style="display:inline-block" :wrapperCol="{ span: 24 }">
              <base-select
                v-decorator="decorator.secgroups(item.key)"
                resource="secgroups"
                :params="secgroupParams"
                :select-props="{ allowClear: true, placeholder: $t('compute.secgroup_tips'), mode: 'multiple' }" />
            </a-form-item>
          </template>
          <a-button v-else type="link" class="mr-1" @click="triggerShowSecgroup(item)">{{ $t('compute.config_secgroup') }}</a-button>
        </template>
          <!-- ipv6 -->
          <template>
            <a-form-item class="mb-0 network-ipv6-item" style="display:inline-block" :wrapperCol="{ span: 24 }" v-if="isSupportIPv6(item) && isSupportIPv4(item)">
              <div class="d-flex align-items-center network-ipv6-switch">
                <a-checkbox style="width: max-content" v-decorator="decorator.ipv6s(item.key, item.network)" @change="(e) => triggerRequireIpv6(item, e)" />
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
                <!-- 保留表单字段，供提交 / setFieldsValue -->
                <a-input type="hidden" v-decorator="decorator.ipv6_mode(item.key, item.network)" />
              </div>
            </a-form-item>
            <template v-if="(isSupportIPv6(item) && item.requireIpv6) || (!isSupportIPv4(item) && isSupportIPv6(item))">
              <template v-if="item.ipv6Show">
                <a-form-item class="mb-0 ml-1 network-ipv6-address-item" :wrapperCol="{ span: 24 }">
                  <div class="network-ipv6-address">
                    <span class="network-ipv6-prefix">{{ getIpv6Prefix(item.network?.guest_ip6_start) }}</span>
                    <a-form-item class="mb-0 network-ipv6-input-item" :wrapperCol="{ span: 24 }">
                      <a-input
                        style="width: 164px"
                        :placeholder="$t('compute.complete_ipv6_address')"
                        @change="e => ipv6Change(e, i)"
                        v-decorator="decorator.ips6(item.key, item.network)" />
                    </a-form-item>
                    <a-button type="link" class="network-ipv6-cancel" @click="triggerShowIpv6(item)">{{$t('compute.text_135')}}</a-button>
                  </div>
                </a-form-item>
              </template>
              <a-button v-else type="link" @click="triggerShowIpv6(item)">{{$t('compute.ipv6_config')}}</a-button>
            </template>
          </template>
        </template>
        <a-button type="link" @click="() => showAdvanced = !showAdvanced">{{ showAdvanced ? $t('compute.hide_advanced') : $t('compute.advanced') }}</a-button>
        <span v-if="i !== 0" class="network-row-remove-wrap">
          <a-button shape="circle" icon="minus" size="small" @click="decrease(item.key, i)" />
        </span>
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
import { uuid } from '@/utils/utils'
import IpSelect from './IpSelect.vue'

export default {
  name: 'NetworkConfig',
  components: {
    IpSelect,
  },
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
    decorator: {
      type: Object,
      required: true,
      validator: val => R.is(Function, val.vpcs) && R.is(Function, val.networks) && R.is(Function, val.ips) && R.is(Function, val.macs) && R.is(Function, val.ips6) && R.is(Function, val.secgroups),
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
      screenWidth: document.body.clientWidth,
      showAdvanced: false,
      canDefaultSelect: true,
    }
  },
  computed: {
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
    isBigScreen () {
      return this.screenWidth > 1650
    },
  },
  watch: {
    vpcObj (val) {
      if (val && val.id && val.name) {
        this.networkList[0].vpc = val
        this.form.fc.setFieldsValue({
          [this.decorator.vpcs(this.networkList[0].key)[0]]: this.vpcObj.id,
        })
      }
    },
    networkList (val) {
      this.form.fi.networkList = val
    },
  },
  created () {
    this.add()
  },
  mounted () {
    window.addEventListener('resize', this.onResize)
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
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
        if (!this.form || !this.form.fc || !this.networkList.length) return
        const first = this.networkList[0]
        if (first.vpc && first.vpc.id) {
          this.form.fc.setFieldsValue({
            [this.decorator.vpcs(first.key)[0]]: first.vpc.id,
          })
        }
        this.networkList.forEach((item) => {
          const value = {}
          // 子网：仅写已在列表中 resolve 且可用的 id，禁止盲种草稿无效 id
          const netId = item.network && item.network.id
          if (netId && this.isNetworkAvailable(item.network)) {
            value[this.decorator.networks(item.key)[0]] = netId
          }
          const netKeyForDecorators = (netId && this.isNetworkAvailable(item.network)) ? netId : null
          if (item.address && netKeyForDecorators) {
            value[this.decorator.ips(item.key, netKeyForDecorators)[0]] = item.address
          }
          if (item.mac && netKeyForDecorators) {
            value[this.decorator.macs(item.key, netKeyForDecorators)[0]] = item.mac
          }
          if (netKeyForDecorators) {
            value[this.decorator.ipv6s(item.key, netKeyForDecorators)[0]] = item.requireIpv6
            value[this.decorator.ipv6_mode(item.key, netKeyForDecorators)[0]] = item.ipv6Mode
          }
          if (item.address6 && netKeyForDecorators) {
            value[this.decorator.ips6(item.key, netKeyForDecorators)[0]] = item.address6.replace(this.getIpv6Prefix(item.address6), '')
          }
          if (item.sriov_device && item.sriov_device.model) {
            value[this.decorator.devices(item.key)[0]] = item.sriov_device.model
          }
          if (item.secgroups && item.secgroups.length > 0) {
            value[this.decorator.secgroups(item.key)[0]] = item.secgroups
          }
          this.form.fc.setFieldsValue(value)
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
      }
      if (this.vpcObj) {
        data.vpc = this.vpcObj
      }
      this.networkList.push(data)
      this.$nextTick(() => {
        if (this.vpcObj) {
          this.form.fc.setFieldsValue({
            [this.decorator.vpcs(uid)[0]]: this.vpcObj.id,
          })
        }
      })
    },
    triggerShowIp (item, i) {
      item.ipShow = !item.ipShow
    },
    triggerShowIpv6 (item, i) {
      item.ipv6Show = !item.ipv6Show
    },
    triggerIpv6Mode (item, e, i) {
      item.ipv6Mode = e.key
      this.$nextTick(() => {
        this.form.fc.setFieldsValue({
          [`networkIPv6Modes[${item.key}]`]: e.key,
        })
      })
    },
    triggerRequireIpv6 (item, e) {
      item.requireIpv6 = e.target.checked
    },
    triggerShowMac (item, i) {
      item.macShow = !item.macShow
    },
    triggerShowDevice (item, i) {
      item.deviceShow = !item.deviceShow
    },
    triggerShowSecgroup (item, i) {
      item.secgroupShow = !item.secgroupShow
    },
    decrease (uid, index) {
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
      this.ipsDisabled = ipsDisabled
    },
    networkChange (val, item, i) {
      this.$nextTick(() => {
        const fieldKey = `networkExits[${item.key}]`
        this.form.fc.getFieldDecorator(fieldKey, {
          preserve: true,
        })
        this.form.fc.setFieldsValue({
          [fieldKey]: item.network.exit,
        })
        if (item.network.guest_ip_start && item.network.guest_ip_end) {
          this.form.fc.setFieldsValue({
            [`networkIPv6Modes[${item.key}]`]: 'all',
            [`networkIPv6s[${item.key}]`]: false,
          })
          this.networkList[i].ipv6Mode = 'all'
          this.networkList[i].requireIpv6 = false
        }
      })
    },
    networkSelectChange (curObjArr, item) {
      item.network = curObjArr[0]
      this.$nextTick(() => {
        const fieldKey = `networkExits[${item.key}]`
        this.form.fc.getFieldDecorator(fieldKey, {
          preserve: true,
        })
        this.form.fc.setFieldsValue({
          [fieldKey]: item.network?.exit,
        })
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

      const field = this.decorator.networks(item.key)[0]
      const preferId = item._draftNetworkId || ''
      const curId = this.form?.fc?.getFieldValue(field) || item.network?.id || item.network?.key

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
          if (this.form?.fc) this.form.fc.setFieldsValue({ [field]: undefined })
        }
        return
      }

      // opts 每次变化都写回，不因 curId===target 而跳过
      item.network = target
      this.$nextTick(() => {
        if (!this.form?.fc) return
        this.form.fc.setFieldsValue({ [field]: target.id })
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
        this.form.fc.setFieldsValue({ [`vpcs[${item.key}]`]: target?.key, vpcs: { [item.key]: target?.key } })
        // VPC 写回后 params 可能 clear 网卡：用最近一次子网 opts 再回填一次
        if (item._lastNetworkResList && item._lastNetworkResList.length) {
          this.resolveNetworkFromFetchedList(item._lastNetworkResList, item)
        }
      })
      this.vpcSelectChange([target], 0, item)
      // this.fetchNetworkOpts(this.networkParamsC, item)
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
        this.form.fc.setFieldsValue({ [`networks[${item.key}]`]: '' })
        this.networkLoading = false
      } else {
        this.networkOpts = []
        new this.$Manager('networks').list({ params }).then((res) => {
          this.networkOpts = res.data.data || []
          this.$nextTick(() => {
            this.form.fc.setFieldsValue({ [`networks[${item.key}]`]: this.networkOpts?.[0]?.id })
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
    onResize () {
      this.screenWidth = document.body.clientWidth
    },
    isSupportIPv6 (item) {
      return !!item.network.guest_ip6_start && !!item.network.guest_ip6_end
    },
    isSupportIPv4 (item) {
      return !!item.network.guest_ip_start && !!item.network.guest_ip_end
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
  }
  // 保持内容宽度（不拉满），右侧留给「高级」；仅钉死 VPC 列宽与 oc-select 默认 200px 对齐
  .network-config-main {
    flex: 0 0 auto;
    width: auto;
  }
  .network-nic-tag.ant-tag {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 32px !important;
    margin: 0 8px 0 0 !important;
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
    :deep(.ant-form-item-extra) {
      margin-top: 4px;
    }
  }
  // 高级区顶部对齐：校验错误撑高时不把旁边按钮挤到垂直居中
  .network-advanced--inline {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    margin-left: 8px;
    min-height: 32px;
    :deep(.ant-form-item) {
      margin-bottom: 0;
    }
    :deep(.ant-btn-link) {
      height: 32px;
      padding-top: 0;
      padding-bottom: 0;
      line-height: 32px;
    }
    :deep(.ant-checkbox-wrapper) {
      display: inline-flex;
      align-items: center;
      height: 32px;
      margin-inline-end: 0;
    }
  }
  .network-row-remove-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    margin-left: 4px;
  }
  .network-ipv6-switch {
    height: 32px;
    :deep(input[type='hidden']) {
      display: none;
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
    // 错误文案只出现在输入框下方，不参与和「取消」的垂直居中
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
  .network-ipv6-cancel {
    flex: 0 0 auto;
    height: 32px !important;
    line-height: 32px !important;
  }
}
</style>
