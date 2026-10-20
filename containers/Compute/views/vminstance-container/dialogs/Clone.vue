<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_359')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server_container')" :count="params.data.length" :action="$t('compute.text_359')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form.fd" :rules="rules" hideRequiredMark>
        <a-form-model-item :label="$t('compute.text_228')" prop="name">
          <a-input v-model:value="form.fd.name" @change="e => { form.fi.generate_name = e.target.value }" />
          <template #extra>
            <name-repeated
              res="servers"
              :name="form.fi.generate_name"
              :default-text="$t('compute.text_893')" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_294')" prop="__count__">
          <a-input-number v-model:value="form.fd.__count__" :min="1" :max="10" :step="1" :parser="Math.round" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1041')" v-if="isOpenWorkflow" prop="reason">
          <a-input v-model:value="form.fd.reason" :placeholder="$t('compute.text_1105')" />
        </a-form-model-item>
      </a-form-model>
      <!-- OsSelect end-state（:model + validate），公有云克隆时单独挂载 -->
      <div v-if="isPublic">
        <a-form-model-item :label="$t('compute.text_267')">
          <os-select
            ref="osSelectRef"
            :type="type"
            :form="form"
            :model="form.fd"
            :types="osTypes"
            :osType="osType"
            :hypervisor="firstData.hypervisor"
            :image-params="imageParams"
            :cache-image-params="cacheImageParams"
            :cloudproviderParamsExtra="cloudproviderParamsExtra" />
        </a-form-model-item>
      </div>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ confirmText }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import * as R from 'ramda'
import _ from 'lodash'
import { mapGetters } from 'vuex'
import { SERVER_TYPE } from '@Compute/constants'
import OsSelect from '@Compute/sections/OsSelect'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import WorkflowMixin from '@/mixins/workflow'
import { findPlatform } from '@/utils/common/hypervisor'
import { IMAGES_TYPE_MAP } from '@/constants/compute'
import NameRepeated from '@/sections/NameRepeated'
import { HYPERVISORS_MAP } from '@/constants'

export default {
  name: 'VmContainerCloneDialog',
  components: {
    OsSelect,
    NameRepeated,
  },
  mixins: [DialogMixin, WindowsMixin, WorkflowMixin],
  provide () {
    return {
      form: this.form,
    }
  },
  data () {
    return {
      loading: false,
      form: {
        fi: {
          generate_name: '',
          imageType: IMAGES_TYPE_MAP.public.key,
        },
        fd: {
          name: undefined,
          __count__: 1,
          reason: '',
          imageType: IMAGES_TYPE_MAP.public.key,
        },
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_210') },
        ],
        __count__: [
          { required: true, message: this.$t('compute.text_1195') },
        ],
      },
      servers: [],
      createParams: {},
      specificationList: [],
      cloudproviderParamsExtra: {
        provider: _.get(this.params, 'data[0].provider'),
      },
    }
  },
  computed: {
    ...mapGetters(['scope', 'isAdminMode', 'userInfo']),
    firstData () {
      return this.params.data[0]
    },
    type () {
      return findPlatform(this.firstData.hypervisor)
    },
    isPublic () {
      return this.type === SERVER_TYPE.public
    },
    imageParams () {
      const params = {
        status: 'active',
        details: true,
        limit: 0,
        'filter.0': 'disk_format.notin(iso,tgz)',
        scope: this.scope,
        is_standard: true,
      }
      if (this.form.fi.imageType === IMAGES_TYPE_MAP.standard.key) {
        return params
      }
      if (this.form.fi.imageType === IMAGES_TYPE_MAP.customize.key) {
        params.is_standard = false
        return params
      }
      return params
    },
    cacheImageParams () {
      const params = {
        details: false,
        order_by: 'ref_count',
        order: 'desc',
        zone: this.firstData.zone_id,
      }
      return params
    },
    osType () {
      return this.params.data[0].os_type
    },
    osTypes () {
      if (HYPERVISORS_MAP.ctyun.key === this.firstData.hypervisor) {
        return ['public', 'public_customize']
      }
      return []
    },
    isOpenWorkflow () {
      return this.checkWorkflowEnabled(this.WORKFLOW_TYPES.APPLY_MACHINE)
    },
    confirmText () {
      return this.isOpenWorkflow ? this.$t('compute.text_288') : this.$t('dialog.ok')
    },
  },
  created () {
    this.manager = new this.$Manager('servers')
    this.fetchServerCreateParams()
    if (this.params.type === 'baremetal') {
      this.fetchHosts()
    }
  },
  methods: {
    async fetchServerCreateParams () {
      const params = {
        id: this.firstData.id,
        spec: 'create-params',
      }
      try {
        const response = await this.manager.getSpecific(params)
        const data = response.data || {}
        this.createParams = data
      } catch (error) {
        throw error
      }
    },
    async fetchHosts () {
      new this.$Manager('hosts').list({
        params: {
          enabled: 1,
          usable: true,
          is_empty: true,
          host_type: 'baremetal',
          scope: this.$store.getters.scope,
        },
      }).then(({ data = {} }) => {
        if (data.data.length) {
          this.specificationList = data.data
        }
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        if (this.isPublic && typeof this.$refs.osSelectRef?.validate === 'function') {
          await this.$refs.osSelectRef.validate()
        }
        const values = { ...this.form.fd }
        const data = this.genCloneData(values)
        if (this.params.type === 'baremetal') {
          if (this.specificationList.length) {
            this.$message.warning(this.$t('compute.text_1196'))
            return
          } else {
            const specificationItem = this.specificationList.filter(item => { return item.id === data.host_id })
            if (R.isEmpty(specificationItem.spec) || R.isNil(specificationItem.spec)) {
              this.$message.warning(this.$t('compute.text_1197'))
              return
            }
          }
        }
        const schedulerManager = new this.$Manager('schedulers', 'v1')
        const schedulerReponse = await schedulerManager.rpc({
          methodname: 'DoForecast',
          params: data,
        })
        if (!schedulerReponse.data.can_create) {
          this.$message.warning(this.$t('compute.text_1198'))
          return
        }
        if (this.isOpenWorkflow) {
          const variables = {
            project: this.params.data[0].tenant_id,
            project_domain: this.params.data[0].domain_id,
            process_definition_key: this.WORKFLOW_TYPES.APPLY_MACHINE,
            initiator: this.userInfo.id,
            'server-create-paramter': JSON.stringify(data),
            description: values.reason,
          }
          await this.createWorkflow(variables)
          this.$message.success(this.$t('compute.text_1045', [data.name]))
          this.$router.push('/workflow')
        } else {
          await this.params.onManager('create', {
            managerArgs: {
              data,
            },
          })
        }
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
    genCloneData (fd) {
      const server = {
        ...this.generateCreateParams(this.createParams, fd),
        __count__: fd.__count__,
        name: fd.name,
        generate_name: fd.name,
      }
      const disks = this.createParams.disks
      if (disks && disks.length > 0) {
        disks.forEach((disk) => {
          if (disk.disk_type === 'data') {
            delete disk.image_id
          }
        })
      }
      delete server.eip
      if (this.isPublic) {
        server.disks[0].image_id = fd.image.key
        server.imageType = fd.imageType
        server.prefer_manager = fd.prefer_manager
      }
      return server
    },
    generateCreateParams (createParams, fd) {
      const delProps = ['domain', 'domain_id', 'project', 'project_domain', 'project_domain_id', 'project_id', 'tenant', 'tenant_id']
      delProps.forEach(v => {
        delete createParams[v]
      })
      createParams.project_id = this.params.data[0].tenant_id
      return createParams
    },
  },
}
</script>
