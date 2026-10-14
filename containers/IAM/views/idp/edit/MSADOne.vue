<template>
  <a-form-model ref="formRef" :model="fd" :rules="rules">
    <a-form-model-item :label="$t('system.text_217')" :extra="$t('system.text_218')" prop="url">
      <a-input v-model:value="fd.url" />
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_219')" :extra="$t('system.text_220')" prop="suffix">
      <a-input v-model:value="fd.suffix" />
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_227', [$t('dictionary.user')])" prop="user">
      <a-input v-model:value="fd.user" />
    </a-form-model-item>
    <a-form-model-item :label="$t('system.text_221')" prop="password">
      <a-input-password v-model:value="fd.password" />
    </a-form-model-item>
    <a-form-model-item :label="`${$t('dictionary.user')}DN`" :extra="$t('system.text_222')" prop="user_tree_dn">
      <a-input v-model:value="fd.user_tree_dn" />
    </a-form-model-item>
    <a-form-model-item :label="`${$t('dictionary.group')}DN`" :extra="$t('system.text_222')" prop="group_tree_dn">
      <a-input v-model:value="fd.group_tree_dn" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
export default {
  name: 'IDPMSADOneEdit',
  props: {
    offsetWrapperCol: {
      type: Object,
      required: true,
    },
    fd: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      rules: {
        url: [
          { required: true, message: this.$t('system.text_236') },
        ],
        suffix: [
          { required: true, message: this.$t('system.text_237') },
        ],
        user: [
          { required: true, message: this.$t('scope.text_331') },
        ],
        password: [
          { required: true, message: this.$t('scope.text_333') },
        ],
        user_tree_dn: [
          { required: false, message: this.$t('system.text_240') },
        ],
        group_tree_dn: [
          { required: false, message: this.$t('system.text_241') },
        ],
      },
    }
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
    },
  },
}
</script>
