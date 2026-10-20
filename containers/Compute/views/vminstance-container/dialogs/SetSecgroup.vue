<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1116')}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning" :message="message" />
      <dialog-selected-tips :name="$t('dictionary.server_container')" :count="params.data.length" :action="$t('compute.text_1116')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <loader loading v-if="!(bindedSecgroupsLoaded && secgroupsInitLoaded)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark v-show="bindedSecgroupsLoaded && secgroupsInitLoaded">
        <a-form-model-item :label="$t('compute.text_105')" v-if="bindedSecgroupsLoaded" prop="secgroups">
          <div slot="extra">{{$t('compute.text_1242', [max])}}
            <dialog-trigger :vm="params.vm" :extParams="{ tenant, domain }" :name="$t('compute.text_189')" value="CreateSecgroupDialog" resource="secgroups" @success="successCallback" />
          </div>
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
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
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
  name: 'VmContainerSetSecgroupDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const validateSecgroups = (rule, value, callback) => {
      const maxError = this.isBindOne ? this.$t('compute.text_1243') : this.$t('compute.text_1244')
      const minError = this.$t('compute.text_192')
      const max = this.isBindOne ? 1 : 5
      if (value.length > max) {
        return callback(maxError)
      }
      if (value.length < 1) {
        return callback(minError)
      }
      return callback()
    }

    return {
      loading: false,
      form: {
        secgroups: this.params.data[0].secgroups && this.params.data[0].secgroups.map(item => item.id),
      },
      rules: {
        secgroups: [
          { validator: validateSecgroups, trigger: 'change' },
        ],
      },
      secgroupsInitLoaded: false,
      bindedSecgroups: [],
      bindedSecgroupsLoaded: false,
      secgroupOptions: [],
    }
  },
  computed: {
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
        params.vpc_id = this.params.data[0].vpc_id
      }
      return params
    },
  },
  created () {
    this.fetchBindedSecgroups()
  },
  methods: {
    mapperSecgroups (data) {
      let newData = [...data, ...this.bindedSecgroups]
      newData = R.uniqBy(item => item.id, newData)
      return newData
    },
    async fetchBindedSecgroups () {
      const manager = new this.$Manager('secgroups')
      try {
        const { data: { data = [] } } = await manager.list({
          params: {
            scope: this.scope,
            server: this.params.data[0].id,
          },
        })
        this.bindedSecgroups = data
        this.form.secgroups = data.map(item => item.id)
        this.bindedSecgroupsLoaded = true
      } catch (error) {
        throw error
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const ids = this.params.data.map(item => item.id)
        const data = {
          secgroup_ids: this.form.secgroups,
        }
        if (this.params.manager) {
          await this.params.manager.batchPerformAction({
            ids,
            action: 'set-secgroup',
            data,
          })
        } else {
          await this.params.onManager('batchPerformAction', {
            id: ids,
            managerArgs: {
              action: 'set-secgroup',
              data,
            },
          })
        }
        this.params.refresh && this.params.refresh()
        this.$bus.$emit(SECGROUP_LIST_FOR_VMINSTANCE_SIDEPAGE_REFRESH)
        this.cancelDialog()
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
