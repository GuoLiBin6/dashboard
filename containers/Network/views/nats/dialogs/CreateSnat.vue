<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        v-bind="formItemLayout"
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_44')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_249')">
          <a-radio-group v-model:value="resource" @change="onResourceTypeChanged">
            <a-radio value="networks">{{$t('network.snat.type.network')}}</a-radio>
            <a-radio value="servers">{{$t('network.snat.type.server')}}</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="resource_label" prop="res_id">
          <base-select
            v-model:value="form.res_id"
            :params="resParams"
            :select-props="resouce_props"
            :resource="resource"
            v-model:resList="resOptions"
            :filterable="true" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_539')" prop="eip">
          <template #extra>{{$t('network.text_540')}}<router-link :to="{ path: '/eip' }" target="_blank">{{$t('dictionary.eip')}}</router-link>
          </template>
          <base-select
            v-model:value="form.eip"
            :params="eipParams"
            :select-props="{ placeholder: $t('network.text_541') }"
            resource="eips"
            :labelFormat="labelFormat"
            :showSync="true" />
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
import * as R from 'ramda'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'SNatCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: undefined,
        res_id: undefined,
        eip: undefined,
      },
      resource_label: this.$t('network.snat.type.network'),
      resource: 'networks',
      resouce_props: { placeholder: this.$t('network.text_552') },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('serverCreateName') },
        ],
        res_id: [
          { required: true, message: this.$t('network.text_552') },
        ],
        eip: [
          { required: true, message: this.$t('network.text_541') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 19,
        },
        labelCol: {
          span: 5,
        },
      },
      tailFormItemLayout: {
        wrapperCol: {
          span: 16,
          offset: 8,
        },
        labelCol: {
          span: 3,
        },
      },
      resParams: {
        scope: this.$store.getters.scope,
        vpc: this.params.data.vpc_id,
        status: ['running', 'ready', 'available'],
      },
      eipParams: {
        scope: this.$store.getters.scope,
        usable_eip_for_associate_type: 'natgateway',
        usable_eip_for_associate_id: this.params.data.id,
      },
      resOptions: [],
    }
  },
  methods: {
    onResourceTypeChanged (e) {
      this.resource = e.target ? e.target.value : e
      this.form.res_id = undefined
      switch (this.resource) {
        case 'servers':
          this.resource_label = this.$t('network.snat.type.server')
          this.resouce_props = { placeholder: this.$t('network.text_60') }
          this.rules.res_id[0].message = this.$t('network.text_60')
          break
        case 'networks':
          this.resource_label = this.$t('network.snat.type.network')
          this.resouce_props = { placeholder: this.$t('network.text_552') }
          this.rules.res_id[0].message = this.$t('network.text_552')
          break
      }
    },
    labelFormat (val) {
      return `${val.name}(${val.ip_addr})`
    },
    doCreate (data) {
      return this.params.onManager('create', {
        managerArgs: {
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        const params = {
          name: values.name,
          natgateway_id: this.params.data.id,
          eip: values.eip,
        }
        const resObj = R.indexBy(R.prop('id'), this.resOptions)
        switch (this.resource) {
          case 'networks':
            params.network_id = values.res_id
            break
          case 'servers':
            resObj[values.res_id].nics.forEach((nic) => {
              if (nic.ip_addr && nic.vpc_id === this.params.data.vpc_id) {
                params.source_cidr = nic.ip_addr + '/32'
              }
            })
            break
        }
        await this.doCreate(params)
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
