<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('network.associated_cluster') }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('network.text_20')" :count="params.data.length" :action="$t('network.associated_cluster')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('network.associated_cluster')" prop="enable_associated">
          <a-switch
            v-model:checked="form.enable_associated"
            :checkedChildren="$t('common.text00062')"
            :unCheckedChildren="$t('common.text00063')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_19')" v-if="form.enable_associated" prop="cluster_id">
          <base-select
            v-model:value="form.cluster_id"
            resource="loadbalancerclusters"
            :params="clusterParams"
            remote
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            showSync
            :select-props="{ placeholder: $t('network.text_79') }" />
          <p slot="extra">
            {{$t('network.text_80')}}
            <a-button type="link" size="small" @click="createCluster">{{$t('network.text_26')}}</a-button>
          </p>
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
  name: 'AssociatedClusterDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        enable_associated: !!this.params.data[0].cluster_id,
        cluster_id: this.params.data[0].cluster_id,
      },
      rules: {
        cluster_id: [
          { required: true, message: this.$t('network.text_79') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 19,
        },
        labelCol: {
          span: 5,
        },
      },
    }
  },
  computed: {
    clusterParams () {
      return {
        region: this.params.data[0].region,
      }
    },
  },
  methods: {
    createCluster () {
      this.createDialog('LoadbalancerclusterCreateDialog', {
        title: this.$t('network.text_26'),
      })
    },
    doAssociated (id, cluster_id) {
      return this.params.onManager('performAction', {
        id,
        managerArgs: {
          action: 'join-cluster',
          data: {
            cluster_id,
          },
        },
      })
    },
    doUnAssociated (id, cluster_id) {
      return this.params.onManager('performAction', {
        id,
        managerArgs: {
          action: 'leave-cluster',
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const id = this.params.data[0].id
        const { enable_associated, cluster_id } = this.form

        if (enable_associated) {
          await this.doAssociated(id, cluster_id)
        } else {
          await this.doUnAssociated(id, cluster_id)
        }

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
