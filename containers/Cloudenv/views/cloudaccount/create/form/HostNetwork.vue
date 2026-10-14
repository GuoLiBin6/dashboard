<template>
  <a-form-model ref="formRef" :model="form.fd" v-bind="formLayout">
    <prepare-nets :prepareNetData="prepareNetData" type="host" />
    <prepare-nets-form :form="form" :prepareNetData="prepareNetData" type="host" />
  </a-form-model>
</template>

<script>
import { trimFormValues } from './components/createFormModelHelpers'
import createMixin from './components/createMixin'
import PrepareNets from '../components/PrepareNets'
import PrepareNetsForm from '../components/PrepareNetsForm'

export default {
  name: 'HostNetworkCreate',
  components: {
    PrepareNets,
    PrepareNetsForm,
  },
  mixins: [createMixin],
  props: {
    prepareNetData: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      keepAliveFields: true,
    }
  },
  methods: {
    async validateForm () {
      if (this.$refs.formRef?.validate) {
        await this.$refs.formRef.validate()
      }
      return this.transformParams(trimFormValues({ ...this.form.fd }))
    },
  },
}
</script>
