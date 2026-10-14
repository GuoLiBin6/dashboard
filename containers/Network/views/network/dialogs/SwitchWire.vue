<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.network')" :count="params.data.length" :action="params.title" />
      <dialog-table class="mb-2" :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('network.text_571')" prop="wire">
          <base-select
            resource="wires"
            v-model:value="form.wire"
            :selectProps="{ 'placeholder': $t('network.text_572') }"
            :isDefaultSelect="true"
            :params="wireParams" />
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'NetworkSwitchWireDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        wire: this.params.data[0].wire_id,
      },
      rules: {
        wire: [
          { required: true, message: this.$t('network.text_572') },
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
    }
  },
  computed: {
    columns () {
      return this.params.columns.filter(item => ['name', 'status', 'wire'].includes(item.field))
    },
    wireParams () {
      const params = {
        scope: this.$store.getters.scope,
        // brand: this.params.data[0].brand,
        vpcId: this.params.data[0].vpc_id,
        // zone: this.params.data[0].zone_id,
      }
      return params
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        const ids = this.params.data.map(item => item.id)
        if (ids.length > 1) {
          await this.params.onManager('batchPerformAction', {
            ids,
            managerArgs: {
              action: 'switch-wire',
              data: {
                wire_id: values.wire,
              },
            },
          })
        } else {
          await this.params.onManager('performAction', {
            id: ids[0],
            managerArgs: {
              action: 'switch-wire',
              data: {
                wire_id: values.wire,
              },
            },
          })
        }
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
