import { mapGetters } from 'vuex'
import NameRepeated from '@/sections/NameRepeated'

export default {
  props: {
    type: String,
    cloudEnv: String,
  },
  components: {
    NameRepeated,
  },
  data () {
    return {
      form: {
        fd: {
          name: '',
          description: '',
          domain: undefined,
          project: undefined,
          provider: undefined,
          cloudregion: undefined,
          zone: undefined,
          cloudprovider: undefined,
          capacity_gb: 1,
          tag: {},
          billing_type: 'postpaid',
          durationStandard: 'none',
          duration: '1h',
          enableWorldMap: false,
          sku: undefined,
          capacity: 0,
          cloudregion_id: undefined,
          zone_id: undefined,
          network: undefined,
          vpc: undefined,
        },
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo', 'capability']),
  },
  provide () {
    return {
      form: this.form,
      validateCreateForm: () => this.validateCreateForm(),
    }
  },
  methods: {
    async validateCreateForm () {
      if (this.$refs.formRef?.validate) {
        await this.$refs.formRef.validate()
      }
      const refs = [this.$refs.areaSelects, this.$refs.REF_NETWORK]
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
    handleCancel () {
      this.$router.push({ name: 'FileSystem' })
    },
  },
}
