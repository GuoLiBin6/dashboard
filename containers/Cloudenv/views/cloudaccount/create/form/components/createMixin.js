import { keySecretFields } from '@Cloudenv/views/cloudaccount/constants'
import BlockedResources from '@Cloudenv/views/cloudaccount/components/BlockedResources'
import { PROVIDER_MAP, EXTRA_HYPERVISORS } from '@/constants'
import { getDomainProjectExtraRules } from '@Cloudenv/views/cloudaccount/components/domainProjectForm'
import {
  applyFieldMapInitialValues,
  rulesFromFieldMap,
  trimFormValues,
} from './createFormModelHelpers'

export default {
  components: {
    BlockedResources,
  },
  props: {
    provider: {
      type: String,
      required: true,
    },
    cloneData: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    let initialProject = {
      key: this.$store.getters.userInfo.projectId,
      label: this.$store.getters.userInfo.project,
    }
    let initIsOpenBlockedResources = false
    let initBlockedResources = []
    if (this.cloneData) {
      const { tenant, tenant_id, skip_sync_resources = [] } = this.cloneData
      if (tenant || tenant_id) {
        initialProject = {
          key: tenant_id,
          label: tenant,
        }
      }
      if (skip_sync_resources.length > 0) {
        initIsOpenBlockedResources = true
        initBlockedResources = skip_sync_resources
      }
    }
    return {
      form: {
        fd: {
          domain: '',
          share_mode: 'account_domain',
          project: initialProject,
          isOpenBlockedResources: initIsOpenBlockedResources,
          blockedResources: initBlockedResources,
          enable_auto_sync: false,
          sync_interval_seconds: 60,
          proxy_setting: '',
          saml_auth: false,
        },
      },
      keySecretFieldInit: keySecretFields[this.provider.toLowerCase()],
      domainProjectShow: false,
      samlAuthChecked: false,
      fieldMap: {
        project: {
          name: 'project',
          initialValue: initialProject,
          rules: [
            { required: true, message: this.$t('rules.project') },
          ],
        },
        isOpenBlockedResources: {
          name: 'isOpenBlockedResources',
          initialValue: initIsOpenBlockedResources,
          valuePropName: 'checked',
        },
        blockedResources: {
          name: 'blockedResources',
          initialValue: initBlockedResources,
          rules: [
            { required: true, message: this.$t('common.tips.select', [this.$t('cloudenv.block_resources_type')]) },
          ],
        },
      },
    }
  },
  computed: {
    keySecretField () {
      return keySecretFields[this.provider.toLowerCase()]
    },
    isAliyun () {
      return this.provider.toLowerCase() === 'aliyun'
    },
    formRules () {
      return {
        ...rulesFromFieldMap(this.fieldMap),
        ...getDomainProjectExtraRules(this),
      }
    },
  },
  watch: {
    provider () {
      if (typeof this.getFieldMap === 'function') {
        this.fieldMap = this.getFieldMap()
      }
      this.syncFormFdFromFieldMap()
    },
    'form.fd.domain': {
      deep: true,
      handler () {
        this.project_change()
      },
    },
  },
  activated () {
    this.domainProjectShow = true
  },
  deactivated () {
    this.domainProjectShow = false
    if (this.keepAliveFields) return
    if (this.$refs.formRef && this.$refs.formRef.resetFields) {
      this.$refs.formRef.resetFields()
    }
  },
  created () {
    this.syncFormFdFromFieldMap()
    const saml = this.fieldMap && this.fieldMap.saml_auth
    if (saml) {
      this.samlAuthChecked = !!(saml?.initialValue)
      this.form.fd.saml_auth = this.samlAuthChecked
    }
  },
  mounted () {
    this.syncFormFdFromFieldMap()
    if (this.fieldMap && this.fieldMap.saml_auth) {
      this.form.fd.saml_auth = this.samlAuthChecked
    }
  },
  methods: {
    syncFormFdFromFieldMap () {
      applyFieldMapInitialValues(this.form.fd, this.fieldMap)
      if (this.form.fd.isOpenBlockedResources !== undefined) {
        // keep blocked resources in sync with mixin defaults
      }
    },
    onSamlAuthChange (v) {
      this.samlAuthChecked = v
      this.form.fd.saml_auth = v
    },
    transformParams (params) {
      if (params.isOpenBlockedResources) {
        params.skip_sync_resources = params.blockedResources
        delete params.isOpenBlockedResources
        delete params.blockedResources
      }
      if (params.oracle_private_pem) {
        params.oracle_private_key = params.oracle_private_pem
        delete params.oracle_private_pem
      }
      if (this.provider === PROVIDER_MAP.VMware.key) {
        if (params.zone) {
          params.zone = params.zone?.key
          delete params.cloudregion
        }
      }
      if (this.provider === EXTRA_HYPERVISORS.CephFS.key) {
        if (params.mon_host || params.secret || params.option_name) {
          params.options = params.options || {}
          params.options.mon_host = params.mon_host
          params.options.password = params.secret
          params.options.name = params.option_name
          delete params.mon_host
          delete params.secret
          delete params.option_name
        }
      }
      return params
    },
    async validateSectionRefs () {
      const refs = [
        this.$refs.cloudregionZoneRef,
        this.$refs.cloudregionVpcWireRef,
        this.$refs.ipSubnetsRef,
      ]
      for (const ref of refs) {
        if (ref && typeof ref.validate === 'function') {
          await ref.validate()
        }
      }
    },
    async validateForm () {
      if (this.$refs.formRef) {
        await this.$refs.formRef.validate()
      }
      await this.validateSectionRefs()
      const values = { ...this.form.fd }
      const params = trimFormValues(values)
      if (this.provider === 'Huawei' && !params.environment) {
        params.environment = 'ChinaCloud'
      }
      return this.transformParams(params)
    },
    project_change () {
      const proxySettingref = this.$refs.proxySetting
      if (proxySettingref && proxySettingref.fetchQueryProxy) {
        proxySettingref.fetchQueryProxy()
      }
    },
  },
}
