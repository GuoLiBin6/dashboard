<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item v-if="isCloudflare" :label="$t('common.name')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('validator.resourceName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_249')" prop="backend_type">
          <a-radio-group v-model:value="form.backend_type" @change="handleBackendTypeChange">
            <a-radio-button v-for="(v, k) in backendTypes" :value="k" :key="k">{{v}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item key="server" :label="$t('dictionary.server')" v-if="backend_type === 'guest'" prop="guest_backend">
          <base-select
            resource="servers"
            need-params
            :params="serverParams"
            v-model:value="form.guest_backend"
            show-sync
            remote
            :remote-fn="q => ({ search: q })"
            :mapper="serverlistMapper"
            :select-props="{ placeholder: $t('network.text_334', [$t('dictionary.server')]) }" />
            <div slot="extra">{{$t('network.text_335', [$t('dictionary.server')])}}<help-link :href="serverHref">{{$t('network.text_26')}}</help-link>
          </div>
        </a-form-model-item>
        <a-form-model-item key="host" :label="$t('dictionary.host')" v-if="backend_type === 'host'" prop="host_backend">
          <base-select
            show-sync
            class="w-100"
            v-model:value="form.host_backend"
            resource="hosts"
            remote
            :remote-fn="q => ({ search: q })"
            :params="hostParams"
            :select-props="{ placeholder: $t('network.text_62') }" />
        </a-form-model-item>
        <a-form-model-item key="ip" :label="$t('network.text_213')" v-if="backend_type === 'ip'" :extra="$t('network.text_337')" prop="ip_backend">
          <a-input v-model:value="form.ip_backend" :placeholder="$t('network.text_338')" />
        </a-form-model-item>
        <a-form-model-item key="ip_or_domain" :label="$t('network.text_213')" v-if="backend_type === 'ip_or_domain'" prop="ip_or_domain_backend">
          <a-input v-model:value="form.ip_or_domain_backend" :placeholder="$t('network.ip_or_domain')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_165')" :extra="$t('network.text_339')" prop="port">
          <a-input-number v-model:value="form.port" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_166')" :extra="$t('network.text_333', [params.maxWeight])" prop="weight">
          <a-input-number v-model:value="form.weight" />
        </a-form-model-item>
        <a-form-model-item v-if="isOneCloud" label="SSL" :extra="$t('network.text_340')" prop="ssl">
          <a-switch v-model:checked="form.ssl" />
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
import { findPlatform } from '@/utils/common/hypervisor'
import regexp from '@/utils/regexp'

export default {
  name: 'LoadbalancerbackendCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const initialBackendType = this.params.lbBackendgroupData.provider === 'Cloudflare' ? 'ip_or_domain' : 'guest'
    return {
      loading: false,
      backend_type: initialBackendType,
      form: {
        name: undefined,
        backend_type: initialBackendType,
        guest_backend: undefined,
        host_backend: undefined,
        ip_backend: undefined,
        ip_or_domain_backend: undefined,
        port: 1,
        weight: 1,
        ssl: false,
      },
      firstLbBackendVpc: undefined,
    }
  },
  computed: {
    rules () {
      const isRequired = (k) => this.backend_type === k
      return {
        name: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
          { validator: this.$validate('resourceName') },
        ],
        backend_type: [
          { required: true, message: this.$t('network.text_343') },
        ],
        guest_backend: [
          { required: isRequired('guest'), message: this.$t('network.text_344') },
        ],
        host_backend: [
          { required: isRequired('host'), message: this.$t('network.text_345') },
        ],
        ip_backend: [
          { required: isRequired('ip'), message: this.$t('network.text_346') },
          { validator: this.$validate('IPv4', false) },
        ],
        ip_or_domain_backend: [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (!value) {
                callback(new Error(this.$t('common.tips.input', [this.$t('network.ip_or_domain')])))
              }
              if (!regexp.isIPOrDomain(value)) {
                callback(new Error(this.$t('common.tips.input', [this.$t('network.ip_or_domain')])))
              }
              callback()
            },
          },
        ],
        port: [
          { required: true, message: this.$t('network.text_176') },
          { type: 'number', min: 1, max: 65535, message: this.$t('network.text_347') },
        ],
        weight: [
          { required: true, message: this.$t('network.text_177') },
          { type: 'number', min: 0, max: this.params.maxWeight, message: this.$t('network.text_348', [this.params.maxWeight]) },
        ],
      }
    },
    isOneCloud () {
      return this.params.lbBackendgroupData.provider === 'OneCloud'
    },
    isCloudflare () {
      return this.params.lbBackendgroupData.provider === 'Cloudflare'
    },
    backendTypes () {
      if (this.isCloudflare) {
        return {
          ip_or_domain: this.$t('network.text_71'),
        }
      }
      if (!this.isOneCloud) {
        return {
          guest: this.$t('network.text_341'),
        }
      }
      const _ = {
        guest: this.$t('network.text_341'),
        host: this.$t('network.text_342'),
        ip: this.$t('network.text_71'),
      }
      const { isAdminMode, isDomainMode } = this.$store.getters
      if (!isAdminMode && !isDomainMode) {
        delete _.host
      }
      return _
    },
    serverHref () {
      const { provider } = this.params.lbBackendgroupData
      const platform = findPlatform(provider, 'provider')
      const platformArr = ['idc', 'private', 'public']
      if (platformArr.includes(platform)) return `/vminstance/create?type=${platform}`
      return '/vminstance/create'
    },
    serverParams () {
      const params = {
        'filter.0': 'status.equals(running,ready)',
        region: this.params.lbBackendgroupData.region_id,
        scope: this.$store.getters.scope,
        project: this.params.lbBackendgroupData.tenant_id,
      }
      if (this.params.lbData.vpc_id) {
        params.vpc = this.params.lbData.vpc_id
      }
      if (this.params.lbBackendgroupData.brand.toLowerCase() === 'openstack') {
        delete params.vpc
      } else if (this.isPublicAliyun) {
        delete params.vpc
        if (this.firstLbBackendVpc) {
          params.vpc = this.firstLbBackendVpc
        } else {
          params.manager_id = this.params.lbData.manager_id
        }
      }
      return params
    },
    hostParams () {
      const params = {
        baremetal: false,
        brand: 'OneCloud',
        'filter.0': 'status.equals(running,ready)',
      }
      if (this.params.lbData.zone_id) {
        params.zone = this.params.lbData.zone_id
      }
      return params
    },
    isPublicAliyun () {
      return this.params.lbData.address_type === 'internet' && this.params.lbBackendgroupData.brand.toLowerCase() === 'aliyun'
    },
  },
  created () {
    if (this.isPublicAliyun) {
      this.fetchFirstdataVpc()
    }
  },
  methods: {
    handleBackendTypeChange (e) {
      this.form.guest_backend = undefined
      this.form.host_backend = undefined
      this.form.ip_backend = undefined
      this.form.ip_or_domain_backend = undefined
      this.backend_type = e.target.value
    },
    serverlistMapper (list) {
      return list.filter(v => {
        if (v.nics) {
          return v.nics.some(n => n.is_exit === false)
        }
        return true
      })
    },
    async doCreate (values) {
      const { backend_type } = values
      let data = {
        backend_group: this.params.lbBackendgroupData.id,
        ssl: values.ssl ? 'on' : 'off',
        backend: values[`${backend_type}_backend`],
      }
      if (this.isCloudflare) {
        data.generate_name = values.name
        data.address = values.ip_or_domain_backend
        data.backend_type = 'address'
        data.weight = values.weight
        data.port = values.port
      } else {
        data = { ...values, ...data }
      }
      await new this.$Manager('loadbalancerbackends').create({
        data,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        await this.doCreate(values)
        this.loading = false
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
      }
    },
    async fetchFirstdataVpc () {
      try {
        const firstLbBackendList = Object.values(this.params.listData).filter(val => val.data.backend_type === 'guest')
        if (firstLbBackendList && firstLbBackendList.length) {
          const firstLbBackendData = firstLbBackendList[0]
          const firstId = firstLbBackendData.data.backend_id
          const { data } = await new this.$Manager('servers').get({ id: firstId })
          this.firstLbBackendVpc = data.vpc_id
        }
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
