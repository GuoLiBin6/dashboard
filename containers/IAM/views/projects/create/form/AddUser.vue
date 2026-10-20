<template>
  <a-form-model ref="formRef" :model="form" :rules="rules">
    <a-form-model-item :label="$t('dictionary.user')">
      <domain-user-select
          :labelInValue="false"
          :form="form"
          :initial-domain-id="domainId"
          :projectDomainId="projectDomainId"
          @domainChange="domainChange" />
    </a-form-model-item>
    <a-form-model-item :label="`${$t('dictionary.role')}`" prop="roles">
      <base-select
        v-model="form.roles"
        version="v1"
        resource="roles"
        :params="roleParams"
        filterable
        :showSync="true"
        :select-props="{ mode: 'multiple', placeholder: $t('rules.role') }" />
      <div slot="extra">{{$t('system.text_441', [$t('dictionary.role')])}}<help-link :href="roleLink">{{$t('system.text_440')}}</help-link></div>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { mapGetters } from 'vuex'
import DomainUserSelect from '../../components/DomainUserSelect'

export default {
  name: 'AddUser',
  components: {
    DomainUserSelect,
  },
  props: {
    domainId: {
      type: String,
      default: 'default',
    },
    domainOpt: [],
  },
  data () {
    return {
      projectDomainId: this.domainId,
      form: {
        domain: this.domainId,
        users: undefined,
        roles: undefined,
      },
      rules: {
        users: [
          { required: true, message: this.$t('rules.user') },
        ],
        roles: [
          { required: true, message: this.$t('rules.role') },
        ],
        domain: [
          { required: true, message: this.$t('rules.domain') },
        ],
      },
    }
  },
  computed: {
    ...mapGetters(['scope', 'isAdminMode', 'userInfo', 'l3PermissionEnable']),
    roleParams () {
      const params = {
        scope: this.scope,
        limit: 0,
      }
      if (this.isAdminMode) {
        if (this.l3PermissionEnable) {
          params.domain_id = this.projectDomainId || this.userInfo.projectDomainId
        } else {
          params.domain_id = this.userInfo.projectDomainId
        }
      }
      return params
    },
    roleLink () {
      return this.$router.resolve('/role').href
    },
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
      return { ...this.form }
    },
    domainChange (val) {
      this.projectDomainId = val
    },
  },
}
</script>
