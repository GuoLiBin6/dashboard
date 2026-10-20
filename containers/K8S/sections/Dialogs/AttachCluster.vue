<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('k8s.text_366')}}</div>
    <div slot="body">
      <a-form-model ref="formRef" class="mt-3" :model="form" :rules="rules">
        <a-form-model-item :label="$t('k8s.text_28')" class="mb-0" prop="cluster_id">
          <base-select
            v-model:value="form.cluster_id"
            resource="kubeclusters"
            :params="clusterParams"
            version="v1"
            :select-props="{ placeholder: $t('k8s.text_30') }" />
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
  name: 'AttachClusterDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        cluster_id: undefined,
      },
      rules: {
        cluster_id: [
          { required: true, message: this.$t('k8s.text_30'), trigger: 'blur' },
        ],
      },
      clusterParams: {
        federated_keyword: this.params.resource,
        federated_used: false,
        federatedresource_id: this.params.data.id,
      },
    }
  },
  computed: {
    ...mapGetters(['scope']),
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.params.onManager('performAction', {
          id: this.params.data.id,
          managerArgs: {
            action: 'attach-cluster',
            data: { ...this.form },
          },
        })
        this.loading = false
        this.cancelDialog()
        this.params.success && this.params.success()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
