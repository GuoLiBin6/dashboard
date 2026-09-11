<template>
  <div>
    <a-form-item :label="label">
      <a-radio-group v-decorator="decorators.scope" @change="scopeChange" :disabled="disabled">
        <a-radio-button
          v-for="item in scopeOptions"
          :value="item.key"
          :key="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-item>
    <a-form-item :label="$t('dictionary.domain')" key="domain"  v-if="isAdminMode && l3PermissionEnable && isDomainScope">
      <base-select
        resource="domains"
        v-decorator="decorators.domain"
        :params="domainParams"
        filterable
        remote
        version="v1"
        :disabled="disabled"
        @change="v => emit(v, 'domainId')"
        :select-props="{ placeholder: `${$t('common.text00106')}${$t('dictionary.domain')}` }" />
    </a-form-item>
    <a-form-item :label="$t('dictionary.project')" key="project" v-if="!isProjectMode && isProjectScope">
      <base-select
        resource="projects"
        v-decorator="decorators.project"
        :params="projectParams"
        v-model:item="project"
        filterable
        remote
        version="v1"
        :need-params="true"
        :disabled="disabled"
        @change="v => emit(v, 'projectId')"
        :select-props="{ placeholder: `${$t('common.text00106')}${$t('dictionary.project')}` }" />
    </a-form-item>
    <a-form-item :label="$t('dictionary.domain')" v-if="isDomainMode && isDomainScope">
      <div>{{ userInfo.projectDomain }}</div>
    </a-form-item>
    <a-form-item :label="$t('dictionary.project')" v-if="isProjectMode && isProjectScope">
      <div>{{ userInfo.projectName }}</div>
    </a-form-item>
  </div>
</template>

<script lang="jsx">
import _ from 'lodash'
import { mapGetters } from 'vuex'
import i18n from '@/locales'

export default {
  name: 'ScopeRadio',
  props: {
    decorators: {
      type: Object,
      required: true,
      validator: val => val.scope && val.domain && val.project,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    form: {
      type: Object,
      required: true,
      validator: val => val.fc,
    },
    isDefaultSelect: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      default: i18n.t('common.text00105'),
    },
    hiddenScope: {
      type: Array,
      default () {
        return []
      },
    },
  },
  data () {
    return {
      formScope: _.get(this.decorators, 'scope[1].initialValue'),
      domainParams: {
        scope: this.scope,
        limit: 20,
      },
      project: {},
    }
  },
  computed: {
    ...mapGetters(['scope', 'isAdminMode', 'isDomainMode', 'l3PermissionEnable', 'isProjectMode', 'userInfo']),
    isDomainScope () {
      return this.formScope === 'domain'
    },
    isProjectScope () {
      return this.formScope === 'project'
    },
    projectParams () {
      const params = { limit: 20 }
      if (this.isAdminMode) {
        params.scope = 'system'
      } else if (this.isDomainMode) {
        params.project_domain_id = this.userInfo.projectDomainId
      }
      return params
    },
    scopeOptions () {
      const ret = [
        { label: this.$t('shareScope.project'), key: 'project' },
      ]
      if (this.l3PermissionEnable && !this.isProjectMode) {
        ret.splice(0, 0, { label: this.$t('shareScope.domain'), key: 'domain' })
      }
      if (this.isAdminMode) {
        ret.splice(0, 0, { label: this.$t('dictionary.infos'), key: 'system' })
      }
      return ret.filter(v => !this.hiddenScope.includes(v.key))
    },
  },
  watch: {
    project: {
      handler (val) {
        this.form.fc.setFieldsValue({
          domain: val.domain_id,
        })
      },
      immediate: true,
      deep: true,
    },
  },
  created () {
    const formScopeInit = _.get(this.decorators, 'scope[1].initialValue')
    const isValid = !!this.scopeOptions.find(val => val.key === formScopeInit)
    if (!isValid) {
      this.formScope = this.scopeOptions[0].key
      this.form.fc.setFieldsValue({
        [this.decorators.scope[0]]: this.formScope,
      })
    }
  },
  methods: {
    emit (val, field) {
      const value = {
        scope: this.formScope,
      }
      if (field === 'domainId') {
        value.domain_id = val
      }
      if (field === 'projectId') {
        value.project_id = val
        this.form.fc.setFieldsValue({
          domain: this.project.domain_id,
        })
      }
      this.$emit('change', value)
    },
    projectsLabelFormat (item) {
      let text = item.name
      if (this.isAdminMode && this.l3PermissionEnable) {
        text += `（${this.$t('monitor.text_107')}: ${item.project_domain}）`
      }
      return text
      // 因为在 BaseSelect 的 OptionLabel 中关闭了 labelformat直接返回vnode，所以会显示出兼容的 name，此vnode不会展示。因此目前展示采用👆样式丑陋的方式展示，至少数据是全的
      // return <div class='d-flex'>
      //   <span class='text-truncate flex-fill mr-2' title={ item.name }>{ item.name }</span>
      //   {(this.isAdminMode && this.l3PermissionEnable) ? <span style="color: #8492a6; font-size: 13px">{this.$t('common_257')}{this.$t('dictionary.domain')}: {item.project_domain}</span> : null}
      // </div>
    },
    async scopeChange (e) {
      this.formScope = e.target.value
      const emitValue = {
        scope: this.formScope,
      }
      if (this.isDefaultSelect && (this.formScope !== 'system')) {
        await this.$nextTick()
        const key = this.formScope === 'domain' ? 'projectDomainId' : 'projectId'
        this.form.fc.setFieldsValue({
          [this.decorators[this.formScope][0]]: this.userInfo[key],
        })
        emitValue[`${this.formScope}_id`] = this.userInfo[key]
      }
      this.$emit('change', emitValue)
    },
  },
}
</script>
