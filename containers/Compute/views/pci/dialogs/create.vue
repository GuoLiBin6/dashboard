<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('common.create') }}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.pci.dev_type')" prop="dev_type">
          <a-input v-model:value="form.dev_type" :placeholder="$t('compute.pci.dev_type.placeholder')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.pci.model')" prop="model">
          <a-input v-model:value="form.model" :placeholder="$t('compute.pci.model.placeholder')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.pci.vendor_id')" prop="vendor_id">
          <template #extra v-if="showDocsLink()">
            {{ $t('compute.pci.vendor_id.extra') }}<help-link v-if="vendorAndDeviceLink" :href="vendorAndDeviceLink">{{ $t('compute.pci.document') }}</help-link>
          </template>
          <a-input v-model:value="form.vendor_id" :placeholder="$t('compute.pci.vendor_id.placeholder')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.pci.device_id')" prop="device_id">
          <template #extra v-if="showDocsLink()">
            {{ $t('compute.pci.device_id.extra') }}<help-link v-if="vendorAndDeviceLink" :href="vendorAndDeviceLink">{{ $t('compute.pci.document') }}</help-link>
          </template>
          <a-input v-model:value="form.device_id" :placeholder="$t('compute.pci.device_id.placeholder')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.pci.disable_auto_detect')" prop="disable_auto_detect">
          <a-switch v-model:checked="form.disable_auto_detect" :checked-children="$t('table.title.on')" :un-checked-children="$t('table.title.off')" />
        </a-form-model-item>
        <a-form-model-item v-if="!form.disable_auto_detect" :label="$t('compute.pci.host')" :extra="$t('compute.pci.host.extra')" prop="hosts">
          <list-select
            v-model:value="form.hosts"
            :list-props="resourceProps"
            :formatter="v => v.name"
            :multiple="true"
            :placeholder="$t('compute.pci.host.placeholder')"
            :dialog-params="{ title: $t('compute.text_111'), width: 1060 }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.pci.hot_pluggable')" :extra="$t('compute.pci.hot_pluggable.tips')" prop="hot_pluggable">
          <a-switch v-model:checked="form.hot_pluggable" :checked-children="$t('table.title.on')" :un-checked-children="$t('table.title.off')" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { typeClouds } from '@/utils/common/hypervisor'
import { DOCS_MAP, showDocsLink } from '@/constants/docs'
import ListSelect from '@/sections/ListSelect'
import ResourcePropsMixin from '../mixins/resourceProps'

export default {
  name: 'PciCreateDialog',
  components: {
    ListSelect,
  },
  mixins: [DialogMixin, WindowsMixin, ResourcePropsMixin],
  data () {
    return {
      showDocsLink,
      loading: false,
      form: {
        dev_type: undefined,
        model: undefined,
        vendor_id: undefined,
        device_id: undefined,
        hosts: undefined,
        hot_pluggable: false,
        disable_auto_detect: false,
      },
      rules: {
        dev_type: [
          { required: true, message: this.$t('compute.pci.dev_type.placeholder') },
        ],
        model: [
          { required: true, message: this.$t('compute.pci.model.placeholder') },
        ],
        vendor_id: [
          { required: true, message: this.$t('compute.pci.vendor_id.placeholder') },
          { validator: this.validateVendorId(), trigger: 'blur' },
        ],
        device_id: [
          { required: true, message: this.$t('compute.pci.device_id.placeholder') },
          { validator: this.validateDeviceId(), trigger: 'blur' },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
      hostParams: {
        details: false,
        baremetal: false,
        brand: typeClouds.brandMap.OneCloud.brand,
      },
    }
  },
  computed: {
    vendorAndDeviceLink () {
      return DOCS_MAP.pciVendorAndDevice()
    },
  },
  methods: {
    validateVendorId () {
      return (rule, value, callback) => {
        const reg = /^[a-f0-9]{4}$/
        if (reg.test(value)) {
          return callback()
        }
        return callback(new Error(this.$t('compute.pci.vendor_id.reg_error_msg')))
      }
    },
    validateDeviceId () {
      return (rule, value, callback) => {
        const reg = /^[a-f0-9]{4}$/
        if (reg.test(value)) {
          return callback()
        }
        return callback(new Error(this.$t('compute.pci.device_id.reg_error_msg')))
      }
    },
    doSubmit (data) {
      return new this.$Manager('isolated_device_models').create({
        data,
      })
    },
    async handleConfirm () {
      try {
        this.loading = true
        await this.$refs.formRef.validate()
        const data = {
          dev_type: this.form.dev_type.trim(),
          model: this.form.model.trim(),
          vendor_id: this.form.vendor_id.trim(),
          device_id: this.form.device_id.trim(),
          hosts: this.form.hosts,
          hot_pluggable: this.form.hot_pluggable,
          disable_auto_detect: this.form.disable_auto_detect,
        }
        await this.doSubmit(data)
        this.cancelDialog()
        this.params.refresh && this.params.refresh()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
