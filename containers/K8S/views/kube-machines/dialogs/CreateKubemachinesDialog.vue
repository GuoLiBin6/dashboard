<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('k8s.create')}}</div>
    <div slot="body">
      <a-alert :showIcon="false" banner class="mt-2">
        <template #message>
          <div>
            <p>{{$t('k8s.text_147')}}</p>
            <p>{{$t('k8s.text_148')}}</p>
          </div>
        </template>
      </a-alert>
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form.fd">
        <a-form-model-item :label="$t('k8s.text_152')">
          <server-config
            ref="serverConfigRef"
            :networkParams="networkParams"
            :form="form"
            :model="form.fd"
            :cloudregionId="params.data.cloudregion_id"
            :hypervisor="hypervisor"
            :platform="platform"
            @vmAdd="vmAdd">
            <template v-slot:hypervisor="slotProps">
              <a-form-model-item :label="$t('k8s.platform')" v-if="hypervisorsC.length">
                <a-radio-group
                  :value="(form.fd.hypervisors && form.fd.hypervisors[slotProps.i]) || hypervisor"
                  @change="e => onHypervisorChange(slotProps.i, e.target.value)">
                  <a-radio-button v-for="item in hypervisorsC" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </a-radio-button>
                </a-radio-group>
              </a-form-model-item>
            </template>
          </server-config>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{$t('common.create')}}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import _ from 'lodash'
import { mapGetters } from 'vuex'
import ServerConfig from '@K8S/sections/serverConfig'
import { hyperOpts } from '@K8S/views/cluster/constants'
import { HYPERVISORS_MAP } from '@/constants'
import { expandBracketFd, setBracketValue } from '@/utils/bracketModel'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { typeClouds, findPlatform } from '@/utils/common/hypervisor'

export default {
  name: 'CreateKubemachinesDialog',
  components: {
    ServerConfig,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const hypervisor = _.get(typeClouds.providerlowcaseMap, `[${this.params.data.provider}].hypervisor`) || 'kvm'
    return {
      loading: false,
      hypervisor,
      form: {
        fi: {
          capability: {},
          clusterHypervisor: hypervisor, // 该集群的默认 hypervisor
        },
        fd: {
          hypervisor,
        },
      },
      param: {
        zone: {
          usable: true,
          show_emulated: true,
          order_by: 'created_at',
          order: 'asc',
          scope: this.scope,
        },
        region: {
          usable: true,
          scope: this.scope,
          cloud_env: 'onpremise',
        },
        network: {},
        k8sVersions: {
          provider: this.hypervisor,
          resource_type: 'guest',
        },
      },
    }
  },
  provide () {
    return {
      form: this.form,
    }
  },
  computed: {
    ...mapGetters(['scope']),
    hypervisorsC () {
      const opts = hyperOpts.filter(item => {
        return (_.get(this.form.fi, 'capability.hypervisors') || []).find(val => val === item.value.toLowerCase())
      })
      return opts
    },
    networkParams () {
      return {
        vpc: this.params.data.vpc_id,
        filter: 'server_type.notin(ipmi, pxe)',
        scope: this.scope,
      }
    },
    platform () {
      return findPlatform(this.form.fd.hypervisor, 'hypervisor')
    },
  },
  methods: {
    onHypervisorChange (i, val) {
      setBracketValue(this, this.form.fd, `hypervisors[${i}]`, val)
    },
    validator (type) {
      return (rule, value, _callback) => {
        if (type === 'vcpu_count') {
          if (value < 4 || value > 32) {
            return _callback(this.$t('k8s.text_172'))
          }
        } else if (type === 'vmem_size') {
          if (value < 4 || value > 128) {
            return _callback(this.$t('k8s.text_173'))
          }
        } else if (type === 'disk') {
          if (value < 1 || value > 128) {
            return _callback(this.$t('k8s.text_174'))
          }
        }
        return _callback()
      }
    },
    doCreate (data) {
      return new this.$Manager('kubeclusters', 'v1').performAction({
        id: this.params.data.id,
        action: 'add-machines',
        data,
      })
    },
    genData (data) {
      const values = {
        machines: [],
      }
      Object.keys(data.sku).map(key => {
        const disks = [{
          index: 0,
          size: data.systemDiskSize[key] * 1024,
          backend: data.systemDiskType[key].key,
        }]
        if (data.systemDiskSchedtag) {
          if (data.systemDiskSchedtag[key] && data.systemDiskPolicy[key]) {
            disks[0].schedtags = [{ id: data.systemDiskSchedtag[key], strategy: data.systemDiskPolicy[key] }]
          }
        }
        if (this.hypervisor === HYPERVISORS_MAP.kvm.key || this.hypervisor === HYPERVISORS_MAP.cloudpods.key) {
          const backend = disks[0].backend
          disks[0].backend = backend.split('/')[0]
          disks[0].medium = backend.split('/')[1]
        }
        if (data.image && data.image[key]) {
          disks[0].image_id = data.image[key].key
        }
        const machinesItem = {
          vm: {
            /*
             * vcpu_count: data.vcpu_count[key],
             * vmem_size: data.vmem_size[key] * 1024,
             */
            instance_type: data.sku[key].name,
            hypervisor: this.hypervisor,
            disks,
            nets: [{ network: data.network[key] }],
          },
        }
        if (data.ip && data.ip[key]) machinesItem.vm.nets[0].address = data.ip[key]
        if (data.num[key] > 1) {
          for (let i = 0; i < data.num[key]; i++) {
            values.machines.push({ config: machinesItem, role: data.role[key], resource_type: 'vm' })
          }
        } else {
          values.machines.push({ config: machinesItem, role: data.role[key], resource_type: 'vm' })
        }
      })
      return values
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (this.$refs.formRef) {
          await this.$refs.formRef.validate()
        }
        if (typeof this.$refs.serverConfigRef?.validate === 'function') {
          await this.$refs.serverConfigRef.validate()
        }
        const values = expandBracketFd(this.form.fd)
        const genValues = this.genData(values)
        await this.doCreate(genValues)
        this.loading = false
        this.$message.success(this.$t('k8s.text_281'))
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    async fetchCapability (id, resource) {
      const params = {
        show_emulated: true,
        resource_type: 'shared',
        scope: this.scope,
      }
      const capabilityParams = { id, spec: 'capability', params }
      if (!id) return
      this.capabilityParams = capabilityParams
      try {
        const { data } = await new this.$Manager(`${resource}s`).getSpecific(this.capabilityParams)
        this.form.fi.capability = data
        await this.$nextTick()
        if (this.hypervisorsC.length) {
          const hasDefaultHypervisor = this.hypervisorsC.find(val => val.value === this.form.fi.clusterHypervisor)
          if (!hasDefaultHypervisor) {
            const hypervisors = this.form.fd.hypervisors || {}
            Object.keys(hypervisors).forEach((key) => {
              setBracketValue(this, this.form.fd, `hypervisors[${key}]`, this.hypervisorsC[0].value)
            })
          }
        }
      } catch (error) {
        throw error
      }
    },
    vmAdd ({ key }) {
      if (this.hypervisorsC.length) {
        setBracketValue(this, this.form.fd, `hypervisors[${key}]`, this.hypervisorsC[0].value)
      }
    },
  },
}
</script>
