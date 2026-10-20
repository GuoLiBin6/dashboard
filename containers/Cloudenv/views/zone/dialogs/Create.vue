<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('cloudenv.text_480')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('cloudenv.text_95')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('cloudenv.text_190')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_10')" prop="region">
          <base-select
            v-model:value="form.region"
            resource="cloudregions"
            :selectProps="{ 'placeholder': $t('cloudenv.text_231') }"
            :params="{ 'cloud_env': 'private_or_onpremise', 'brand': 'OneCloud' }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_374')" prop="location">
          <a-input v-model:value="form.location" :placeholder="$t('cloudenv.text_481')" />
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
  name: 'CreateZoneDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
        description: '',
        region: undefined,
        location: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('cloudenv.text_190') },
        ],
        region: [
          { required: true, message: this.$t('cloudenv.text_231') },
        ],
        location: [
          { required: true, message: this.$t('cloudenv.text_482') },
        ],
      },
    }
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
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doCreate(this.form)
        this.cancelDialog()
      } catch (error) {
        // validation or API error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
