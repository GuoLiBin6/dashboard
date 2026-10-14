<template>
  <div class="blocked-resources">
    <a-form-model-item :label="$t('cloudenv.block_resources')" prop="isOpenBlockedResources">
      <a-switch
        :checkedChildren="$t('cloudenv.text_84')"
        :unCheckedChildren="$t('cloudenv.text_85')"
        v-model:checked="form.isOpenBlockedResources" />
    </a-form-model-item>
    <a-form-model-item :label="$t('cloudenv.block_resources_type')" v-if="form.isOpenBlockedResources" prop="blockedResources">
      <base-select
        v-model:value="form.blockedResources"
        :options="BLOCKED_RESOURCES"
        :select-props="{ placeholder: $t('common.tips.select', [$t('cloudenv.block_resources_type')]), allowClear: true, mode: 'multiple' }" />
    </a-form-model-item>
  </div>
</template>

<script>
import { BLOCKED_RESOURCES } from '@Cloudenv/constants'

export default {
  name: 'BlockedResources',
  props: {
    form: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      BLOCKED_RESOURCES,
    }
  },
}
</script>
