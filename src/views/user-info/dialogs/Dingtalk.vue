<template>
  <a-form-model v-bind="formItemLayout">
    <a-form-model-item :label="$t('scope.text_200')">
      {{ imobile }}
    </a-form-model-item>
  </a-form-model>
</template>

<script>
export default {
  name: 'dingtalk',
  inject: ['userId', 'manager', 'imobile', 'formItemLayout'],
  methods: {
    async submit () {
      await this.manager.performAction({
        id: this.userId,
        action: 'trigger-verify',
        data: {
          contact_type: 'dingtalk',
        },
      })
    },
  },
}
</script>
