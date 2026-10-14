/** END-STATE：form = { fd }；SKU / Network 写 fd；原 onValuesChange → watch form.fd */
import { getInitialValue } from '@/utils/common/ant'
import { SKU_PARAMS, CAPABILIT_PARAMS, SPECS_PARAMS, REDIS_CREATE_FIELD_MAP } from '../constants'

export default {
  data () {
    const initFd = {
      ...getInitialValue(REDIS_CREATE_FIELD_MAP),
    }
    return {
      provider: '',
      form: {
        fd: initFd,
      },
    }
  },
  provide () {
    return {
      form: this.form,
      validateCreateForm: () => this.validateCreateForm(),
    }
  },
  async created () {
    ;['cloudregion_id', 'zone_id'].forEach((name) => {
      if (this.form.fd[name] === undefined) {
        this.$set(this.form.fd, name, undefined)
      }
    })
    this.keysChange = {
      area: CAPABILIT_PARAMS,
      capability: SPECS_PARAMS,
    }
    this.keysChange.sku_params = SKU_PARAMS
    await this.$nextTick()
    this.skuRef = this.$refs.REF_SKU
    this.networkRef = this.$refs.REF_NETWORK
  },
  watch: {
    'form.fd.domain' () { this.domain_change() },
    'form.fd.project' () { this.project_change() },
    'form.fd.provider' (val) {
      this.provider = val || ''
      this.area_change()
    },
    'form.fd.cloudregion' () { this.area_change() },
    'form.fd.zone' () { this.zone_change() },
    'form.fd.engine' () { this.capability_change() },
    'form.fd.engine_version' () { this.capability_change() },
    'form.fd.local_category' () { this.capability_change() },
    'form.fd.memory_size_mb' () { this.sku_params_change() },
    'form.fd.sku' () { this.sku_change() },
    'form.fd.cloudregion_id' () { this.cloudregion_id_change() },
    'form.fd.zone_id' () { this.zone_id_change() },
  },
  methods: {
    domain_change () {
      if (this.$store.getters.isAdminMode) {
        const { domain } = this.form.fd
        this.project_domain = domain
      } else {
        this.project_domain = undefined
      }
    },
    project_change () {
      const { project } = this.form.fd
      this.project_id = project
    },
    area_change () {
      if (this.skuRef) this.skuRef.fetchCapability()
    },
    async capability_change () {
      if (this.skuRef) await this.skuRef.fetchSpecs()
    },
    sku_params_change () {
      if (this.skuRef) this.skuRef.fetchSkus()
    },
    sku_change () {
      const { fd } = this.form
      const { sku } = fd
      let callback
      if (sku && (fd.cloudregion_id !== sku.cloudregion_id)) {
        this.$set(this.form.fd, 'cloudregion_id', sku.cloudregion_id)
        callback = this.cloudregion_id_change
      }
      if (sku && (fd.zone_id !== sku.zone_id)) {
        this.$set(this.form.fd, 'zone_id', sku.zone_id)
        callback = this.zone_id_change
      }
      if (callback) {
        callback()
      }
    },
    cloudregion_id_change () {
      if (this.networkRef && this.networkRef.fetchVpc) {
        this.networkRef.fetchVpc()
      }
    },
    zone_id_change () {
      if (this.networkRef && this.networkRef.fetchVpc) {
        this.networkRef.fetchVpc()
      }
    },
    zone_change () {
      if (this.networkRef && this.networkRef.fetchVpc) {
        this.networkRef.fetchVpc()
      }
    },
    async validateCreateForm () {
      if (this.$refs.formRef?.validate) {
        await this.$refs.formRef.validate()
      }
      const refs = [
        this.$refs.domainProjectRef,
        this.$refs.ITEM_AREA,
        this.$refs.REF_NETWORK,
        this.$refs.passwordRef,
        this.$refs.secgroupRef,
      ]
      for (const ref of refs) {
        if (typeof ref?.validate === 'function') {
          await ref.validate()
        }
      }
      if (!this.form.fd.sku) {
        throw new Error('sku')
      }
      return { ...this.form.fd }
    },
  },
}
