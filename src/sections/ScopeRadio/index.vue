<template>
  <div>
    <a-form-model-item :label="label" :prop="scopeProp">
      <a-radio-group :value="formScope" @change="scopeChange" :disabled="disabled">
        <a-radio-button
          v-for="item in scopeOptions"
          :value="item.key"
          :key="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item :label="$t('dictionary.domain')" key="domain" :prop="domainProp" v-if="isAdminMode && l3PermissionEnable && isDomainScope">
      <base-select
        resource="domains"
        :value="domainValue"
        :params="domainParams"
        filterable
        remote
        version="v1"
        :disabled="disabled"
        @change="onDomainChange"
        :select-props="{ placeholder: `${$t('common.text00106')}${$t('dictionary.domain')}` }" />
    </a-form-model-item>
    <a-form-model-item :label="$t('dictionary.project')" key="project" :prop="projectProp" v-if="!isProjectMode && isProjectScope">
      <base-select
        resource="projects"
        :value="projectValue"
        :params="projectParams"
        v-model:item="project"
        filterable
        remote
        version="v1"
        :need-params="true"
        :disabled="disabled"
        @change="onProjectChange"
        :select-props="{ placeholder: `${$t('common.text00106')}${$t('dictionary.project')}` }" />
    </a-form-model-item>
    <a-form-model-item :label="$t('dictionary.domain')" v-if="isDomainMode && isDomainScope">
      <div>{{ userInfo.projectDomain }}</div>
    </a-form-model-item>
    <a-form-model-item :label="$t('dictionary.project')" v-if="isProjectMode && isProjectScope">
      <div>{{ userInfo.projectName }}</div>
    </a-form-model-item>
  </div>
</template>

<script lang="jsx">
import { mapGetters } from 'vuex'
import i18n from '@/locales'

export default {
  name: 'ScopeRadio',
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    form: {
      type: Object,
    },
    /** a-form-model：读写 scope / domain / project（必传） */
    model: {
      type: Object,
      required: true,
    },
    /** 可选：{ scope, domain, project } → rules[]，供 validate() */
    fieldRules: {
      type: Object,
      default: null,
    },
    scopeProp: {
      type: String,
      default: 'scope',
    },
    domainProp: {
      type: String,
      default: 'domain',
    },
    projectProp: {
      type: String,
      default: 'project',
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
      formScope: this.model[this.scopeProp],
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
    domainValue () {
      return this.model[this.domainProp]
    },
    projectValue () {
      return this.model[this.projectProp]
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
        if (!val || !val.domain_id) return
        this.model[this.domainProp] = val.domain_id
      },
      immediate: true,
      deep: true,
    },
  },
  created () {
    this.initModelMode()
  },
  methods: {
    initModelMode () {
      const isValid = !!this.scopeOptions.find(val => val.key === this.formScope)
      if (!isValid) {
        this.formScope = this.scopeOptions[0].key
      }
      this.model[this.scopeProp] = this.formScope
    },
    setField (key, value) {
      this.model[key] = value
    },
    onDomainChange (v) {
      this.setField(this.domainProp, v)
      this.emit(v, 'domainId')
    },
    onProjectChange (v) {
      this.setField(this.projectProp, v)
      this.emit(v, 'projectId')
    },
    emit (val, field) {
      const value = {
        scope: this.formScope,
      }
      if (field === 'domainId') {
        value.domain_id = val
      }
      if (field === 'projectId') {
        value.project_id = val
        this.model[this.domainProp] = this.project.domain_id
      }
      this.$emit('change', value)
    },
    async scopeChange (e) {
      this.formScope = e?.target?.value ?? e
      this.setField(this.scopeProp, this.formScope)
      const emitValue = {
        scope: this.formScope,
      }
      if (this.isDefaultSelect && (this.formScope !== 'system')) {
        await this.$nextTick()
        const key = this.formScope === 'domain' ? 'projectDomainId' : 'projectId'
        const fieldKey = this.formScope === 'domain' ? this.domainProp : this.projectProp
        this.setField(fieldKey, this.userInfo[key])
        emitValue[`${this.formScope}_id`] = this.userInfo[key]
      }
      this.$emit('change', emitValue)
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length)
          if (empty) {
            reject(new Error(rule.message || 'required'))
            return
          }
        }
        if (typeof rule.validator === 'function') {
          let settled = false
          const finish = (err) => {
            if (settled) return
            settled = true
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          }
          let ret
          try {
            ret = rule.validator(rule, value, finish)
          } catch (e) {
            finish(e)
            return
          }
          if (ret && typeof ret.then === 'function') {
            ret.then(() => finish()).catch(finish)
          }
          return
        }
        resolve()
      })
    },
    async validate () {
      const rulesMap = this.fieldRules || {}
      const pairs = [
        [this.scopeProp, rulesMap.scope],
        [this.domainProp, rulesMap.domain],
        [this.projectProp, rulesMap.project],
      ]
      for (const [prop, rules] of pairs) {
        if (!rules?.length) continue
        for (const rule of rules) {
          await this.runFieldRule(rule, this.model[prop])
        }
      }
      return true
    },
  },
}
</script>
