<template>
  <a-form-model-item :required="isRequired" :label="$t('cloudenv.text_22')" prop="conditionVals">
    <div class="condition-select-row">
      <a-select
        class="condition-select-key"
        :value="conditionKey"
        @change="onConditionKeyChange">
        <a-select-option value="projects">{{ $t('dictionary.project') }}</a-select-option>
      </a-select>
      <base-select
        class="condition-select-vals"
        :value="conditionVals"
        resource="projects"
        version="v1"
        @change="conditionValsChange"
        :params="projectParams"
        remote
        :remote-fn="q => ({ filter: `name.contains(${q})` })"
        :select-props="{ placeholder: $t('rules.project'), mode: 'multiple' }" />
    </div>
  </a-form-model-item>
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
        this.form.fd[name] = val
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

<style lang="less" scoped>
.condition-select-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}
.condition-select-key {
  width: 120px;
  flex-shrink: 0;
}
.condition-select-vals {
  flex: 1;
  min-width: 0;
}
</style>
