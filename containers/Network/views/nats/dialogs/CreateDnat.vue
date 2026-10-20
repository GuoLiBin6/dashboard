<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_44')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_539')" prop="ip">
          <template #extra>{{$t('network.text_540')}}<router-link :to="{ path: '/eip' }" target="_blank">{{$t('dictionary.eip')}}</router-link>
          </template>
          <base-select
            v-model:value="form.ip"
            :params="eipParams"
            :select-props="{ placeholder: $t('network.text_541') }"
            resource="eips"
            :showSync="true"
            :labelFormat="eiplabelFormat"
            v-model:resList="eipOptions" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_542')" prop="server">
          <base-select
            v-model:value="form.server"
            :params="serverParams"
            :select-props="{ placeholder: $t('network.text_543') }"
            resource="servers"
            :filterable="true"
            :labelFormat="serverlabelFormat"
            v-model:resList="serverOptions"
            :mapper="serversMapper" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_544')" :extra="$t('network.text_545')" prop="externalPort">
          <a-input-number :min="1" :max="65535" v-model:value="form.externalPort" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_546')" :extra="$t('network.text_545')" prop="internalPort">
          <a-input-number :min="1" :max="65535" v-model:value="form.internalPort" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_547')" prop="protocol">
          <a-select v-model:value="form.protocol">
            <a-select-option value="tcp">TCP</a-select-option>
            <a-select-option value="udp">UDP</a-select-option>
          </a-select>
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
  name: 'DNatCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: undefined,
        ip: undefined,
        server: undefined,
        externalPort: undefined,
        internalPort: undefined,
        protocol: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('serverCreateName') },
        ],
        ip: [
          { required: true, message: this.$t('network.text_541') },
        ],
        server: [
          { required: true, message: this.$t('network.text_543') },
        ],
        externalPort: [
          { required: true, message: this.$t('network.text_548') },
        ],
        internalPort: [
          { required: true, message: this.$t('network.text_549') },
        ],
        protocol: [
          { required: true, message: this.$t('network.text_550') },
        ],
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
      serverParams: {
        scope: this.$store.getters.scope,
        vpc: this.params.data.vpc_id,
        status: ['running', 'ready'],
      },
      eipParams: {
        scope: this.$store.getters.scope,
        usable_eip_for_associate_type: 'natgateway',
        usable_eip_for_associate_id: this.params.data.id,
      },
      snatEips: [],
      serverOptions: [],
      eipOptions: [],
    }
  },
  created () {
    this.querySnatResources()
  },
  methods: {
    eiplabelFormat (val) {
      return `${val.name}(${val.ip_addr})`
    },
    serverlabelFormat (val) {
      return `${val.name}(${val.ips})`
    },
    querySnatResources () {
      const manager = new this.$Manager('natgateways')
      manager.performAction({ id: this.params.data.id, action: 'snat-resources', data: {} })
        .then((res) => {
          this.snatEips = res.data.eips
        })
    },
    serversMapper (data) {
      data = data.filter((item) => { return !item.eip })
      return data
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
        const eipObj = R.indexBy(R.prop('id'), this.eipOptions)
        const serverObj = R.indexBy(R.prop('id'), this.serverOptions)
        const params = {
          name: values.name,
          natgateway_id: this.params.data.id,
          internal_ip: serverObj[values.server].ips,
          internal_port: Number(values.internalPort),
          external_ip: eipObj[values.ip].ip_addr,
          external_ip_id: eipObj[values.ip].id,
          external_port: Number(values.externalPort),
          ip_protocol: values.protocol,
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
