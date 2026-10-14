<template>
  <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
    <a-form-model-item :label="$t('dictionary.project')">
      <domain-project-select
        :labelInValue="false"
        :form="form"
        :projectDomainId="domainId"
        @domainChange="domainChange" />
    </a-form-model-item>
    <a-form-model-item :label="`${$t('dictionary.role')}`" prop="roles">
      <base-select
        v-model="form.roles"
        version="v1"
        resource="roles"
        :params="roleParams"
        filterable
        remote
        :showSync="true"
        :select-props="{ mode: 'multiple', placeholder: $t('rules.role') }" />
      <div slot="extra">{{$t('system.text_441', [$t('dictionary.role')])}}<help-link :href="roleLink">{{$t('system.text_440')}}</help-link></div>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { mapGetters } from 'vuex'
import DomainProjectSelect from '../../components/DomainProjectSelect'

export default {
  name: 'JoinProject',
  components: {
    DomainProjectSelect,
  },
  props: {
    domain: {
      type: Object,
      validator: val => val.key && val.label,
    },
  },
  data () {
    const domainId = !this.domain || !this.$store.getters.l3PermissionEnable ? 'default' : this.domain.key
    const initialDomain = this.$store.getters.isAdminMode ? (this.domain || { key: 'default', label: 'Default' }) : domainId
    return {
      form: {
        domain: initialDomain,
        projects: undefined,
        roles: undefined,
      },
      rules: {
        roles: [
          { required: true, message: this.$t('rules.role') },
        ],
        projects: [
          { required: true, message: this.$t('rules.project') },
        ],
        domain: [
          { required: true, message: this.$t('rules.domain') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
          xxl: {
            span: 22,
          },
        },
        labelCol: {
          span: 3,
          xxl: {
            span: 2,
          },
        },
      },
      domainId,
    }
  },
  computed: {
    ...mapGetters(['isDomainMode', 'isAdminMode', 'userInfo', 'l3PermissionEnable', 'scope']),
    domainOptions () {
      return [{
        label: 'Default',
        key: 'default',
      }]
    },
    domainParams () {
      return {
        scope: this.scope,
      }
    },
    roleParams () {
      const ret = {
        scope: this.scope,
        limit: 20,
      }
      return ret
    },
    roleLink () {
      return this.$router.resolve('/role').href
    },
    projectCreateLink () {
      return this.$router.resolve('/project/create').href
    },
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
      return { ...this.form }
    },
    domainChange (val) {
      this.domainId = val
    },
  },
}
</script>
