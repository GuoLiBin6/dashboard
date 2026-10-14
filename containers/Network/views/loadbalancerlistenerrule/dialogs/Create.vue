<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('network.text_521')}}</div>
    <div slot="body">
      <a-form-model
        v-if="isOneCloud && !isCloudflare"
        ref="redirectFormRef"
        :model="redirectForm"
        v-bind="formItemLayout">
        <redirect-form-items
          :form="redirectForm"
          modelMode
          :listenerType="params.lbListenerData.listener_type"
          @redirectChange="handleRedirectChange" />
      </a-form-model>
      <a-form-model
        ref="formRef"
        v-bind="formItemLayout"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input v-model:value="form.name"  :placeholder="$t('network.text_522')" />
        </a-form-model-item>
        <template v-if="isCloudflare">
          <a-form-model-item :label="$t('network.text_156')" class="mb-0" required>
            <div class="d-flex align-items-top">
              <a-form-model-item class="mr-2" style="width: 100%" :extra="$t('network.domain_prefix_extra')" prop="domain_prefix">
                <a-input v-model:value="form.domain_prefix" :placeholder="$t('network.domain_prefix')" />
              </a-form-model-item>
              <a-form-model-item style="width: 100%" prop="domain_name">
                <base-select
                  v-model:value="form.domain_name"
                  resource="cdn_domains"
                  :params="cdnDomainParams"
                  filterable
                  :mapper="domainMapper"
                  :select-props="{ placeholder: $t('network.text_156') }" />
              </a-form-model-item>
            </div>
          </a-form-model-item>
          <a-form-model-item label="URL" :extra="$t('network.domain_url_extra')">
            {{ currentUrl }}
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_139')" prop="backend_groups">
            <base-select
              v-model:value="form.backend_groups"
              resource="loadbalancerbackendgroups"
              :params="backendParams"
              filterable
              :select-props="{ placeholder: $t('network.text_139'), mode: 'multiple' }" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.default_backend_server_group')" :extra="$t('network.default_backend_server_group_extra')" prop="backend_group_id">
            <base-select
              v-model:value="form.backend_group_id"
              resource="loadbalancerbackendgroups"
              :params="backendParams1"
              filterable
              :select-props="{ placeholder: $t('network.default_backend_server_group') }" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.rule_redirect')" :extra="form.redirect_type === 'geography' ? $t('network.rule_redirect_extra') : ''" prop="redirect_type">
            <a-select v-model:value="form.redirect_type">
              <a-select-option value="off">{{$t('network.rule_redirect_type_off')}}</a-select-option>
              <a-select-option value="geography">{{$t('network.rule_redirect_type_geography')}}</a-select-option>
            </a-select>
          </a-form-model-item>
          <template v-if="form.redirect_type === 'geography'">
            <a-form-model-item v-bind="formItemLayout2" :label="$t('network.rule_redirect_region_country')">
              <div class="d-flex" v-for="(item, index) in redirectRules" :key="index">
                <a-form-model-item class="mr-2 w-100" :prop="'redirect_region_type.' + index" :rules="rules.redirect_region_type">
                  <a-select class="w-100" v-model:value="form.redirect_region_type[index]" :placeholder="$t('network.rule_redirect_type')" @change="v => onRedirectRegionTypeChange(index, v)">
                    <a-select-option value="region">{{$t('network.text_199')}}</a-select-option>
                    <a-select-option value="country">{{$t('network.cdn.clear_cache_country')}}</a-select-option>
                  </a-select>
                </a-form-model-item>
                <a-form-model-item class="mr-2 w-100" :prop="'redirect_region_country.' + index" :rules="rules.redirect_region_country">
                  <a-select v-if="item.type === 'region'" class="w-100" v-model:value="form.redirect_region_country[index]" :placeholder="$t('network.text_199')">
                    <a-select-option v-for="region in REGIONS" :key="region.key" :value="region.key">{{region.label}}</a-select-option>
                  </a-select>
                  <a-select v-else-if="item.type === 'country'" class="w-100" v-model:value="form.redirect_region_country[index]" :placeholder="$t('network.cdn.clear_cache_country')">
                    <a-select-option v-for="country in COUNTRYS" :key="country.key" :value="country.key">{{country.label}}</a-select-option>
                  </a-select>
                  <a-select v-else class="w-100" />
                </a-form-model-item>
                <a-form-model-item class="mr-2 w-100" :prop="'redirect_backend_groups.' + index" :rules="rules.redirect_backend_groups">
                  <base-select
                    class="w-100"
                    v-model:value="form.redirect_backend_groups[index]"
                    resource="loadbalancerbackendgroups"
                    :params="genBackendParams(index)"
                    filterable
                    :select-props="{placeholder: $t('network.text_139'), mode: 'multiple' }" />
                </a-form-model-item>
                <a-form-model-item>
                  <div><a-button style="flex: 0 0 24px;" shape="circle" icon="minus" size="small" :disabled="redirectRules.length === 1" @click="deleteRule(item,index)" /></div>
                </a-form-model-item>
              </div>
            </a-form-model-item>
            <div class="d-flex align-items-center">
              <a-button type="primary" shape="circle" icon="plus" size="small" @click="addRule" />
              <a-button type="link" @click="addRule">{{$t('network.add_redirect_rule')}}</a-button>
            </div>
          </template>
        </template>
        <template v-else>
          <a-form-model-item :label="$t('network.text_156')" prop="domain">
            <div slot="extra">{{$t('network.text_523')}}</div>
            <a-input v-model:value="form.domain" :placeholder="$t('network.text_522')" />
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_143')" v-if="params.lbListenerData.listener_type === 'https'" prop="certificate_id">
            <base-select
              v-model:value="form.certificate_id"
              resource="loadbalancercertificates"
              :params="certificateParams"
              :label-format="certificateFormatter"
              show-sync
              :select-props="{ placeholder: $t('network.text_421') }" />
            <div slot="extra">{{$t('network.text_422')}}<help-link href="/lbcert">{{$t('network.text_321')}}</help-link></div>
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_524')" prop="path">
            <div slot="extra">
              {{$t('network.text_525')}}
              <span v-if="isDomainOrPathProviders" :class="{'error-color': !isDomainOrPath}">{{$t('common_465')}}</span>
            </div>
            <a-input v-model:value="form.path" :placeholder="$t('network.text_522')" />
          </a-form-model-item>
          <template v-if="!isRedirect">
            <a-form-model-item :label="$t('network.default_backend_server_group')" prop="backend_group">
              <base-select
                v-model:value="form.backend_group"
                resource="loadbalancerbackendgroups"
                need-params
                :params="bgParams"
                filterable
                :select-props="{ placeholder: $t('network.text_394') }" />
            </a-form-model-item>
            <a-form-model-item v-if="isOneCloud" :label="$t('network.text_527')" prop="http_request_rate">
              <div slot="extra">{{$t('network.text_438')}}</div>
              <a-input :min="0" v-model:value="form.http_request_rate" :addonAfter="$t('network.text_439')" type="number" />
            </a-form-model-item>
            <a-form-model-item v-if="isOneCloud" :label="$t('network.text_440')" prop="http_request_rate_per_src">
              <div slot="extra">{{$t('network.text_528')}}</div>
              <a-input :min="0" v-model:value="form.http_request_rate_per_src" :addonAfter="$t('network.text_439')" type="number" />
            </a-form-model-item>
          </template>
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
import _ from 'lodash'
import RedirectFormItems from '@Network/views/loadbalancerlistener/components/RedirectFormItems'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { REGEXP } from '@/utils/validate'
import { REGIONS, COUNTRYS } from '../constants'

