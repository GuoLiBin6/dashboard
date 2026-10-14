<template>
  <div>
    <page-header :title="$t('common_661')" :tabs="cloudEnvOptions" v-model:currentTab="cloudEnv" />
    <page-body>
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout"
        hideRequiredMark>
        <a-form-model-item :label="$t('network.text_205', [$t('dictionary.project')])" v-if="isAdminMode" prop="project">
          <domain-project
            :form="form"
            :labelInValue="false"
            @update:domain="domainChange" />
        </a-form-model-item>
        <a-form-model-item v-if="cloudEnv === 'public'" :label="$t('dictionary.cloudaccount')" class="mb-0">
          <a-row :gutter="8" class="w-100">
            <a-col :span="12">
              <a-form-model-item :wrapperCol="{ span: 24 }" prop="brand">
                <a-select
                  v-model:value="form.brand"
                  :allowClear="allowClear"
                  class="w-100"
                  style="width:100%"
                  :placeholder="$t('rules.provider')"
                  showSearch
                  @change="brandChange">
                  <a-select-option v-for="item of brandOpts" :value="item.key" :key="item.key">{{ item.label }}</a-select-option>
                </a-select>
              </a-form-model-item>
            </a-col>
            <a-col :span="12">
              <a-form-model-item :wrapperCol="{ span: 24 }" prop="account">
                <base-select
                  v-model="form.account"
                  :remote="true"
                  class="w-100"
                  :needParams="true"
                  resource="cloudaccounts"
                  isDefaultSelect
                  :params="accountParams"
                  :remote-fn="q => ({ filter: `name.contains(${q})` })"
                  :select-props="{ placeholder: $t('rules.cloudaccount') }"
                  @update:item="handleAccountChange" />
              </a-form-model-item>
            </a-col>
          </a-row>
        </a-form-model-item>
        <a-form-model-item v-if="cloudEnv === 'public'" :label="$t('compute.text_15')" prop="cloudprovider">
          <base-select
            v-model="form.cloudprovider"
            resource="cloudproviders"
            :params="cloudproviderParams"
            :isDefaultSelect="true"
            :showSync="true"
            :select-props="{ placeholder: $t('common_588') }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_717')" prop="zoneType">
          <a-select v-model:value="form.zoneType" @change="zoneTypeChangeHandle">
            <a-select-option v-for="v in zoneTypes" :value="v.value" :key="v.value">
              <div>{{ v.label }}<span class="ml-2">{{ v.desc }}</span></div>
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_156')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_157')" />
        </a-form-model-item>
        <a-form-model-item label="VPC" v-if="cloudEnv === 'public' && form.zoneType === 'PrivateZone'" prop="vpc_ids">
          <base-select
            v-model="form.vpc_ids"
            resource="vpcs"
            remote
            :params="vpcParams"
            :needParams="true"
            :labelFormat="vpcLabelFormat"
            :select-props="{ placeholder: $t('common_226'), mode: 'multiple' }"
            :remote-fn="q => ({ filter: `name.contains(${q})` })" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea v-model:value="form.description" :auto-size="{ minRows: 1, maxRows: 3 }" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.text00012')" class="mb-0" prop="__meta__">
          <tag :value="form.__meta__" @change="v => { form.__meta__ = v }" />
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <template #right>
        <a-button class="mr-3" type="primary" :loading="loading" @click="handleConfirm">{{ $t('dialog.ok') }}</a-button>
        <a-button @click="cancel">{{ $t('dialog.cancel') }}</a-button>
      </template>
    </page-footer>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters } from 'vuex'
import { HYPERVISORS_MAP } from '@/constants'
import DomainProject from '@/sections/DomainProject/model'
import validateForm, { validate } from '@/utils/validate'
import { getCloudEnvOptions } from '@/utils/common/hypervisor'
import Tag from '@/sections/Tag'
import { zoneTypes } from '../constants'

