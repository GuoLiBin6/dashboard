<template>
  <a-spin :spinning="loading">
    <page-header :title="$t('network.text_722')" />
    <page-body>
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input :disabled="!!lbAgentId" v-model:value="form.name" :placeholder="$t('network.text_44')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_19')" prop="cluster_id">
          <base-select
            :disabled="!!lbAgentId"
            v-model="form.cluster_id"
            resource="loadbalancerclusters"
            remote
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            showSync
            :select-props="{ placeholder: $t('network.text_79') }"
            @change="handleClusterChange" />
          <template #extra>
            {{$t('network.text_80')}}<a-button type="link" size="small" @click="createCluster">{{$t('network.text_26')}}</a-button>
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.priority')" prop="priority">
          <a-tooltip>
            <template #title>
              {{ $t('network.priority.extra') }}
            </template>
            <a-input-number
              v-model:value="form.priority"
              :min="1"
              :max="255"
              :step="1"
              :formatter="v => `${ isNaN(parseInt(v)) ? 1 : parseInt(v) }`"
              :parser="v => `${ isNaN(parseInt(v)) ? 1 : parseInt(v) }`" />
          </a-tooltip>
        </a-form-model-item>
        <a-collapse :bordered="false">
          <a-collapse-panel :header="$t('network.text_94')" key="1" forceRender>
            <a-collapse @change="handleCollapseChange">
              <a-collapse-panel key="telegraf" :header="$t('network.text_97')" forceRender>
                <a-form-model-item :label="$t('network.text_98')" :extra="$t('network.text_99')">
                  <a-row :gutter="8">
                    <a-col :span="12">
                      <a-input v-model:value="form.telegraf.influx_db_output_url" :placeholder="$t('network.text_100')" />
                    </a-col>
                    <a-col :span="12">
                      <a-checkbox class="ml-4" v-model:checked="form.telegraf.influx_db_output_unsafe_ssl">{{$t('network.text_101')}}</a-checkbox>
                    </a-col>
                  </a-row>
                </a-form-model-item>
                <a-form-model-item :label="$t('network.text_102')">
                  <a-input v-model:value="form.telegraf.influx_db_output_name" />
                </a-form-model-item>
                <a-form-model-item :label="$t('network.text_103')" prop="telegraf.haproxy_input_interval">
                  <a-input v-model:value="form.telegraf.haproxy_input_interval" type="Number" :addonAfter="$t('network.text_76')" />
                </a-form-model-item>
                <a-form-model-item :label="$t('network.text_104')">
                  <code-mirror :value="form.telegraf_conf_tmpl" @change="v => form.telegraf_conf_tmpl = v" :options="cmOptions" />
                </a-form-model-item>
              </a-collapse-panel>
              <a-collapse-panel key="haproxy" :header="$t('network.text_105')" forceRender>
                <a-form-model-item :label="$t('network.text_106')" prop="haproxy.global_nbthread">
                  <a-input v-model:value="form.haproxy.global_nbthread" type="Number" />
                </a-form-model-item>
                <a-form-model-item :label="$t('network.text_107')" :extra="$t('network.text_108')">
                  <a-input v-model:value="form.haproxy.global_log_path" :placeholder="$t('network.text_109')" />
                </a-form-model-item>
                <a-form-model-item :label="$t('network.text_110')">
                  <a-switch v-model:checked="form.haproxy.log_http" />
                </a-form-model-item>
                <a-form-model-item :label="$t('network.text_111')">
                  <a-switch v-model:checked="form.haproxy.log_tcp" />
                </a-form-model-item>
                <a-form-model-item :label="$t('network.text_112')">
                  <a-switch v-model:checked="form.haproxy.log_normal" />
                </a-form-model-item>
                <a-form-model-item :label="$t('network.text_113')" prop="haproxy.tune_http_maxhdr">
                  <a-input v-model:value="form.haproxy.tune_http_maxhdr" type="Number" />
                  <template #extra>{{$t('network.text_114')}}</template>
                </a-form-model-item>
                <a-form-model-item :label="$t('network.text_104')">
                  <code-mirror :value="form.haproxy_conf_tmpl" @change="v => form.haproxy_conf_tmpl = v" :options="cmOptions" />
                </a-form-model-item>
              </a-collapse-panel>
              <a-collapse-panel key="keepalived" :header="$t('network.text_115')" forceRender>
                <a-form-model-item :label="$t('network.text_104')">
                  <code-mirror :value="form.keepalived_conf_tmpl" @change="v => form.keepalived_conf_tmpl = v" :options="cmOptions" />
                </a-form-model-item>
              </a-collapse-panel>
            </a-collapse>
          </a-collapse-panel>
        </a-collapse>
      </a-form-model>
    </page-body>
    <page-footer>
      <template v-slot:right>
        <a-button type="primary" :loading="submiting" @click="handleSubmit">{{ $t('common.ok') }}</a-button>
        <a-button class="ml-2" @click="handleCancel">{{ $t('dialog.cancel') }}</a-button>
      </template>
    </page-footer>
  </a-spin>
