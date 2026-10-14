<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('network.additional_wires.set') }}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('network.text_571')" v-bind="formItemLayout" prop="type">
          <a-radio-group v-model:value="form.type">
            <a-radio-button value="auto">{{ $t('network.additional_wires.type.auto') }}</a-radio-button>
            <a-radio-button value="manual">{{ $t('network.additional_wires.type.manual') }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item v-bind="formItemLayoutWithOutLabel" v-if="form.type === 'manual'" prop="wires">
          <base-select
            resource="wires"
            v-model:value="form.wires"
            :selectProps="{ 'placeholder': $t('network.text_572'), mode: 'multiple' }"
            remote
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :params="wireParams"
            :mapper="wireMapper" />
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
import { PROVIDER_MAP } from '@/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'SetAdditionalWiresDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const currentData = this.params.currentData
    const additionalWires = currentData.additional_wires && currentData.additional_wires.map(item => item.wire_id)

    return {
      loading: false,
      form: {
        type: 'auto',
        wires: additionalWires,
      },
      rules: {
        wires: [
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
      formItemLayoutWithOutLabel: {
        wrapperCol: {
          span: 19,
          offset: 5,
        },
      },
      wireParams: {
        scope: this.$store.getters.scope,
        provider: PROVIDER_MAP.VMware.key,
        limit: 20,
      },
    }
  },
  methods: {
    wireMapper (list) {
      if (list && list.length > 0) {
        return list.filter(item => {
          const wid = this.params.currentData.wire_id
          return item.id !== wid
        })
      }
      return []
    },
    async doSubmit (values) {
      const id = this.params.currentData.id
      const params = {}

      if (values.type === 'manual') {
        params.wire_ids = values.wires
      }
      await new this.$Manager('networks').performAction({
        id,
        action: 'sync-additional-wires',
        data: params,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        this.doSubmit({ ...this.form })
        this.cancelDialog()
        this.$message.success(this.$t('common.success'))
        this.params.success && this.params.success()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
