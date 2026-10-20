<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.loadbalancer')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('network.text_19')" prop="cluster_id">
          <base-select
            remote
            showSync
            :params="clusterParams"
            v-model:value="form.cluster_id"
            resource="loadbalancerclusters"
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :select-props="{ placeholder: $t('network.text_79') }" />
          <!-- <p slot="extra" v-if="this.params.data.length === 1">{{$t('network.text_80')}}<a-button type="link" size="small" @click="createCluster">{{$t('network.text_26')}}</a-button>
          </p> -->
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
import expectStatus from '@/constants/expectStatus'

export default {
  name: 'LbUpdateCluster',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        cluster_id: this.params.data[0].cluster_id,
      },
      rules: {
        cluster_id: [
          { required: true, message: this.$t('network.text_79') },
        ],
      },
    }
  },
  computed: {
    clusterParams () {
      return {
        limit: 0,
        scope: this.$store.getters.scope,
        zone_id: this.params.data[0].zone_id,
      }
    },
  },
  methods: {
    createCluster () {
      this.createDialog('LoadbalancerclusterCreateDialog', {
        title: this.$t('network.text_26'),
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        const ids = this.params.data.map(item => item.id)
        await this.params.onManager('batchUpdate', {
          id: ids,
          steadyStatus: Object.values(expectStatus.lb).flat(),
          managerArgs: {
            data: values,
          },
        })
        this.params.refresh()
        this.cancelDialog()
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
