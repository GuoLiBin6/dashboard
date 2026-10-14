<template>
  <div>
    <a-alert v-if="isOpenstack" class="my-2" :message="$t('cloudenv.text_252')" banner />
    <a-form-model ref="formRef" :model="form.fd" :rules="formRules" v-bind="formLayout" :data-oc-label-min-text="$t('cloudenv.project_mapping_effective_scope')">
      <a-form-model-item :label="$t('cloudenv.text_95')">
        <a-input v-model:value="form.fd.name" :placeholder="$t('cloudenv.text_190')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')">
        <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('cloudenv.text_253')">
        <a-input v-model:value="form.fd.auth_url" />
        <span slot="extra" v-if="isOpenstack">
          {{$t('common_569')}}
        </span>
        <span slot="extra" v-else-if="isZStack">
          {{$t('cloudenv.zstack.auth_url_extra')}}
        </span>
        <span slot="extra" v-else>
          {{$t('common_570')}}
        </span>
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
      <a-form-model-item :label="$t('cloudenv.text_254')"  v-if="isOpenstack">
        <a-input v-model:value="form.fd.project_name" :placeholder="$t('cloudenv.text_255')" />
      </a-form-model-item>
      <a-form-model-item label="Domain Name"  v-if="isOpenstack">
        <a-input v-model:value="form.fd.domain_name" />
      </a-form-model-item>
      <domain-project :form="form.fd" :form-layout="formLayout" :cloneData="cloneData" />
      <blocked-resources :form="form.fd" :cloneData="cloneData"  />
      <proxy-setting :form="form.fd" ref="proxySetting" :cloneData="cloneData" />
      <auto-sync :form="form.fd" :form-layout="formLayout" :cloneData="cloneData" />
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
  name: 'OpenstackZstack',
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
  computed: {
    isOpenstack () {
      return this.provider.toLowerCase() === 'openstack'
    },
    urlPlaceholder () {
      if (this.isOpenstack) {
        return this.$t('cloudenv.text_256')
      }
      return this.$t('cloudenv.text_257')
    },
    isZStack () {
      return this.provider.toLowerCase() === 'zstack'
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
        access_url: initAuthUrl = '',
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
        auth_url: {
          name: 'auth_url',
          validateFirst: true,
          initialValue: initAuthUrl,
          rules: [
            { required: true, message: this.$t('cloudenv.text_258') },
            { validator: this.$validate('url') },
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
        project_name: {
          name: 'project_name',
          rules: [
            { required: true, message: this.$t('cloudenv.text_259') },
          ],
        },
        domain_name: { name: 'domain_name' },
        domain: {
          name: 'domain',
          initialValue: initDomain,
          rules: [
            { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
          ],
        },
        auto_create_project: {
          name: 'auto_create_project',
          initialValue: initAutoCreateProject || this.provider.toLowerCase() === 'openstack',
          valuePropName: 'checked',
        },
      }
      return fieldMap
    },
  },
}
</script>
