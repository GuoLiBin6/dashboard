<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{ title }}</template>
    <template #body>
      <dialog-selected-tips :name="$t('dictionary.network')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <!-- ocLayoutForm 下勿再绑 offset；空 label 行会自动占同一 label 宽 -->
      <a-form-model ref="formRef" :model="form" class="mt-3" hideRequiredMark>
        <a-form-model-item
          v-for="(row, index) in form.rows"
          :key="row.key"
          :colon="false"
          :label="index === 0 ? `${$t('network.mac_ip.mapping_table')}：` : undefined"
          :class="{ 'oc-form-item-follow-label': index !== 0 }">
          <a-row :gutter="8" type="flex" align="middle">
            <a-col :span="11">
              <a-form-model-item
                class="mb-0"
                :prop="['rows', index, 'ip']"
                :rules="rules.ip"
                :validate-first="true">
                <a-input v-model:value="row.ip" :placeholder="$t('network.text_217')" />
              </a-form-model-item>
            </a-col>
            <a-col :span="11">
              <a-form-model-item
                class="mb-0"
                :prop="['rows', index, 'mac']"
                :rules="rules.mac"
                :validate-first="true">
                <a-input v-model:value="row.mac" :placeholder="$t('common.tips.input', [$t('network.text_228')])" />
              </a-form-model-item>
            </a-col>
            <a-col :span="2" v-show="!isEdit" class="text-right">
              <a-button v-if="index === 0" type="primary" shape="circle" size="small" @click="add">
                <template #icon><icon type="plus" /></template>
              </a-button>
              <a-button v-else shape="circle" size="small" @click="remove(row.key)">
                <template #icon><icon type="minus" /></template>
              </a-button>
            </a-col>
          </a-row>
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
import { h } from 'vue'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { Manager } from '@/utils/manager'

let id = 0

const buildInitialRows = (params) => {
  const editData = params?.editData
  if (editData?.length) {
    return editData.map((item, i) => ({
      key: i,
      ip: item.ip_addr || undefined,
      mac: item.mac_addr || undefined,
    }))
  }
  return [{ key: 0, ip: undefined, mac: undefined }]
}

export default {
  name: 'NetworkIpMacsCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const rows = buildInitialRows(this.params)
    id = rows.reduce((max, row) => Math.max(max, row.key), 0)
    return {
      loading: false,
      form: {
        rows,
      },
      rules: {
        ip: [
          { required: true, message: this.$t('network.text_217') },
          { validator: this.$validate('IPv4') },
        ],
        mac: [
          { required: true, message: this.$t('common.tips.input', [this.$t('network.text_228')]) },
          { validator: this.$validate('mac') },
        ],
      },
      columns: [
        {
          field: 'name',
          title: this.$t('common.name'),
        },
        {
          field: 'vpc',
          title: 'VPC',
        },
        {
          field: 'guest_ip_start',
          title: this.$t('network.text_213'),
          width: 180,
          slots: {
            default: ({ row }) => {
              return [
                h('div', {}, this.$t('network.ip.start', [row.guest_ip_start, row.guest_ip_mask])),
                h('div', {}, this.$t('network.ip.end', [row.guest_ip_end, row.guest_ip_mask])),
              ]
            },
          },
        },
        {
          field: 'guest_ip6_start',
          title: this.$t('network.ipv6.address'),
          width: 180,
          slots: {
            default: ({ row }) => {
              if (!row.guest_ip6_start || !row.guest_ip6_end) {
                return '-'
              }
              return [
                h('div', {}, this.$t('network.ip.start', [row.guest_ip6_start, row.guest_ip6_mask])),
                h('div', {}, this.$t('network.ip.end', [row.guest_ip6_end, row.guest_ip6_mask])),
              ]
            },
          },
        },
      ],
    }
  },
  computed: {
    isEdit () {
      return this.params.editData
    },
    title () {
      return this.isEdit ? this.$t('common.edit') : this.$t('common.create')
    },
    action () {
      return this.isEdit ? this.$t('network.mac_ip.edit_mapping_table') : this.$t('network.mac_ip.create_mapping_table')
    },
  },
  methods: {
    generateValues () {
      const data = {
        network_id: this.params.data[0].id,
      }
      const ip_mac = {}
      this.form.rows.forEach(row => {
        ip_mac[`${row.ip}`] = row.mac
      })
      data.ip_mac = ip_mac
      return data
    },
    async doCreate () {
      const manager = new Manager('network_ip_macs/batch-create')
      const data = this.generateValues()
      await manager.create({ data })
    },
    async doUpdate () {
      const manager = new Manager('network_ip_macs')
      const row = this.form.rows[0]
      const data = {
        ip_addr: row.ip,
        mac_addr: row.mac,
      }
      await manager.update({
        id: this.params.editData[0].id,
        data,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        this.isEdit ? await this.doUpdate() : await this.doCreate()
        this.$message.success(this.$t('common.success'))
        this.params.ok && this.params.ok()
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    add () {
      const nextKey = ++id
      this.form.rows.push({ key: nextKey, ip: undefined, mac: undefined })
    },
    remove (k) {
      if (this.form.rows.length === 1) {
        return
      }
      this.form.rows = this.form.rows.filter(row => row.key !== k)
    },
  },
}
</script>
