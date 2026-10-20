<template>
  <div class="severtemplate-create-server">
    <page-header :title="$t('compute.text_1039', [this.$t('dictionary.server')])" />
    <div v-if="fetchError" class="mt-3 px-3">
      <a-button @click="goBack">{{ $t('compute.text_135') }}</a-button>
    </div>
    <a-spin v-else :spinning="!templateReady">
      <a-form-model
        v-if="templateReady"
        ref="formRef"
        class="mt-3"
        :model="form.fd"
        :rules="rules">
        <a-form-model-item :label="$t('compute.text_297', [$t('dictionary.project')])" prop="project">
          <domain-project
            :form="form.fd"
            :get-domain-list="templateDomainFilterId ? fetchRestrictDomains : undefined"
            :ignore-storage="true" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_228')" prop="generate_name" :extra="$t('compute.text_1040')">
          <a-input v-model:value="form.fd.generate_name" :placeholder="$t('validator.resourceCreateName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_294')" prop="count">
          <a-input-number v-model:value="form.fd.count" :min="1" :max="100" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1041')" v-if="isOpenWorkflow" prop="reason">
          <a-input v-model:value="form.fd.reason" :placeholder="$t('compute.text_1042')" />
        </a-form-model-item>
        <page-footer>
          <template v-slot:right>
            <a-button
              type="primary"
              class="mr-2"
              @click="submit"
              style="width: 120px;"
              :loading="loading">{{ isOpenWorkflow ? $t('compute.text_288') : $t('dialog.ok') }}</a-button>
            <a-button style="width: 120px;" @click="goBack">{{$t('compute.text_135')}}</a-button>
            <side-errors :error-title="$t('compute.text_290')" v-model:errors="errors" />
          </template>
        </page-footer>
      </a-form-model>
    </a-spin>
  </div>
</template>

<script>
import { GenCreateData } from '@Compute/utils/createServer'
import DomainProject from '@/sections/DomainProject/model'
import WindowsMixin from '@/mixins/windows'
import workflowMixin from '@/mixins/workflow'
import { WORKFLOW_TYPES } from '@/constants/workflow'
import SideErrors from '@/sections/SideErrors'
import { isRequired } from '@/utils/validate'

export default {
  name: 'ServertemplateBaremetalCreateServer',
  components: {
    SideErrors,
    DomainProject,
  },
  mixins: [WindowsMixin, workflowMixin],
  data () {
    return {
      loading: false,
      fetchError: false,
      catalogData: {},
      serverConfig: null,
      project_id: '',
      project_domain: '',
      templateProjectId: '',
      /** 用于域下拉接口过滤，与模板数据中的域一致 */
      templateDomainFilterId: '',
      templateReady: false,
      errors: {},
      form: {
        fd: {
          generate_name: '',
          count: 1,
          reason: '',
          domain: undefined,
          project: undefined,
        },
      },
      rules: {
        project: [
          { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
        ],
        generate_name: [
          { required: true, message: this.$t('compute.text_1043') },
          { validator: this.$validate('resourceCreateName') },
        ],
        count: [
          { required: true, message: this.$t('compute.text_211') },
        ],
      },
    }
  },
  computed: {
    isOpenWorkflow () {
      return this.checkWorkflowEnabled(WORKFLOW_TYPES.APPLY_MACHINE)
    },
  },
  created () {
    this.fetchServerConfig()
  },
  methods: {
    fetchRestrictDomains (params) {
      const p = { ...params }
      if (this.templateDomainFilterId) {
        p.id = String(this.templateDomainFilterId).replace(/'/g, "\\'")
      }
      return new this.$Manager('domains', 'v1').list({ params: p })
    },
    fetchServerConfig () {
      new this.$Manager('servertemplates', 'v2')
        .get({ id: this.$route.query.id })
        .then(({ data }) => {
          this.serverConfig = data.content
          this.project_id = data.tenant_id
          this.project_domain = data.project_domain
          this.templateProjectId = data.tenant_id
          this.templateDomainFilterId = data.project_domain || data.content?.extraData?.domain_id || ''
          this.templateReady = true
        })
        .catch(() => {
          this.$message.error(this.$t('compute.text_1044'))
          this.fetchError = true
        })
    },
    /** 名称、数量覆盖模板；域、项目以表单为准写入请求体（与 GenCreateData 一致） */
    buildCreateParams (values) {
      const base = {
        ...this.serverConfig,
        generate_name: values.generate_name,
        __count__: values.count,
      }
      const proj = values.project
      const dom = values.domain
      if (proj && proj.key) {
        base.project_id = proj.key
      }
      if (dom && dom.key) {
        base.extraData = { ...(base.extraData || {}), domain_id: dom.key }
      }
      return base
    },
    doCreateWorkflow (values) {
      const params = this.buildCreateParams(values)
      delete params.reason
      const variables = {
        process_definition_key: WORKFLOW_TYPES.APPLY_MACHINE,
        initiator: this.$store.getters.userInfo.id,
        description: values.reason,
        'server-create-paramter': JSON.stringify(params),
        project: (values.project && values.project.key) || this.project_id,
        project_domain: (values.domain && values.domain.key) || this.project_domain,
      }
      return new this.$Manager('process-instances', 'v1')
        .create({ data: { variables } })
        .then(() => {
          this.$message.success(this.$t('compute.text_1045', [params.generate_name]))
          this.goWorkflow()
        })
    },
    async checkCreateData (fd) {
      try {
        const data = { ...this.buildCreateParams(fd), dry_run: true }
        const res = new this.$Manager('servers').create({ data })
        return res
      } catch (error) {
        throw error
      }
    },
    doForecast (fd) {
      const genCreateData = new GenCreateData()
      const params = this.buildCreateParams(fd)
      return new this.$Manager('schedulers', 'v1').rpc({ methodname: 'DoForecast', params })
        .then(res => {
          if (res.data.can_create) {
            this.createServer(params)
          } else {
            this.errors = genCreateData.getForecastErrors(res.data)
          }
        })
        .catch(err => {
          this.$message.error(this.$t('compute.text_321', [err]))
        })
    },
    createServer (data) {
      delete data.vcpu_count
      delete data.vmem_size
      new this.$Manager('servers', 'v2').create({ data })
        .then(() => {
          this.$message.success(this.$t('compute.text_322'))
          this.goVminstance()
        })
    },
    async submit () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form.fd }
        if (this.isOpenWorkflow) {
          await this.doCreateWorkflow(values)
        } else {
          await this.checkCreateData(values)
          await this.doForecast(values)
        }
        this.loading = false
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    goWorkflow () {
      this.$router.push('/workflow')
    },
    goBack () {
      this.$router.push('/servertemplate-baremetal')
    },
    goVminstance () {
      this.$router.push('/baremetal')
    },
  },
}
</script>

<style lang="less" scoped>
.severtemplate-create-server {
  :deep(.ant-form.ant-form-horizontal .ant-form-item .ant-form-item-label) {
    padding-left: 20px;
  }
}
</style>
