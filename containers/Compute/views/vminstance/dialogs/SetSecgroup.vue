<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{$t('compute.text_1116')}}</template>
    <template #body>
      <a-alert class="mb-2" type="warning" :message="message" />
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_1116')" />
      <dialog-table v-if="params.columns && params.columns.length > 0" :data="params.data" :columns="(params.columns || []).slice(0, 3)" />
      <loader loading v-if="!(bindedSecgroupsLoaded && secgroupsInitLoaded)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark v-show="bindedSecgroupsLoaded && secgroupsInitLoaded" v-bind="formItemLayout">
        <a-form-model-item v-if="params.type === 'vminstance'" :label="$t('compute.nic')" :extra="$t('compute.nic_empty_secgroups_tip')" prop="nic">
          <base-select
            class="w-100"
            v-model:value="form.nic"
            :options="nicOptions"
            :select-props="{ allowClear: true, placeholder: $t('compute.text_193') }"
            @change="handleNicChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_105')" prop="secgroups">
          <template #extra>{{$t('compute.text_1242', [max])}}
            <dialog-trigger :vm="params.vm" :extParams="{ tenant, domain }" :name="$t('compute.text_189')" value="CreateSecgroupDialog" resource="secgroups" @success="successCallback" />
          </template>
          <base-select
            ref="secgroupRef"
            class="w-100"
            remote
            show-sync
            v-model:value="form.secgroups"
            resource="secgroups"
            v-model:resList="secgroupOptions"
            :mapper="mapperSecgroups"
            :params="secgroupsParams"
            v-model:initLoaded="secgroupsInitLoaded"
            :select-props="{ allowClear: true, placeholder: $t('compute.text_190'), mode: 'multiple' }" />
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import * as R from 'ramda'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { HYPERVISORS_MAP, isUcloudLikeProvider } from '@/constants'
import { SECGROUP_LIST_FOR_VMINSTANCE_SIDEPAGE_REFRESH } from '@/constants/event-bus'

