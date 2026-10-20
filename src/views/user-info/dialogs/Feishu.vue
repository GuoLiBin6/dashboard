<template>
  <a-form-model>
    <a-form-model-item :label="$t('scope.text_200')">
      {{ imobile }}
    </a-form-model-item>
  </a-form-model>
</template>

<script>
export default {
  name: 'feishu',
  inject: ['userId', 'manager', 'imobile'],
  methods: {
    async submit () {
      await this.manager.performAction({
        id: this.userId,
        action: 'trigger-verify',
        data: {
          contact_type: 'feishu',
        },
      })
    },
  },
}
</script>
