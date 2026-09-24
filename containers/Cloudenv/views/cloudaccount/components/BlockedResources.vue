<template>
  <div class="blocked-resources">
    <a-form-item :label="$t('cloudenv.block_resources')">
      <a-switch
        :checkedChildren="$t('cloudenv.text_84')"
        :unCheckedChildren="$t('cloudenv.text_85')"
        v-model:checked="isOpenBlockedResources"
        @change="blockedResourcesChangeHandle" />
    </a-form-item>
    <a-form-item :label="$t('cloudenv.block_resources_type')" v-if="isOpenBlockedResources">
      <base-select
        v-decorator="decorators.blockedResources"
        :options="BLOCKED_RESOURCES"
        :select-props="{ placeholder: $t('common.tips.select', [$t('cloudenv.block_resources_type')]), allowClear: true, mode: 'multiple' }" />
    </a-form-item>
  </div>
</template>

<script>
import * as R from 'ramda'
import { BLOCKED_RESOURCES } from '@Cloudenv/constants'

export default {
  name: 'BlockedResources',
  props: {
    decorators: {
      type: Object,
      validator: val => R.is(Array, val.isOpenBlockedResources) && R.is(Array, val.blockedResources),
    },
  },
  data () {
    return {
      BLOCKED_RESOURCES,
      isOpenBlockedResources: this.decorators.isOpenBlockedResources[1]?.initialValue || false,
    }
  },
  mounted () {
    this.syncOpenToForm(this.isOpenBlockedResources)
  },
  methods: {
    getFormFc () {
      let cur = this.$parent
      while (cur) {
        if (cur.form && cur.form.fc) return cur.form.fc
        cur = cur.$parent
      }
      return null
    },
    syncOpenToForm (v) {
      const fc = this.getFormFc()
      const deco = this.decorators && this.decorators.isOpenBlockedResources
      if (!fc || !deco) return
      const [name, opts] = deco
      if (typeof fc.__registerField === 'function') fc.__registerField(name, opts || {})
      fc.setFieldsValue({ [name]: v })
    },
    blockedResourcesChangeHandle (v) {
      this.isOpenBlockedResources = v
      this.syncOpenToForm(v)
    },
  },
}
</script>

<style lang="scss" scoped></style>
