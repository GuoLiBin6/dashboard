<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.disk_perform_create_snapshot')}}</div>
    <div slot="body">
      <a-alert :message="errorInfo" banner v-if="errorInfo !== ''" />
      <dialog-selected-tips :count="params.data.length" :action="$t('compute.disk_perform_create_snapshot')" :name="$t('dictionary.disk')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('compute.text_415')" v-bind="formItemLayout" prop="name">
          <a-input v-model:value="form.name" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading" :disabled="confirmDisabled">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { HYPERVISORS_MAP } from '@/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'DiskCreateSnapshotDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_416') },
          { validator: this.$validate('snapshotName') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
      serversOpts: [],
    }
  },
  computed: {
    errorInfo () {
      if (this.isKvm) {
        if (this.isCeph) return ''
        if (this.manualSnapshotCount === this.maxManualSnapshotCount) {
          return this.$t('compute.text_417')
        }
        return this.$t('compute.text_418', [this.manualSnapshotCount, this.maxManualSnapshotCount - this.manualSnapshotCount])
      }
      return ''
    },
    confirmDisabled () {
      if (!this.isKvm) return
      if (this.isCeph) return
      return this.manualSnapshotCount === this.maxManualSnapshotCount
    },
    isKvm () {
      return this.params.data[0].provider === HYPERVISORS_MAP.kvm.provider
    },
    isHuawei () {
      return this.params.data[0].provider === HYPERVISORS_MAP.huawei.provider
    },
    isCeph () {
      return this.params.data[0].storage_type === 'rbd'
    },
    maxManualSnapshotCount () {
      return this.params.data[0].max_manual_snapshot_count || 2
    },
    manualSnapshotCount () {
      return this.params.data[0].manual_snapshot_count || 0
    },
  },
  created () {
    const params = {
      details: false,
      disk: this.params.data[0].id,
    }
    new this.$Manager('servers').list({ params })
      .then((res) => {
        this.serversOpts = res.data.data
      })
  },
  methods: {
    doCreate (data) {
      return new this.$Manager('snapshots').create({ data })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          name: this.form.name,
          disk: this.params.data[0].id,
        }
        await this.doCreate(values)
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        // validate or submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
