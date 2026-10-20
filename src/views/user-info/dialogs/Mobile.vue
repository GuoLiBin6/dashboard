<template>
  <a-form-model ref="formRef" :model="form" :rules="rules">
    <a-form-model-item :label="$t('scope.text_200')">
      {{ imobile }}
    </a-form-model-item>
    <a-form-model-item :label="$t('scope.text_201')" prop="code">
      <div class="d-flex">
        <a-input v-model:value="form.code" style="max-width: 100px;" />
        <a-button type="link" class="flex-grow-0 flex-shrink-0" @click="getMobileVerifyCode" :disabled="codeButtonDisable" style="width: 150px; border-left-width: 0;">{{ codeButtonText }}</a-button>
      </div>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
export default {
  name: 'mobile',
  inject: ['userId', 'manager', 'imobile'],
  data () {
    return {
      processId: '',
      codeButtonText: this.$t('scope.text_206'),
      codeButtonDisable: false,
      codeInt: null,
      form: {
        code: '',
      },
      rules: {
        code: [
          { required: true, message: this.$t('scope.text_209') },
          {
            pattern: '[0-9]{6}',
            message: this.$t('scope.text_210'),
          },
        ],
      },
    }
  },
  unmounted () {
    this.vm = null
    clearInterval(this.codeInt)
  },
  methods: {
    async getMobileVerifyCode () {
      try {
        await this.manager.performAction({
          id: this.userId,
          action: 'trigger-verify',
          data: {
            contact: this.mobile,
            contact_type: 'mobile',
          },
        })
        let sec = 300
        this.codeButtonDisable = true
        this.codeButtonText = this.$t('scope.text_219', [sec])

        this.codeInt = setInterval(() => {
          sec -= 1
          const text = this.$t('scope.text_219', [sec])
          this.codeButtonText = text
          if (sec <= 0) {
            this.codeButtonDisable = false
            this.codeButtonText = this.$t('scope.text_206')
            clearInterval(this.codeInt)
          }
        }, 1000)
      } catch (error) {
        throw error
      }
    },
    async submit () {
      await this.$refs.formRef.validate()
      await this.manager.performAction({
        id: this.userId,
        action: 'verify',
        data: {
          contact_type: 'mobile',
          token: this.form.code,
        },
      })
    },
  },
}
</script>
