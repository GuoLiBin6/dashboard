<template>
  <div>
    <page-header :title="$t('storage.text_95')" :tabs="cloudEnvOptions" v-model:currentTab="cloudEnv" />
    <page-body>
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout"
        hideRequiredMark>
        <a-form-model-item :label="$t('storage.text_55', [$t('dictionary.project')])" prop="project">
          <domain-project
            :form="form"
            :labelInValue="true"
            @update:domain="handleDomainChange" />
        </a-form-model-item>
        <area-selects
          class="mb-0"
          ref="areaSelects"
          :model="form"
          :wrapperCol="formItemLayout.wrapperCol"
          :labelCol="formItemLayout.labelCol"
          :names="areaselectsName"
          :cloudregionParams="cloudregionParams"
          :isRequired="true"
          :cloudregionParamsMapper="cloudregionParamsMapper"
          :providerParams="providerParams"
          filterBrandResource="object_storage"
          @change="handleCloudregionChange" />
        <a-form-model-item :label="$t('storage.text_40')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('storage.text_56')" />
          <template #extra>
            {{$t('storage.text_101')}}<template v-if="cloudregion.provider === 'Azure'"><br />{{$t('storage.text_102')}}</template>
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea v-model:value="form.description" :auto-size="{ minRows: 1, maxRows: 3 }" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_15')" prop="cloudprovider">
          <base-select
            class="w-50"
            v-model="form.cloudprovider"
            resource="cloudproviders"
            :params="cloudproviderParams"
            :mapper="providerMapper"
            :isDefaultSelect="true"
            :showSync="true"
            :select-props="{ placeholder: $t('compute.text_149') }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1154')" class="mb-0" prop="tag">
          <tag :value="form.tag" @change="v => { form.tag = v || {} }" :allowNoValue="false" />
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <div slot="right">
        <a-button class="ml-3 float-right" @click="() => $router.back()">{{$t('common.cancel')}}</a-button>
        <a-button class="float-right" type="primary" @click="handleConfirm" :loading="loading">{{ $t('common_258') }}</a-button>
      </div>
    </page-footer>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import { formItemLayout } from '@Storage/constants/index.js'
import Tag from '@/sections/Tag'
import AreaSelects from '@/sections/AreaSelects/model'
import { isRequired } from '@/utils/validate'
import i18n from '@/locales'
import DomainProject from '@/sections/DomainProject/model'
import { getCloudEnvOptions } from '@/utils/common/hypervisor'

function validateTag (rule, value, callback) {
  if (R.is(Object, value) && Object.keys(value).length > 20) {
    return callback(new Error(i18n.t('compute.text_209')))
  }
  callback()
}

export default {
  name: 'BucketCreate',
  components: {
    AreaSelects,
    DomainProject,
    Tag,
  },
  data () {
    const cloudEnvOptions = getCloudEnvOptions('object_storage_brands', true)
    return {
      loading: false,
      cloudEnvOptions,
      routerQuery: this.$route.query.type,
      cloudEnv: this.$route.query.type ? this.$route.query.type : cloudEnvOptions[0].key,
      form: {
        domain: undefined,
        project: undefined,
        provider: undefined,
        cloudregion: undefined,
        name: '',
        description: '',
        cloudprovider: undefined,
        tag: {},
      },
      formItemLayout,
      project_domain: '',
      cloudregion: {},
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'scope', 'isAdminMode']),
    rules () {
      return {
        project: [
          { validator: isRequired(), message: i18n.t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('storage.text_56'), trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              const isAzure = this.cloudregion.provider === 'Azure'
              if (isAzure && (value && value.indexOf('-') > -1)) {
                return callback(new Error(this.$t('storage.text_102')))
              }
              return this.$validate('bucketName')(rule, value, callback)
            },
            trigger: 'blur',
          },
        ],
        cloudprovider: [
          { required: true, message: this.$t('network.text_689'), trigger: 'change' },
        ],
        tag: [
          { validator: validateTag, trigger: 'change' },
        ],
      }
    },
    cloudregionParams () {
      const params = {
        scope: this.scope,
      }
      params.cloud_env = this.cloudEnv
      if (this.isAdminMode) {
        params.project_domain = this.project_domain
        delete params.scope
      }
      return params
    },
    cloudproviderParams () {
      const params = {
        limit: 0,
        enabled: 1,
        details: true,
        scope: this.scope,
        read_only: false,
        cloudregion: this.cloudregion.id,
      }
      if (this.isAdminMode) {
        params.admin = true
        params.project_domain = this.project_domain
        delete params.scope
        delete params.domain_id
      }
      return params
    },
    areaselectsName () {
      if (this.cloudEnv === 'onpremise') {
        return ['cloudregion']
      }
      return ['provider', 'cloudregion']
    },
    providerParams () {
      return {
        cloud_env: this.cloudEnv,
        scope: this.scope,
        projecct_domain: this.project_domain,
      }
    },
  },
  watch: {
    cloudEnv () {
      this.$refs.areaSelects?.fetchs(this.areaselectsName)
    },
    project_domain () {
      this.$refs.areaSelects?.fetchs(this.areaselectsName)
    },
  },
  methods: {
    handleDomainChange (val) {
      this.project_domain = val?.key || val || ''
    },
    providerMapper (data) {
      if (this.cloudEnv === 'onpremise') data = data.filter(item => item.provider !== 'VMware')
      return data
    },
    handleCloudregionChange (data) {
      const hasCloudRegion = R.has('cloudregion')(data)
      if (!hasCloudRegion || R.isEmpty(data.cloudregion)) return
      const cloudregion = data.cloudregion.value
      this.cloudregion = cloudregion || {}
      if (this.form.name) {
        this.$refs.formRef?.validateField?.('name')
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { project, domain, tag, zone, cloudregion, ...rest } = this.form
        const payload = {
          ...rest,
          cloudregion,
          __meta__: tag || {},
          project_domain: (domain && domain.key) || this.userInfo.projectDomainId,
          project_id: (project && project.key) || this.userInfo.projectId,
        }
        if (zone) {
          payload.zone = zone.key || zone
        }
        await new this.$Manager('buckets').create({ data: payload })
        this.loading = false
        this.$message.success(this.$t('storage.text_62'))
        this.$router.push('/bucket')
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    cloudregionParamsMapper (params) {
      const p = { ...params, capability: 'objectstore' }
      delete p.usable
      return p
    },
  },
}
</script>
