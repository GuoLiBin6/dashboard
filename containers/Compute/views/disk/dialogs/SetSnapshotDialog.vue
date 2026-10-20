<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.disk_perform_setup_snapshot_policy')}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning" :message="$t('compute.snapshotpolicy_bind_disk_tip')" />
      <dialog-selected-tips :count="params.data.length" :name="$t('dictionary.disk')" :action="$t('compute.disk_perform_setup_snapshot_policy')" />
      <dialog-table v-if="params.columns && params.columns.length" :data="params.data" :columns="[...params.columns.slice(0, 3), { field: 'guest_snapshotpolicy_count', title: $t('compute.guest_snapshotpolicy_count'), formatter: ({ row }) => { return row.guest_snapshotpolicy_count || 0 } }]" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('compute.text_427')" prop="isOpen">
          <a-switch v-model:checked="form.isOpen" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" @change="onOpenChange" />
        </a-form-model-item>
        <template v-if="form.isOpen">
          <a-form-model-item :label="$t('compute.text_428')" prop="snapshotpolicy">
            <a-row :gutter="8">
              <a-col :span="12">
                <a-select v-model:value="form.snapshotpolicy" :filterOption="filterOption" showSearch @change="assembly">
                  <a-select-option v-for="item in snapshotpolicyOptions" :key="item.id" :value="item.id">
                    {{getPolicyLabel(item)}}
                  </a-select-option>
                </a-select>
              </a-col>
              <a-col :span="12">
                <icon type="sync" class="mr-1" @click="refresh" />
                <dialog-trigger :vm="params.vm" :extParams="{ tenant, domain, types: ['disk'] }" :name="$t('compute.text_430')" value="CreateSnapshotPolicyDialog" resource="snapshotpolicies" @success="successCallback" />
              </a-col>
            </a-row>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_431')">
            <span class="ant-form-text">
              {{ weekTips }}
            </span>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_432')">
            <span class="ant-form-text">
              {{ timeTips }}
            </span>
          </a-form-model-item>
          <a-form-model-item :label="$t('compute.text_433')">
            <span class="ant-form-text">
              {{ dayTips }}
            </span>
          </a-form-model-item>
        </template>
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
import { weekOptions, timeOptions } from '../../../constants'

export default {
  name: 'DiskSetSnapshotDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const hasPolicy = this.params.data[0].snapshotpolicies && this.params.data[0].snapshotpolicies.length > 0
    return {
      loading: false,
      scope: this.$store.getters.scope,
      form: {
        isOpen: hasPolicy,
        snapshotpolicy: hasPolicy ? this.params.data[0].snapshotpolicies[0].id : '',
      },
      rules: {
        snapshotpolicy: [
          { required: true },
        ],
      },
      snapshotpolicyOptions: [],
      attchedPolices: hasPolicy ? this.params.data[0].snapshotpolicies : [],
      weekTips: '',
      timeTips: '',
      dayTips: '',
    }
  },
  computed: {
    domain () {
      return this.params.data[0].domain_id
    },
    tenant () {
      return this.params.data[0].tenant_id
    },
  },
  created () {
    this.fetchSnaphotpolicy().then(() => {
      if (this.params.data[0].snapshotpolicies && this.params.data[0].snapshotpolicies.length) {
        this.assembly(this.params.data[0].snapshotpolicies[0].id)
      }
    })
    this.manager = new this.$Manager('snapshotpolicies')
  },
  methods: {
    onOpenChange (checked) {
      if (checked === true && this.snapshotpolicyOptions.length) {
        this.$nextTick(() => {
          this.form.snapshotpolicy = this.snapshotpolicyOptions[0].id
          this.assembly(this.form.snapshotpolicy)
        })
      }
    },
    refresh () {
      this.fetchSnaphotpolicy()
    },
    detachPolicy (id) {
      return this.params.onManager('batchPerformAction', {
        id: this.params.data.map(item => item.id),
        steadyStatus: 'ready',
        managerArgs: {
          action: 'unbind-snapshotpolicy',
          data: {
            snapshotpolicy_id: id,
          },
        },
      })
    },
    detachPolices () {
      const promiseArr = this.attchedPolices.map(item => {
        return this.detachPolicy(item.id)
      })
      return Promise.all(promiseArr)
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (this.form.isOpen) {
          await this.$refs.formRef.validate()
          await this.detachPolices()
          await this.params.onManager('performAction', {
            id: this.params.data[0].id,
            steadyStatus: 'ready',
            managerArgs: {
              action: 'set-snapshotpolicy',
              data: {
                snapshotpolicy_id: this.form.snapshotpolicy,
              },
            },
          })
        } else if (this.attchedPolices.length) {
          await this.detachPolices()
        }
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    getPolicyLabel (item) {
      let text = item.name
      if (item.repeat_weekdays && item.repeat_weekdays.length) {
        text += this.$t('compute.text_434') + item.repeat_weekdays.map(item => weekOptions[item - 1]).join('、')
      }
      if (item.time_points && item.time_points.length) {
        text += '，' + item.time_points.map(item => timeOptions[item]).join('、')
      }
      if (item.retention_days === -1) {
        text += this.$t('compute.text_435')
      } else if (item.retention_days) {
        text += this.$t('compute.text_436', [item.retention_days])
      }
      if (text.length > 24) {
        return text.substring(0, 24) + '...'
      }
      return text
    },
    async fetchSnaphotpolicy () {
      const manager = new this.$Manager('snapshotpolicies')
      const params = {
        scope: this.scope,
        type: 'disk',
      }
      if (this.params.data[0].manager_id) {
        params.manager_id = this.params.data[0].manager_id
      }
      if (this.params.data[0].cloud_env) {
        params.cloud_env = this.params.data[0].cloud_env
      }
      try {
        const res = await manager.list({ params })
        const data = res.data.data
        if (data && data.length) {
          this.snapshotpolicyOptions = data.filter((item) => {
            return item.status === 'available'
          })
        }
      } catch (error) {}
    },
    assembly (id) {
      const snapshotpolicyObj = R.indexBy(R.prop('id'), this.snapshotpolicyOptions)
      const selectItem = snapshotpolicyObj[id]
      if (!selectItem) return
      this.weekTips = (
        selectItem.repeat_weekdays &&
        selectItem.repeat_weekdays.map(item => weekOptions[item - 1]).join('、')
      ) || '-'
      this.timeTips = (
        selectItem.time_points &&
        selectItem.time_points.map(item => timeOptions[item]).join('、')
      ) || '-'
      let ret = '-'
      if (selectItem.retention_count) {
        ret = `${this.$t('compute.retention_count_prefix')} ${selectItem.retention_count} ${this.$t('compute.retention_count_suffix')}`
      } else if (selectItem.retention_days === -1) {
        ret = this.$t('compute.text_437')
      } else if (selectItem.retention_days) {
        ret = this.$t('compute.text_438', [selectItem.retention_days])
      }
      this.dayTips = ret
    },
    async successCallback () {
      await this.fetchSnaphotpolicy()
      if (this.snapshotpolicyOptions.length) {
        this.form.snapshotpolicy = this.snapshotpolicyOptions[0].id
        this.assembly(this.form.snapshotpolicy)
      }
    },
    filterOption (input, option) {
      const label = option.children?.[0]?.children || option.label || ''
      return String(label).toLowerCase().indexOf(input.toLowerCase()) >= 0
    },
  },
}
</script>
