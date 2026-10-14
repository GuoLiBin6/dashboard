<template>
  <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
    <a-form-model-item :label="$t('system.text_101')" prop="name">
      <a-input :placeholder="$t('system.text_168')" v-model:value="form.name" />
    </a-form-model-item>
    <a-form-model-item :label="$t('common.description')" prop="description">
      <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('dictionary.domain')" v-if="$store.getters.isAdminMode && $store.getters.l3PermissionEnable" prop="domain_id">
      <base-select
        resource="domains"
        v-model="form.domain_id"
        :params="domainParams"
        remote
        version="v1"
        :showSync="true"
        :select-props="{ placeholder: $t('system.text_443', [$t('dictionary.domain')])}" />
        <div slot="extra">{{$t('system.text_439')}}<help-link :href="domainCreateLink">{{$t('system.text_440')}}</help-link>
      </div>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'CreateProject',
  data () {
    return {
      form: {
        name: undefined,
        description: undefined,
        domain_id: undefined,
      },
      rules: {
        name: [
          {
            required: true,
            message: this.$t('system.text_170'),
          },
        ],
        domain_id: [
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
      domainParams: {
        scope: this.$store.getters.scope,
        limit: 20,
        enabled: true,
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'l3PermissionEnable', 'userInfo']),
    tenant () {
      return this.$route.query.tenant
    },
    domain () {
      return this.$route.query.domain
    },
    isClone () {
      if (this.$route.query.tenant && this.$route.query.domain) {
        return true
      }
      return false
    },
    domainCreateLink () {
      return this.$router.resolve('/domain/create').href
    },
  },
  created () {
    if (this.isClone) {
      this.form.domain_id = this.domain
    } else if (!this.isAdminMode || !this.l3PermissionEnable) {
      if (!this.l3PermissionEnable) {
        this.form.domain_id = 'default'
      } else {
        this.form.domain_id = this.userInfo.projectDomainId
      }
    }
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
      return { ...this.form }
    },
  },
}
</script>
