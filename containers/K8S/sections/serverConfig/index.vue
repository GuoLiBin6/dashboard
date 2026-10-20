<template>
  <div>
    <a-card class="mb-2 card" v-for="(item, i) in serverConfigList" :key="item.key">
      <a-button v-if="i !== 0" @click="decrease(item.key, i)" type="link" size="small" class="error-color position-absolute" style="right: 10px; top: 10px;">{{ $t('common.delete') }}</a-button>
      <slot name="hypervisor" :i="item.key" />
      <a-form-item :label="$t('k8s.text_121')" required>
        <a-row :gutter="8">
          <a-col :span="24">
            <a-form-item
              style="min-width: 200px;"
              class="w-100 mb-0 mr-1">
              <base-select
                class="w-100"
                :value="fieldVal(serverConfigField.network(item.key))"
                @change="v => { fieldSet(serverConfigField.network(item.key), v); handleNetworkChange(i, v) }"
                resource="networks"
                remote
                is-default-select
                v-model:item="item.network"
                :need-params="true"
                :params="getNetworkParams(item.key)"
                :mapper="networkResourceMapper"
                :labelFormat="networkLabelFormat"
                :select-props="{ allowClear: true, placeholder: $t('k8s.text_122') }" />
            </a-form-item>
          </a-col>
          <a-col :span="10" v-if="item.ipShow">
            <a-form-item class="mb-0 mr-2">
              <a-input
                :placeholder="$t('k8s.text_123')"
                @change="e => ipChange(e, i)"
                :value="fieldVal(serverConfigField.ip(item.key))"
                @update:value="v => fieldSet(serverConfigField.ip(item.key), v)" />
            </a-form-item>
          </a-col>
          <a-col :span="2">
            <a-button v-if="item.ipShow" type="link" class="mr-1 mt-1" @click="hideIp(item)">{{$t('k8s.text_410')}}</a-button>
            <a-button v-else type="link" class="mr-1 mt-1" @click="showIp(item)">{{$t('k8s.text_124')}}</a-button>
          </a-col>
        </a-row>
      </a-form-item>
      <a-form-item>
        <sku
          :model="resolvedModel"
          @change="v => handleSkuChange(i, v)"
          :field="`sku[${item.key}]`"
          :type="osSelectType"
          :hypervisor="hypervisor"
          :sku-params="skuParam(i)" />
        </a-form-item>
      <a-form-item :label="$t('compute.text_267')" class="mb-0" v-if="useImage">
        <os-select
          :type="osSelectType"
          :uefi="uefi"
          :model="resolvedModel"
          :form="form"
          :field="item.key"
          :hypervisor="hypervisor"
          @updateImageMsg="updateImageMsg(i, $event)"
          :cloudType="platform"
          :imageType="getImageType()"
          :imageParams="getImageParams()"
          :cacheImageParams="getCacheImageParams()" />
      </a-form-item>
      <a-form-item :label="$t('k8s.text_120')" class="mb-0">
        <system-disk
          :ref="`systemDisk_${item.key}`"
          :field="item.key"
          :type="platform"
          :form="form"
          :model="resolvedModel"
          :image="imageMock"
          :hypervisor="hypervisor"
          :capability-data="getCapability(i)"
          :sku="getSku(i)"
          :domain="userInfo.projectDomainId" />
      </a-form-item>

      <a-form-item :label="$t('dictionary.role')">
        <a-radio-group
          :value="fieldVal(serverConfigField.role(item.key))"
          @change="e => fieldSet(serverConfigField.role(item.key), e.target.value)">
          <a-radio-button v-for="role in roleList" :key="role.value" :value="role.value">
            {{ role.label}}
          </a-radio-button>
        </a-radio-group>
      </a-form-item>

      <a-form-item v-show="!item.ipShow" :label="$t('k8s.text_125')" :extra="$t('k8s.text_126')">
        <a-input-number :value="fieldVal(serverConfigField.num(item.key))" @change="v => fieldSet(serverConfigField.num(item.key), v)" :min="1" :max="item.ipShow ? 1 : 10"  :parser="v => parser(v, '', '1')" />
      </a-form-item>
    </a-card>
    <div class="d-flex align-items-center" v-if="serverConfigRemaining > 0">
      <a-button type="primary" shape="circle" icon="plus" size="small" @click="add" />
      <a-button type="link" @click="add">{{$t('k8s.text_127')}}</a-button>
      <span class="network-count-tips">{{$t('k8s.text_128')}}<span class="remain-num">{{ serverConfigRemaining }}</span>{{$t('k8s.text_129')}}</span>
    </div>
  </div>
</template>

