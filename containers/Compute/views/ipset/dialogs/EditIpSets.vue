<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ dialogTitle }}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item v-if="!isEdit" :label="$t('compute.text_297', [$t('dictionary.project')])" class="mb-0">
          <domain-project
            :form="form"
            :form-layout="formItemLayout"
            @update:domain="handleDomainChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_228')" class="mb-0" prop="name">
          <a-input :placeholder="$t('validator.resourceName')" v-model:value="form.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" class="mb-0" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" :placeholder="$t('common_367')" v-model:value="form.description" />
        </a-form-model-item>
        <template v-if="isManaged">
          <a-form-model-item v-if="showProvider" :label="$t('compute.text_176')" class="mb-0" prop="provider">
            <base-select
              v-model:value="form.provider"
              resource="cloudregions"
              version="v2"
              idKey="provider"
              nameKey="provider"
              filterable
              :params="providerListParams"
              :mapper="providerOptionsMapper"
              :isDefaultSelect="true"
              :select-props="{ placeholder: $t('compute.text_176') }"
              @change="onProviderChange"
              @update:item="onProviderItem" />
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_177')" class="mb-0" prop="cloudregion">
            <base-select
              v-model:value="form.cloudregion"
              resource="cloudregions"
              version="v2"
              filterable
              :params="cloudregionSelectParams"
              :mapper="cloudregionMapper"
              :isDefaultSelect="true"
              :select-props="{ placeholder: $t('compute.text_212') }"
              @change="onCloudregionChange"
              @update:item="onCloudregionItem" />
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_15')" class="mb-0" prop="manager_id">
            <base-select
              resource="cloudproviders"
              v-model:value="form.manager_id"
              :params="cloudproviderParams"
              :isDefaultSelect="true"
              :needParams="true"
              :showSync="true"
              :select-props="{ placeholder: $t('compute.text_149') }" />
          </a-form-model-item>
        </template>
        <a-form-model-item :label="$t('compute.text_175')" class="mb-0" prop="ip_set_type">
          <a-radio-group v-model:value="form.ip_set_type" @change="ipsetTypeChange" :disabled="isEdit">
            <a-radio value="ipv4_cidr_list">IPv4</a-radio>
            <a-radio value="ipv6_cidr_list">IPv6</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="decLabel" :extra="$t('compute.secgroup.secrule.source.prompt')" class="mb-0" prop="data">
          <a-textarea
            :auto-size="{ minRows: 3, maxRows: 10 }"
            v-model:value="form.data"
            :placeholder="$t('compute.text_996')" />
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
import { mapGetters } from 'vuex'
import { isRequired, REGEXP } from '@/utils/validate'
import DomainProject from '@/sections/DomainProject/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

import { IPSET_PRIVATE_BRANDS, IPSET_PUBLIC_BRANDS } from '../constants'

