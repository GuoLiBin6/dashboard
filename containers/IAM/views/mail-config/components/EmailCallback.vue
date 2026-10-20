<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules">
    <a-alert type="warning" :message="$t('system.text_274')" class="mb-2" />
    <a-form-model-item :label="$t('system.text_275')" prop="address">
      <a-input v-model:value="form.address" />
    </a-form-model-item>
    <a-form-model-item :wrapper-col="offsetWrapperCol">
      <a-button type="primary" @click="handleSubmit" :loading="submiting">{{ $t('common.ok') }}</a-button>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
export default {
  name: 'EmailCallbackConfig',
  props: {
    offsetWrapperCol: {
      required: true,
      type: Object,
    },
    loading: Boolean,
  },
  data () {
    return {
      submiting: false,
      mailCallbackId: null,
      form: {
        address: '',
      },
      rules: {
        address: [
          { required: true, message: this.$t('system.text_276') },
        ],
      },
    }
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('parameters', 'v1')
    this.fetchData()
  },
  methods: {
    async fetchData () {
      this.$emit('update:loading', true)
      try {
        const response = await this.manager.get({
          id: 'mail-call-back-address',
          params: {
            service: 'itsm',
            scope: this.$store.getters.scope,
          },
        })
        this.mailCallbackId = response.data && response.data.id
        const value = response.data?.value || {}
        this.form.address = value.address || ''
      } catch (error) {
        throw error
      } finally {
        this.$emit('update:loading', false)
      }
    },
    async handleSubmit () {
      this.submiting = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        if (this.mailCallbackId) {
          await this.manager.update({
            id: this.mailCallbackId,
            data: {
              service: 'itsm',
              value: values,
            },
          })
        } else {
          await this.manager.create({
            data: {
              service: 'itsm',
              name: 'mail-call-back-address',
              value: values,
            },
          })
        }
        this.$message.success(this.$t('system.text_277'))
      } catch (error) {
        throw error
      } finally {
        this.submiting = false
      }
    },
  },
}
</script>
