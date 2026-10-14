<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ title }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.network')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" class="mt-3" v-bind="formItemLayout" hideRequiredMark>
        <a-form-model-item
          v-for="(row, index) in form.rows"
          :key="row.key"
          v-bind="index === 0 ? formItemLayout : formItemLayoutWithOutLabel"
          :label="index === 0 ? $t('network.mac_ip.mapping_table') : ''"
          :required="false">
          <a-row :gutter="6">
            <a-col :span="11">
              <a-form-model-item
                :wrapperCol="{ span: 24 }"
                class="mb-0 mr-1"
                :prop="`rows.${index}.ip`"
                :rules="rules.ip">
                <a-input v-model:value="row.ip" :placeholder="$t('network.text_217')" />
              </a-form-model-item>
            </a-col>
            <a-col :span="11">
              <a-form-model-item
                :wrapperCol="{ span: 24 }"
                class="mb-0 mr-1"
                :prop="`rows.${index}.mac`"
                :rules="rules.mac">
                <a-input v-model:value="row.mac" :placeholder="$t('common.tips.input', [$t('network.text_228')])" />
              </a-form-model-item>
            </a-col>
            <a-col :span="2" v-show="!isEdit">
              <a-button v-if="index === 0" type="primary" shape="circle" icon="plus" size="small" @click="add" />
              <a-button v-else shape="circle" icon="minus" size="small" @click="remove(row.key)" />
            </a-col>
          </a-row>
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
          field: 'ip',
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
          field: 'ip',
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
      formItemLayout: {
        wrapperCol: {
          md: { span: 16 },
          xl: { span: 18 },
          xxl: { span: 20 },
        },
        labelCol: {
          md: { span: 8 },
          xl: { span: 6 },
          xxl: { span: 4 },
        },
      },
      formItemLayoutWithOutLabel: {
        wrapperCol: {
          md: { span: 16, offset: 8 },
          xl: { span: 18, offset: 6 },
          xxl: { span: 20, offset: 4 },
        },
      },
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

<style>

</style>
