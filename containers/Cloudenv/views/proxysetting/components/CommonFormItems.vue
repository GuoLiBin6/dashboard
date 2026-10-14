<template>
  <div>
    <a-form-model-item :label="$t('cloudenv.text_395')">
      <a-input v-model:value="form.https_proxy" />
      <template #extra>{{$t('cloudenv.text_396')}}<br />{{$t('cloudenv.text_397')}}</template>
    </a-form-model-item>
    <a-form-model-item :label="$t('cloudenv.text_398')">
      <a-input v-model:value="form.http_proxy" />
      <template #extra>{{$t('cloudenv.text_399')}}<br />{{$t('cloudenv.text_400')}}</template>
    </a-form-model-item>
    <a-form-model-item :label="$t('cloudenv.text_401')">
      <a-input v-model:value="form.no_proxy" />
      <template #extra>{{$t('cloudenv.text_402')}}<br />
        foo.com,.bar.com,7.7.7.7,8.8.8.8/8,9.9.9.9:80
      </template>
    </a-form-model-item>
  </div>
</template>

<script>
export default {
  name: 'proxysettingFormItems',
  props: {
    form: {
      type: Object,
      required: true,
    },
  },
}
</script>

<style>

</style>