export default {
  name: 'VmSetSecgroupDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const validateSecgroups = (rule, value, callback) => {
      const maxError = this.isBindOne ? this.$t('compute.text_1243') : this.$t('compute.text_1244')
      const minError = this.$t('compute.text_192')
      const max = this.isBindOne ? 1 : 5
      if (value.length > max) {
        return callback(maxError)
      }
      if (this.params.type === 'vminstance' && this.form.nic) {
        return callback()
      }
      if (value.length < 1) {
        return callback(minError)
      }
      return callback()
    }

    return {
      loading: false,
      form: {
        nic: null,
        secgroups: this.params.data[0].secgroups && this.params.data[0].secgroups.map(item => item.id),
      },
      rules: {
        nic: [
          { required: false, message: this.$t('compute.text_193') },
        ],
        secgroups: [
          { validator: validateSecgroups, trigger: 'change' },
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
      secgroupsInitLoaded: false,
      bindedSecgroups: [],
      bindedSecgroupsLoaded: false,
      secgroupOptions: [],
      nicOptions: [],
    }
  },
  computed: {
    selectedNic () {
      if (!this.form.nic) return null
      return this.nicOptions.find(item => item.value === this.form.nic)
    },
    ...mapGetters(['isAdminMode', 'scope']),
    isAzure () {
      return this.params.data[0].provider === HYPERVISORS_MAP.azure.provider
    },
    isUCloud () {
      return isUcloudLikeProvider(this.params.data[0].provider)
    },
    isZStack () {
      return this.params.data[0].provider === HYPERVISORS_MAP.zstack.provider
    },
    isBindOne () {
      return this.isAzure || this.isUCloud || this.isZStack
    },
    message () {
      let str = this.$t('compute.text_1245')
      if (this.isBindOne) {
        str = this.$t('compute.text_1246')
      }
      return str
    },
    href () {
      const url = this.$router.resolve('/secgroup')
      return url.href
    },
    max () {
      if (this.isBindOne) {
        return 1
      }
      return 5
    },
    domain () {
      return this.params.data[0].domain_id
    },
    tenant () {
      return this.params.data[0].tenant_id
    },
    secgroupsParams () {
      const params = { limit: 20 }
      if (this.isAdminMode) {
        params.project_domain = this.params.data[0].domain_id
      } else {
        params.scope = this.scope
      }
      if (this.params.data[0] && this.params.data[0].vpc_id) {
        params.vpc_id = this.params.data[0].vpc_id.split(',')[0]
      }
      return params
    },
  },
  created () {
    this.initNicOptions()
    this.fetchBindedSecgroups()
  },
  methods: {
    initNicOptions () {
      const nics = this.params.data[0].nics || []
      this.nicOptions = nics.map(nic => {
        const label = `${this.$t('compute.text_193')}${nic.index} (${nic.ip_addr || nic.mac})`
        return {
          label,
          value: nic.mac,
          ...nic,
        }
      })
    },
    async handleNicChange (value) {
      this.form.nic = value
      this.form.secgroups = []
      await this.$nextTick()
      await this.fetchBindedSecgroups()
      if (this.$refs.secgroupRef) {
        await this.$refs.secgroupRef.loadOpts()
      }
      await this.$nextTick()
      if (this.selectedNic) {
        const bindedSecgroupIds = this.getBindedSecgroupIds()
        if (bindedSecgroupIds.length > 0) {
          this.form.secgroups = bindedSecgroupIds
        }
      } else {
        const defaultSecgroupIds = this.params.data[0].secgroups && this.params.data[0].secgroups.map(item => item.id)
        if (defaultSecgroupIds && defaultSecgroupIds.length > 0) {
          this.form.secgroups = defaultSecgroupIds
        }
      }
    },
    getBindedSecgroupIds () {
      if (!this.selectedNic) {
        return []
      }
      const selectedMac = this.selectedNic.value
      const networkSecgroups = this.params.data[0].network_secgroups || []
      const currentNicSecgroup = networkSecgroups.find(item => item.mac === selectedMac)
      if (currentNicSecgroup && currentNicSecgroup.secgroups) {
        return currentNicSecgroup.secgroups.map(item => item.id)
      }
      return []
    },
    mapperSecgroups (data) {
      let newData = [...data, ...this.bindedSecgroups]
      newData = R.uniqBy(item => item.id, newData)
      return newData
    },
    async fetchBindedSecgroups () {
      let bindedSecgroupIds = []
      if (this.selectedNic) {
        bindedSecgroupIds = this.getBindedSecgroupIds()
      } else {
        bindedSecgroupIds = this.params.data[0].secgroups ? this.params.data[0].secgroups.map(item => item.id) : []
      }

      if (bindedSecgroupIds.length > 0) {
        const manager = new this.$Manager('secgroups')
        try {
          const { data: { data = [] } } = await manager.list({
            params: {
              scope: this.scope,
              filter: `id.in(${bindedSecgroupIds.join(',')})`,
            },
          })
          this.bindedSecgroups = data
        } catch (error) {
          console.error('Failed to fetch secgroups:', error)
          this.bindedSecgroups = []
        }
      } else {
        this.bindedSecgroups = []
      }

      this.form.secgroups = bindedSecgroupIds
      this.bindedSecgroupsLoaded = true
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const manager = new this.$Manager('servers')
        if (this.selectedNic) {
          const data = {
            network_index: this.selectedNic.index,
            guest: this.params.data[0].id,
            secgroup_ids: this.form.secgroups,
          }
          await manager.performAction({
            id: this.params.data[0].id,
            action: 'set-network-secgroup',
            data,
          })
        } else {
          const ids = this.params.data.map(item => item.id)
          const data = {
            secgroup_ids: this.form.secgroups,
          }
          await manager.batchPerformAction({
            ids,
            action: 'set-secgroup',
            data,
          })
        }
        this.params.refresh && this.params.refresh()
        this.$bus.$emit(SECGROUP_LIST_FOR_VMINSTANCE_SIDEPAGE_REFRESH)
        this.cancelDialog()
        this.$message.success(this.$t('common_360'))
      } finally {
        this.loading = false
      }
    },
    async successCallback () {
      await this.$refs.secgroupRef.loadOpts()
      const newSecgroup = this.secgroupOptions[0]
      this.form.secgroups = [...(this.form.secgroups || []), newSecgroup.id]
    },
  },
}
</script>
