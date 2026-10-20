<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_983')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.secgroup')" :count="params.data.length" :action="$t('compute.text_983')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('compute.text_228')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('compute.text_210')" />
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
  name: 'CloneSecgroupDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_333') },
        ],
      },
      templateOps: {
        1: this.$t('compute.text_1010'),
        2: this.$t('compute.text_1011'),
        3: this.$t('compute.text_144'),
      },
    }
  },
  methods: {
    doCreate (data) {
      return new this.$Manager('secgroups').performAction({
        id: this.params.data[0].id,
        action: 'clone',
        data,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doCreate(this.form)
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        // validate or submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