export default {
  name: 'LoadbalancerlistenerruleCreateDialog',
  components: {
    RedirectFormItems,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const provider = this.params.lbListenerData.provider.toLowerCase()
    const customDomain = (rule, value, callback) => {
      if (value === '' || REGEXP.domain.regexp.test(value)) {
        callback()
      } else {
        callback(new Error())
      }
    }
    return {
      REGIONS,
      COUNTRYS,
      isRedirect: false,
      loading: false,
      isDomainOrPath: true,
      provider,
      form: {
        name: undefined,
        domain: undefined,
        domain_prefix: '',
        domain_name: undefined,
        certificate_id: undefined,
        path: undefined,
        backend_group: undefined,
        backend_groups: undefined,
        backend_group_id: undefined,
        redirect_type: 'off',
        redirect_region_type: [''],
        redirect_region_country: [''],
        redirect_backend_groups: [undefined],
        http_request_rate: 0,
        http_request_rate_per_src: 0,
      },
      redirectForm: {
        redirect: false,
        redirect_code: 301,
        redirect_scheme: 'http',
        redirect_host: undefined,
        redirect_path: undefined,
        listener_type: this.params.lbListenerData.listener_type,
      },
      customDomain,
      redirectRules: [
        {
          type: '',
          region: '',
          backend_group: '',
        },
      ],
      formItemLayout: {
        wrapperCol: {
          span: 18,
        },
        labelCol: {
          span: 6,
        },
      },
      formItemLayout2: {
        wrapperCol: {
          span: 24,
        },
        labelCol: {
          span: 24,
        },
      },
    }
  },
  computed: {
    rules () {
      const rules = {
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('resourceName') },
        ],
      }
      if (this.isCloudflare) {
        rules.domain_prefix = [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (!value) {
                callback(new Error(this.$t('common.tips.input', [this.$t('network.domain_prefix')])))
              }
              const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/
              if (!regex.test(value)) {
                callback(new Error(this.$t('network.domain_prefix_invalid')))
              }
              callback()
            },
          },
        ]
        rules.domain_name = [
          { required: true, message: this.$t('common.tips.select', [this.$t('network.text_156')]) },
        ]
        rules.backend_groups = [
          { required: true, message: this.$t('common.tips.select', [this.$t('network.text_139')]) },
        ]
        rules.backend_group_id = [
          { required: true, message: this.$t('common.tips.select', [this.$t('network.default_backend_server_group')]) },
        ]
        rules.redirect_type = [
          { required: true, message: this.$t('network.rule_redirect_type') },
        ]
        if (this.form.redirect_type === 'geography') {
          rules.redirect_region_type = [
            { required: true, message: this.$t('network.rule_redirect_type') },
          ]
          rules.redirect_region_country = [
            { required: true, message: this.$t('network.text_203') },
          ]
          rules.redirect_backend_groups = [
            { required: true, message: this.$t('network.text_139') },
          ]
        }
      } else {
        rules.domain = [
          { required: this.provider === 'qcloud', message: this.$t('network.text_530') },
          { validator: this.customDomain, message: this.$t('network.text_531'), trigger: 'blur' },
        ]
        rules.path = [
          { required: this.provider === 'qcloud', message: this.$t('network.text_530') },
          { pattern: /^\/.+/, message: this.$t('network.text_529'), trigger: 'blur' },
        ]
        if (!this.isRedirect) {
          rules.backend_group = [
            { required: true, message: this.$t('network.text_394') },
          ]
        }
      }
      return rules
    },
    certificateParams () {
      const params = {
        usable: true,
        limit: 0,
        project: this.params.lbDetail.project,
        cloudregion: this.params.lbDetail.cloudregion_id,
        manager: this.params.lbDetail.manager_id,
      }
      if (this.$store.getters.isAdminMode) {
        const domain = _.get(this.params.lbListenerData, 'domain_id') || _.get(this.params.lbDetail, 'domain_id')
        params.project_domain = domain
      } else {
        params.scope = this.$store.getters.scope
      }
      return params
    },
    bgParams () {
      const params = {
        scope: this.$store.getters.scope,
        loadbalancer: this.params.lbListenerData.loadbalancer_id,
      }
      if (this.params.lbListenerData.provider && this.params.lbListenerData.provider.toLowerCase() === 'aliyun') {
        params.type = 'normal'
      }
      return params
    },
    isOneCloud () {
      return this.provider === 'onecloud'
    },
    isCloudflare () {
      return this.provider === 'cloudflare'
    },
    isDomainOrPathProviders () {
      return this.provider === 'huawei' || this.provider === 'aliyun' || this.provider === 'aws' || this.provider === 'openstack'
    },
    cdnDomainParams () {
      return {
        scope: this.$store.getters.scope,
        provider: this.params.lbListenerData.provider,
      }
    },
    backendParams () {
      return {
        scope: this.$store.getters.scope,
        loadbalancer: this.params.lbListenerData.loadbalancer_id,
        filter: 'status.in(enabled,disabled)',
        $t: 1,
      }
    },
    backendParams1 () {
      return {
        scope: this.$store.getters.scope,
        loadbalancer: this.params.lbListenerData.loadbalancer_id,
        filter: 'status.in(enabled,disabled)',
        $t: 2,
      }
    },
    currentUrl () {
      if (this.isCloudflare) {
        return `${this.form.domain_prefix}.${this.form.domain_name}`
      }
      return ''
    },
  },
  watch: {
    'form.path' () {
      this.syncDomainOrPathFlag()
    },
    'form.domain' () {
      this.syncDomainOrPathFlag()
    },
  },
  methods: {
    syncDomainOrPathFlag () {
      if (this.isDomainOrPathProviders) {
        this.isDomainOrPath = this.form.path || this.form.domain
      }
    },
    onRedirectRegionTypeChange (index, val) {
      this.$set(this.redirectRules[index], 'type', val)
    },
    deleteRule (item, index) {
      this.redirectRules = this.redirectRules.filter((_, i) => i !== index)
      this.form.redirect_region_type.splice(index, 1)
      this.form.redirect_region_country.splice(index, 1)
      this.form.redirect_backend_groups.splice(index, 1)
    },
    addRule () {
      this.redirectRules.push({
        region: '',
        backend_group: '',
      })
      this.form.redirect_region_type.push('')
      this.form.redirect_region_country.push('')
      this.form.redirect_backend_groups.push(undefined)
    },
    genBackendParams (index) {
      return {
        scope: this.$store.getters.scope,
        loadbalancer: this.params.lbListenerData.loadbalancer_id,
        filter: 'status.in(enabled,disabled)',
        $t: `n${index}`,
      }
    },
    domainMapper (list) {
      return list.map(item => ({
        id: item.name,
        name: item.name,
      }))
    },
    handleRedirectChange (bool) {
      this.isRedirect = bool
    },
    async doCreate (values) {
      let data = { listener: this.params.lbListenerData.id }
      if (this.isCloudflare) {
        data.name = values.name
        data.domain = values.domain_name
        data.path = `${values.domain_prefix}.${values.domain_name}`
        data.backend_groups = values.backend_groups.map(id => ({ id }))
        data.backend_group_id = values.backend_group_id
        if (values.redirect_type === 'geography') {
          data.redirect_pool = {
            region_pools: {},
            country_pools: {},
          }
          values.redirect_region_type.map((type, index) => {
            if (type === 'region') {
              data.redirect_pool.region_pools[values.redirect_region_country[index]] = values.redirect_backend_groups[index].map(id => ({ id }))
            } else {
              data.redirect_pool.country_pools[values.redirect_region_country[index]] = values.redirect_backend_groups[index].map(id => ({ id }))
            }
          })
        }
      } else {
        data = {
          ...values,
          ...data,
        }
      }
      await new this.$Manager('loadbalancerlistenerrules').create({
        data,
      })
    },
    async handleConfirm () {
      try {
        if (this.isDomainOrPathProviders && !this.isCloudflare) {
          this.syncDomainOrPathFlag()
          if (!(this.form.path || this.form.domain)) {
            return false
          }
        }
        await this.$refs.formRef.validate()
        let values = { ...this.form }
        if (this.isOneCloud && !this.isCloudflare) {
          if (this.$refs.redirectFormRef) {
            await this.$refs.redirectFormRef.validate()
          }
          values = { ...values, ...this.redirectForm }
          values.http_request_rate = Number(values.http_request_rate)
          values.http_request_rate_per_src = Number(values.http_request_rate_per_src)
          delete values.listener_type
          delete values.check
        }
        this.loading = true
        values.redirect = values.redirect ? 'raw' : 'off'
        if (!values.redirect_host) {
          delete values.redirect_host
        }
        await this.doCreate(values)
        this.loading = false
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
      }
    },
    certificateFormatter (item) {
      var label = `${item.name}`
      if (item.common_name) {
        label += ` - ${item.common_name}`
      }
      var valid = true
      const now = new Date()
      if (item.not_before) {
        var notBefore = new Date(item.not_before)
        if (notBefore.getTime() > now.getTime()) {
          valid = false
        }
      }
      if (item.not_after) {
        var notAfter = new Date(item.not_after)
        if (notAfter.getTime() < now.getTime()) {
          valid = false
        }
      }
      if (valid) {
        label += ` - ${this.$t('status.sslCertificate.available')}`
      } else {
        label += ` - ${this.$t('status.sslCertificate.expired')}`
      }
      return label
    },
  },
}
</script>
