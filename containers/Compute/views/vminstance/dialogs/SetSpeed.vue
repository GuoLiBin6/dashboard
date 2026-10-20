<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item v-for="(obj, idx) in disksInfo" :key="idx">
          <a-card size="small">
            <div slot="title"><a-tag>{{ obj.disk_type === 'sys' ? $t('common_432') : $t('common_433') }}</a-tag> {{obj.name}}</div>
            <a-row>
              <a-col :span="12">
                <a-form-model-item :extra="$t('compute.not_limited')" :prop="'disks.' + idx + '.iops'" :rules="iopsRules">
                  <span slot="label">
                    {{ $t('compute.iops') }}&nbsp;
                    <a-tooltip :title="$t('compute.text_1248_tip')">
                      <icon type="question-circle" />
                    </a-tooltip>
                  </span>
                  <span>
                    <a-input-number :min="0" :step="50" v-model:value="form.disks[idx].iops" />
                  </span>
                </a-form-model-item>
              </a-col>
              <a-col :span="12">
                <a-form-model-item :extra="$t('compute.not_limited')" :prop="'disks.' + idx + '.bps'" :rules="bpsRules">
                  <span slot="label">
                    {{ $t('compute.bps') }}&nbsp;
                    <a-tooltip :title="$t('compute.text_1248_1_tip')">
                      <icon type="question-circle" />
                    </a-tooltip>
                  </span>
                  <span>
                    <a-input-number :min="0" :step="50" v-model:value="form.disks[idx].bps" />
                  </span>
                  <span class="ml-2">M/s</span>
                </a-form-model-item>
              </a-col>
            </a-row>
          </a-card>
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
  name: 'VmSetSpeedDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const disksInfo = this.params.data[0].disks_info || []
    return {
      loading: false,
      action: this.$t('compute.text_1249'),
      form: {
        disks: disksInfo.map(o => ({
          iops: o.iops || 0,
          bps: (o.bps || 0) / 1024 / 1024,
        })),
      },
      iopsRules: [
        { required: true, message: this.$t('compute.text_1250') },
      ],
      bpsRules: [
        { required: true, message: this.$t('compute.text_1250_1') },
      ],
    }
  },
  computed: {
    disksInfo () {
      return this.params.data[0].disks_info
    },
  },
  methods: {
    async doSetSpeedSubmit () {
      const bps = {}
      const iops = {}
      this.disksInfo.forEach((o, i) => {
        bps[o.id] = +(this.form.disks[i].bps) * 1024 * 1024
        iops[o.id] = this.form.disks[i].iops
      })
      const params = {
        bps,
        iops,
      }
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: ['running', 'ready'],
        managerArgs: {
          action: 'io-throttle',
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doSetSpeedSubmit()
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
