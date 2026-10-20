<template>
  <a-form-item :required="isRequired" class="no-line-height" :label="$t('cloudenv.text_22')">
    <a-input-group compact>
      <a-select :value="conditionKey" @change="onConditionKeyChange">
        <a-select-option value="projects">{{ $t('dictionary.project') }}</a-select-option>
      </a-select>
      <a-form-item class="mb-0 custom-form-item">
        <base-select
          style="width: 300px;"
          :value="conditionVals"
          resource="projects"
          version="v1"
          @change="conditionValsChange"
          :params="projectParams"
          remote
          :remote-fn="q => ({ filter: `name.contains(${q})` })"
          :select-props="{ placeholder: $t('rules.project'), mode: 'multiple' }" />
      </a-form-item>
    </a-input-group>
  </a-form-item>
</template>

<script>
const CONDITION_KEY_FIELD = 'conditionKey'
const CONDITION_VALS_FIELD = 'conditionVals'

export default {
  name: 'ConditionSelect',
  props: {
    required: {
      type: Boolean,
      default: true,
    },
  },
  inject: {
    form: { default: null },
  },
  data () {
    return {
      scope: this.$store.getters.scope,
      conditionKey: this.form?.fd?.[CONDITION_KEY_FIELD] ?? 'projects',
      conditionVals: this.form?.fd?.[CONDITION_VALS_FIELD],
    }
  },
  computed: {
    projectParams () {
      return {
        limit: 20,
        scope: this.scope,
      }
    },
    isRequired () {
      return this.required
    },
  },
  mounted () {
    this.syncFromFd()
  },
  methods: {
    syncFromFd () {
      const fd = this.form?.fd
      if (!fd) return
      if (fd[CONDITION_KEY_FIELD] !== undefined) this.conditionKey = fd[CONDITION_KEY_FIELD]
      if (fd[CONDITION_VALS_FIELD] !== undefined) this.conditionVals = fd[CONDITION_VALS_FIELD]
    },
    setField (name, val) {
      if (this.form?.fd) {
        this.$set(this.form.fd, name, val)
      }
    },
    onConditionKeyChange (val) {
      this.conditionKey = val
      this.setField(CONDITION_KEY_FIELD, val)
    },
    conditionValsChange (...args) {
      const val = args[0]
      this.conditionVals = val
      this.setField(CONDITION_VALS_FIELD, val)
      this.$emit('conditionValsChange', ...args)
    },
  },
}
</script>
