<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_513')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.host')" :count="params.data.length" :action="$t('compute.text_513')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 2)" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('compute.cpu_commit_bound')" prop="cpu_cmtbound">
          <a-input-number v-model:value="form.cpu_cmtbound" :min="0.1" :step="0.1" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.memory_commit_bound')" prop="mem_cmtbound">
          <template v-if="isOpenPage">
            <a-tooltip>
              <template #title>
                {{ $t('compute.host.open_page_size.tooltip') }}
              </template>
              <a-input-number v-model:value="form.mem_cmtbound" :min="0.1" :max="maxMemCmtBound" :step="0.1" :disabled="true" />
            </a-tooltip>
          </template>
          <a-input-number v-else v-model:value="form.mem_cmtbound" :min="0.1" :max="maxMemCmtBound" :step="0.1" />
          <div style="font-size:12px" class="add-desc">{{$t('compute.text_544')}}</div>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.memory_reserve_gb')" prop="mem_reserved">
          <template v-if="isOpenPage">
            <a-tooltip>
              <template #title>
                {{ $t('compute.host.open_page_size.tooltip') }}
              </template>
              <a-input-number v-model:value="form.mem_reserved" :min="1" :step="1" :disabled="true" />
            </a-tooltip>
          </template>
          <a-input-number v-else v-model:value="form.mem_reserved" :min="1" :step="1" />
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'HostAdjustOversoldRatioDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      scope: this.$store.getters.scope,
      form: {
        cpu_cmtbound: this.params.data[0].cpu_commit_bound,
        mem_cmtbound: this.params.data[0].mem_commit_bound,
        mem_reserved: this.params.data[0].mem_reserved / 1024,
      },
      rules: {
        cpu_cmtbound: [
          { required: true, message: this.$t('compute.text_545') },
        ],
        mem_cmtbound: [
          { required: true, message: this.$t('compute.text_546') },
        ],
        mem_reserved: [
          { required: true, message: this.$t('compute.memory_reserve_gb.placeholder') },
        ],
      },
    }
  },
  computed: {
    isOpenPage () {
      const firstItem = this.params.data[0]
      return firstItem?.page_size_kb > 4
    },
    maxMemCmtBound () {
      for (let i = 0; i < this.params.data.length; i++) {
        if (this.params.data[i].host_type !== 'container') {
          return 1.0
        }
      }
      return 8.0
    },
  },
  methods: {
    doUpdate (data) {
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('batchUpdate', {
        id: ids,
        managerArgs: {
          data: { mem_reserved: data.mem_reserved },
        },
      })
    },
    doPerformAction (data) {
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('batchPerformAction', {
        id: ids,
        managerArgs: {
          action: 'set-commit-bound',
          data: { cpu_cmtbound: data.cpu_cmtbound, mem_cmtbound: data.mem_cmtbound },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          ...this.form,
          mem_reserved: this.form.mem_reserved * 1024,
        }
        await this.doUpdate(values)
        await this.doPerformAction(values)
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        // validate / submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
