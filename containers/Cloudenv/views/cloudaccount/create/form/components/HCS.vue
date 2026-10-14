<template>
  <div>
    <a-form-model ref="formRef" :model="form.fd" :rules="formRules" v-if="fieldMap" v-bind="formLayout" :data-oc-label-min-text="$t('cloudenv.project_mapping_effective_scope')">
      <a-form-model-item :label="$t('cloudenv.text_95')">
        <a-input v-model:value="form.fd.name" :placeholder="$t('cloudenv.text_190')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')">
        <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <!-- hcs 信息 -->
      <h2 class="mb-3">{{ $t('cloudenv.operation_info_input') }}</h2>
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
      <a-form-model-item :label="$t('cloudenv.cloudaccount.hcs.auth_url')">
        <a-input v-model:value="form.fd.auth_url" :placeholder="$t('common.tips.input', [$t('cloudenv.cloudaccount.hcs.auth_url')])" />
      </a-form-model-item>
      <!-- hcsop 信息 -->
      <h2 class="mb-3">{{ $t('cloudenv.operation_and_maintenance_info_input') }}</h2>
      <a-form-model-item :label="$t('cloudenv.text_94')">
        <a-input v-model:value="form.fd.options.account" :placeholder="$t('common.tips.input', [$t('cloudenv.text_94')])" />
      </a-form-model-item>
      <a-form-model-item :label="$t('cloudenv.text_147')">
        <a-input-password v-model:value="form.fd.options.password" :placeholder="$t('common.tips.input', [$t('cloudenv.text_147')])" />
      </a-form-model-item>
      <domain-project :form="form.fd" :form-layout="formLayout" :cloneData="cloneData" />
      <blocked-resources :form="form.fd" :cloneData="cloneData"  />
      <proxy-setting :form="form.fd" ref="proxySetting" :cloneData="cloneData" />
      <auto-sync :form="form.fd" :cloneData="cloneData" />
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
import { keySecretFields } from '@Cloudenv/views/cloudaccount/constants'
import { isRequired } from '@/utils/validate'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import createMixin from './createMixin'
import DomainProject from '../../../components/DomainProject'

export default {
  name: 'HCS',
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
    return {
      docs: DOCS_MAP.cloudaccount(),
      showDocsLink,
      fieldMap: this.getFieldMap(keySecretField),
    }
  },
  methods: {
    getFieldMap (initKeySecretFields) {
      const keySecretField = this.keySecretField || initKeySecretFields
      let initDomain = {
        key: this.$store.getters.userInfo.projectDomainId,
        label: this.$store.getters.userInfo.projectDomain,
      }
      let initAutoCreateProject = false
      let initAuthUrl = ''
      if (this.cloneData) {
        const { access_url, domain_id, project_domain, auto_create_project = false } = this.cloneData
        if (domain_id && project_domain) {
          initDomain = {
            key: domain_id,
            label: project_domain,
          }
        }
        initAutoCreateProject = auto_create_project
        initAuthUrl = access_url
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
        auth_url: {
          name: 'auth_url',
          initialValue: initAuthUrl,
          rules: [
            { required: true, message: this.$t('common.tips.input', [this.$t('cloudenv.cloudaccount.hcs.auth_url')]) },
          ],
        },
        options: {
          account: ['options.account'],
          password: ['options.password'],
        },
      }
      return fieldMap
    },
  },
}
</script>
