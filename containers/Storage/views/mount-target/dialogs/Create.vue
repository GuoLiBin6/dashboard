<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('dictionary.filesystem')">
          <a-input :value="filesystem" disabled />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.network.type')" prop="network_type">
          <a-radio-group v-model:value="form.network_type">
            <a-radio value="vpc">{{$t('common.network.type.vpc')}}</a-radio>
            <a-radio value="classic" :disabled="isClassicDisabled">{{$t('common.network.type.classic')}}</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.access_group')" prop="access_group_id">
          <base-select
            v-model:value="form.access_group_id"
            :params="accessGroupParams"
            :select-props="{ placeholder: $t('storage.access.group.select') }"
            resource="access_groups"
            :filterable="true" />
        </a-form-model-item>
        <a-form-model-item
          v-if="form.network_type !== 'classic'"
          :label="$t('network.text_211')"
          required>
          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-model-item prop="vpc" :wrapperCol="{ span: 24 }" class="mb-0">
                <base-select
                  v-model="form.vpc"
                  resource="vpcs"
                  remote
                  :isDefaultSelect="true"
                  :need-params="true"
                  :params="vpcParams"
                  :select-props="{ allowClear: true, placeholder: $t('network.text_274') }" />
              </a-form-model-item>
            </a-col>
            <a-col :span="12">
              <a-form-model-item prop="network" :wrapperCol="{ span: 24 }" class="mb-0">
                <base-select
                  v-model="form.network"
                  resource="networks"
                  remote
                  :need-params="true"
                  :isDefaultSelect="true"
                  :params="networkParamsConcat"
                  :select-props="{ allowClear: true, placeholder: $t('network.text_212') }" />
              </a-form-model-item>
            </a-col>
          </a-row>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading.submit">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
export default {
  name: 'MountTargetCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: {
        submit: false,
        trafficPolicy: false,
      },
      form: {
        network_type: 'vpc',
        access_group_id: undefined,
        vpc: undefined,
        network: undefined,
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
      filesystem: this.params.data.name,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
    rules () {
      const rules = {
        network_type: [
          { required: true },
        ],
        access_group_id: [
          { required: true, message: this.$t('storage.access.group.select') },
        ],
      }
      if (this.form.network_type !== 'classic') {
        rules.vpc = [
          { required: true, message: this.$t('network.text_274') },
        ]
        rules.network = [
          { required: true, message: this.$t('network.text_212') },
        ]
      }
      return rules
    },
    vpcParams () {
      const params = {
        scope: this.scope,
        usable: true,
        manager: this.params.data.manager_id,
        cloudregion_id: this.params.data.cloudregion_id,
      }
      if (this.isAdminMode) {
        params.project_domain = this.params.data.domain_id
        delete params.scope
      }
      return params
    },
    networkParamsConcat () {
      const ret = {
        limit: 0,
        usable: true,
        scope: this.scope,
      }
      if (this.form.vpc) {
        ret.vpc = this.form.vpc
      }
      return ret
    },
    accessGroupParams () {
      const ret = {
        limit: 0,
        scope: this.scope,
        manager: this.params.data.manager_id,
        cloudregion_id: this.params.data.cloudregion_id,
      }
      if (this.isAdminMode) {
        ret.project_domain = this.params.data.domain_id
        delete ret.scope
      }
      return ret
    },
    isClassicDisabled () {
      if (this.params.data.file_system_type === 'standard') {
        return false
      }
      return true
    },
  },
  methods: {
    doCreate (data) {
      return this.params.onManager('create', {
        managerArgs: {
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading.submit = true
      try {
        await this.$refs.formRef.validate()
        let values = {
          network_type: this.form.network_type,
          access_group_id: this.form.access_group_id,
        }
        if (this.form.network_type !== 'classic') {
          values.vpc = this.form.vpc
          values.network = this.form.network
        }
        values = {
          generate_name: 'access-group-for-' + this.params.data.name,
          file_system_id: this.params.data.id,
          ...values,
        }
        await this.doCreate(values)
        this.loading.submit = false
        this.cancelDialog()
      } catch (error) {
        this.loading.submit = false
        throw error
      }
    },
  },
}
</script>
