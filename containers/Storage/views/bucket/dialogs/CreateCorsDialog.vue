<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{isUpdate ? $t('storage.text_192') : $t('storage.text_193')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('storage.text_194')" prop="allowed_origins">
          <a-textarea
            v-model:value="form.allowed_origins"
            :placeholder="$t('storage.text_195')"
            :auto-size="{ minRows: 5, maxRows: 8 }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_196')" prop="allowed_methods">
          <a-checkbox-group
            v-model:value="form.allowed_methods"
            :options="methodsOptions" />
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_197')" prop="allowed_headers">
          <a-textarea
            v-model:value="form.allowed_headers"
            :auto-size="{ minRows: 5, maxRows: 8 }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_198')" prop="expose_headers">
          <a-textarea
            v-model:value="form.expose_headers"
            :auto-size="{ minRows: 5, maxRows: 8 }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('storage.text_199')" prop="max_age_seconds">
          <a-input-number v-model:value="form.max_age_seconds" :min="0" />
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
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'CreateCorsDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        allowed_origins: this.params.data && this.params.data[0].allowed_origins ? this.params.data[0].allowed_origins.join('\n') : '',
        allowed_methods: this.params.data && this.params.data[0].allowed_methods ? this.params.data[0].allowed_methods : [],
        allowed_headers: this.params.data && this.params.data[0].allowed_headers ? this.params.data[0].allowed_headers.join('\n') : '',
        expose_headers: this.params.data && this.params.data[0].expose_headers ? this.params.data[0].expose_headers.join('\n') : '',
        max_age_seconds: this.params.data && this.params.data[0].max_age_seconds ? this.params.data[0].max_age_seconds : 0,
      },
      rules: {
        allowed_origins: [
          { required: true, message: this.$t('storage.text_200') },
        ],
        allowed_methods: [
          { required: true, message: this.$t('storage.text_201') },
        ],
        allowed_headers: [
          { required: true, message: this.$t('storage.text_202') },
        ],
        expose_headers: [
          { required: true, message: this.$t('storage.text_203') },
        ],
        max_age_seconds: [
          { required: true, message: this.$t('storage.text_204') },
        ],
      },
      methodsOptions: [
        { label: 'PUT', value: 'PUT' },
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'HEAD', value: 'HEAD' },
      ],
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
    isUpdate () {
      return !!(this.params.data && this.params.data[0])
    },
  },
  methods: {
    genData (data) {
      const ret = {
        ...data,
        allowed_headers: data.allowed_headers.trim().split('\n'),
        allowed_origins: data.allowed_origins.trim().split('\n'),
        expose_headers: data.expose_headers.trim().split('\n'),
      }
      if (this.params.data && this.params.data[0].id) ret.id = this.params.data[0].id
      return ret
    },
    doCreate (data) {
      return new this.$Manager('buckets').performAction({
        id: this.params.bucketID,
        action: 'set-cors',
        data: {
          data: [
            { ...data },
          ],
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const data = this.genData({ ...this.form })
        await this.doCreate(data)
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
