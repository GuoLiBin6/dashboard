<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ params.title }}</div>
    <div slot="body">
      <a-alert class="mb-2" :message="$t('compute.text_1354')" banner />
      <dialog-selected-tips :count="params.data.length" :action="$t('compute.text_1355')" :name="params.name" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item :label="$t('compute.text_494')" :extra="$t('compute.text_1356')" prop="auto_start">
          <a-switch v-model:checked="form.auto_start" :checked-children="$t('compute.text_115')" :un-checked-children="$t('compute.text_116')" />
        </a-form-model-item>
        <a-form-model-item v-if="hasMemorySnapshot" prop="with_memory">
          <a-checkbox v-model:checked="form.with_memory">
            {{$t('compute.rollback_mem_snapshot_same_time')}}
          </a-checkbox>
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'RollbackHostDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        auto_start: true,
        with_memory: undefined,
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'isDomainMode', 'scope']),
    columns () {
      const showFields = ['name', 'guest', 'brand']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
    hasMemorySnapshot () {
      return this.params.data[0].with_memory
    },
  },
  methods: {
    doRollback (data) {
      const guestId = this.params.data[0] && this.params.data[0].guest_id
      return new this.$Manager('servers').performAction({
        action: 'instance-snapshot-reset',
        id: guestId,
        data,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        const values = {
          ...this.form,
          instance_snapshot: this.params.data[0].id,
        }
        await this.doRollback(values)
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
