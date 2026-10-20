<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('cloudenv.text_340')}}</div>
    <div slot="body">
      <a-alert class="mb-3" type="warning">
        <template #message>
          <div>
            {{$t('cloudenv.text_341')}}
          </div>
          <div>{{$t('cloudenv.text_342')}} </div>
          <div>{{$t('cloudenv.text_343')}}</div>
        </template>
      </a-alert>
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('cloudenv.text_344')" prop="enrollment_account_id">
          <base-select
            v-model:value="form.enrollment_account_id"
            showSync
            isDefaultSelect
            :resource="`cloudaccounts/${params.data.id}/enrollment-accounts`"
            :selectProps="{ 'placeholder': $t('cloudenv.text_345') }" />
          <div slot="extra">{{$t('cloudenv.text_346')}}</div>
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_347')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('cloudenv.text_348')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_349')" prop="offer_type">
          <a-select v-model:value="form.offer_type" :placeholder="$t('cloudenv.text_350')">
            <a-select-option value="MS-AZR-0017P">{{$t('cloudenv.text_351')}}</a-select-option>
            <a-select-option value="MS-AZR-0148P">{{$t('cloudenv.text_352')}}</a-select-option>
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'cloudproviderCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
        enrollment_account_id: undefined,
        offer_type: 'MS-AZR-0017P',
      },
      rules: {
        name: [
          { required: true, message: this.$t('cloudenv.text_190') },
        ],
        enrollment_account_id: [
          { required: true, message: this.$t('cloudenv.text_345') },
        ],
        offer_type: [
          { required: true, message: this.$t('cloudenv.text_350') },
        ],
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await new this.$Manager('cloudaccounts').performAction({
          id: this.params.data.id,
          action: 'create-subscription',
          data: this.form,
        })
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
