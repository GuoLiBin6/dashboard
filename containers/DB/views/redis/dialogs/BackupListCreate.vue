<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('db.text_287')}}</div>
    <a-form-model ref="formRef" slot="body" :model="form" :rules="rules" class="mt-3">
      <a-form-model-item :label="$t('db.text_60')" prop="name">
        <a-input :placeholder="$t('db.text_288')" v-model:value="form.name" />
        <name-repeated v-slot:extra res="dbinstancebackups" :name="form.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('db.text_219')" prop="description">
        <a-textarea :placeholder="$t('db.text_220')"
        :autosize="{ minRows: 4, maxRows: 7 }"
        v-model:value="form.description" />
      </a-form-model-item>
    </a-form-model>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import validateForm from '@/utils/validate'
import { ACCOUNT_PRIVILEGES } from '../constants'
export default {
  name: 'BackupListCreate',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { initialValues = {} } = this.params
    return {
      loading: false,
      privileges: ACCOUNT_PRIVILEGES,
      form: {
        name: initialValues.name,
        description: initialValues.ip_list,
      },
      rules: {
        name: [
          { required: true, message: this.$t('db.text_136') },
          { validator: validateForm('serverName') },
        ],
        description: [
          { max: 200, message: this.$t('db.text_289') },
        ],
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        const params = {
          ...values,
          elasticcache: this.params.redisItem.id,
        }
        delete params.checkPassword
        await this.params.list.onManager('create', {
          managerArgs: {
            data: params,
          },
        })
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