export default {
  name: 'EditIpSetsDialog',
  components: {
    DomainProject,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const selectItem = (this.params.data && this.params.data[0]) || {}
    const ipsetType = selectItem.ip_set_type || selectItem.ipset_type || 'ipv4_cidr_list'
    const dataValue = Array.isArray(selectItem.data)
      ? selectItem.data.join(',')
      : (selectItem.data || '')
    return {
      loading: false,
      form: {
        domain: this.$store.getters.userInfo.projectDomainId,
        project: this.$store.getters.userInfo.projectId,
        name: selectItem.name,
        description: selectItem.description || '',
        provider: undefined,
        cloudregion: undefined,
        manager_id: undefined,
        ip_set_type: ipsetType,
        data: dataValue,
      },
      rules: {
        domain: [
          { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('compute.text_210') },
          { validator: this.$validate('resourceName') },
        ],
        manager_id: [
          { required: true, message: this.$t('compute.text_149') },
        ],
        cloudregion: [
          { required: true, message: this.$t('compute.text_212') },
        ],
        data: [
          { required: true, message: this.$t('compute.text_996') },
          { validator: this.validateCIDR },
        ],
      },
      allowedPrivateBrands: IPSET_PRIVATE_BRANDS,
      allowedPublicBrands: IPSET_PUBLIC_BRANDS,
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
      ipsetType,
      regionId: '',
      regionProvider: '',
      projectDomain: '',
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'isAdminMode', 'scope']),
    isEdit () {
      return this.params.title === 'edit'
    },
    cloudEnv () {
      return this.params.cloudEnv || 'onpremise'
    },
    isManaged () {
      return !this.isEdit && ['private', 'public'].includes(this.cloudEnv)
    },
    isPublic () {
      return this.cloudEnv === 'public'
    },
    showProvider () {
      return this.cloudEnv === 'public'
    },
    isQcloud () {
      return String(this.regionProvider).toLowerCase() === 'qcloud'
    },
    isCloudpods () {
      return this.cloudEnv === 'private' || String(this.regionProvider).toLowerCase() === 'cloudpods'
    },
    skipRegionFilter () {
      return this.isQcloud || this.isCloudpods
    },
    allowedBrands () {
      if (this.cloudEnv === 'private') {
        return this.allowedPrivateBrands
      }
      if (this.cloudEnv === 'public') {
        return this.allowedPublicBrands
      }
      return []
    },
    dialogTitle () {
      if (this.isEdit) {
        return `${this.$t('compute.text_982')}${this.$t('compute.title.ipset')}`
      }
      return `${this.$t('compute.perform_create')}${this.$t('compute.title.ipset')}`
    },
    decLabel () {
      return this.form.ip_set_type === 'ipv6_cidr_list' ? 'IPv6 CIDR' : 'IPv4 CIDR'
    },
    providerListParams () {
      const params = {
        scope: this.scope,
        limit: 0,
        usable: false,
        show_emulated: true,
        read_only: false,
        is_public: true,
      }
      if (this.isAdminMode) {
        params.project_domain = this.projectDomain || this.userInfo.projectDomainId
        delete params.scope
      }
      return params
    },
    cloudregionSelectParams () {
      const params = {
        scope: this.scope,
        limit: 0,
        usable: false,
        show_emulated: true,
        read_only: false,
      }
      if (this.cloudEnv === 'private') {
        params.is_private = true
        params.provider = 'Cloudpods'
      } else if (this.cloudEnv === 'public') {
        params.is_public = true
        if (this.regionProvider) {
          params.provider = this.regionProvider
        } else {
          params.filter = [`provider.in(${this.allowedPublicBrands.join(',')})`]
        }
      }
      if (this.isAdminMode) {
        params.project_domain = this.projectDomain || this.userInfo.projectDomainId
        delete params.scope
      }
      return params
    },
    cloudproviderParams () {
      if (this.isPublic && !this.regionProvider) return {}
      if (!this.skipRegionFilter && !this.regionId) return {}
      const params = {
        limit: 0,
        enabled: true,
        read_only: false,
        'filter.0': 'status.equals("connected")',
      }
      if (!this.skipRegionFilter && this.regionId) {
        params.cloudregion = this.regionId
      }
      if (this.regionProvider) {
        params.brand = this.regionProvider
      } else if (this.cloudEnv === 'private') {
        params.brand = 'Cloudpods'
      }
      if (this.isAdminMode) {
        params.project_domain = this.projectDomain || this.userInfo.projectDomainId
      } else {
        params.scope = this.scope
      }
      return params
    },
  },
  methods: {
    isAllowedBrand (brand) {
      if (!brand) return false
      return this.allowedBrands.some(item => item.toLowerCase() === String(brand).toLowerCase())
    },
    providerOptionsMapper (list = []) {
      const seen = new Set()
      return list.filter(item => {
        const brand = item.provider || item.brand || item.name
        if (!this.isAllowedBrand(brand) || seen.has(brand)) return false
        seen.add(brand)
        return true
      }).map(item => ({
        ...item,
        id: item.provider || item.brand || item.name,
        name: item.provider || item.brand || item.name,
        provider: item.provider || item.brand || item.name,
      }))
    },
    cloudregionMapper (list = []) {
      return list.filter(item => this.isAllowedBrand(item.provider || item.brand))
    },
    handleDomainChange (val) {
      this.projectDomain = (val && val.key) || val || ''
    },
    onProviderChange (val) {
      this.regionProvider = this.isAllowedBrand(val) ? val : ''
      this.form.cloudregion = undefined
      this.regionId = ''
      this.form.manager_id = undefined
    },
    onProviderItem (item) {
      const brand = item && (item.provider || item.brand || item.name || item.id)
      if (brand && this.isAllowedBrand(brand)) {
        this.regionProvider = brand
      }
    },
    onCloudregionChange (val) {
      this.regionId = val || ''
      this.form.manager_id = undefined
    },
    onCloudregionItem (item) {
      if (!item) {
        this.regionId = ''
        return
      }
      const brand = item.provider || item.brand || this.regionProvider || (this.cloudEnv === 'private' ? 'Cloudpods' : '')
      if (!this.isAllowedBrand(brand)) {
        this.regionId = ''
        return
      }
      this.regionId = item.id
      if (!this.regionProvider && brand) {
        this.regionProvider = brand
      }
    },
    ipsetTypeChange (e) {
      this.ipsetType = e.target.value
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.validateField('data')
      })
    },
    parseDataList (value) {
      if (!value) return []
      if (Array.isArray(value)) {
        return value.map(item => String(item).trim()).filter(Boolean)
      }
      return String(value).split(/[,\n]/).map(item => item.trim()).filter(Boolean)
    },
    validateCIDR (rule, value, callback) {
      if (!value) {
        return callback()
      }
      const items = this.parseDataList(value)
      const isIpv6 = this.form.ip_set_type === 'ipv6_cidr_list'
      for (const item of items) {
        if (isIpv6) {
          if (!REGEXP.IPv6.regexp.test(item) && !REGEXP.cidr6.regexp.test(item)) {
            return callback(new Error(this.$t('common.tips.input', ['IPv6/CIDR'])))
          }
        } else if (!REGEXP.IPv4.regexp.test(item) && !REGEXP.cidr.regexp.test(item)) {
          return callback(new Error(this.$t('common.tips.input', ['IPv4/CIDR'])))
        }
      }
      return callback()
    },
    genData (values) {
      const { project, domain, data, cloudregion, provider, manager_id, ...rest } = values
      const payload = {
        ...rest,
        data: this.parseDataList(data).join(','),
      }
      if (!this.isEdit) {
        payload.project_domain = (domain && domain.key) || domain || this.userInfo.projectDomainId
        payload.project_id = (project && project.key) || project || this.userInfo.projectId
        if (this.isManaged) {
          const providerName = this.regionProvider || provider || ''
          const isQcloud = String(providerName).toLowerCase() === 'qcloud'
          if (!isQcloud) {
            payload.cloudregion_id = this.regionId || cloudregion
          }
          payload.manager_id = manager_id
        }
      }
      return payload
    },
    doCreate (data) {
      return this.params.onManager('create', {
        managerArgs: { data },
      })
    },
    doUpdate (data) {
      return this.params.onManager('update', {
        id: this.params.data[0].id,
        managerArgs: { data },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const payload = this.genData({ ...this.form })
        if (this.isEdit) {
          await this.doUpdate(payload)
        } else {
          await this.doCreate(payload)
        }
        this.params.refresh && this.params.refresh()
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
