<template>
  <div>
    <a-form-model ref="formRef" :model="form.fd" :rules="formRules" :data-oc-label-min-text="$t('cloudenv.project_mapping_effective_scope')">
      <a-form-model-item :label="$t('cloudenv.text_95')">
        <a-input v-model:value="form.fd.name" :placeholder="$t('cloudenv.text_190')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('common.description')">
        <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
      </a-form-model-item>
      <a-form-model-item :label="keySecretField.label.k">
        <a-input v-model:value="form.fd.oracle_user_ocid" :placeholder="keySecretField.placeholder.k" />
        <div slot="extra" v-if="showDocsLink()">
          {{$t('cloudenv.text_236', [keySecretField.text, keySecretField.label.k])}}
          <help-link :href="docs[provider.toLowerCase()]">{{$t('cloudenv.text_237')}}</help-link>
        </div>
      </a-form-model-item>
      <a-form-model-item :label="keySecretField.label.s">
        <a-input v-model:value="form.fd.oracle_tenancy_ocid" :placeholder="keySecretField.placeholder.s" />
      </a-form-model-item>
      <upload-pem-file :form="form.fd">
        <a-textarea
          v-model:value="form.fd.oracle_private_key"
          :placeholder="$t('common.tips.input', [$t('cloudenv.private_key')])"
          :auto-size="{ minRows: 6, maxRows: 8 }" />
      </upload-pem-file>
      <a-form-model-item :label="$t('cloudenv.cloudaccount.region_id')">
        <a-input v-model:value="form.fd.region_id" :placeholder="$t('common.tips.input', [$t('cloudenv.cloudaccount.region_id')])" />
      </a-form-model-item>
      <domain-project :form="form.fd" :cloneData="cloneData" />
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
import UploadPemFile from '@Cloudenv/views/cloudaccount/components/UploadPemFile'
import { keySecretFields } from '@Cloudenv/views/cloudaccount/constants'
import { isRequired } from '@/utils/validate'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import createMixin from './createMixin'
import DomainProject from '../../../components/DomainProject'

export default {
  name: 'OracleCloudCreate',
  components: {
    AutoSync,
    DomainProject,
    UploadPemFile,
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
    const {
      domain_id,
      project_domain,
      auto_create_project: initAutoCreateProject = false,
      oracle_private_pem: initPrivatePem = '',
      oracle_private_key: initPrivateKey = '',
      region_id: initRegionId = '',
    } = this.cloneData
    if (domain_id && project_domain) {
      initDomain = {
        key: domain_id,
        label: project_domain,
      }
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
        user: {
          name: 'user',
          rules: [
            { required: true, message: this.$t('cloudenv.text_260') },
          ],
        },
        oracle_user_ocid: {
          name: keySecretField.k,
          rules: [
            { required: true, message: keySecretField.placeholder.k },
          ],
        },
        oracle_tenancy_ocid: {
          name: keySecretField.s,
          rules: [
            { required: true, message: keySecretField.placeholder.s },
          ],
        },
        oracle_private_pem: {
          name: 'oracle_private_pem',
          initialValue: initPrivatePem,
          rules: [
            { required: true, message: this.$t('cloudenv.private_pem_message') },
          ],
        },
        oracle_private_key: {
          name: 'oracle_private_key',
          initialValue: initPrivateKey,
          rules: [
            { required: true, message: this.$t('common.tips.input', [this.$t('cloudenv.private_key')]) },
          ],
        },
        domain: {
          name: 'domain',
          initialValue: initDomain,
          rules: [
            { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
          ],
        },
        region_id: {
          name: 'region_id',
          initialValue: initRegionId,
          rules: [
            { required: false, message: this.$t('common.tips.input', [this.$t('cloudenv.cloudaccount.region_id')]) },
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
