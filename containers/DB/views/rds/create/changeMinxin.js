/** END-STATE：form = { fd }；SKU / Network 写 fd；原 onValuesChange → watch form.fd */
import { getInitialValue } from '@/utils/common/ant'
import { RDS_CREATE_FIELD_MAP } from './constants/index'

export default {
  data () {
    const initFd = {
      billing_type: 'postpaid',
      ...getInitialValue(RDS_CREATE_FIELD_MAP),
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
    const capability = ['engine', 'engine_version', 'category', 'storage_type']
    const specs = ['vcpu_count', 'vmem_size_mb', 'zones']
    this.keysChange = {
      capability,
      specs,
    }
    ;['billing_type', 'domain', 'project', 'provider', 'cloudregion', 'generate_name', 'description', '__count__', '__meta__', 'multi_az', 'disk_size_gb'].forEach((name) => {
      if (this.form.fd[name] === undefined && name !== 'billing_type') {
        this.$set(this.form.fd, name, this.form.fd[name])
      }
    })
    await this.$nextTick()
    this.skuRef = this.$refs.SKU
    this.networkRef = this.$refs.NETWORK
  },
  watch: {
    'form.fd.domain' () { this.domain_change() },
    'form.fd.provider' (val) {
      this.provider = val || ''
      if (this.networkRef) this.provider_change()
    },
    'form.fd.cloudregion' () {
      if (this.skuRef) this.cloudregion_change()
    },
    'form.fd.engine' () { this.capability_change() },
    'form.fd.engine_version' () { this.capability_change() },
    'form.fd.category' () { this.capability_change() },
    'form.fd.storage_type' () { this.capability_change() },
    'form.fd.vcpu_count' () { this.specs_change() },
    'form.fd.vmem_size_mb' () { this.specs_change() },
    'form.fd.zones' () { this.zones_change() },
  },
  methods: {
    domain_change () {
      if (this.$store.getters.isAdminMode) {
        const { domain } = this.form.fd
        this.scopeParams.project_domain = domain
        delete this.scopeParams.scope
      } else {
        delete this.scopeParams.project_domain
      }
    },
    capability_change () {
      if (this.skuRef && this.skuRef.ensureFetchSpecs) {
        this.skuRef.ensureFetchSpecs(0)
      }
    },
    cloudregion_change () {
      if (this.skuRef && this.skuRef.fetchCapability) {
        this.skuRef.fetchCapability()
      }
    },
    specs_change () {
      if (this.skuRef) this.skuRef.fetchSkus()
    },
    zones_change () {
      if (this.skuRef) this.skuRef.fetchSkus()
      if (this.networkRef) this.networkRef.fetchVpc()
    },
    provider_change () {
      const { provider } = this.form.fd
      if (provider && provider === 'Aws' && this.networkRef) {
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
        this.$refs.NETWORK,
        this.$refs.passwordRef,
        this.$refs.secgroupRef,
      ]
      for (const ref of refs) {
        if (typeof ref?.validate === 'function') {
          await ref.validate()
        }
      }
      if (!(this.form.fd.sku && this.form.fd.sku.name)) {
        throw new Error('sku')
      }
      return { ...this.form.fd }
    },
  },
}
