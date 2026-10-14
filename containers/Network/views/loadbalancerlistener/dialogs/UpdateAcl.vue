<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('network.text_470')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.lb_listener')" :count="params.data.length" :action="$t('network.text_470')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('network.text_360')" prop="acl_status">
          <a-switch v-model:checked="form.acl_status" />
        </a-form-model-item>
        <template v-if="form.acl_status">
          <a-form-model-item :label="$t('network.text_361')" prop="acl_type">
            <a-select v-model:value="form.acl_type">
              <a-select-option v-for="item in aclTypeOpts" :value="item.key" :key="item.key">{{ item.label }}</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item :label="$t('network.text_362')" prop="acl">
            <base-select
              v-model="form.acl"
              resource="loadbalanceracls"
              show-sync
              :params="aclParams"
              :select-props="{ placeholder: $t('network.text_363') }" />
          </a-form-model-item>
        </template>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import _ from 'lodash'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import expectStatus from '@/constants/expectStatus'

export default {
  name: 'LbListenerUpdateAclDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const itemData = this.params.data[0]
    return {
      loading: false,
      form: {
        acl_status: itemData.acl_status === 'on',
        acl_type: itemData.acl_type,
        acl: itemData.acl_id,
      },
      aclTypeOpts: [
        { key: 'white', label: this.$t('network.text_364') },
        { key: 'black', label: this.$t('network.text_365') },
      ],
      formItemLayout: {
        wrapperCol: {
          span: 17,
        },
        labelCol: {
          span: 7,
        },
      },
      lbDetail: this.params.lbDetail,
    }
  },
  computed: {
    rules () {
      const rules = {}
      if (this.form.acl_status) {
        rules.acl = [
          { required: true, message: this.$t('network.text_363') },
        ]
      }
      return rules
    },
    aclParams () {
      const params = {
        limit: 0,
      }
      if (this.$store.getters.isAdminMode) {
        const domain = _.get(this.listenerData, 'domain_id') || _.get(this.lbDetail, 'domain_id')
        params.project_domain = domain
      } else {
        params.scope = this.$store.getters.scope
      }
      return params
    },
    listenerData () {
      return this.params.data[0]
    },
  },
  methods: {
    doUpdate (id, data) {
      return this.params.onManager('update', {
        id,
        managerArgs: {
          data,
        },
        steadyStatus: {
          status: Object.values(expectStatus.lb).flat(),
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const params = {
          acl_status: this.form.acl_status ? 'on' : 'off',
        }
        if (params.acl_status === 'on') {
          params.acl_type = this.form.acl_type
          params.acl = this.form.acl
        }
        await this.doUpdate(this.params.data[0].id, params)
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
