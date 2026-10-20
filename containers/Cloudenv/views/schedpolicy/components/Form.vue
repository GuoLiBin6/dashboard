<template>
  <a-form-model
    ref="formRef"
    :model="form.fd"
    :rules="rules">
    <a-form-model-item :label="$t('cloudenv.text_95')" prop="name" v-if="!updateValue">
      <a-input v-model:value="form.fd.name" :placeholder="$t('validator.resourceName')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('common.description')" prop="description" v-if="!updateValue">
      <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.fd.description" :placeholder="$t('common_367')" />
    </a-form-model-item>
    <a-form-model-item required :label="$t('cloudenv.text_413')" prop="strategy">
      <strategy-radio
        :isNone="false"
        v-model:value="form.fd.strategy" />
    </a-form-model-item>
    <a-form-model-item :label="$t('cloudenv.text_18')" prop="schedtag">
      <base-select
        v-model:value="form.fd.schedtag"
        resource="schedtags"
        :params="schedtagParams"
        :select-props="{ placeholder: $t('cloudenv.text_378') }"
        :autoLoadDefaultSelect="false" />
    </a-form-model-item>
    <condition-select @conditionValsChange="conditionValsChange" />
  </a-form-model>
</template>

<script>
import StrategyRadio from '@Cloudenv/sections/StrategyRadio'
import ConditionSelect from '@Cloudenv/sections/ConditionSelect'

export default {
  name: 'SchedpolicyForm',
  components: {
    StrategyRadio,
    ConditionSelect,
  },
  provide () {
    return {
      form: this.form,
    }
  },
  props: {
    updateValue: Object,
  },
  data () {
    const getInitValue = () => {
      let strategy = 'exclude'
      let schedtag
      let conditionVals
      if (this.updateValue) {
        strategy = this.updateValue.strategy
        schedtag = this.updateValue.schedtag
        if (this.updateValue.condition.includes('in')) {
          const key = this.updateValue.condition.substring(this.updateValue.condition.indexOf('(') + 1, this.updateValue.condition.length - 1)
          /* eslint-disable no-useless-escape */
          conditionVals = key.replace(/\"/g, '').split(',')
        }
      }
      return {
        strategy,
        schedtag,
        conditionVals,
      }
    }
    const initValue = getInitValue()
    return {
      scope: this.$store.getters.scope,
      form: {
        fd: {
          name: '',
          description: '',
          strategy: initValue.strategy,
          schedtag: initValue.schedtag,
          conditionKey: 'projects',
          conditionVals: initValue.conditionVals,
          condition: '',
        },
      },
      rules: {
        name: [
          { required: true, message: this.$t('common.text00042') },
          { validator: this.$validate('resourceName') },
        ],
        strategy: [
          { required: true, message: this.$t('common_620') },
        ],
        conditionVals: [
          { required: true, message: this.$t('common_621') },
        ],
      },
    }
  },
  computed: {
    schedtagParams () {
      return {
        limit: 0,
        scope: this.scope,
        filter: 'resource_type.equals(hosts)',
      }
    },
  },
  methods: {
    conditionValsChange (val) {
      if (val) {
        const conditions = []
        val.forEach((item) => {
          /* eslint-disable no-useless-escape */
          conditions.push(`\"${item}\"`)
        })
        this.form.fd.condition = `server.owner_tenant_id.in(${conditions.join(',')})`
      }
    },
    validateForm () {
      return new Promise((resolve, reject) => {
        this.$refs.formRef.validate(valid => {
          if (valid) {
            resolve({ ...this.form.fd })
          } else {
            reject(new Error('validate failed'))
          }
        })
      })
    },
  },
}
</script>
