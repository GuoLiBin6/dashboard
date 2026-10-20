<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.dbinstances')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form.fd">
        <s-k-u ref="SKU" :disableds="disableds" :rdsItem="rdsItem">
          <a-radio-group disabled slot="zone" :defaultValue="Object.keys(rdsZone)[0]">
            <a-radio-button :key="key" :value="key" v-for="(value, key) in rdsZone">{{value}}</a-radio-button>
          </a-radio-group>
        </s-k-u>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import SKU from '../create/components/SKU'
export default {
  name: 'RSDSetConfig',
  components: {
    SKU,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      rdsZone: {},
      form: {
        fd: {
          provider: this.params.data[0].provider,
        },
      },
    }
  },
  computed: {
    rdsItem () {
      const { data } = this.params
      return data[0]
    },
    disableds () {
      const _ = {
        Huawei: ['engine', 'engine_version', 'zones', 'category', 'storage_type'],
        Aliyun: ['engine', 'engine_version', 'zones', 'storage_type'],
        Google: ['engine', 'engine_version', 'zones', 'category'],
      }
      return _[this.rdsItem.brand]
    },
    scopeParams () {
      if (this.$store.getters.isAdminMode) {
        return {
          project_domain: this.rdsItem.domain_id,
        }
      } else {
        return {
          scope: this.$store.getters.scope,
        }
      }
    },
  },
  provide () {
    return {
      form: this.form,
      scopeParams: this.scopeParams,
    }
  },
  async mounted () {
    const capability = ['engine', 'engine_version', 'category', 'storage_type']
    const specs = ['vcpu_count', 'vmem_size_mb', 'zones']
    this.keysChange = {
      capability,
      specs,
    }
    await this.$nextTick()
    this.skuRef = this.$refs.SKU
    await this.skuRef.fetchCapability(this.rdsItem.cloudregion_id)
    await this.setValues()
  },
  methods: {
    setValues () {
      const SKU = this.$refs.SKU
      const { engine, provider } = this.rdsItem
      const zoneIds = []
      const zoneNames = []
      let i = 0
      for (;;) {
        ++i
        const id = this.rdsItem[`zone${i}`]
        const name = this.rdsItem[`zone${i}_name`]
        if (id) {
          zoneIds.push(id)
          zoneNames.push(name)
        } else {
          break
        }
      }
      this.rdsZone = {
        [zoneIds.join('+')]: zoneNames.join('+'),
      }
      const values = {
        provider,
        engine,
        engine_version: this.rdsItem.engine_version,
        category: this.rdsItem.category,
        storage_type: this.rdsItem.storage_type,
        vcpu_count: this.rdsItem.vcpu_count,
        vmem_size_mb: this.rdsItem.vmem_size_mb,
        zones: zoneIds.join('+'),
        cloudregion_id: this.rdsItem.cloudregion_id,
        cloudregion: this.rdsItem.cloudregion_id,
      }
      Object.keys(values).forEach((key) => {
        this.$set(this.form.fd, key, values[key])
      })
      this.$nextTick(() => {
        if (typeof SKU.linkageValue === 'function') SKU.linkageValue()
      })
    },
    capability_change () {
      this.skuRef.fetchSpecs()
    },
    specs_change () {
      this.skuRef.fetchSkus()
    },
    async validateForm () {
      if (this.$refs.formRef?.validate) {
        await this.$refs.formRef.validate()
      }
      const merged = { ...this.form.fd }
      if (!(merged.sku && merged.sku.name)) {
        throw new Error('sku')
      }
      if (merged.sku) {
        merged.instance_type = merged.sku.name
        delete merged.sku
      }
      if (merged.zones) {
        merged.zones.split('+').forEach((zone, index) => {
          merged[`zone${index + 1}`] = zone
        })
        delete merged.zones
      }
      return merged
    },
    async handleConfirm () {
      this.loading = true
      try {
        const values = await this.validateForm()
        await this.params.onManager('performAction', {
          id: this.params.data[0].id,
          steadyStatus: ['running'],
          managerArgs: {
            action: 'change-config',
            data: values,
          },
        })
        this.cancelDialog()
        this.params.refresh()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
