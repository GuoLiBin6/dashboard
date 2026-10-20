<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('network.text_532')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('network.text_141')" :count="params.data.length" :action="$t('network.text_532')" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model
        v-if="isOneCloud"
        ref="redirectFormRef"
        :model="redirectForm">
        <redirect-form-items
          :form="redirectForm"
          modelMode
          :listenerType="params.lbListenerData.listener_type"
          @redirectChange="handleRedirectChange" />
      </a-form-model>
      <a-form-model
        v-if="!isRedirect"
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_139')" prop="backend_group">
          <base-select
            v-model:value="form.backend_group"
            resource="loadbalancerbackendgroups"
            need-params
            :params="bgParams"
            filterable
            :select-props="{ placeholder: $t('network.text_394') }" />
        </a-form-model-item>
        <a-form-model-item v-if="isOneCloud" :label="$t('network.text_527')" prop="http_request_rate">
          <template #extra>{{$t('network.text_438')}}</template>
          <a-input :min="0" v-model:value="form.http_request_rate" :addonAfter="$t('network.text_439')" type="number" />
        </a-form-model-item>
        <a-form-model-item v-if="isOneCloud" :label="$t('network.text_440')" prop="http_request_rate_per_src">
          <template #extra>{{$t('network.text_528')}}</template>
          <a-input :min="0" v-model:value="form.http_request_rate_per_src" :addonAfter="$t('network.text_439')" type="number" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import RedirectFormItems from '@Network/views/loadbalancerlistener/components/RedirectFormItems'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'LoadbalancerlistenerruleUpdateDialog',
  components: {
    RedirectFormItems,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      isRedirect: false,
      form: {
        backend_group: undefined,
        http_request_rate: 0,
        http_request_rate_per_src: 0,
      },
      redirectForm: {
        redirect: false,
        redirect_code: 301,
        redirect_scheme: 'http',
        redirect_host: undefined,
        redirect_path: undefined,
        listener_type: this.params.lbListenerData.listener_type,
      },
      rules: {
        backend_group: [
          { required: true, message: this.$t('network.text_394') },
        ],
      },
    }
  },
  computed: {
    isOneCloud () {
      return this.params.lbListenerData.provider === 'OneCloud'
    },
    columns () {
      const showFields = ['name', 'domain', 'path']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
    bgParams () {
      const params = {
        scope: this.$store.getters.scope,
        loadbalancer: this.params.lbListenerData.loadbalancer_id,
      }
      if (this.params.provider && this.params.provider.toLowerCase() === 'aliyun') {
        params.type = 'normal'
      }
      return params
    },
  },
  mounted () {
    this.backfill()
  },
  methods: {
    async backfill () {
      const { data = [] } = this.params
      await this.$nextTick()
      if (data && data.length > 0) {
        const rowData = data[0]
        this.isRedirect = rowData.redirect === 'raw'
        if (this.isRedirect) {
          this.redirectForm.redirect = true
          this.redirectForm.redirect_code = rowData.redirect_code
          this.redirectForm.redirect_scheme = rowData.redirect_scheme
          this.redirectForm.redirect_host = rowData.redirect_host
          this.redirectForm.redirect_path = rowData.redirect_path
        } else {
          this.form.backend_group = rowData.backend_group
          this.form.http_request_rate = rowData.http_request_rate
          this.form.http_request_rate_per_src = rowData.http_request_rate_per_src
        }
      }
    },
    handleRedirectChange (bool) {
      this.isRedirect = bool
    },
    async collectValues () {
      const values = { ...this.form }
      if (this.isOneCloud) {
        if (this.$refs.redirectFormRef) {
          await this.$refs.redirectFormRef.validate()
        }
        Object.assign(values, { ...this.redirectForm })
      }
      if (!this.isRedirect) {
        values.http_request_rate = Number(values.http_request_rate)
        values.http_request_rate_per_src = Number(values.http_request_rate_per_src)
      }
      return values
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (!this.isRedirect) {
          await this.$refs.formRef.validate()
        }
        const values = await this.collectValues()
        values.redirect = values.redirect ? 'raw' : 'off'
        delete values.listener_type
        delete values.check
        await this.params.onManager('update', {
          id: this.params.data[0].id,
          managerArgs: {
            data: values,
          },
        })
        this.cancelDialog()
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
