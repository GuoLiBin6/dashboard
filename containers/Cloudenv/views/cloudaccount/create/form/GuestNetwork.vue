<template>
  <a-form-model ref="formRef" :model="form.fd">
    <prepare-nets :prepareNetData="prepareNetData" type="guest" />
    <prepare-nets-form :form="form" :prepareNetData="prepareNetData" type="guest" />
  </a-form-model>
</template>

<script>
import { trimFormValues } from './components/createFormModelHelpers'
import createMixin from './components/createMixin'
import PrepareNets from '../components/PrepareNets'
import PrepareNetsForm from '../components/PrepareNetsForm'

export default {
  name: 'GuestNetworkCreate',
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
