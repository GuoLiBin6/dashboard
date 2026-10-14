<template>
  <div>
    <a-form-model-item :label="$t('dictionary.domain')" v-bind="formLayout" prop="domain" v-if="isAdminMode && l3PermissionEnable">
      <base-select
        ref="domain"
        v-model:value="form.domain"
        resource="domains"
        remote
        :is-default-select="isDefaultSelect"
        :params="domainParams"
        :select-props="{
          allowClear,
          labelInValue,
          placeholder: $t('rules.domain'),
          popupClassName: 'oc-select-dropdown',
          labelInValueKeyName: 'key',
        }"
        @change="domainChange"
        @update:resList="updateDomainList">
        <template #optionLabelTemplate="{ item }">
          <span class="text-color-secondary option-prefix">{{ $t('dictionary.domain') }}: </span>{{ item.name }}
        </template>
      </base-select>
    </a-form-model-item>
    <a-form-model-item :label="$t('cloudenv.resource_map_type')" :extra="resourceMapExtra" prop="resource_map_type">
      <a-checkbox-group v-model:value="form.resource_map_type" :options="resourceMapTypeOpts" @change="resourceMapTypeChange" />
    </a-form-model-item>
    <a-form-model-item v-if="openProjectMapping" :label="$t('cloudenv.text_580')" prop="project_mapping_id">
      <base-select
        v-model:value="form.project_mapping_id"
        resource="project_mappings"
        showSync
        :select-props="{ placeholder: $t('common.tips.select', [$t('cloudenv.text_580')]) }"
        :params="projectMappingParams" />
      <div slot="extra">
        {{$t('cloudenv.no_project_mapping')}}
        <help-link :href="href">{{$t('cloudenv.go_create')}}</help-link>
      </div>
    </a-form-model-item>
    <a-form-model-item v-if="openProjectMapping" :label="$t('cloudenv.project_mapping_effective_scope')" :extra="effectiveScopeExtra" prop="effective_scope">
      <a-radio-group v-model:value="form.effective_scope" @change="effectiveScopeChange">
        <a-radio-button value="resource">{{$t('cloudenv.resource_tag')}}</a-radio-button>
        <a-radio-button value="project">{{$t('cloudenv.project_tag')}}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="resourceMapType.length" :label="resourceMapType.length === 1 && resourceMapType.includes('project') ? $t('cloudenv.target_project') : $t('cloudenv.default_project')" prop="project">
      <base-select
        ref="project"
        v-model:value="form.project"
        resource="projects"
        remote
        :is-default-select="isDefaultSelect"
        :params="projectParams"
        :select-props="{
          allowClear,
          labelInValue,
          placeholder: $t('rules.project'),
          popupClassName: 'oc-select-dropdown',
          labelInValueKeyName: 'key',
        }"
        @change="projectChange"
        @update:resList="updateProjectList">
        <template #optionLabelTemplate="{ item }">
          <span class="text-color-secondary option-prefix">{{ $t('dictionary.project') }}: </span>{{ item.name }}
        </template>
      </base-select>
    </a-form-model-item>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import { ensureDomainProjectFormFields } from './domainProjectForm'

