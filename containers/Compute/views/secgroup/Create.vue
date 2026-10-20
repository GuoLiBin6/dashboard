<template>
  <div>
    <page-header :title="$t('compute.text_189')" :tabs="cloudEnvOptions" v-model:currentTab="cloudEnv" />
    <page-body>
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form"
        :rules="rules"
        @submit.prevent="handleSubmit"
        hideRequiredMark>
        <a-form-model-item :label="$t('network.text_205', [$t('dictionary.project')])" class="mt-3" prop="project">
          <domain-project
            :form="form"
            :labelInValue="true"
            @update:domain="handleDomainChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('validator.resourceName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea v-model:value="form.description" :auto-size="{ minRows: 1, maxRows: 3 }" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <template v-if="cloudEnv !== 'idc' && cloudEnv !== 'onpremise'">
          <area-selects
            class="mb-0"
            ref="areaSelects"
            :model="form"
            :names="areaselectsName"
            :providerParams="providerParams"
            :cloudregionParams="cloudregionParams"
            :isRequired="true"
            filterBrandResource="security_group"
            @change="handleRegionChange" />
          <a-form-model-item label="VPC" prop="vpc" v-if="regionId !== 'default'">
            <base-select
              v-model="form.vpc"
              resource="vpcs"
              :params="vpcParams"
              :isDefaultSelect="true"
              :needParams="true"
              v-model:item="curVpc"
              :labelFormat="vpcLabelFormat"
              :select-props="{ placeholder: $t('common_226') }"
              @change="vpcChange" />
          </a-form-model-item>
        </template>
        <a-form-model-item :label="$t('common.text00012')" class="mb-0" prop="__meta__">
          <tag :value="form.__meta__" @change="v => { form.__meta__ = v }" />
        </a-form-model-item>
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
import { mapGetters } from 'vuex'
import validateForm, { isRequired } from '@/utils/validate'
import { Manager } from '@/utils/manager'
import { getCloudEnvOptions } from '@/utils/common/hypervisor'
import DomainProject from '@/sections/DomainProject/model'
import AreaSelects from '@/sections/AreaSelects/model'
import { HYPERVISORS_MAP } from '@/constants'
import Tag from '@/sections/Tag'

export default {
  name: 'SecgroupCreate',
  components: {
    DomainProject,
    AreaSelects,
    Tag,
  },
  data () {
    const cloudEnvOptions = getCloudEnvOptions('security_group_brands', true)
    const queryType = this.$route.query.type
    let cloudEnv = queryType === 'idc' ? 'onpremise' : this.$route.query.type
    let routerQuery = this.$route.query.type
    if (!cloudEnvOptions.find(val => val.key === cloudEnv)) {
      cloudEnv = cloudEnvOptions[0].key
      routerQuery = cloudEnv === 'onpremise' ? 'idc' : cloudEnv
    }
    return {
      submiting: false,
      cloudEnvOptions,
      cloudEnv,
      routerQuery,
      form: {
        domain: undefined,
        project: undefined,
        name: '',
        description: '',
        provider: undefined,
        cloudregion: undefined,
        vpc: undefined,
        __meta__: {},
      },
      guestIpPrefixValidateStatus: '',
      guestIpPrefixHelp: '',
      show: true,
      regionProvider: '',
      regionId: '',
      project_domain: '',
      vpcId: '',
      curVpc: null,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'isDomainMode', 'scope', 'userInfo']),
    rules () {
      const rules = {
        project: [
          { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('network.text_116'), trigger: 'blur' },
          { validator: this.$validate('resourceName'), trigger: 'blur' },
        ],
        __meta__: [
          { validator: validateForm('tagName'), trigger: 'change' },
        ],
      }
      if (this.cloudEnv !== 'idc' && this.cloudEnv !== 'onpremise' && this.regionId !== 'default') {
        rules.vpc = [
          { required: true, message: this.$t('network.text_274'), trigger: 'change' },
        ]
      }
      return rules
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
        show_emulated: true,
      }
      if (this.cloudEnv === 'private') {
        params.is_private = true
        params.usable_vpc = true
      } else if (this.cloudEnv === 'public') {
        params.is_public = true
        params.usable_vpc = true
      } else {
        params.is_on_premise = true
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
        project_domain: this.form.domain?.key,
      }
    },
  },
  watch: {
    cloudEnv (newValue) {
      this.$refs.areaSelects?.fetchs(this.areaselectsName)
      if (newValue === 'private') {
        this.show = false
        this.isGroupGuestIpPrefix = false
      } else if (newValue === 'public') {
        this.show = false
        this.isGroupGuestIpPrefix = false
      } else {
        this.show = true
        this.isGroupGuestIpPrefix = true
      }
    },
  },
  methods: {
    handleDomainChange (val) {
      this.project_domain = val?.key || val || ''
    },
    handleRegionChange (data) {
      const { provider, cloudregion } = data
      if (data.hasOwnProperty('provider')) {
        if (provider) {
          this.regionProvider = provider.id || provider
        } else {
          this.regionProvider = ''
          this.regionId = ''
        }
      }
      if (data.hasOwnProperty('cloudregion')) {
        if (cloudregion) {
          this.regionId = cloudregion.id || cloudregion
        }
      }
    },
    vpcChange (vpcId) {
      this.vpcId = vpcId
    },
    vpcLabelFormat (item) {
      const h = this.$createElement
      if (this.cloudEnv === 'public' || this.regionProvider === HYPERVISORS_MAP.hcso.provider || this.regionProvider === HYPERVISORS_MAP.hcs.provider) {
        if (item.manager) {
          if (item.cidr_block) {
            return h('div', [
              item.name,
              h('span', '（' + item.cidr_block + '）'),
              h('span', { class: 'ml-2 text-color-secondary' }, this.$t('common.cloudprovider_1var', [item.manager])),
            ])
          }
          return h('div', [
            item.name,
            h('span', { class: 'ml-2 text-color-secondary' }, this.$t('common.cloudprovider_1var', [item.manager])),
          ])
        }
      } else if (this.cloudEnv === 'onpremise') {
        if (item.cidr_block) {
          return h('div', [item.name, h('span', '（' + item.cidr_block + '）')])
        }
        if (item.id === 'default') {
          const children = [item.name]
          if (item.cidr_block) children.push(h('span', '（' + this.$t('common.text00047') + '）'))
          return h('div', children)
        }
      }
      return h('div', item.name)
    },
    genData (values) {
      const ret = {
        name: values.name,
        description: values.description,
        vpc: values.vpc,
        __meta__: values.__meta__,
      }
      if (!this.isAdminMode && !this.isDomainMode) {
        ret.project_id = this.userInfo.projectId
      } else {
        ret.project_id = values.project?.key
      }
      return ret
    },
    clearGuestIpPrefixError () {
      this.guestIpPrefixValidateStatus = ''
      this.guestIpPrefixHelp = ''
    },
    async handleSubmit () {
      const ListPath = this.$router.resolve(this.$route.path)
      try {
        await this.$refs.formRef.validate()
        this.submiting = true
        const data = this.genData(this.form)
        const manager = new Manager('secgroups')
        await manager.create({ data })
        this.$router.push({ path: ListPath.resolved.matched[0].path })
      } catch (error) {
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
