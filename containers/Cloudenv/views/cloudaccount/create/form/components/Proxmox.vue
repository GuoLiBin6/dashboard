<template>
  <div>
    <a-form-model ref="formRef" :model="form.fd" :rules="formRules" :data-oc-label-min-text="$t('cloudenv.project_mapping_effective_scope')">
      <a-form-model-item :label="$t('cloudenv.text_95')">
        <a-input v-model:value="form.fd.name" :placeholder="$t('cloudenv.text_190')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')">
        <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('cloudenv.text_261')" :extra="this.$t('common_572')">
        <a-input v-model:value="form.fd.host" />
      </a-form-model-item>
      <a-form-model-item :label="$t('cloudenv.text_266')">
        <a-input v-model:value="form.fd.port" />
      </a-form-model-item>
      <a-form-model-item :label="$t('cloudenv.verify_method')">
        <a-radio-group v-model:value="form.fd.verify_method" @change="onVerifyMethodChange">
          <a-radio-button v-for="item of verifyMethodOptions" :key="item.key" :value="item.key">{{ item.label }}</a-radio-button>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item :label="keySecretField.label.k">
        <a-input v-model:value="form.fd.username" :placeholder="keySecretField.placeholder.k" :suffix="usernameSuffix" />
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

const verifyMethodOptions = [
  { key: 'pam', label: 'PAM' },
  { key: 'pve', label: 'PVE' },
]

export default {
  name: 'ProxmoxCreate',
  components: {
    AutoSync,
    DomainProject,
    ProxySetting,
    ShareMode,
  },
  mixins: [createMixin],
  data () {
    const keySecretField = keySecretFields[this.provider.toLowerCase()]
    let initDomain = {
      key: this.$store.getters.userInfo.projectDomainId,
      label: this.$store.getters.userInfo.projectDomain,
    }
    let initHost = ''
    let initPort = 8006
    let initVerifyMethod = verifyMethodOptions[0].key
    const {
      domain_id,
      project_domain,
      auto_create_project: initAutoCreateProject = false,
      account,
      access_url = '',
    } = this.cloneData
    if (domain_id && project_domain) {
      initDomain = {
        key: domain_id,
        label: project_domain,
      }
    }
    if (access_url) {
      const str = access_url.replace('https://', '').replace('http://', '')
      const list = str.split(':')
      initHost = list[0]
      initPort = list[1] || 8006
    }
    if (account && account.includes(verifyMethodOptions[1].key)) {
      initVerifyMethod = verifyMethodOptions[1].key
    }
    return {
      verifyMethodOptions,
      docs: DOCS_MAP.cloudaccount(),
      showDocsLink,
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
        host: {
          name: 'host',
          validateFirst: true,
          initialValue: initHost,
          rules: [
            { required: true, message: this.$t('cloudenv.text_262') },
            { validator: this.$validate(['domain', 'IPv4'], true, 'some'), trigger: ['blur', 'change'], message: this.$t('cloudenv.text_269') },
          ],
        },
        port: {
          name: 'port',
          initialValue: initPort,
          rules: [
            { type: 'number', min: 0, max: 65535, message: this.$t('cloudenv.text_270'), trigger: 'blur', transform: (v) => parseFloat(v) },
          ],
        },
        verify_method: { name: 'verify_method', initialValue: initVerifyMethod },
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
      },
      keepAliveFields: true,
      form: {
        fd: {
          verify_method: initVerifyMethod,
        },
      },
    }
  },
  computed: {
    usernameSuffix () {
      const suffix = this.form.fd.verify_method || verifyMethodOptions[0].key
      return `@${suffix}`
    },
  },
  methods: {
    onVerifyMethodChange (e) {
      this.form.fd.verify_method = e.target.value
    },
  },
}
</script>
