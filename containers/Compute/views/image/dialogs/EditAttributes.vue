<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_247')}}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('compute.text_228')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('compute.text_627')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1365')">
          <os-arch
            :value="form.os_arch"
            @change="osArchChangeHandle"
            :form="form" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_267')" v-if="!$route.path.includes('app-package')" prop="osType">
          <a-radio-group @change="osTypeChangeHandle" v-model:value="form.osType">
            <a-radio-button value="Linux">Linux</a-radio-button>
            <a-radio-button value="Windows">Windows</a-radio-button>
            <a-radio-button value="Other">{{$t('compute.text_151')}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_657')" v-if="!$route.path.includes('app-package')" prop="osDistribution">
          <a-select
            :placeholder="$t('compute.text_658')"
            v-model:value="form.osDistribution"
            @change="osDistributionChange">
            <a-select-option
              v-for="item in osNewDisOptions"
              :key="item.value"
              :value="item.value">{{item.text}}</a-select-option>
          </a-select>
          <a-input
            v-if="isDisOther"
            v-model:value="form.osOtherDistribution"
            :placeholder="$t('compute.text_659')" />
        </a-form-model-item>
        <a-form-model-item
          :label="$t('compute.text_633')"
          :extra="$t('compute.image.min_disk.extra')"
          v-if="!isHostImage"
          prop="minDisk">
          <div class="d-flex align-items-center">
            <a-input-number
              :min="1"
              :max="1000"
              :step="50"
              :precision="0"
              v-model:value="form.minDisk" />
            <span class="ml-2">GB</span>
          </div>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_634')" prop="diskDriver">
          <a-radio-group v-model:value="form.diskDriver">
            <a-radio-button
              v-for="(item, index) in diskDriverOptions"
              :value="item.value"
              :key="index">{{item.text}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_635')" prop="netDriver">
          <a-radio-group v-model:value="form.netDriver">
            <a-radio-button
              v-for="(item, index) in netDriverOptions"
              :value="item.value"
              :key="index">{{item.text}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1155')" prop="bios">
          <a-radio-group v-model:value="form.bios">
            <a-radio-button
              v-for="(item, index) in biosOptions"
              :value="item.value"
              :key="index"
              :disabled="isArm && item.value==='BIOS'">{{item.text}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.vdi_protocol')" prop="vdi">
          <a-radio-group v-model:value="form.vdi">
            <a-radio-button
              v-for="(item, index) in vdiOptions"
              :value="item.value"
              :key="index">{{item.text}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.machine')" prop="machine_type">
          <a-radio-group v-model:value="form.machine_type">
            <a-radio-button
              v-for="(item, index) in machineTypeOptions"
              :value="item.value"
              :key="index">{{item.text}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.usb_kbd')" prop="disable_usb_kbd">
          <a-switch v-model:checked="form.disable_usb_kbd" />
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
import * as R from 'ramda'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import OsArch from '@/sections/OsArch'
import { HOST_CPU_ARCHS } from '@/constants/compute'

export default {
  name: 'ImageEditAttributesDialog',
  components: {
    OsArch,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const data = this.params.data[0]
    let os_arch = data.os_arch || HOST_CPU_ARCHS.x86.key
    if (data.properties && data.properties.os_arch) {
      os_arch = data.properties.os_arch.includes('x86') ? HOST_CPU_ARCHS.x86.key : HOST_CPU_ARCHS.arm.key
    }
    let bios = 'BIOS'
    const { properties = {} } = data
    const { uefi_support, bios_support } = properties
    if (uefi_support === 'true' && bios_support === 'true') {
      bios = 'BIOS & UEFI'
    } else if (uefi_support === 'true' && bios_support !== 'true') {
      bios = 'UEFI'
    } else if (uefi_support !== 'true') {
      bios = 'BIOS'
    }
    const isArm = (os_arch === HOST_CPU_ARCHS.arm.key)
    return {
      isArm: isArm,
      loading: false,
      form: {
        name: this.params.data[0].name,
        osType: 'Linux',
        osDistribution: 'CentOS',
        osOtherDistribution: undefined,
        minDisk: 1,
        diskDriver: undefined,
        netDriver: undefined,
        os_arch,
        bios,
        vdi: 'vnc',
        machine_type: '',
        disable_usb_kbd: false,
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_660') },
          { validator: this.$validate('imageName') },
          { validator: this.checkTemplateName },
        ],
      },
      osDistributionOptions: {
        Windows: [
          { text: 'Windows Server 2025', value: 'Windows Server 2025' },
          { text: 'Windows Server 2022', value: 'Windows Server 2022' },
          { text: 'Windows Server 2019', value: 'Windows Server 2019' },
          { text: 'Windows Server 2016', value: 'Windows Server 2016' },
          { text: 'Windows Server 2012 R2', value: 'Windows Server 2012 R2' },
          { text: 'Windows Server 2012', value: 'Windows Server 2012' },
          { text: 'Windows Server 2008 R2', value: 'Windows Server 2008 R2' },
          { text: 'Windows Server 2008', value: 'Windows Server 2008' },
          { text: 'Windows 11', value: 'Windows 11' },
          { text: 'Windows 10', value: 'Windows 10' },
          { text: this.$t('compute.text_151'), value: 'Other' },
        ],
        Linux: [
          { text: 'CentOS', value: 'CentOS' },
          { text: 'CoreOS', value: 'CoreOS' },
          { text: 'Debian', value: 'Debian' },
          { text: 'Fedora', value: 'Fedora' },
          { text: 'Gentoo', value: 'Gentoo' },
          { text: 'OpenSUSE', value: 'OpenSUSE' },
          { text: 'RedHat', value: 'RedHat' },
          { text: 'SUSE Linux', value: 'SUSE Linux' },
          { text: 'Ubuntu', value: 'Ubuntu' },
          { text: 'Anolis', value: 'Anolis' },
          { text: 'Rocky Linux', value: 'Rocky' },
          { text: this.$t('compute.os.kylin'), value: 'Kylin' },
          { text: this.$t('compute.os.nfs'), value: 'nfs' },
          { text: this.$t('compute.text_151'), value: 'Other' },
        ],
        Other: [
          { text: this.$t('compute.text_151'), value: 'Other' },
        ],
      },
      osNewDisOptions: [
        { text: 'CentOS', value: 'CentOS' },
        { text: 'CoreOS', value: 'CoreOS' },
        { text: 'Debian', value: 'Debian' },
        { text: 'Fedora', value: 'Fedora' },
        { text: 'Gentoo', value: 'Gentoo' },
        { text: 'OpenSUSE', value: 'OpenSUSE' },
        { text: 'RedHat', value: 'RedHat' },
        { text: 'SUSE Linux', value: 'SUSE Linux' },
        { text: 'Ubuntu', value: 'Ubuntu' },
        { text: 'OpenKylin', value: 'OpenKylin' },
        { text: 'OpenCloudOS', value: 'OpenCloudOS' },
        { text: 'AlmaLinux', value: 'AlmaLinux' },
        { text: 'UOSDesktop', value: 'UOSDesktop' },
        { text: 'OpenEuler', value: 'OpenEuler' },
        { text: 'Anolis', value: 'Anolis' },
        { text: 'Rocky Linux', value: 'Rocky' },
        { text: this.$t('compute.os.kylin'), value: 'Kylin' },
        { text: this.$t('compute.os.neokylin'), value: 'NeoKylin' },
        { text: this.$t('compute.os.nfs'), value: 'nfs' },
        { text: this.$t('compute.text_151'), value: 'Other' },
      ],
      isDisOther: false,
      initName: '',
      diskDriverOptions: [
        { text: this.$t('compute.text_661'), value: '' },
        { text: 'virtio', value: 'virtio' },
        { text: 'scsi', value: 'scsi' },
        { text: 'pvscsi', value: 'pvscsi' },
        { text: 'ide', value: 'ide' },
        { text: 'sata', value: 'sata' },
      ],
      netDriverOptions: [
        { text: this.$t('compute.text_661'), value: '' },
        { text: 'virtio', value: 'virtio' },
        { text: 'e1000', value: 'e1000' },
        { text: 'vmxnet3', value: 'vmxnet3' },
      ],
      biosOptions: [
        { text: 'BIOS', value: 'BIOS' },
        { text: 'UEFI', value: 'UEFI' },
        { text: 'BIOS & UEFI', value: 'BIOS & UEFI' },
      ],
      vdiOptions: [
        { text: this.$t('compute.text_661'), value: '' },
        { text: 'VNC', value: 'vnc' },
        { text: 'SPICE', value: 'spice' },
      ],
      machineTypeOptions: [
        { text: this.$t('compute.text_661'), value: '' },
        { text: 'PC', value: 'pc' },
        { text: 'Q35', value: 'q35' },
      ],
      initMinDisk: 0,
    }
  },
  computed: {
    isHostImage () {
      return this.params.data[0].root_image
    },
  },
  created () {
    this.fetchData()
  },
  methods: {
    fetchData () {
      this.manager = new this.$Manager(this.isHostImage ? 'guestimages' : 'images', 'v1')
      this.manager.get({ id: this.params.data[0].id })
        .then((res) => {
          const { name, min_disk: minDisk } = res.data
          const { os_type: osType, os_distribution: osDistribution, disk_driver: diskDriver, net_driver: netDriver, uefi_support: uefiSupport, bios_support: biosSupport, vdi_protocol: vdiProtocol, machine_type: machineType, disable_usb_kbd: disableUsbKbd } = res.data.properties
          this.initName = name
          this.initMinDisk = minDisk
          this.$nextTick(() => {
            Object.assign(this.form, {
              name,
              minDisk: Math.round(minDisk / 1024),
              osType,
              osDistribution,
              diskDriver: diskDriver || '',
              netDriver: netDriver || '',
              bios: this.getBios(uefiSupport, biosSupport),
              vdi: vdiProtocol || 'vnc',
              machine_type: machineType || '',
              disable_usb_kbd: disableUsbKbd === 'true',
            })
          })
        })
    },
    getBios (uefiSupport, biosSupport) {
      if (uefiSupport === 'true' && biosSupport === 'true') {
        return 'BIOS & UEFI'
      } else if (uefiSupport === 'true' && biosSupport !== 'true') {
        return 'UEFI'
      }
      return 'BIOS'
    },
    checkTemplateName (rule, value, callback) {
      return new this.$Manager(this.isHostImage ? 'guestimages' : 'images', 'v1').list({
        params: {
          name: value,
        },
      }).then(res => {
        const data = res.data.data
        if (!R.isNil(data) && !R.isEmpty(data)) {
          if (data[0].name === this.initName) {
            callback()
          } else {
            callback(new Error(this.$t('compute.text_662')))
          }
        } else {
          callback()
        }
      })
    },
    osArchChangeHandle (e) {
      this.form.os_arch = e
      this.isArm = (e === HOST_CPU_ARCHS.arm.key)
      this.$nextTick(() => {
        this.form.bios = 'UEFI'
      })
    },
    osTypeChangeHandle (e) {
      const v = e.target.value
      this.osNewDisOptions = this.osDistributionOptions[v]
      if (v === 'Other') {
        this.form.osDistribution = 'Other'
        this.isDisOther = true
      } else {
        this.form.osDistribution = this.osNewDisOptions[0].value
        this.isDisOther = false
        this.osDistributionChange(this.osNewDisOptions[0].value)
      }
    },
    osDistributionChange (e) {
      if (e === 'Other') {
        this.isDisOther = true
      } else {
        this.isDisOther = false
        if (e.startsWith('Windows')) {
          let minDisk = 40
          if (e === 'Windows 11') {
            minDisk = 60
          }
          if (this.form.minDisk < minDisk) {
            this.form.minDisk = minDisk
          }
        }
      }
    },
    doEdit (data) {
      return new this.$Manager(this.isHostImage ? 'guestimages' : 'images', 'v1').update({
        id: this.params.data[0].id,
        data,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { name, osType, osDistribution, osOtherDistribution, minDisk, diskDriver, netDriver, os_arch, bios, vdi, machine_type, disable_usb_kbd } = this.form
        const params = {
          name,
          os_arch,
          properties: {
            os_type: osType,
            os_distribution: this.isDisOther ? osOtherDistribution : osDistribution,
            disk_driver: diskDriver,
            net_driver: netDriver,
            os_arch,
            vdi_protocol: vdi,
            machine_type,
            disable_usb_kbd: disable_usb_kbd ? 'true' : 'false',
          },
        }
        if (!this.isHostImage) {
          params['min-disk'] = minDisk * 1024
          if (params['min-disk'] === 0) {
            params['min-disk'] = this.initMinDisk
          }
        }
        if (bios === 'UEFI') {
          params.properties.uefi_support = 'true'
          params.properties.bios_support = 'false'
        } else if (bios === 'BIOS') {
          params.properties.uefi_support = 'false'
          params.properties.bios_support = 'true'
        } else if (bios === 'BIOS & UEFI') {
          params.properties.uefi_support = 'true'
          params.properties.bios_support = 'true'
        }
        await this.doEdit(params)
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
