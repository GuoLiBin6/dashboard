<template>
  <a-form-model ref="formRef" :model="form" :rules="rules">
    <a-form-model-item :label="$t('system.text_101')" prop="name">
      <a-input :placeholder="$t('system.text_168')" v-model:value="form.name" />
    </a-form-model-item>
    <a-form-model-item :label="$t('common.description')" prop="description">
      <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_221')" prop="password">
      <a-input-password :placeholder="$t('system.text_239')" v-model:value="form.password" />
    </a-form-model-item>
    <a-form-model-item :label="$t('dictionary.domain')" v-if="isAdminMode" prop="domain">
      <base-select
        resource="domains"
        v-model="form.domain"
        :params="domainParams"
        filterable
        remote
        version="v1"
        :showSync="true"
        :select-props="{placeholder: $t('system.text_443', [$t('dictionary.domain')]), labelInValue: true }" />
        <div slot="extra">{{$t('system.text_439')}}<help-link :href="domainCreateLink">{{$t('system.text_128')}}</help-link>
      </div>
    </a-form-model-item>
    <a-form-model-item :label="$t('scope.text_245')" prop="displayname">
      <a-input :placeholder="$t('system.displayname_tip')" v-model:value="form.displayname" />
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_475')" prop="allow_web_console">
      <a-switch :checkedChildren="$t('system.text_134')" :unCheckedChildren="$t('system.text_135')" v-model:checked="form.allow_web_console" />
      <div slot="extra">{{$t('system.text_481')}}</div>
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_483')" prop="enable_mfa">
      <a-switch :checkedChildren="$t('system.text_134')" :unCheckedChildren="$t('system.text_135')" v-model:checked="form.enable_mfa" />
      <div slot="extra">{{$t('system.text_484')}}</div>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'CreateUser',
  data () {
    return {
      minPasswordLen: null,
      form: {
        name: undefined,
        description: undefined,
        password: undefined,
        domain: undefined,
        displayname: '',
        allow_web_console: true,
        enable_mfa: false,
      },
      rules: {
        name: [
          { required: true, message: this.$t('system.text_168') },
        ],
        password: [
          { required: true, message: this.$t('system.text_486'), trigger: 'blur' },
        ],
        domain: [
          { required: true, message: this.$t('rules.domain') },
        ],
      },
      domainParams: {
        scope: this.$store.getters.scope,
        limit: 20,
        enabled: true,
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode']),
    domainCreateLink () {
      return this.$router.resolve('/domain/create').href
    },
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
      return { ...this.form }
    },
  },
}
</script>
