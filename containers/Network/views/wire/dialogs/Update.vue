<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('network.text_606')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.wire')" :count="params.data.length" :action="$t('network.text_606')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_195')" prop="bandwidth">
          <a-select
              v-model:value="form.bandwidth"
              :placeholder="$t('network.text_697')">
            <a-select-option v-for="item in bandwidthOptions" :value="item.value" :key="item.value">
              {{item.label}}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="MTU" prop="mtu">
          <a-input-number :min="68" :max="9216" :step="50" v-model:value="form.mtu" />
          <div class="add-desc">{{$t('network.text_700')}}</div>
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
import { BAND_WIDTH_OPTION } from '../../../constants'
export default {
  name: 'WireUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        bandwidth: this.params.data[0].bandwidth.toString(),
        mtu: this.params.data[0].mtu || 1500,
      },
      rules: {
        bandwidth: [
          { required: true, message: this.$t('network.text_699') },
        ],
      },
      bandwidthOptions: BAND_WIDTH_OPTION,
    }
  },
  methods: {
    doUpdate (data) {
      return new this.$Manager('wires').update({
        id: this.params.data[0].id,
        data,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doUpdate({ ...this.form })
        this.loading = false
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped lang="less">
  .add-desc{
    font-size: 12px;
    b{
      color: #333333;
    }
  }
</style>