export default {
  name: 'DomainProject',
  props: {
    form: {
      type: Object,
      required: true,
    },
    labelInValue: {
      type: Boolean,
      default: true,
    },
    fieldMap: {
      type: Object,
      default: () => ({}),
    },
    allowClear: Boolean,
    formLayout: Object,
    provider: {
      type: String,
    },
    showAutoCreateProject: {
      type: Boolean,
      default: true,
    },
    isDefaultSelect: {
      type: Boolean,
      default: true,
    },
    cloneData: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    const init = ensureDomainProjectFormFields(this.form, this.cloneData, this)
    return {
      domains: [],
      domainParams: {
        scope: this.scope,
        limit: 20,
        filter: 'enabled.equals(1)',
      },
      domainId: '',
      projectData: {},
      projects: [],
      disableProjectSelect: false,
      resourceMapType: init.resourceMapType,
      openProjectMapping: init.openProjectMapping,
      effectiveScope: init.effectiveScope,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'isDomainMode', 'userInfo', 'l3PermissionEnable']),
    isOpenstack () {
      if (this.provider) {
        return this.provider.toLowerCase() === 'openstack'
      }
      return false
    },
    resourceMapExtra () {
      const { resourceMapType } = this
      if (!resourceMapType.length) return ''
      if (resourceMapType.length === 1) {
        return this.$t(`cloudenv.resource_map_type.${resourceMapType[0]}`)
      }
      if (resourceMapType.includes('project_mapping') && resourceMapType.includes('external_project') && resourceMapType.includes('cloudprovider')) {
        return this.$t('cloudenv.resource_map_type.all')
      }
      if (resourceMapType.includes('project_mapping') && resourceMapType.includes('external_project')) {
        return this.$t('cloudenv.resource_map_type.project_mapping_and_external_project')
      }
      if (resourceMapType.includes('project_mapping') && resourceMapType.includes('cloudprovider')) {
        return this.$t('cloudenv.resource_map_type.project_mapping_and_cloudprovider')
      }
      if (resourceMapType.includes('external_project') && resourceMapType.includes('cloudprovider')) {
        return this.$t('cloudenv.resource_map_type.external_project_and_cloudprovider')
      }
      const types = resourceMapType.filter(key => key !== 'project')
      if (types.length) {
        return this.$t(`cloudenv.resource_map_type.${types[0]}`)
      }
      return this.$t('cloudenv.resource_map_type.project')
    },
    effectiveScopeExtra () {
      if (this.effectiveScope === 'resource') {
        return this.$t('cloudenv.resource_tag_tip')
      }
      return this.$t('cloudenv.project_tag_tip')
    },
    href () {
      const url = this.$router.resolve('/projectmapping')
      return url.href
    },
    projectParams () {
      const ret = {
        scope: this.scope,
        limit: 20,
      }
      const domainId = this.domainId
      if (domainId && !this.isDomainMode) {
        ret.domain_id = domainId
      }
      if (this.isAdminMode) {
        delete ret.scope
        delete ret.domain_id
        ret.project_domain = domainId || this.userInfo.projectDomainId
      }
      return ret
    },
    projectMappingParams () {
      if (this.isAdminMode) {
        return {
          scope: this.scope,
          project_domain: this.domainId || this.userInfo.projectDomainId,
        }
      }
      return {
        scope: this.scope,
      }
    },
    resourceMapTypeOpts () {
      return [
        { value: 'project_mapping', label: this.$t('cloudenv.belong_to_project.project_mapping') },
        { value: 'external_project', label: this.$t('cloudenv.belong_to_project.external_project') },
        { value: 'cloudprovider', label: this.$t('cloudenv.belong_to_project.cloudprovider') },
        { value: 'project', label: this.$t('cloudenv.target_project') },
      ]
    },
  },
  mounted () {
    this.initDefaultData()
  },
  methods: {
    updateDomainList () {},
    updateProjectList () {},
    async initDefaultData () {
      if (this.isAdminMode) {
        let defaultDomain = { key: this.userInfo.projectDomainId, label: this.userInfo.projectDomain }
        const initialValue = this.fieldMap?.domain?.initialValue
        if (R.is(Object, initialValue) && initialValue.key) {
          defaultDomain = { key: initialValue.key, label: initialValue.label }
        } else if (R.is(String, initialValue) && initialValue) {
          defaultDomain = { key: initialValue }
        }
        const projectInitialValue = this.fieldMap?.project?.initialValue
        const runDomainChange = () => {
          this._setInitDomain(defaultDomain)
          this.domainChange(defaultDomain || {})
        }
        if (R.is(Object, projectInitialValue) && projectInitialValue.key) {
          runDomainChange()
        } else if (R.is(String, projectInitialValue) && projectInitialValue) {
          runDomainChange()
        } else if (this.isDefaultSelect) {
          runDomainChange()
        }
      } else if (this.isDomainMode) {
        const data = [{
          key: this.userInfo.projectDomainId,
          label: this.userInfo.projectDomain,
        }]
        this.domains = data
        this.domainChange(data[0])
        let defaultProject = { key: this.userInfo.projectId, label: this.userInfo.projectName }
        const initialProject = this.fieldMap?.project?.initialValue
        if (R.is(Object, initialProject) && initialProject.key) {
          defaultProject = { key: initialProject.key, label: initialProject.label }
        } else if (R.is(String, initialProject) && initialProject) {
          defaultProject = { key: initialProject.key, label: initialProject.label }
        }
        const runProjectChange = () => {
          this.projectChange(defaultProject || {})
          this._setInitProject(defaultProject || {})
        }
        if (R.is(Object, initialProject) && initialProject.key) {
          runProjectChange()
        } else if (R.is(String, initialProject) && initialProject) {
          runProjectChange()
        } else if (this.isDefaultSelect) {
          runProjectChange()
        }
      } else {
        const data = [{
          key: this.userInfo.projectId,
          label: this.userInfo.projectName,
        }]
        this.projects = data
        this.projectChange(data[0])
        this._setInitProject(data[0])
      }
    },
    resourceMapTypeChange (value) {
      this.resourceMapType = value
      this.openProjectMapping = value.includes('project_mapping')
    },
    effectiveScopeChange (e) {
      this.effectiveScope = e.target.value
    },
    _setInitDomain (domain) {
      if (!R.isNil(domain) && !R.isEmpty(domain)) {
        if (this.labelInValue) {
          this.form.domain = { key: domain.key, label: domain.label }
        } else {
          this.form.domain = domain.key
        }
      }
    },
    _setInitProject (project) {
      if (!R.isNil(project) && !R.isEmpty(project)) {
        if (this.labelInValue) {
          this.form.project = { key: project.key, label: project.label }
        } else {
          this.form.project = project.key
        }
      }
    },
    domainChange (domain) {
      const domainId = R.is(Object, domain) ? domain.key : domain
      if (this.labelInValue) {
        this.$emit('update:domain', domain)
      } else {
        this.$emit('update:domain', domainId)
      }
      this.domainId = domainId
    },
    projectChange (project) {
      const projectId = R.is(Object, project) ? project.key : project
      this.projectData = project
      if (this.labelInValue) {
        this.$emit('update:project', project)
      } else {
        this.$emit('update:project', projectId)
      }
    },
  },
}
</script>
