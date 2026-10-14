<template>
  <div>
    <slot />
    <a-form-model-item :label="$t('compute.text_1140')" help="" :extra="$t('validator.resourceName')" prop="servertemplate_name">
      <a-input v-model:value="form.fd.servertemplate_name" :placeholder="$t('compute.text_220')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('common.description')" prop="description">
      <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
    </a-form-model-item>
  </div>
</template>

<script>
export default {
  props: {
    form: {
      type: Object,
      required: true,
    },
  },
}
</script>
