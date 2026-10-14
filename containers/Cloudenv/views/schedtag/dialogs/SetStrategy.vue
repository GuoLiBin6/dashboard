<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('cloudenv.text_422')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.schedtag')" :count="params.data.length" :action="$t('cloudenv.text_422')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" v-bind="formItemLayout">
        <a-form-model-item required :label="$t('cloudenv.text_413')" prop="default_strategy">
          <strategy-radio v-model:value="form.default_strategy" />
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
import StrategyRadio from '@Cloudenv/sections/StrategyRadio'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'SetStrategyDialog',
  components: {
    StrategyRadio,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        default_strategy: this.params.data[0].default_strategy || '',
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  methods: {
    doSubmit (values) {
      return this.params.onManager('update', {
        id: this.params.data[0].id,
        managerArgs: {
          data: values,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doSubmit({ ...this.form })
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
