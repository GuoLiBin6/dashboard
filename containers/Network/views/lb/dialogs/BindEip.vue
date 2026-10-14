<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1179')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('network.text_714')" :count="params.data.length" :action="$t('compute.text_1179')" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <eip-config
          hidden-none-type
          type-field="type"
          charge-type-field="charge_type"
          bgp-type-field="bgp_type"
          bandwidth-field="bandwidth"
          eip-field="eip"
          :eip-params="eipParams"
          :hypervisor="hypervisor"
          :cloud-env="params.data[0].cloud_env"
          :model="form"
          :formItemLayout="formItemLayout"
          :show-new="eipBindNew" />
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import EipConfig from '@Compute/sections/EipConfig/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'LbBindEipDialog',
  components: {
    EipConfig,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const typeInitialValue = this.params.data[0].brand === 'OneCloud' ? 'new' : 'bind'
    return {
      loading: false,
      form: {
        type: typeInitialValue,
        charge_type: 'bandwidth',
        bgp_type: '',
        bandwidth: 30,
        eip: undefined,
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
    }
  },
  computed: {
    hypervisor () {
      return this.params.data[0].hypervisor
    },
    eipParams () {
      return {
        usable_eip_for_associate_type: 'loadbalancer',
        usable_eip_for_associate_id: this.params.data[0].id,
        scope: this.$store.getters.scope,
      }
    },
    eipBindNew () {
      return this.params.data[0].brand === 'OneCloud'
    },
    columns () {
      const fields = ['name', 'vpc', 'address']
      return this.params.columns.filter(item => {
        const { field } = item
        return fields.indexOf(field) > -1
      })
    },
    rules () {
      if (this.form.type !== 'bind') return {}
      return {
        eip: [
          { required: true, message: this.$t('compute.text_145'), trigger: 'change' },
        ],
      }
    },
  },
  methods: {
    doCreateEip (ids, values) {
      return this.params.onManager('batchPerformAction', {
        id: ids,
        managerArgs: {
          action: 'create-eip',
          data: {
            charge_type: values.charge_type,
            bandwidth: values.bandwidth,
            bgp_type: values.bgp_type,
          },
        },
      })
    },
    doBindEip (ids, values) {
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: ['enabled'],
        managerArgs: {
          action: 'associate-eip',
          data: {
            eip_id: values.eip,
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = this.form
        const ids = this.params.data.map(item => item.id)
        if (values.type === 'new') {
          await this.doCreateEip(ids, values)
        }
        if (values.type === 'bind') {
          await this.doBindEip(ids, values)
        }
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