</template>
<script>
import workflowMixin from '@/mixins/workflow'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'AgentCreate',
  mixins: [WindowsMixin, workflowMixin],
  data () {
    return {
      loading: false,
      submiting: false,
      defaultParams: {},
      form: {
        name: undefined,
        description: undefined,
        cluster_id: undefined,
        priority: 1,
        telegraf: {
          influx_db_output_url: undefined,
          influx_db_output_unsafe_ssl: true,
          influx_db_output_name: undefined,
          haproxy_input_interval: undefined,
        },
        haproxy: {
          global_nbthread: undefined,
          global_log_path: undefined,
          log_http: undefined,
          log_tcp: undefined,
          log_normal: undefined,
          tune_http_maxhdr: 101,
        },
        telegraf_conf_tmpl: undefined,
        haproxy_conf_tmpl: undefined,
        keepalived_conf_tmpl: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('resourceName') },
        ],
        cluster_id: [
          { required: true, message: this.$t('network.text_79') },
        ],
        'telegraf.haproxy_input_interval': [
          {
            validator: (rule, value, callback) => {
              if (value === undefined || value === null || value === '') return callback()
              const n = Number(value)
              if (!Number.isInteger(n) || n < 1 || n > 600) {
                return callback(new Error(this.$t('network.text_123')))
              }
              return callback()
            },
            trigger: 'blur',
          },
        ],
        'haproxy.global_nbthread': [
          {
            validator: (rule, value, callback) => {
              if (value === undefined || value === null || value === '') return callback()
              const n = Number(value)
              if (!Number.isInteger(n) || n < 1 || n > 64) {
                return callback(new Error(this.$t('network.text_124')))
              }
              return callback()
            },
            trigger: 'blur',
          },
        ],
        'haproxy.tune_http_maxhdr': [
          {
            validator: (rule, value, callback) => {
              if (value === undefined || value === null || value === '') return callback()
              const n = Number(value)
              if (!Number.isInteger(n) || n < 1 || n > 32767) {
                return callback(new Error(this.$t('network.text_125')))
              }
              return callback()
            },
            trigger: 'blur',
          },
        ],
      },
      cmOptions: {
        tabSize: 2,
        styleActiveLine: true,
        lineNumbers: true,
        line: true,
        mode: 'text/x-yaml',
        theme: 'material',
        autofocus: true,
        value: undefined,
      },
    }
  },
  computed: {
    lbAgentId () {
      return this.$route.query.id
    },
  },
  created () {
    this.manager = new this.$Manager('loadbalanceragents')
    if (this.lbAgentId) {
      this.getFetchLbAgent()
    }
  },
  methods: {
    createCluster () {
      this.createDialog('LoadbalancerclusterCreateDialog', {
        title: this.$t('network.text_26'),
      })
    },
    handleClusterChange (id) {
      !this.lbAgentId && this.getFetchDefaultParams(id)
    },
    setValues (data) {
      if (!data || !Object.keys(data).length || !data.params) return false
      const params = { ...data.params }
      this.form.name = data.name
      this.form.description = data.description
      this.form.cluster_id = data.cluster_id
      this.form.priority = data.priority
      if (params.telegraf) {
        this.form.telegraf = {
          ...this.form.telegraf,
          ...params.telegraf,
        }
      }
      if (params.haproxy) {
        this.form.haproxy = {
          ...this.form.haproxy,
          ...params.haproxy,
        }
        if (params.haproxy.global_log) {
          this.form.haproxy.global_log_path = params.haproxy.global_log.split(' ')[1]
        }
      }
      // conf tmpl 在 expand collapse 时再填，避免 code-mirror 赋值 bug
      this.form.telegraf_conf_tmpl = undefined
      this.form.haproxy_conf_tmpl = undefined
      this.form.keepalived_conf_tmpl = undefined
      this.defaultParams = data.params
    },
    formatValues (values) {
      const data = {
        ...values,
        telegraf: { ...values.telegraf },
        haproxy: { ...values.haproxy },
      }
      if (data.telegraf.haproxy_input_interval !== undefined && data.telegraf.haproxy_input_interval !== '') {
        data.telegraf.haproxy_input_interval = Number(data.telegraf.haproxy_input_interval)
      }
      if (data.haproxy.global_nbthread !== undefined && data.haproxy.global_nbthread !== '') {
        data.haproxy.global_nbthread = Number(data.haproxy.global_nbthread)
      }
      if (data.haproxy.tune_http_maxhdr !== undefined && data.haproxy.tune_http_maxhdr !== '') {
        data.haproxy.tune_http_maxhdr = Number(data.haproxy.tune_http_maxhdr)
      }
      const templKeys = ['telegraf_conf_tmpl', 'haproxy_conf_tmpl', 'keepalived_conf_tmpl']
      templKeys.forEach(k => {
        if (data[k]) {
          data[k] = window.btoa(data[k])
        } else {
          data[k] = this.defaultParams[k]
        }
      })
      if (data.haproxy.global_log_path && this.defaultParams?.haproxy?.global_log) {
        const logConfs = this.defaultParams.haproxy.global_log.split(' ')
        logConfs[1] = data.haproxy.global_log_path
        data.haproxy.global_log = logConfs.join(' ')
        delete data.haproxy.global_log_path
      }
      const { name, description, cluster_id, priority, ...rest } = data
      return {
        name,
        description,
        cluster_id,
        priority,
        params: {
          ...rest,
        },
      }
    },
    async doUpdate (values) {
      const { params, ...rest } = this.formatValues(values)
      await this.manager.update({
        id: this.lbAgentId,
        data: rest,
      })
      await this.manager.performAction({
        action: 'params-patch',
        id: this.lbAgentId,
        data: { params },
      })
    },
    async handleCollapseChange (activeKeys) {
      activeKeys.forEach((k) => {
        const tk = `${k}_conf_tmpl`
        if (!this.form[tk] && this.defaultParams[tk]) {
          this.form[tk] = window.atob(this.defaultParams[tk])
        }
      })
    },
    async getFetchLbAgent () {
      const { id } = this.$route.query
      try {
        const { data = {} } = await this.manager.get(({
          id,
        }))
        this.setValues(data)
      } catch (err) {
        throw err
      }
    },
    async getFetchDefaultParams (cluster) {
      try {
        const { data = {} } = await this.manager.get(({
          id: 'default-params',
          params: {
            cluster,
          },
        }))
        if (data && data.params) {
          this.setValues(data)
        }
      } catch (err) {
        throw err
      }
    },
    async handleSubmit () {
      this.submiting = true
      try {
        await this.$refs.formRef.validate()
        if (this.lbAgentId) {
          await this.doUpdate(this.form)
          this.$store.commit('keepAlive/ADD_DELAY_EVENT', { name: 'ResourceListSingleRefresh', params: this.lbAgentId })
        }
        this.handleCancel()
      } catch (error) {
        throw error
      } finally {
        this.submiting = false
      }
    },
    handleCancel () {
      this.$router.push('/lbagent')
    },
  },
}
</script>
