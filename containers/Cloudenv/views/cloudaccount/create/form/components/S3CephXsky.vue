<template>
  <div>
    <a-form-model ref="formRef" :model="form.fd" :rules="formRules" :data-oc-label-min-text="$t('cloudenv.project_mapping_effective_scope')">
      <a-form-model-item :label="$t('cloudenv.text_95')">
        <a-input v-model:value="form.fd.name" :placeholder="$t('cloudenv.text_190')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')">
        <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('cloudenv.text_261')" :extra="$t('common_571')">
        <a-input v-model:value="form.fd.endpoint" />
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
      <a-form-model-item :label="$t('cloudenv.s3.sign_alg_version')" v-if="isS3">
        <a-radio-group v-model:value="form.fd.options__sign_ver">
          <a-radio-button value="">{{ $t('common_712') }}</a-radio-button>
          <a-radio-button value="v2">V2</a-radio-button>
          <a-radio-button value="v4">V4</a-radio-button>
        </a-radio-group>
      </a-form-model-item>
      <domain-project :form="form.fd" :cloneData="cloneData" />
      <blocked-resources :form="form.fd" :cloneData="cloneData"  />
      <proxy-setting :form="form.fd" ref="proxySetting" :cloneData="cloneData" />
      <auto-sync :form="form.fd" :cloneData="cloneData" />
      <share-mode :form="form.fd" :cloneData="cloneData" />
    </a-form-model>
  </div>
</template>

<script>
import AutoSync from '@Cloudenv/views/cloudaccount/components/AutoSync'
import ProxySetting from '@Cloudenv/views/cloudaccount/components/ProxySetting'
import ShareMode from '@Cloudenv/views/cloudaccount/components/ShareMode'
import { keySecretFields } from '@Cloudenv/views/cloudaccount/constants'
import { isRequired } from '@/utils/validate'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import createMixin from './createMixin'
import DomainProject from '../../../components/DomainProject'

export default {
  name: 'S3CephXsky',
  components: {
    AutoSync,
    DomainProject,
    ProxySetting,
    ShareMode,
  },
  mixins: [createMixin],
  data () {
    const keySecretField = keySecretFields[this.provider.toLowerCase()]
    return {
      docs: DOCS_MAP.cloudaccount(),
      showDocsLink,
      fieldMap: this.getFieldMap(keySecretField),
    }
  },
  computed: {
    isS3 () {
      return this.provider.toLowerCase() === 's3'
    },
  },
  deactivated () {
    this.$refs.formRef && this.$refs.formRef.resetFields()
  },
  methods: {
    getFieldMap (initKeySecretFields) {
      const keySecretField = this.keySecretField || initKeySecretFields
      let initDomain = {
        key: this.$store.getters.userInfo.projectDomainId,
        label: this.$store.getters.userInfo.projectDomain,
      }
      const {
        domain_id,
        project_domain,
        auto_create_project: initAutoCreateProject = false,
        access_url: initEndpoint = '',
      } = this.cloneData
      if (domain_id && project_domain) {
        initDomain = {
          key: domain_id,
          label: project_domain,
        }
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
        endpoint: {
          name: 'endpoint',
          validateFirst: true,
          initialValue: initEndpoint,
          rules: [
            { required: true, message: this.$t('cloudenv.text_263') },
            { validator: this.$validate('url'), trigger: ['blur'] },
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
        options__sign_ver: { name: 'options__sign_ver', initialValue: '' },
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
      }
      return fieldMap
    },
  },
}
</script>
