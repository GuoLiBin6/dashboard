<template>
  <div>
    <a-form-model
      ref="formRef"
      class="mt-3"
      v-bind="formItemLayout"
      :model="form.fd"
      :rules="rules"
      hideRequiredMark>
      <a-form-model-item :label="$t('storage.text_55', [$t('dictionary.project')])" prop="project">
        <domain-project :form="form.fd" />
      </a-form-model-item>
      <a-form-model-item :label="$t('storage.text_40')" prop="name">
        <a-input v-model:value="form.fd.name" />
        <template #extra>
          <name-repeated res="file_systems" :name="form.fd.name" :default-text="$t('compute.text_893')" />
        </template>
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')" prop="description">
        <a-textarea v-model:value="form.fd.description" :auto-size="{ minRows: 1, maxRows: 3 }" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <area-selects
        class="mb-0"
        ref="areaSelects"
        :model="form.fd"
        :wrapperCol="formItemLayout.wrapperCol"
        :labelCol="formItemLayout.labelCol"
        :names="areaselectsName"
        :cloudregionParams="param.region"
        :zoneParams="param.zone"
        :providerParams="param.provider"
        :isRequired="true"
        filterBrandResource="compute_engine"
        @change="handleRegionChange" />
      <a-form-model-item :label="$t('compute.text_15')" prop="cloudprovider" required v-bind="formItemLayout">
        <base-select
          class="w-50"
          v-model:value="form.fd.cloudprovider"
          resource="cloudproviders"
          :params="cloudproviderParams"
          :mapper="providerMapper"
          :isDefaultSelect="true"
          :showSync="true"
          :select-props="{ placeholder: $t('common.tips.select', [$t('compute.text_653')]) }" />
      </a-form-model-item>
      <a-form-model-item :label="$t('storage.capacity')" prop="capacity_gb">
        <a-input-number v-model:value="form.fd.capacity_gb" :min="1" :step="1" :precision="0" /> GB
      </a-form-model-item>
      <a-form-model-item :label="$t('compute.text_1154')" class="mb-0" prop="tag">
        <tag
          :value="form.fd.tag" @change="v => { form.fd.tag = v || {} }" :allowNoValue="false" />
      </a-form-model-item>
      <bottom-bar
        :values="form.fd"
        @submit="handleConfirm"
        @cancel="handleCancel" />
    </a-form-model>
  </div>
</template>

<script>
import { formItemLayout } from '@Storage/constants'
import DomainProject from '@/sections/DomainProject/model'
import AreaSelects from '@/sections/AreaSelects/model'
import Tag from '@/sections/Tag'
import validateForm, { isRequired } from '@/utils/validate'
import fsCreateMixin from './mixin'
import BottomBar from '../components/BottomBar'

export default {
  name: 'FileSystemIDCCreate',
  components: {
    DomainProject,
    AreaSelects,
    Tag,
    BottomBar,
  },
  mixins: [fsCreateMixin],
  data () {
    return {
      formItemLayout,
      areaselectsName: ['cloudregion', 'zone'],
      regionList: [],
      zoneList: [],
      rules: {
        project: [
          { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('network.text_218') },
          { validator: validateForm('serverName') },
        ],
        cloudprovider: [
          { required: true, message: this.$t('common.tips.select', [this.$t('compute.text_653')]) },
        ],
        tag: [
          { validator: validateForm('tagName') },
        ],
      },
    }
  },
  computed: {
    param () {
      const project_domain = { project_domain: this.form.fd.domain?.key || this.userInfo.projectDomainId || this.userInfo.domain.id }
      const params = {
        zone: {
          usable: true,
          show_emulated: true,
          order_by: 'created_at',
          order: 'asc',
          ...project_domain,
        },
        region: {
          usable: true,
          cloud_env: 'onpremise',
          show_emulated: true,
          ...project_domain,
        },
        provider: {},
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
        cloudregion: this.form.fd.cloudregion,
      }
      if (this.isAdminMode) {
        params.admin = true
        params.project_domain = this.form.fd.domain?.key
        delete params.scope
        delete params.domain_id
      }
      return params
    },
  },
  methods: {
    providerMapper (data) {
      if (this.cloudEnv === 'onpremise') data = data.filter(item => item.provider !== 'VMware')
      return data
    },
    handleRegionChange (val) {
      if (val.cloudregion) {
        this.form.fd.cloudregion = val.cloudregion.id
      }
      if (val.zone) {
        this.form.fd.zone = val.zone.id
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form.fd }
        const { name, project, domain, cloudprovider, capacity_gb, tag, ...rest } = values

        await new this.$Manager('file_systems').create({
          data: {
            ...rest,
            generate_name: name,
            __meta__: tag,
            project_domain: (domain && domain.key) || this.userInfo.projectDomainId,
            project_id: (project && project.key) || this.userInfo.projectId,
            cloudregion: this.form.fd.cloudregion,
            zone_id: this.form.fd.zone,
            manager_id: cloudprovider,
            file_system_type: 'standard',
            protocol: 'CephFS',
            storage_type: 'capacity',
            capacity: capacity_gb,
          },
        })
        this.$message.success(this.$t('network.nat.create.success'))
        this.$router.push('/nas')
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style>
</style>
