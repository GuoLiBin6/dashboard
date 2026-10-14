<template>
  <div>
    <a-form-model ref="formRef" :model="form.fd" :rules="formRules" v-bind="formLayout" :data-oc-label-min-text="$t('cloudenv.project_mapping_effective_scope')">
      <a-form-model-item :label="$t('cloudenv.text_95')">
        <a-input v-model:value="form.fd.name" :placeholder="$t('cloudenv.text_190')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')">
        <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('cloudenv.environment')">
        <base-select
          :options="environments"
          v-model:value="form.fd.environment"
          :selectProps="{ placeholder: $t('cloudenv.environment_check') }"
          @change="envChangeHandle" />
      </a-form-model-item>
      <a-form-model-item :label="keySecretField.label.k">
        <a-input v-model:value="form.fd.username" :placeholder="keySecretField.placeholder.k" />
        <div slot="extra" v-if="showDocsLink()">
          {{$t('cloudenv.text_236', [keySecretField.text, keySecretField.label.k])}}
          <help-link :href="docs[provider.toLowerCase()]">{{$t('cloudenv.text_237')}}</help-link>
        </div>
      </a-form-model-item>
      <a-form-model-item>
        <span slot="label">{{$t('cloudenv.text_239')}}</span>
        <a-input v-model:value="form.fd.directory_id" :placeholder="$t('cloudenv.text_241')" />
      </a-form-model-item>
      <a-form-model-item :label="keySecretField.label.s">
        <a-input-password v-model:value="form.fd.password" :placeholder="keySecretField.placeholder.s" />
      </a-form-model-item>
      <domain-project :form="form.fd" :form-layout="formLayout" :cloneData="cloneData" />
      <blocked-resources :form="form.fd"  />
      <proxy-setting :form="form.fd" ref="proxySetting" :cloneData="cloneData" />
      <a-form-model-item :label="$t('cloudaccount.create_form.saml_user_label')" v-if="isAzurePublicCloud">
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
      <auto-sync :form="form.fd" :form-layout="formLayout" :cloneData="cloneData" />
      <read-only :cloneData="cloneData" />
      <skip-duplicate-account-check :cloneData="cloneData" />
      <share-mode :form="form.fd" :cloneData="cloneData" />
    </a-form-model>
  </div>
</template>

<script>
import AutoSync from '@Cloudenv/views/cloudaccount/components/AutoSync'
import ProxySetting from '@Cloudenv/views/cloudaccount/components/ProxySetting'
import ShareMode from '@Cloudenv/views/cloudaccount/components/ShareMode'
import ReadOnly from '@Cloudenv/views/cloudaccount/components/ReadOnly'
import SkipDuplicateAccountCheck from '@Cloudenv/views/cloudaccount/components/SkipDuplicateAccountCheck'
import { keySecretFields, ACCESS_URL } from '@Cloudenv/views/cloudaccount/constants'
import { isRequired } from '@/utils/validate'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import createMixin from './createMixin'
import DomainProject from '../../../components/DomainProject'

export default {
  name: 'AzureCreate',
  components: {
    AutoSync,
    DomainProject,
    ProxySetting,
    ShareMode,
    ReadOnly,
    SkipDuplicateAccountCheck,
  },
  mixins: [createMixin],
  data () {
    const keySecretField = keySecretFields[this.provider.toLowerCase()]
    const environments = Object.entries(ACCESS_URL[this.provider.toLowerCase()]).map(keyValueArr => ({ key: keyValueArr[0], label: keyValueArr[1] }))
    let initDomain = {
      key: this.$store.getters.userInfo.projectDomainId,
      label: this.$store.getters.userInfo.projectDomain,
    }
    let initEnvironment
    let initSamlAuth = false
    let initAutoCreateProject = false
    let initDirectoryId = ''
    if (this.cloneData) {
      const { access_url, domain_id, project_domain, saml_auth = false, auto_create_project = false, directory_id = '' } = this.cloneData
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
      initDirectoryId = directory_id
    }
    return {
      showDocsLink,
      formLayout: {
        labelCol: { span: 4 },
        wrapperCol: { span: 10 },
      },
      docs: DOCS_MAP.cloudaccount(),
      smaluserDoc: DOCS_MAP.samlUser(),
      environments,
      fieldMap: {
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
        directory_id: {
          name: 'directory_id',
          initialValue: initDirectoryId,
          rules: [
            { required: true, message: this.$t('cloudenv.text_243'), trigger: 'blur' },
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
        balanceKey: { name: 'balanceKey' },
      },
      isAzurePublicCloud: false,
    }
  },
  methods: {
    envChangeHandle (changeValue) {
      this.isAzurePublicCloud = changeValue === 'AzurePublicCloud'
    },
  },
}
</script>
