<template>
  <div>
    <page-header :title="$t('network.text_570')" :tabs="cloudEnvOptions" v-model:currentTab="cloudEnv" />
    <page-body>
      <a-form-model ref="formRef" class="mt-3" :model="form.fd" :rules="rules" @submit.prevent="handleSubmit" hideRequiredMark>
        <a-form-model-item :label="$t('network.text_205', [$t('dictionary.project')])" class="mt-3" prop="project">
          <domain-project :form="form.fd" @update:domain="handleDomainChange" />
        </a-form-model-item>
        <area-selects
          class="mb-0"
          ref="areaSelects"
          :model="form.fd"
          :names="areaselectsName"
          :providerParams="providerParams"
          :cloudregionParams="cloudregionParams"
          :isRequired="true"
          filterBrandResource="network_manage"
          @change="handleRegionChange" />
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input v-model:value="form.fd.name" :placeholder="$t('validator.resourceName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item label="VPC" prop="vpc">
          <base-select
            v-model:value="form.fd.vpc"
            resource="vpcs"
            :params="vpcParams"
            :isDefaultSelect="true"
            :needParams="true"
            @change="vpcChange"
            v-model:item="curVpc"
            :labelFormat="vpcLabelFormat"
            :select-props="{ placeholder: $t('common_226') }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_571')" v-if="show || isShowWire" prop="wire">
          <base-select
            resource="wires"
            v-model:value="form.fd.wire"
            :selectProps="{ 'placeholder': $t('network.text_572') }"
            :isDefaultSelect="true"
            v-model:item="curWire"
            :labelFormat="wireLabelFormat"
            :params="wireParams" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_24')" :extra="$t('network.text_573')" v-if="!show && !isShowWire" prop="zone">
          <a-select v-model:value="form.fd.zone" :placeholder="$t('network.text_287')" :filterOption="filterOption" show-search>
            <a-select-option v-for="item in zoneList" :key="item.id" :value="item.id">{{item.name}}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_574')" v-if="show" prop="server_type">
          <a-radio-group v-model:value="form.fd.server_type">
            <a-radio-button
              v-for="item of serverTypeOpts"
              :disabled="item.disabled"
              :key="item.key"
              :value="item.key">{{ item.label }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <!-- 网段 -->
        <a-form-model-item :label="$t('network.text_575')" required v-if="show">
          <template #extra>
            <div>{{$t('network.text_576')}}</div>
            <div>{{$t('network.text_577')}}</div>
          </template>
          <ip-subnets ref="ipSubnetsRef" :field-factories="fieldMap.ipSubnets" :model="form.fd" @clear-error="clearIpSubnetsError" />
          <div v-if="ipSubnetsHelp" class="error-tips">{{ ipSubnetsHelp }}</div>
        </a-form-model-item>
        <!-- 输入 网段 -->
        <a-form-model-item :label="$t('network.text_575')" :extra="$t('network.prefix_in_cidr_range.prompt', [curVpcCidrText])" v-if="!show && !isGroupGuestIpPrefix">
          <div class="guest-ip-prefix-list">
            <div class="guest-ip-prefix-row">
              <a-form-item class="mb-0" v-if="curVpc && curVpc.cidr_block">
                <a-input :value="fieldVal(fieldMap.guest_ip_prefix(0))" @update:value="v => fieldSet(fieldMap.guest_ip_prefix(0), v)" :placeholder="$t('network.ipv4.prefix.prompt')" />
              </a-form-item>
              <a-form-item class="mb-0" v-if="curVpc && curVpc.cidr_block6">
                <a-input :value="fieldVal(fieldMap.guest_ip6_prefix(0))" @update:value="v => fieldSet(fieldMap.guest_ip6_prefix(0), v)" :placeholder="$t('network.ipv6.prefix.prompt')" />
              </a-form-item>
            </div>
          </div>
          <div v-if="guestIpPrefixHelp" class="error-tips">{{ guestIpPrefixHelp }}</div>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_575')" :validate-status="guestIpPrefixValidateStatus" :help="guestIpPrefixHelp" required v-if="isGroupGuestIpPrefix">
          <template #extra>
            <div>{{$t('network.prefix_in_cidr_range.prompt', [curVpcCidrText])}}</div>
            <div>{{$t('network.text_580')}}</div>
          </template>
          <!-- 网段 -->
          <div class="guest-ip-prefix-list">
            <div class="guest-ip-prefix-row" v-for="(item, i) in guestIpPrefix" :key="item.key">
              <a-form-item class="mb-0">
                <a-input :value="fieldVal(fieldMap.guest_ip_prefix(i))" @update:value="v => fieldSet(fieldMap.guest_ip_prefix(i), v)" :placeholder="$t('network.ipv4.subnet.input.prompt')" />
              </a-form-item>
              <a-form-item class="mb-0">
                <a-input :value="fieldVal(fieldMap.guest_ip6_prefix(i))" @update:value="v => fieldSet(fieldMap.guest_ip6_prefix(i), v)" :placeholder="$t('network.ipv6.subnet.input.prompt')" />
              </a-form-item>
              <a-button
                shape="circle"
                icon="minus"
                size="small"
                class="guest-ip-prefix-row__remove"
                v-if="guestIpPrefix.length > 1"
                @click="decrease(i)" />
            </div>
          </div>
          <div class="d-flex align-items-center mt-1" v-if="remain > 0">
            <a-button type="primary" shape="circle" icon="plus" size="small" @click="addGuestIpPrefix" />
            <a-button type="link" @click="addGuestIpPrefix">{{$t('network.text_582')}}</a-button>
            <span class="count-tips">{{$t('network.text_169')}}<span class="remain-num">{{ remain }}</span>{{$t('network.text_170')}}</span>
          </div>
        </a-form-model-item>
        <a-form-model-item :label="$t('common_498')" v-if="isShowIsAutoAlloc" prop="is_auto_alloc">
          <a-switch
            v-model:checked="form.fd.is_auto_alloc"
            :checkedChildren="$t('common.text00062')"
            :unCheckedChildren="$t('common.text00063')" />
          <template #extra>{{$t('common_500')}}</template>
        </a-form-model-item>
        <a-form-model-item :label="$t('common.text00012')" class="mb-0" prop="__meta__">
          <tag
            :value="form.fd.__meta__" @change="v => { form.fd.__meta__ = v }" />
        </a-form-model-item>
        <a-collapse :bordered="false" v-if="isShowAdvanceOptions">
          <a-collapse-panel :header="$t('network.text_94')" key="1" forceRender>
            <a-form-model-item :label="$t('network.text_743')" v-if="hasBgpType" prop="bgp_type">
              <a-input v-model:value="form.fd.bgp_type" />
              <template #extra>{{$t('network.text_744')}}</template>
            </a-form-model-item>
            <a-form-model-item prop="alloc_policy">
              <template #label>{{$t('network.text_583')}}</template>
              <a-radio-group v-model:value="form.fd.alloc_policy">
                <a-radio-button
                  v-for="item of allocPolicyoptions"
                  :key="item.key"
                  :value="item.key">{{ item.label }}</a-radio-button>
              </a-radio-group>
              <template #extra v-if="form.fd.alloc_policy === 'none'">{{$t('network.text_584')}}</template>
            </a-form-model-item>
            <a-form-model-item :label="$t('network.dns_server')" prop="guest_dns">
              <a-input :placeholder="$t('validator.IPs')" v-model:value="form.fd.guest_dns" />
            </a-form-model-item>
            <a-form-model-item prop="guest_domain">
              <template #label>{{$t('network.text_586')}}</template>
              <template #extra>
                <div>{{$t('network.text_587')}}</div>
                <div>{{$t('network.text_588')}}</div>
                <div>{{$t('network.text_589')}}</div>
                <div>{{$t('network.text_590')}}</div>
              </template>
              <a-input :placeholder="$t('validator.domain')" v-model:value="form.fd.guest_domain" />
            </a-form-model-item>
            <a-form-model-item :label="$t('network.ntp_server')" prop="guest_ntp">
              <a-input :placeholder="$t('validator.IPs_or_domains')" v-model:value="form.fd.guest_ntp" />
            </a-form-model-item>
            <a-form-model-item label="dhcp_relay" v-if="show" prop="guest_dhcp">
              <a-input class="w-50" v-model:value="form.fd.guest_dhcp" :placeholder="$t('validator.IPs')" />
            </a-form-model-item>
          </a-collapse-panel>
        </a-collapse>
        <page-footer>
          <template v-slot:right>
            <a-button type="primary" html-type="submit" class="ml-3" :loading="submiting">{{$t('network.text_30')}}</a-button>
            <a-button class="ml-3" @click="() => $router.back()">{{$t('common.cancel')}}</a-button>
          </template>
        </page-footer>
      </a-form-model>
    </page-body>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import validateForm, { isRequired, REGEXP } from '@/utils/validate'
import { Manager } from '@/utils/manager'
import { uuid } from '@/utils/utils'
import { typeClouds, getCloudEnvOptions } from '@/utils/common/hypervisor'
import DomainProject from '@/sections/DomainProject/model'
import AreaSelects from '@/sections/AreaSelects/model'
import i18n from '@/locales'
import { HYPERVISORS_MAP } from '@/constants'
import Tag from '@/sections/Tag'
import { resolveFieldMeta } from '@/utils/common/ant'
import IpSubnets from './components/IpSubnets'

const { networkSegment, networkSegment6 } = REGEXP
const masks = {
  azure: { min: 8, max: 29 },
  qcloud: { min: 16, max: 28 },
  aliyun: { min: 17, max: 29 },
  aws: { min: 16, max: 28 },
  ucloud: { min: 16, max: 29 },
  rockbase: { min: 16, max: 29 },
  huawei: { min: 16, max: 29 },
  onecloud: undefined,
  vmware: undefined,
  baremetal: undefined,
  openstack: undefined,
  zstack: undefined,
  dstack: undefined,
}

const stripIpWhitespace = value => (typeof value === 'string' ? value.replace(/\s/g, '') : value)

function validateGateway (rule, value, callback) {
  value = stripIpWhitespace(value)
  if (!value) {
    return callback()
  }
  // 只需要查看是否是以 0 结尾
  const ipItems = value.split('.')
  const msg = i18n.t('network.text_591')
  if (ipItems[ipItems.length - 1] === '0') {
    return callback(msg)
  }
  return callback()
}

function validateGateway6 (rule, value, callback) {
  value = stripIpWhitespace(value)
  if (!value) {
    return callback()
  }
  // 只需要查看是否是以 0 结尾
  const ipItems = value.split(':')
  const msg = i18n.t('network.text_591')
  if (ipItems[ipItems.length - 1] === '0') {
    return callback(msg)
  }
  return callback()
}

export default {
  name: 'NetworkCreate',
  components: {
    IpSubnets,
    DomainProject,
    AreaSelects,
    Tag,
  },
  data () {
    const cloudEnvOptions = getCloudEnvOptions('network_manage_brands', true)
    const { vpc: initVpc, wire: initWire, domain: initDomain, project: initProject, type: queryType } = this.$route.query
    let cloudEnv = queryType === 'idc' ? 'onpremise' : this.$route.query.type
    let routerQuery = this.$route.query.type
    if (!cloudEnvOptions.find(val => val.key === cloudEnv)) {
      cloudEnv = cloudEnvOptions[0].key
      routerQuery = cloudEnv === 'onpremise' ? 'idc' : cloudEnv
    }
    const prefixKey = uuid()
    return {
      submiting: false,
      cloudEnvOptions,
      cloudEnv,
      routerQuery,
      form: {
        fd: {
          guest_ip_prefix: { 0: '' },
          guest_ip6_prefix: { 0: '' },
          domain: initDomain,
          project: initProject,
          name: '',
          description: undefined,
          vpc: initVpc,
          wire: initWire,
          zone: undefined,
          server_type: '',
          is_auto_alloc: undefined,
          __meta__: undefined,
          bgp_type: undefined,
          alloc_policy: 'none',
          guest_dns: '',
          guest_domain: '',
          guest_ntp: '',
          guest_dhcp: undefined,
          provider: undefined,
          cloudregion: undefined,
        },
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('resourceName') },
        ],
        vpc: [
          { required: true, message: this.$t('common_226') },
        ],
        project: [
          { validator: isRequired(), message: this.$t('dictionary.project'), trigger: 'change' },
        ],
        domain: [
          { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
        ],
        wire: [
          { required: true, message: this.$t('network.text_572') },
        ],
        zone: [
          { required: true, message: this.$t('network.text_287') },
        ],
        server_type: [
          { required: true, message: this.$t('network.text_592') },
        ],
        guest_dns: [
          { validator: this.$validate('IPs', false) },
        ],
        guest_domain: [
          { validator: this.$validate('domain', false) },
        ],
        guest_ntp: [
          { validator: this.$validate('IPs_or_domains', false) },
        ],
        guest_dhcp: [
          { validator: this.$validate('IPs', false) },
        ],
        __meta__: [
          { validator: validateForm('tagName') },
        ],
      },
      ipSubnetsValidateStatus: '',
      guestIpPrefixValidateStatus: '',
      ipSubnetsHelp: '',
      guestIpPrefixHelp: '',
      fieldMap: {
        domain: {
          name: 'domain',
          initialValue: initDomain,
          rules: [
            { validator: isRequired(), message: i18n.t('rules.domain'), trigger: 'change' },
          ],
        },
        project: {
          name: 'project',
          initialValue: initProject,
          rules: [
            { validator: isRequired(), message: i18n.t('rules.project'), trigger: 'change' },
          ],
        },
        name: {
          name: 'name',
          initialValue: '',
          validateFirst: true,
          rules: [
            { required: true, message: this.$t('network.text_116') },
            { validator: this.$validate('resourceName') },
          ],
        },
        description: { name: 'description' },
        vpc: {
          name: 'vpc',
          initialValue: initVpc,
          rules: [
            { required: true, message: this.$t('network.text_274') },
          ],
        },
        wire: {
          name: 'wire',
          initialValue: initWire,
          rules: [
            { required: true, message: this.$t('network.text_572') },
          ],
        },
        zone: {
          name: 'zone',
          rules: [
            { required: true, message: this.$t('network.text_287') },
          ],
        },
        server_type: {
          name: 'server_type',
          initialValue: '',
          rules: [
            { required: true, message: this.$t('network.text_592') },
          ],
        },
        alloc_policy: { name: 'alloc_policy', initialValue: 'none' },
        guest_dns: {
          name: 'guest_dns',
          initialValue: '',
          validateTrigger: ['change', 'blur'],
          normalize: stripIpWhitespace,
          rules: [
            { validator: this.$validate('IPs', false) },
          ],
        },
        guest_domain: {
          name: 'guest_domain',
          initialValue: '',
          rules: [
            { validator: this.$validate('domain', false) },
          ],
        },
        guest_ntp: {
          name: 'guest_ntp',
          initialValue: '',
          validateTrigger: ['change', 'blur'],
          rules: [
            { validator: this.$validate('IPs_or_domains', false) },
          ],
        },
        ipSubnets: {
          startip: i => ({
            name: `startip[${i}]`,
            initialValue: '',
            validateFirst: true,
            normalize: stripIpWhitespace,
            rules: [
              // { required: true, message: this.$t('network.text_593') },
              { validator: this.validateIpv4 },
            ],
          }),
          endip: i => ({
            name: `endip[${i}]`,
            initialValue: '',
            validateFirst: true,
            normalize: stripIpWhitespace,
            rules: [
              // { required: true, message: this.$t('network.text_594') },
              { validator: this.validateIpv4 },
            ],
          }),
          netmask: i => ({
            name: `netmask[${i}]`,
            initialValue: '24',
            rules: [
              { required: true, message: this.$t('network.text_595') },
            ],
          }),
          gateway: i => ({
            name: `gateway[${i}]`,
            initialValue: '',
            validateTrigger: ['change', 'blur'],
            validateFirst: true,
            normalize: stripIpWhitespace,
            rules: [
              { validator: this.validateIpv4 },
              { validator: validateGateway },
            ],
          }),
          startip6: i => ({
            name: `startip6[${i}]`,
            initialValue: '',
            validateFirst: true,
            normalize: stripIpWhitespace,
            rules: [
              { validator: this.validateIpv6 },
            ],
          }),
          endip6: i => ({
            name: `endip6[${i}]`,
            initialValue: '',
            validateFirst: true,
            normalize: stripIpWhitespace,
            rules: [
              { validator: this.validateIpv6 },
            ],
          }),
          netmask6: i => ({
            name: `netmask6[${i}]`,
            initialValue: '64',
            rules: [
              { required: true, message: this.$t('network.text_595') },
            ],
          }),
          gateway6: i => ({
            name: `gateway6[${i}]`,
            initialValue: '',
            validateTrigger: ['change', 'blur'],
            validateFirst: true,
            normalize: stripIpWhitespace,
            rules: [
              { validator: this.validateIpv6 },
              { validator: validateGateway6 },
            ],
          }),
          vlan: i => ({ name: `vlan[${i}]`, initialValue: '' }),
        },
        guest_ip_prefix: i => ({
          name: `guest_ip_prefix[${i}]`,
          initialValue: '',
          validateFirst: true,
          normalize: stripIpWhitespace,
          rules: [
            { validator: this.validatePublicIpPrefix },
          ],
        }),
        guest_ip6_prefix: i => ({
          name: `guest_ip6_prefix[${i}]`,
          initialValue: '',
          validateFirst: true,
          normalize: stripIpWhitespace,
          rules: [
            { validator: this.validatePublicIpPrefix6 },
          ],
        }),
        guest_dhcp: {
          name: 'guest_dhcp',
          validateFirst: true,
          normalize: stripIpWhitespace,
          rules: [
            { validator: this.$validate('IPs', false) },
          ],
        },
        is_auto_alloc: { name: 'is_auto_alloc', valuePropName: 'checked' },
        bgp_type: { name: 'bgp_type' },
        __meta__: {
          name: '__meta__',
          rules: [
            { validator: validateForm('tagName') },
          ],
        },
      },
      allocPolicyoptions: [
        { label: this.$t('network.text_600'), key: 'none' },
        { label: this.$t('network.text_601'), key: 'stepdown' },
        { label: this.$t('network.text_602'), key: 'stepup' },
        { label: this.$t('network.text_603'), key: 'random' },
      ],
      isShowWire: true,
      isGroupGuestIpPrefix: false,
      show: true,
      regionProvider: '',
      regionId: '',
      guestIpPrefix: [{ key: prefixKey }],
      guestIp6Prefix: [{ key: prefixKey }],
      zoneList: [],
      project_domain: '',
      vpcId: '',
      curVpc: null,
      curWire: null,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
    // 是否显示加入自动分配地址池
    isShowIsAutoAlloc () {
      const { vpc, server_type } = this.form.fd
      if (this.cloudEnv === 'onpremise' && vpc === 'default') {
        return ['guest', undefined].includes(server_type)
      }
      return true
    },
    // 是否显示高级配置
    isShowAdvanceOptions () {
      return this.cloudEnv === 'onpremise'
    },
    remain () {
      const remain = 6 - this.guestIpPrefix.length
      return Math.max(remain, 0)
    },
    vpcParams () {
      const params = {
        limit: 0,
        usable_vpc: true,
        scope: this.scope,
        cloudregion_id: this.regionId,
      }
      if (this.cloudEnv === 'private') {
        params.show_emulated = true
      }
      if (this.isAdminMode) {
        params.project_domain = this.project_domain
        delete params.scope
      }
      if (!this.regionId) return {}
      return params
    },
    cloudregionParams () {
      const params = {
        scope: this.scope,
        limit: 0,
        is_on_premise: true,
        // usable_vpc: true,
        show_emulated: true,
        usable: false,
      }
      if (this.cloudEnv === 'private') {
        params.is_private = true
        delete params.is_public
        delete params.is_on_premise
      } else if (this.cloudEnv === 'public') {
        params.is_public = true
        delete params.is_private
        delete params.is_on_premise
      } else {
        params.is_on_premise = true
        delete params.is_private
        delete params.is_public
      }
      if (this.isAdminMode) {
        params.project_domain = this.project_domain
        delete params.scope
      }
      return params
    },
    wireParams () {
      const params = {
        scope: this.scope,
        vpcId: this.vpcId,
      }
      if (this.isAdminMode) {
        params.project_domain = this.project_domain
        delete params.scope
      }
      return params
    },
    zoneParams () {
      const params = {
        scope: this.scope,
        show_emulated: true,
        'filter.0': 'status.equals(enable)',
        order: 'asc',
        order_by: 'external_id',
      }
      if (this.isAdminMode) {
        params.project_domain = this.project_domain
        delete params.scope
      }
      return params
    },
    areaselectsName () {
      if (this.cloudEnv === 'private' || this.cloudEnv === 'onpremise') {
        return ['cloudregion']
      }
      return ['provider', 'cloudregion']
    },
    providerParams () {
      return {
        cloud_env: 'public',
        usable: false,
        usable_vpc: true,
        project_domain: this.form.fd.domain?.key,
        filter: 'provider.notequals("Google")',
      }
    },
    curVpcCidrText () {
      const cidrs = []
      if (this.curVpc?.cidr_block) {
        cidrs.push(this.curVpc.cidr_block)
      }
      if (this.curVpc?.cidr_block6) {
        cidrs.push(this.curVpc.cidr_block6)
      }
      return cidrs.join(', ')
    },
    hasBgpType () {
      return this.form.fd.server_type === 'eip' || this.form.fd.server_type === 'guest' || this.form.fd.server_type === 'baremetal' || this.form.fd.server_type === 'hostlocal'
    },
    serverTypeOpts () {
      const opts = [
        { label: this.$t('network.text_226'), key: 'guest', disabled: false },
        { label: this.$t('network.text_598'), key: 'baremetal', disabled: false },
        // { label: this.$t('network.text_599'), key: 'container' },
        { label: 'PXE', key: 'pxe', disabled: false },
        { label: 'IPMI', key: 'ipmi', disabled: false },
        { label: this.$t('network.text_221'), key: 'eip', disabled: false },
        { label: this.$t('network.server_type.hostlocal.text'), key: 'hostlocal', disabled: false },
      ]
      const isHostLocalWire = this.curWire?.id === '__host_local__'
      for (let i = 0; i < opts.length; i++) {
        if (opts[i].key === 'hostlocal') {
          if (isHostLocalWire) {
            opts[i].disabled = false
          } else {
            opts[i].disabled = true
          }
        } else {
          if (isHostLocalWire) {
            opts[i].disabled = true
          } else {
            opts[i].disabled = false
          }
        }
      }
      return opts
    },
  },
  provide () {
    return {
      form: this.form,
    }
  },
  watch: {
    cloudEnv (newValue) {
      this.$refs.areaSelects.fetchs(this.areaselectsName)
      if (newValue === 'private') {
        this.show = false
        this.isGroupGuestIpPrefix = false
      } else if (newValue === 'public') {
        this.show = false
        this.isGroupGuestIpPrefix = false
      } else {
        this.show = true
        this.isGroupGuestIpPrefix = !this.isDefaultVpc()
      }
    },
    'form.fd.guest_ip_prefix': {
      handler (newValue) {
        if (!newValue) return
        const list = Array.isArray(newValue) ? newValue : Object.values(newValue)
        if (list.filter(item => item).length > 0) {
          this.guestIpPrefixHelp = ''
        }
      },
    },
    'form.fd.guest_ip6_prefix': {
      handler (newValue) {
        if (!newValue) return
        const list = Array.isArray(newValue) ? newValue : Object.values(newValue)
        if (list.filter(item => item).length > 0) {
          this.guestIpPrefixHelp = ''
        }
      },
    },
    'form.fd.vpc': {
      handler (newValue) {
        if (newValue === 'default') {
          this.$nextTick(() => {
            if (this.curWire?.id === '__host_local__') {
              this.form.fd.server_type = 'hostlocal'
            } else {
              this.form.fd.server_type = 'guest'
            }
          })
        }
      },
    },
    'form.fd.wire': {
      handler (newValue) {
        if (newValue === '__host_local__') {
          this.$nextTick(() => {
            this.form.fd.server_type = 'hostlocal'
          })
        } else {
          this.$nextTick(() => {
            this.form.fd.server_type = 'guest'
          })
        }
      },
    },
  },
  created () {
    this.initState()
  },
  methods: {
    parseBracketName (name) {
      const m = typeof name === 'string' && name.match(/^(\w+)\[([^\]]+)\]$/)
      if (!m) return null
      return { root: m[1], key: m[2] }
    },
    fieldVal (fieldTuple) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return undefined
      const { name, ...opts } = meta
      const target = this.form?.fd
      if (!target) return opts.initialValue
      const nested = this.parseBracketName(name)
      let v
      if (nested && target[nested.root] != null && typeof target[nested.root] === 'object') {
        v = target[nested.root][nested.key]
      } else if (Object.prototype.hasOwnProperty.call(target, name)) {
        v = target[name]
      }
      if (v !== undefined) return v
      return opts.initialValue
    },
    fieldSet (fieldTuple, value) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return
      const { name } = meta
      const target = this.form?.fd
      if (!target) return
      const nested = this.parseBracketName(name)
      if (nested) {
        if (!target[nested.root] || typeof target[nested.root] !== 'object') {
          this.$set(target, nested.root, {})
        }
        this.$set(target[nested.root], nested.key, value)
      } else {
        this.$set(target, name, value)
      }
    },
    validateIpv4 (rule, value, callback) {
      value = stripIpWhitespace(value)
      if (!value) {
        return callback()
      }
      if (!REGEXP.IPv4.regexp.test(value)) {
        return callback(new Error(this.$t('common.tips.input', ['IPv4'])))
      }
      callback()
    },
    validateIpv6 (rule, value, callback) {
      value = stripIpWhitespace(value)
      if (!value) {
        return callback()
      }
      if (!REGEXP.IPv6.regexp.test(value)) {
        return callback(new Error(this.$t('common.tips.input', ['IPv6'])))
      }
      callback()
    },
    validateDhcpRelay (rule, value, callback) {
      if (!value) {
        callback()
      } else if (!REGEXP.IPv4s.regexp.test(value)) {
        callback(new Error(this.$t('common.tips.input', ['IPv4'])))
      }
      callback()
    },
    validateDhcpRelay6 (rule, value, callback) {
      if (!value) {
        callback()
      } else if (!REGEXP.IPv6s.regexp.test(value)) {
        callback(new Error(this.$t('common.tips.input', ['IPv6'])))
      }
      callback()
    },
    // curVpc 在 created 时尚为空，需回退到表单值 / 路由 query，避免把 default 误判成 VPC 网段模式
    isDefaultVpc () {
      const vpcId = this.curVpc?.id || this.form.fd?.vpc || this.$route.query.vpc
      return !vpcId || vpcId === 'default'
    },
    initState () {
      if (this.cloudEnv === 'private') {
        this.show = false
        this.isGroupGuestIpPrefix = false
      } else if (this.cloudEnv === 'public') {
        this.show = false
        this.isGroupGuestIpPrefix = false
      } else {
        this.show = true
        this.isGroupGuestIpPrefix = !this.isDefaultVpc()
      }
    },
    wireLabelFormat (item) {
      if (item) {
        const { name, zone } = item
        return this.$createElement('div', { class: 'd-flex' }, [
          this.$createElement('span', {
            class: 'text-truncate flex-fill mr-2',
            attrs: { title: name },
          }, name),
          this.$createElement('span', {
            style: 'color: #8492a6; font-size: 13px',
          }, '可用区:' + zone),
        ])
      }
      return null
    },
    handleDomainChange (val) {
      this.project_domain = val.key
    },
    addGuestIpPrefix () {
      this.clearGuestIpPrefixError()
      const key = uuid()
      const i = this.guestIpPrefix.length
      this.guestIpPrefix.push({
        key,
      })
      this.guestIp6Prefix.push({
        key,
      })
      if (!this.form.fd.guest_ip_prefix || typeof this.form.fd.guest_ip_prefix !== 'object') {
        this.$set(this.form.fd, 'guest_ip_prefix', {})
      }
      if (!this.form.fd.guest_ip6_prefix || typeof this.form.fd.guest_ip6_prefix !== 'object') {
        this.$set(this.form.fd, 'guest_ip6_prefix', {})
      }
      this.$set(this.form.fd.guest_ip_prefix, i, '')
      this.$set(this.form.fd.guest_ip6_prefix, i, '')
    },
    decrease (index) {
      this.guestIpPrefix.splice(index, 1)
      this.guestIp6Prefix.splice(index, 1)
    },
    handleRegionChange (data) {
      const hasCloudRegion = R.has('cloudregion')(data)
      if (hasCloudRegion && !R.isEmpty(data.cloudregion)) {
        this.fetchZone(data.cloudregion.id)
      } else {
        this.zoneList = []
        this.form.fd.zone = undefined
        return
      }
      const { provider } = data.cloudregion.value
      this.regionProvider = provider
      this.regionId = data.cloudregion.id
      if (provider === typeClouds.providerMap.ZStack.key || provider === typeClouds.providerMap.CNware.key) {
        this.isShowWire = true
      } else {
        this.isShowWire = false
      }
    },
    vpcChange (vpcId) {
      this.vpcId = vpcId
      this.show = false
      if (this.cloudEnv === 'onpremise') {
        if (vpcId !== 'default') { // vpc network
          this.isGroupGuestIpPrefix = true
          this.show = false
        } else { // classic network
          this.isGroupGuestIpPrefix = false
          this.show = true
          this.form.fd.server_type = 'guest'
        }
      } else if (this.cloudEnv === 'private' && this.curVpc?.brand === 'Cloudpods' && this.curVpc?.external_id === 'default') {
        this.isShowWire = true
        this.isGroupGuestIpPrefix = true
      } else {
        this.isShowWire = false
        this.isGroupGuestIpPrefix = false
      }
    },
    vpcLabelFormat (item) {
      const h = this.$createElement
      if (this.cloudEnv === 'public' || this.regionProvider === HYPERVISORS_MAP.hcso.provider || this.regionProvider === HYPERVISORS_MAP.hcs.provider) {
        if (item.manager) {
          if (item.cidr_block || item.cidr_block6) {
            const children = [item.name]
            if (item.cidr_block) children.push(h('span', '（' + item.cidr_block + '）'))
            if (item.cidr_block6) children.push(h('span', '（' + item.cidr_block6 + '）'))
            children.push(h('span', { class: 'ml-2 text-color-secondary' }, this.$t('common.cloudprovider_1var', [item.manager])))
            return h('div', children)
          }
          return h('div', [
            item.name,
            h('span', { class: 'ml-2 text-color-secondary' }, this.$t('common.cloudprovider_1var', [item.manager])),
          ])
        }
      } else if (this.cloudEnv === 'onpremise') {
        if (item.cidr_block || item.cidr_block6) {
          const cidrs = []
          if (item.cidr_block) cidrs.push(item.cidr_block)
          if (item.cidr_block6) cidrs.push(item.cidr_block6)
          return h('div', item.name + ' (' + cidrs.join(', ') + ')')
        }
        if (item.id === 'default') {
          const children = [item.name]
          if (item.cidr_block) children.push(h('span', '（' + this.$t('common.text00047') + '）'))
          return h('div', children)
        }
      }
      return h('div', item.name)
    },
    validatePublicIpPrefix (rule, value, callback) {
      value = stripIpWhitespace(value)
      if (value) {
        if (!networkSegment.regexp.test(value)) {
          callback(new Error(networkSegment.message))
        }
        const maskNum = (value && value.split('/').length > 1) ? value.split('/')[1] : null
        const publicWire = this.form.fd.cloudregion
        if (maskNum && publicWire && publicWire.provider) {
          const provider = publicWire.provider.toLowerCase()
          if (masks[provider]) {
            const min = masks[provider].min
            const max = masks[provider].max
            if (masks[provider] && (maskNum < min || maskNum > max)) {
              callback(new Error(this.$t('network.ipaddr.mask.error', [min, max])))
            }
          }
        }
      }
      callback()
    },
    validatePublicIpPrefix6 (rule, value, callback) {
      value = stripIpWhitespace(value)
      if (value) {
        if (!networkSegment6.regexp.test(value)) {
          callback(new Error(networkSegment6.message))
          return
        }
        const maskNum = (value && value.split('/').length > 1) ? value.split('/')[1] : null
        const min = 64
        const max = 124
        if (maskNum < min || maskNum > max) {
          callback(new Error(this.$t('network.ipaddr.mask.error', [min, max])))
          return
        }
      }
      callback()
    },
    fetchZone (regionId) {
      new this.$Manager('cloudregions')
        .getSpecific({ id: regionId, spec: 'zones', params: this.zoneParams })
        .then(({ data: { data = [] } }) => {
          this.form.fd.zone = undefined
          this.zoneList = data
        })
    },
    genData (values) {
      const guest_dhcp = values.guest_dhcp
      if (this.cloudEnv === 'onpremise') {
        const data = []
        if (this.isGroupGuestIpPrefix) {
          R.forEachObjIndexed((value, key) => {
            const obj = {
              alloc_policy: values.alloc_policy,
              guest_dns: values.guest_dns,
              guest_domain: values.guest_domain,
              guest_ntp: values.guest_ntp,
              guest_ip_prefix: value,
              guest_ip6_prefix: values.guest_ip6_prefix && values.guest_ip6_prefix[key],
              name: values.name,
              description: values.description,
              vpc: values.vpc,
              zone: values.zone,
              project_id: values.project?.key,
              is_auto_alloc: values.is_auto_alloc,
              guest_dhcp,
              __meta__: values.__meta__,
            }
            data.push(obj)
          }, values.guest_ip_prefix)
        } else if (this.show) {
          R.forEachObjIndexed((value, key) => {
            const vlanVal = values.vlan?.[key]
            const obj = {
              bgp_type: values.bgp_type,
              alloc_policy: values.alloc_policy,
              guest_dns: values.guest_dns,
              guest_domain: values.guest_domain,
              guest_ntp: values.guest_ntp,
              guest_ip_start: values.startip?.[key],
              guest_ip_end: values.endip?.[key],
              guest_ip_mask: values.netmask?.[key],
              guest_gateway: values.gateway?.[key],
              guest_ip6_start: values.startip6?.[key],
              guest_ip6_end: values.endip6?.[key],
              guest_ip6_mask: values.netmask6?.[key],
              guest_gateway6: values.gateway6?.[key],
              vlan_id: (vlanVal === '' || vlanVal == null) ? '1' : vlanVal,
              name: values.name,
              description: values.description,
              project_id: values.project?.key,
              server_type: values.server_type,
              wire_id: values.wire,
              is_auto_alloc: values.is_auto_alloc,
              guest_dhcp,
              __meta__: values.__meta__,
            }
            data.push(obj)
          }, values.startip || {})
        } else {
          var ipPrefix = null
          var ip6Prefix = null
          if (values.guest_ip_prefix) {
            ipPrefix = values.guest_ip_prefix[0]
            if (values.guest_ip6_prefix) {
              ip6Prefix = values.guest_ip6_prefix[0]
            }
          } else if (values.guest_ip6_prefix) {
            ip6Prefix = values.guest_ip6_prefix[0]
          }
          const obj = {
            alloc_policy: values.alloc_policy,
            guest_dns: values.guest_dns,
            guest_domain: values.guest_domain,
            guest_ntp: values.guest_ntp,
            name: values.name,
            description: values.description,
            vpc: values.vpc,
            zone: values.zone,
            project_id: values.project?.key,
            is_auto_alloc: values.is_auto_alloc,
            guest_dhcp,
            __meta__: values.__meta__,
          }
          if (ipPrefix) {
            obj.guest_ip_prefix = ipPrefix
          }
          if (ip6Prefix) {
            obj.guest_ip6_prefix = ip6Prefix
          }
          data.push(obj)
        }
        return data
      }
      if (this.regionProvider === typeClouds.providerMap.ZStack.key ||
        (this.cloudEnv === 'private' && this.curVpc?.brand === 'Cloudpods' && this.curVpc?.external_id === 'default')) {
        return {
          project_id: values.project?.key,
          guest_ip_prefix: values.guest_ip_prefix[0],
          guest_ip6_prefix: values.guest_ip6_prefix[0],
          name: values.name,
          description: values.description,
          wire_id: values.wire,
          is_auto_alloc: values.is_auto_alloc,
          guest_dhcp,
          __meta__: values.__meta__,
        }
      } else if (this.regionProvider === typeClouds.providerMap.CNware.key) {
        return {
          project_id: values.project?.key,
          guest_ip_prefix: values.guest_ip_prefix && values.guest_ip_prefix[0],
          guest_ip6_prefix: values.guest_ip6_prefix && values.guest_ip6_prefix[0],
          name: values.name,
          wire_id: values.wire,
          description: values.description,
          vpc: values.vpc,
          zone: values?.zone,
          is_auto_alloc: values.is_auto_alloc,
          guest_dhcp,
          __meta__: values.__meta__,
        }
      }
      return {
        project_id: values.project?.key,
        guest_ip_prefix: values.guest_ip_prefix && values.guest_ip_prefix[0],
        guest_ip6_prefix: values.guest_ip6_prefix && values.guest_ip6_prefix[0],
        name: values.name,
        description: values.description,
        vpc: values.vpc,
        zone: values?.zone,
        is_auto_alloc: values.is_auto_alloc,
        guest_dhcp,
        __meta__: values.__meta__,
      }
    },
    clearIpSubnetsError () {
      this.ipSubnetsValidateStatus = ''
      this.ipSubnetsHelp = ''
    },
    clearGuestIpPrefixError () {
      this.guestIpPrefixValidateStatus = ''
      this.guestIpPrefixHelp = ''
    },
    async validateFormRef () {
      try {
        await this.$refs.formRef.validate()
      } catch (error) {
        // antdv4：校验过程中 model 变更会抛 outOfDate 且无字段错误，忽略后重试一次
        if (error?.outOfDate && !(error.errorFields && error.errorFields.length)) {
          await this.$nextTick()
          await this.$refs.formRef.validate()
          return
        }
        throw error
      }
    },
    async handleSubmit () {
      try {
        await this.validateFormRef()
        if (typeof this.$refs.areaSelects?.validate === 'function') {
          await this.$refs.areaSelects.validate()
        }
        if (this.show && typeof this.$refs.ipSubnetsRef?.validate === 'function') {
          await this.$refs.ipSubnetsRef.validate()
        }
        const values = { ...this.form.fd }
        this.submiting = true
        if (this.cloudEnv === 'onpremise' && this.show && !this.isGroupGuestIpPrefix) {
          const keys = Object.keys(values.startip || {})
          let error = false
          keys.forEach(key => {
            if (!((values.startip[key] && values.endip[key] && values.gateway[key] && !values.startip6?.[key] && !values.endip6?.[key] && !values.gateway6?.[key]) || (values.startip6?.[key] && values.endip6?.[key] && values.gateway6?.[key] && !values.startip[key] && !values.endip[key] && !values.gateway[key]) || (values.startip[key] && values.endip[key] && values.gateway[key] && values.startip6?.[key] && values.endip6?.[key] && values.gateway6?.[key]))) {
              error = true
            }
          })
          if (error) {
            this.ipSubnetsHelp = this.$t('network.required_ipv4_or_ipv6_1')
            return
          }
        }
        // 验证ipv4 和 ipv6 网段 有一个必填
        if (!this.show && !this.isGroupGuestIpPrefix) {
          const guest_ip_prefix = R.is(Array, values.guest_ip_prefix) ? values.guest_ip_prefix[0] : values.guest_ip_prefix
          const guest_ip_prefix6 = R.is(Array, values.guest_ip6_prefix) ? values.guest_ip6_prefix[0] : values.guest_ip6_prefix
          if (!guest_ip_prefix && !guest_ip_prefix6) {
            this.guestIpPrefixValidateStatus = 'error'
            if (this.curVpc && this.curVpc.cidr_block && this.curVpc.cidr_block6) {
              this.guestIpPrefixHelp = this.$t('network.required_ipv4_or_ipv6')
            } else {
              this.guestIpPrefixHelp = this.$t('network.text_597')
            }
            return
          }
        }
        if (this.isGroupGuestIpPrefix && (R.isNil(values.guest_ip_prefix) || R.isEmpty(values.guest_ip_prefix))) {
          this.guestIpPrefixValidateStatus = 'error'
          this.guestIpPrefixHelp = this.$t('network.text_605')
          return
        }
        this.guestIpPrefixHelp = ''
        this.ipSubnetsHelp = ''
        const data = this.genData(values)
        const manager = new Manager('networks')
        if (this.cloudEnv === 'onpremise') {
          for (let i = 0, len = data.length; i < len; i++) {
            const bodyData = { ...data[i] }
            if (i > 0) {
              bodyData.name = `${bodyData.name}-${i + 1}`
            }
            await manager.create({
              data: {
                ...bodyData,
                dry_run: true,
              },
            })
            await manager.create({ data: bodyData })
          }
        } else {
          await manager.create({ data })
        }
        // vue-router 4：resolve 无 .resolved，按路径去掉 /create 回到列表
        const listPath = (this.$route.path || '').replace(/\/create\/?$/, '') || '/network'
        this.$router.push({ path: listPath })
      } catch (error) {
        // 表单校验失败（含 outOfDate）不向上抛，避免 vue errorHandler 噪音；字段错误由表单自身展示
        if (error?.errorFields || error?.outOfDate) return
        throw error
      } finally {
        this.submiting = false
      }
    },
    filterOption (input, option) {
      const lastIdx = option.componentOptions.children.length - 1
      return (
        option.componentOptions.children[lastIdx].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
  },
}
</script>

<style lang="less" scoped>
.error-tips {
  color: #f5222d;
  margin-bottom: 3px;
  line-height: 16px;
}

.guest-ip-prefix-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 720px;
  min-width: 0;
}

.guest-ip-prefix-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 28px;
  gap: 8px;
  align-items: center;
  min-width: 0;

  :deep(.ant-form-item) {
    margin-bottom: 0;
    min-width: 0;
  }

  :deep(.ant-input) {
    width: 100%;
  }
}

.guest-ip-prefix-row__remove {
  justify-self: center;
}
</style>
