<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{$t('common.text00078')}}{{ $t('dictionary.project') }}</template>
    <template #body>
      <template v-if="params.alertMessage">
        <a-alert :message="params.alertMessage" banner class="mb-2" />
      </template>
      <dialog-selected-tips :count="params.data.length" :action="`${$t('common.text00078')}${$t('dictionary.project')}`" :name="params.name || $t('common.text00006')" />
      <dialog-table v-if="columns" :data="params.data" :columns="columns" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="params.projectLabel || $t('dictionary.project')" v-bind="formItemLayout">
          <domain-project
            :form="form"
            :labelInValue="false"
            :ignoreStorage="true"
            :getDomainList="getDomainList" />
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import { is } from 'ramda'
import _ from 'lodash'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import DomainProject from '@/sections/DomainProject/model'

export default {
  name: 'ChangeOwenrDialog',
  components: {
    DomainProject,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const domainId = _.get(this.params, 'data[0].domain_id')
    const projectId = _.get(this.params, 'data[0].tenant_id') || _.get(this.params, 'data[0].project_id')
    return {
      loading: false,
      form: {
        domain: domainId,
        project: projectId,
      },
      rules: {
        domain: [
          { required: true, message: this.$t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { required: true, message: this.$t('rules.project'), trigger: 'change' },
        ],
      },
      formItemLayout: this.params.formItemLayout || {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  computed: {
    columns () {
      if (this.params.custom_columns) {
        return this.params.custom_columns
      }
      if (this.params.columns && this.params.columns.length >= 2) {
        const keys = ['name', 'tenant']
        return this.params.columns.filter(({ field }) => {
          return keys.indexOf(field) > -1
        })
      }
      return this.params.columns
    },
    getDomainList () {
      if (this.params.ignoreCandidateDomains) {
        return undefined
      }
      if (this.params.data.length === 1) {
        return this.getCandidateDomains
      }
      return undefined
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          domain: this.form.domain,
          project: this.form.project,
        }
        const ids = this.params.data.map(item => item.id)
        const { manager } = this.params
        if (manager) {
          await manager.batchPerformAction({
            ids,
            action: this.params.action || 'change-owner',
            data: values,
          })
        } else {
          await this.params.onManager('batchPerformAction', {
            id: ids,
            steadyStatus: this.params.steadyStatus === undefined ? ['running', 'ready'] : this.params.steadyStatus,
            managerArgs: {
              action: this.params.action || 'change-owner',
              data: values,
            },
          })
        }
        this.loading = false
        this.cancelDialog()
        is(Function, this.params.refresh) && this.params.refresh()
      } catch (error) {
        this.loading = false
      }
    },
    async getCandidateDomains (params) {
      try {
        let data
        const candidatesResponse = await new this.$Manager(this.params.resource, this.params.apiVersion || 'v2').getSpecific({
          id: this.params.data[0].id,
          spec: 'change-owner-candidate-domains',
        })
        data = candidatesResponse.data.candidates || []
        if (data.length <= 0) {
          const domainResponse = await new this.$Manager('domains', 'v1').list({
            params,
          })
          data = domainResponse.data.data || []
        }
        return {
          data: {
            data,
          },
        }
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