export default {
  name: 'DnsZoneCreate',
  components: {
    DomainProject,
    Tag,
  },
  data () {
    const cloudEnvOptions = getCloudEnvOptions('compute_engine_brands').filter(val => ['onpremise', 'public'].includes(val.key))
    const cloudEnv = this.$route.params?.cloudEnv || _.get(cloudEnvOptions, '[0].key')
    const zoneType = zoneTypes[0].value
    return {
      loading: false,
      cloudEnvOptions,
      cloudEnv,
      allowClear: true,
      form: {
        domain: undefined,
        project: undefined,
        brand: '',
        account: '',
        cloudprovider: '',
        zoneType,
        name: '',
        description: '',
        vpc_ids: undefined,
        __meta__: {},
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
      brandOpts: [],
      domainId: '',
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'capability']),
    rules () {
      const rules = {
        name: [
          { required: true, message: this.$t('network.text_157'), trigger: 'blur' },
          { validator: this.checkDomainHandle, trigger: 'blur' },
        ],
        zoneType: [
          { required: true, message: this.$t('network.text_717'), trigger: 'change' },
        ],
        __meta__: [
          { validator: validateForm('tagName'), trigger: 'change' },
        ],
      }
      if (this.cloudEnv === 'public') {
        rules.brand = [{ required: true, message: this.$t('rules.brand'), trigger: 'change' }]
        rules.account = [{ required: true, message: this.$t('rules.cloudaccount'), trigger: 'change' }]
        rules.cloudprovider = [{ required: true, message: this.$t('common_588'), trigger: 'change' }]
        if (this.form.zoneType === 'PrivateZone') {
          rules.vpc_ids = [{ required: true, message: this.$t('network.text_274'), trigger: 'change' }]
        }
      }
      return rules
    },
    vpcParams () {
      const params = {
        limit: 20,
        usable_vpc: true,
        scope: this.scope,
      }
      if (this.isAdminMode && this.domainId) {
        params.project_domain = this.domainId
        delete params.scope
      }
      if (this.form.brand) {
        params.brand = this.form.brand
      }
      return params
    },
    zoneTypes () {
      if (this.cloudEnv === 'onpremise') {
        return zoneTypes.filter(item => item.value === 'PrivateZone')
      }
      if (this.isCloudflare || !this.cloudEnv) {
        return zoneTypes.filter(item => item.value === 'PublicZone')
      }
      return zoneTypes
    },
    accountParams () {
      return {
        scope: this.$store.getters.scope,
        provider: this.form.brand,
        limit: 20,
      }
    },
    cloudproviderParams () {
      return {
        scope: this.$store.getters.scope,
        read_only: false,
        cloudaccount_id: this.form.account,
      }
    },
    isCloudflare () {
      return this.form.brand === 'Cloudflare'
    },
  },
  watch: {
    cloudEnv (val) {
      if (val === 'onpremise') {
        this.form.zoneType = 'PrivateZone'
      } else {
        this.initBrands()
      }
    },
    zoneTypes (val) {
      if (val?.[0]?.value) {
        this.form.zoneType = val[0].value
      }
    },
  },
  mounted () {
    if (this.cloudEnv === 'public') {
      this.initBrands()
    }
  },
  methods: {
    initBrands () {
      const ret = []
      const brands = this.capability.dns_brands.filter(key => ['Aliyun', 'Aws', 'Qcloud', 'Cloudflare'].includes(key))
      brands.map(key => {
        const target = HYPERVISORS_MAP[key.toLowerCase()]
        ret.push({ key: target.provider, label: target.label })
      })
      const brand = ret[0] ? ret[0].key : ''
      this.form.brand = brand
      this.brandOpts = ret
    },
    brandChange () {
      this.form.account = ''
      this.form.cloudprovider = ''
    },
    handleAccountChange () {},
    domainChange (domainId) {
      this.domainId = domainId
    },
    doCreate (data) {
      return new this.$Manager('dns_zones').create({ data })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { domain, project, name, zoneType, description, cloudprovider } = this.form
        const data = {
          domain: domain || this.$store.getters.userInfo.project_domain,
          project: project,
          name,
          description,
          zone_type: zoneType,
          __meta__: this.form.__meta__,
        }
        if (this.cloudEnv === 'public') {
          data.cloudprovider_id = cloudprovider
          if (zoneType === 'PrivateZone') {
            data.vpc_ids = this.form.vpc_ids
          }
        }
        await this.doCreate(data)
        this.$router.push({
          name: 'DnsZone',
          params: {
            cloudEnv: this.cloudEnv,
          },
        })
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
    checkDomainHandle (rule, value, callback) {
      if (this.form.zoneType === 'PublicZone') {
        if (validate(value, 'domain') === false || validate(value, 'domain').result === false) {
          return callback(new Error(this.$t('network.text_178')))
        }
      }
      return callback()
    },
    zoneTypeChangeHandle () {
      this.$nextTick(() => {
        this.$refs.formRef?.validateField?.('name')
      })
    },
    vpcLabelFormat (item) {
      const h = this.$createElement
      if (item.manager) {
        if (item.cidr_block) {
          return h('div', [
            h('span', { class: 'text-color-secondary' }, 'VPC:'),
            ' ' + item.name,
            h('span', '（' + item.cidr_block + '）'),
            h('span', { class: 'ml-2 text-color-secondary' }, this.$t('common_711') + ': ' + item.manager),
          ])
        }
        return h('div', [
          h('span', { class: 'text-color-secondary' }, 'VPC:'),
          ' ' + item.name,
          h('span', { class: 'ml-2 text-color-secondary' }, this.$t('common_711') + ': ' + item.manager),
        ])
      }
      return h('div', item.name)
    },
    cancel () {
      this.$router.push({
        name: 'DnsZone',
        params: {
          cloudEnv: this.cloudEnv,
        },
      })
    },
  },
}
</script>

<style lang="less" scoped>
  .steps {
    max-width: 750px;
    margin: 32px 0;
  }
</style>
