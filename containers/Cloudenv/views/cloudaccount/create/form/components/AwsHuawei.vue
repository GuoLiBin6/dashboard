<template>
  <div>
    <a-form-model ref="formRef" :model="form.fd" :rules="formRules" :data-oc-label-min-text="$t('cloudenv.project_mapping_effective_scope')">
      <a-form-model-item :label="$t('cloudenv.text_95')">
        <a-input v-model:value="form.fd.name" :placeholder="$t('cloudenv.text_190')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')">
        <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <a-form-model-item v-if="provider !== 'Huawei' && provider !== 'Ctyun'" :label="$t('cloudenv.environment')">
        <base-select
          :options="environments"
          v-model:value="form.fd.environment"
          :selectProps="{ placeholder: $t('cloudenv.environment_check') }" />
      </a-form-model-item>
      <a-form-model-item :label="keySecretField.label.k">
        <a-input v-model:value="form.fd.username" :placeholder="keySecretField.placeholder.k" />
        <div slot="extra" v-if="showDocsLink()">
          {{$t('cloudenv.text_236', [keySecretField.text, keySecretField.label.k])}}
          <help-link :href="docs[provider.toLowerCase()]">{{$t('cloudenv.text_237')}}</help-link>
        </div>
      </a-form-model-item>
      <a-form-model-item :label="keySecretField.label.s">
        <a-input-password v-model:value="form.fd.password" :placeholder="keySecretField.placeholder.s" />
      </a-form-model-item>
      <domain-project :form="form.fd" :cloneData="cloneData" />
      <blocked-resources :form="form.fd" :cloneData="cloneData"  />
      <proxy-setting :form="form.fd" ref="proxySetting" />
      <a-form-model-item :label="$t('cloudaccount.create_form.saml_user_label')" v-show="!isNotSupportSaml">
        <a-switch :checkedChildren="$t('cloudenv.text_84')" :unCheckedChildren="$t('cloudenv.text_85')" v-model:checked="samlAuthChecked" @change="onSamlAuthChange" />
        <div slot="extra">
          <i18n path="cloudaccount.create_form.saml_user_extra" v-if="showDocsLink()">
            <template #link>
              <help-link :href="smaluserDoc">{{$t('cloudaccount.create_form.saml_user_link')}}</help-link>
            </template>
          </i18n>
          <i18n v-else path="cloudaccount.create_form.saml_user_extra_1" />
        </div>
      </a-form-model-item>
      <auto-sync :form="form.fd" />
      <read-only :cloneData="cloneData" />
      <share-mode :form="form.fd" :cloneData="cloneData" />
    </a-form-model>
  </div>
</template>

<script>
import AutoSync from '@Cloudenv/views/cloudaccount/components/AutoSync'
import ProxySetting from '@Cloudenv/views/cloudaccount/components/ProxySetting'
import ShareMode from '@Cloudenv/views/cloudaccount/components/ShareMode'
import ReadOnly from '@Cloudenv/views/cloudaccount/components/ReadOnly'
import { keySecretFields, ACCESS_URL } from '@Cloudenv/views/cloudaccount/constants'
import { isRequired } from '@/utils/validate'
import { PROVIDER_MAP } from '@/constants'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import createMixin from './createMixin'
import DomainProject from '../../../components/DomainProject'

export default {
  name: 'AwsHuawei',
  components: {
    AutoSync,
    DomainProject,
    ProxySetting,
    ShareMode,
    ReadOnly,
  },
  mixins: [createMixin],
  data () {
    const keySecretField = keySecretFields[this.provider.toLowerCase()]
    const environments = Object.entries(ACCESS_URL[this.provider.toLowerCase()]).map(keyValueArr => ({ key: keyValueArr[0], label: keyValueArr[1] }))
    return {
      showDocsLink,
      docs: DOCS_MAP.cloudaccount(),
      smaluserDoc: DOCS_MAP.samlUser(),
      fieldMap: this.getFieldMap(keySecretField, environments),
      environments,
    }
  },
  computed: {
    isNotSupportSaml () {
      const providers = [PROVIDER_MAP.Ctyun.key]
      return providers.includes(this.provider)
    },
  },
  deactivated () {
    this.$refs.formRef && this.$refs.formRef.resetFields()
  },
  methods: {
    getFieldMap (initKeySecretFields, environments) {
      const keySecretField = this.keySecretField || initKeySecretFields
      let initEnvironment
      let initDomain = {
        key: this.$store.getters.userInfo.projectDomainId,
        label: this.$store.getters.userInfo.projectDomain,
      }
      let initSamlAuth = false
      let initAutoCreateProject = false
      if (this.cloneData) {
        const { access_url, domain_id, project_domain, saml_auth = false, auto_create_project = false } = this.cloneData
        const tEnv = environments.filter(item => item.key === access_url)
        if (tEnv.length > 0) {
          initEnvironment = tEnv[0].key
        }
        if (domain_id && project_domain) {
          initDomain = {
            key: domain_id,
            label: project_domain,
          }
        }
        initSamlAuth = saml_auth
        initAutoCreateProject = auto_create_project
      }
      const fieldMap = {
        name: {
          name: 'name',
          validateFirst: true,
          rules: [
            { required: true, message: this.$t('cloudenv.text_190') },
            // { validator: this.$validate('resourceName') },
          ],
        },
        description: { name: 'description' },
        environment: {
          name: 'environment',
          initialValue: initEnvironment,
          rules: [
            { required: true, message: this.$t('cloudenv.environment_check'), trigger: 'change' },
          ],
        },
        username: {
          name: keySecretField.k,
          rules: [
            { required: true, message: keySecretField.placeholder.k },
          ],
        },
        password: {
          name: keySecretField.s,
          rules: [
            { required: true, message: keySecretField.placeholder.s },
          ],
        },
        domain: {
          name: 'domain',
          initialValue: initDomain,
          rules: [
            { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
          ],
        },
        auto_create_project: {
          name: 'auto_create_project',
          initialValue: initAutoCreateProject,
          valuePropName: 'checked',
        },
        saml_auth: {
          name: 'saml_auth',
          initialValue: initSamlAuth,
          valuePropName: 'checked',
        },
      }
      return fieldMap
    },
  },
}
</script>