<script>
import { h } from 'vue'
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import SystemDisk from '@Compute/views/vminstance/create/components/SystemDisk'
import Sku from '@Compute/sections/SKU'
import OsSelect from '@Compute/sections/OsSelect'
import { IMAGES_TYPE_MAP } from '@/constants/compute'
import { HYPERVISORS_MAP } from '@/constants'
import { uuid } from '@/utils/utils'
import { getBracketValue, setBracketValue } from '@/utils/bracketModel'
import { NODE_ROLE_MAP } from '../../views/cluster/constants'
import {
  serverConfigField,
  serverConfigNetworkRules,
  serverConfigIpRules,
  serverConfigSkuRules,
  serverConfigNumRules,
  serverConfigRoleRules,
} from './fields'

export default {
  name: 'K8SClusterServerConfig',
  components: {
    SystemDisk,
    Sku,
    OsSelect,
  },
  props: {
    form: {
      type: Object,
      default: null,
    },
    /** a-form-model end-state（通常 form.fd） */
    model: {
      type: Object,
      default: null,
    },
    cloudregionId: {
      type: String,
      required: true,
    },
    hypervisor: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      required: true,
    },
    networkParams: {
      type: Object,
      required: true,
    },
  },
  data () {
    const roleList = []
    R.forEachObjIndexed((value, key) => {
      roleList.push({ label: value, value: key })
    }, NODE_ROLE_MAP)
    return {
      serverConfigField,
      imageMock: { min_disk: 40960 }, // 通过mock image数据设置最小磁盘大小
      selectedImage: {},
      serverConfigList: [],
      limit: 10,
      roleList,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'isDomainMode', 'userInfo', 'l3PermissionEnable']),
    resolvedModel () {
      return this.model || this.form?.fd
    },
    osSelectType () {
      if (['idc', 'private', 'public'].includes(this.platform)) return this.platform
      return 'idc'
    },
    useImage () {
      const hypervisor = this.$props.hypervisor
      if (hypervisor === HYPERVISORS_MAP.kvm.key || hypervisor === HYPERVISORS_MAP.cloudpods.key) {
        return true
      }
      return false
    },
    serverConfigRemaining () {
      return this.limit - this.serverConfigList.length
    },
  },
  watch: {
    hypervisor: {
      handler (val, oldVal) {
        console.log(`hypervisor change: ${val}`)
      },
    },
  },
  created () {
    this.add()
  },
  methods: {

    fieldVal (nameOrTuple) {
      const name = Array.isArray(nameOrTuple) ? nameOrTuple[0] : nameOrTuple
      const opts = Array.isArray(nameOrTuple) ? (nameOrTuple[1] || {}) : {}
      if (!name || !this.resolvedModel) return undefined
      const v = getBracketValue(this.resolvedModel, name)
      return v !== undefined ? v : opts.initialValue
    },
    fieldSet (nameOrTuple, value) {
      const name = Array.isArray(nameOrTuple) ? nameOrTuple[0] : nameOrTuple
      if (name && this.resolvedModel) setBracketValue(this, this.resolvedModel, name, value)
    },
    showIp (item) {
      item.ipShow = true
    },
    hideIp (item) {
      item.ipShow = false
    },
    ipChange (e, i) {
      this.serverConfigList[i].ip = e.target.value
    },
    decrease (uid, index) {
      this.serverConfigList.splice(index, 1)
    },
    networkLabelFormat (net) {
      const text = `${net.name} (${net.guest_ip_start} - ${net.guest_ip_end}, zone=${net.zone})`
      return h('div', null, [h('span', null, text)]) // IP子网
    },
    registerConfigFields (key) {
      const initial = {
        [serverConfigField.role(key)]: 'controlplane',
        [serverConfigField.num(key)]: 1,
      }
      Object.keys(initial).forEach((name) => {
        if (getBracketValue(this.resolvedModel, name) === undefined) {
          setBracketValue(this, this.resolvedModel, name, initial[name])
        }
      })
    },
    add () {
      const uid = uuid()
      const data = {
        ipShow: false,
        key: uid,
      }
      this.serverConfigList.push(data)
      this.$nextTick(() => {
        this.registerConfigFields(uid)
        this.$emit('vmAdd', data)
      })
    },
    parser (val, unit, defaultValue = '4') {
      const value = val.replace(unit, '')
      const valueNum = Number(value)
      if (!Number.isNaN(valueNum) && R.is(Number, valueNum)) {
        return value
      }
      return defaultValue
    },
    networkResourceMapper (list) {
      return list
        .map(val => {
          const remain = val.ports - val.ports_used
          if (remain <= 0) {
            return {
              ...val,
              __disabled: true,
            }
          }
          return val
        })
        .sort((a, b) => (b.ports - b.ports_used) - (a.ports - a.ports_used))
    },
    getNetworkParams (key) {
      return {
        ...this.networkParams,
        $t: key,
      }
    },
    getConfig (index) {
      return this.serverConfigList[index]
    },
    setConfig (index, setFunc) {
      let conf = this.getConfig(index)
      conf = setFunc(conf)
      this.$set(this.serverConfigList, index, conf)
    },
    getCurrentNetwork (index) {
      return this.getConfig(index).network
    },
    getCurrentZone (index) {
      const curNet = this.getCurrentNetwork(index)
      if (curNet && curNet.zone_id) {
        return curNet.zone_id
      }
      return null
    },
    skuParam (index) {
      const filters = []
      filters.push('cpu_core_count.gt(1)')
      filters.push('memory_size_mb.gt(4095)')
      const orderBy = []
      orderBy.push('memory_size_mb')
      const param = {
        limit: 0,
        enabled: true,
        usable: true,
        filter: filters,
        order_by: orderBy,
        order: 'asc',
        cloudregion: this.cloudregionId,
        ...this.scopeParams,
      }
      const curZone = this.getCurrentZone(index)
      if (curZone) {
        param.zone = curZone
      }
      return param
    },
    handleNetworkChange (index, networkId) {
      this.fetchCapability(index)
    },
    handleSkuChange (index, sku) {
      this.setConfig(index, (conf) => {
        conf.sku = sku
        console.log(`set config(${index}) sku to ${sku.name}`)
        return conf
      })
    },
    updateImageMsg (index, { imageMsg }) {
      this.selectedImage = imageMsg
      this.setConfig(index, (conf) => {
        conf.image = imageMsg
        console.log(`set config(${index}) image to ${imageMsg.name}`)
        return conf
      })
    },
    getSku (index) {
      return this.getConfig(index).sku
    },
    fetchCapability (index) {
      const params = {
        show_emulated: true,
        resource_type: 'shared',
        scope: this.scope,
      }
      let id = this.getCurrentZone(index)
      let res = 'zones'
      if (!id) {
        id = this.cloudregionId
        res = 'cloudregions'
      }
      const capabilityParams = { id, spec: 'capability', params }
      this.capabilityParams = capabilityParams
      new this.$Manager(res).getSpecific(this.capabilityParams)
        .then(({ data }) => {
          this.setConfig(index, (conf) => {
            conf.capability = data
            /* console.log(`set config(${index}) capability to ${JSON.stringify(data)}`) */
            return conf
          })
        })
    },
    getCapability (index) {
      return this.getConfig(index).capability
    },
    isPublicCloud () {
      return this.platform === 'public'
    },
    isOnPremise () {
      return this.platform === 'idc'
    },
    getImageType () {
      if (this.isPublicCloud()) {
        return IMAGES_TYPE_MAP.public.key
      }
      if (this.isOnPremise()) {
        return IMAGES_TYPE_MAP.standard.key
      }
      throw Error(`Not support platform ${this.platform}`)
    },
    getImageParams () {
      return {
        distributions: ['CentOS', 'Kylin'],
        distribution_precise_match: true,
      }
    },
    getCacheImageParams () {
      if (!this.isPublicCloud()) {
        return {}
      }
      return {
        public_cloud: true,
        region: this.cloudregionId,
      }
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length)
          if (empty) {
            reject(new Error(rule.message || 'required'))
            return
          }
        }
        if (typeof rule.validator === 'function') {
          rule.validator(rule, value, (err) => {
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          })
          return
        }
        resolve()
      })
    },
    async runRules (rules, value) {
      for (const rule of rules || []) {
        await this.runFieldRule(rule, value)
      }
    },
    async validate () {
      for (const item of this.serverConfigList) {
        const key = item.key
        await this.runRules(serverConfigNetworkRules(), this.fieldVal(serverConfigField.network(key)))
        await this.runRules(serverConfigSkuRules(), this.fieldVal(serverConfigField.sku(key)))
        await this.runRules(serverConfigRoleRules(), this.fieldVal(serverConfigField.role(key)))
        await this.runRules(serverConfigNumRules(), this.fieldVal(serverConfigField.num(key)))
        if (item.ipShow) {
          await this.runRules(serverConfigIpRules(key, item.network), this.fieldVal(serverConfigField.ip(key)))
        }
        const diskRef = this.$refs[`systemDisk_${key}`]
        const disk = Array.isArray(diskRef) ? diskRef[0] : diskRef
        if (typeof disk?.validate === 'function') await disk.validate()
      }
      return true
    },
  },
}
</script>
