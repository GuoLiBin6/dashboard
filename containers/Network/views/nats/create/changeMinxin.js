/** END-STATE：form = { fd }；section 写 fd；原 onValuesChange → watch form.fd */
import * as R from 'ramda'
import { getInitialValue } from '@/utils/common/ant'
import { CAPABILIT_PARAMS, NATS_CREATE_FIELD_MAP } from '../constants'

export default {
  data () {
    const initFd = {
      ...getInitialValue(NATS_CREATE_FIELD_MAP),
      auto_renew: false,
      enableWorldMap: false,
    }
    return {
      form: {
        fd: initFd,
      },
    }
  },
  provide () {
    return {
      form: this.form,
      scopeParams: this.scopeParams,
      formItemLayout: this.formItemLayout,
      tailFormItemLayout: this.tailFormItemLayout,
      validateCreateForm: () => this.validateCreateForm(),
    }
  },
  async created () {
    if (this.form.fd.cloudregion_id === undefined) {
      this.$set(this.form.fd, 'cloudregion_id', undefined)
    }
    this.keysChange = {
      area: CAPABILIT_PARAMS,
    }
    await this.$nextTick()
    this.skuRef = this.$refs.REF_SKU
    this.networkRef = this.$refs.REF_NETWORK
  },
  watch: {
    'form.fd.domain' () { this.domain_change() },
    'form.fd.billing_type' () { this.billing_type_change() },
    'form.fd.sku' () { this.sku_change() },
    'form.fd.cloudregion_id' () { this.cloudregion_id_change() },
    'form.fd.provider' () { this.runAreaChange() },
    'form.fd.cloudregion' () { this.runAreaChange() },
    'form.fd.zone' () { this.runAreaChange() },
  },
  methods: {
    runAreaChange () {
      if (typeof this.area_change === 'function') {
        this.area_change()
      }
    },
    domain_change () {
      if (this.$store.getters.isAdminMode) {
        const { domain } = this.form.fd
        this.scopeParams.project_domain = domain || this.project_domain
        delete this.scopeParams.scope
      } else {
        delete this.scopeParams.project_domain
        this.scopeParams.scope = this.scope
      }
    },
    billing_type_change () {
      this.refreshSkuByAreaSelection()
    },
    area_change () {
      this.refreshSkuByAreaSelection()
    },
    sku_change () {
      const sku = this.form.fd.sku
      if (R.is(Object, sku) && sku.cloudregion_id) {
        if (this.form.fd.cloudregion_id !== sku.cloudregion_id) {
          this.$set(this.form.fd, 'cloudregion_id', sku.cloudregion_id)
        }
        this.$nextTick(() => {
          this.fetchVpc()
        })
      }
    },
    cloudregion_id_change () {
      if (this.networkRef && this.networkRef.fetchVpc) {
        this.fetchVpc()
      }
    },
    async validateCreateForm () {
      if (this.$refs.formRef?.validate) {
        await this.$refs.formRef.validate()
      }
      const refs = [this.$refs.areaSelects, this.$refs.REF_NETWORK, this.$refs.eipConfigRef]
      for (const ref of refs) {
        if (typeof ref?.validate === 'function') {
          await ref.validate()
        }
      }
      if (!this.form.fd.sku) {
        throw new Error(this.$t('network.nat.sku.choose'))
      }
      return { ...this.form.fd }
    },
  },
}
