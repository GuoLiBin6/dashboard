<template>
  <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
    <a-form-model-item :label="$t('scope.text_204')" :help="$t('scope.text_205')">
      {{ email }}
    </a-form-model-item>
    <a-form-model-item :label="$t('scope.text_201')" prop="code">
      <div class="d-flex">
        <a-input v-model:value="form.code" style="max-width: 100px;" />
        <a-button type="link" class="flex-grow-0 flex-shrink-0" @click="getEmailVerifyCode" :disabled="codeButtonDisable" style="width: 150px; border-left-width: 0;">{{ codeButtonText }}</a-button>
      </div>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import * as R from 'ramda'

export default {
  name: 'email',
  inject: ['userId', 'manager', 'dialogData', 'formItemLayout'],
  data () {
    return {
      codeButtonText: this.$t('scope.text_206'),
      codeButtonDisable: false,
      codeInt: null,
      email: this.dialogData.email,
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
    clearInterval(this.codeInt)
  },
  methods: {
    async getEmailVerifyCode () {
      try {
        await this.manager.performAction({
          id: this.userId,
          action: 'trigger-verify',
          data: {
            contact: this.email,
            contact_type: 'email',
          },
        })
        let sec = 120
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
          contact: this.email,
          contact_type: 'email',
          token: R.trim(this.form.code),
        },
      })
    },
  },
}
</script>
