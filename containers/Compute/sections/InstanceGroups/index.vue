<template>
  <div>
    <a-form-model-item class="mb-0" :prop="enableField">
      <a-switch
        v-model:checked="model[enableField]"
        :checkedChildren="$t('compute.text_115')"
        :unCheckedChildren="$t('compute.text_116')"
        @change="change" />
    </a-form-model-item>
    <a-form-model-item v-if="groupsEnableValue" :prop="groupsField">
      <base-select
        v-model:value="model[groupsField]"
        :select-props="{ placeholder: $t('compute.text_148', [$t('dictionary.instancegroup')]), mode: 'multiple' }"
        resource="instancegroups"
        :params="params"
        :need-params="true" />
    </a-form-model-item>
  </div>
</template>

<script>
export default {
  name: 'InstanceGroups',
  inject: { form: { default: undefined } },
  props: {
    enableField: {
      type: String,
      default: 'groupsEnable',
    },
    groupsField: {
      type: String,
      default: 'groups',
    },
    model: {
      type: Object,
      required: true,
    },
    params: {
      type: Object,
      required: true,
    },
  },
  computed: {
    groupsEnableValue () {
      return !!this.model[this.enableField]
    },
  },
  methods: {
    change (val) {
      this.$set(this.model, this.enableField, !!val)
    },
    async validate () {
      return true
    },
  },
}
</script>
