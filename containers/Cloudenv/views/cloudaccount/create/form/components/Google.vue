<template>
  <div>
    <a-form-model ref="formRef" :model="form.fd" :rules="formRules" v-bind="formLayout" :data-oc-label-min-text="$t('cloudenv.project_mapping_effective_scope')">
      <a-form-model-item :label="$t('cloudenv.text_95')">
        <a-input v-model:value="form.fd.name" :placeholder="$t('cloudenv.text_190')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')">
        <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <domain-project :form="form.fd" :form-layout="formLayout" :cloneData="cloneData" />
      <blocked-resources :form="form.fd" :cloneData="cloneData"  />
      <upload-json-file :form="form.fd">
        <a-form-model-item label="project_id" prop="gcp_project_id">
          <a-input v-model:value="form.fd.gcp_project_id" :placeholder="$t('cloudenv.text_247')" />
          <div slot="extra" v-if="showDocsLink()">{{$t('cloudenv.text_248', [ `如何获取Google云project_id？点击查看帮助` ])}}<help-link :href="docs['google']">{{$t('cloudenv.text_237')}}</help-link>
          </div>
        </a-form-model-item>
        <a-form-model-item label="private_key_id" prop="gcp_private_key_id">
          <a-input v-model:value="form.fd.gcp_private_key_id" :placeholder="$t('cloudenv.text_162')" />
        </a-form-model-item>
        <a-form-model-item label="private_key" prop="gcp_private_key">
          <a-textarea style="overflow-y:auto" :autosize="{ minRows: 3, maxRows: 35 }" v-model:value="form.fd.gcp_private_key" :placeholder="$t('cloudenv.text_161')" />
        </a-form-model-item>
        <a-form-model-item label="client_email" prop="gcp_client_email">
          <a-input v-model:value="form.fd.gcp_client_email" :placeholder="$t('cloudenv.text_249')" />
        </a-form-model-item>
      </upload-json-file>
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
import UploadJsonFile from '@Cloudenv/views/cloudaccount/components/UploadJsonFile'
import { keySecretFields } from '@Cloudenv/views/cloudaccount/constants'
import { isRequired } from '@/utils/validate'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import createMixin from './createMixin'
import DomainProject from '../../../components/DomainProject'

export default {
  name: 'GoogleCreate',
  components: {
    AutoSync,
    DomainProject,
    UploadJsonFile,
    ProxySetting,
    ShareMode,
    ReadOnly,
  },
  mixins: [createMixin],
  data () {
    const keySecretField = keySecretFields[this.provider.toLowerCase()]
    let initDomain = {
      key: this.$store.getters.userInfo.projectDomainId,
      label: this.$store.getters.userInfo.projectDomain,
    }
    let initAutoCreateProject = false
    let initProjectId = ''
    let initPrivateKeyId = ''
    let initPrivateKey = ''
    let initClientEmail = ''
    if (this.cloneData) {
      const {
        domain_id,
        project_domain,
        auto_create_project = false,
        gcp_project_id = '',
        gcp_private_key_id = '',
        gcp_private_key = '',
        gcp_client_email = '',
      } = this.cloneData
      if (domain_id && project_domain) {
        initDomain = {
          key: domain_id,
          label: project_domain,
        }
      }
      initProjectId = gcp_project_id
      initPrivateKeyId = gcp_private_key_id
      initPrivateKey = gcp_private_key
      initClientEmail = gcp_client_email
      initAutoCreateProject = auto_create_project
    }
    return {
      docs: DOCS_MAP.cloudaccount(),
      showDocsLink,
      keySecretField,
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
        project_id: {
          name: 'gcp_project_id',
          initialValue: initProjectId,
          rules: [
            { required: true, message: this.$t('cloudenv.text_247') },
          ],
        },
        private_key_id: {
          name: 'gcp_private_key_id',
          initialValue: initPrivateKeyId,
          rules: [
            { required: true, message: this.$t('cloudenv.text_162') },
          ],
        },
        private_key: {
          name: 'gcp_private_key',
          initialValue: initPrivateKey,
          rules: [
            { required: true, message: this.$t('cloudenv.text_161') },
          ],
        },
        client_email: {
          name: 'gcp_client_email',
          initialValue: initClientEmail,
          rules: [
            { required: true, message: this.$t('cloudenv.text_249') },
            { type: 'email', message: this.$t('cloudenv.text_250') },
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
    }
  },
}
</script>
