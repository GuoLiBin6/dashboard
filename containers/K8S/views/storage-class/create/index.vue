<template>
  <div>
    <page-header :title="$t('k8s.text_307')" />
    <a-form-model
      ref="formRef"
      class="mt-3"
      :model="form"
      :rules="rules">
      <a-form-model-item
        :label="$t('k8s.text_348')"
        prop="storageType">
        <a-radio-group v-model:value="form.storageType">
          <a-radio-button value="cephCSI">
            Ceph RBD
          </a-radio-button>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item
        :label="$t('k8s.text_41')"
        prop="name">
        <a-input v-model:value="form.name" :placeholder="$t('k8s.text_60')" />
      </a-form-model-item>
      <a-form-model-item
        :label="$t('k8s.text_19')"
        prop="cluster">
        <cluster-select
          v-model="form.cluster"
          @input="onClusterInput"
          style="width: 140px;" />
      </a-form-model-item>
      <a-form-model-item
        :label="$t('k8s.text_18')"
        class="mb-0"
        required>
        <a-row :gutter="8">
          <a-col :span="12">
            <a-form-model-item prop="secretNamespace">
              <namespace-select
                size="small"
                v-model="form.secretNamespace"
                @change="onSecretNamespaceChange"
                :cluster="form.cluster" />
            </a-form-model-item>
          </a-col>
          <a-col :span="12">
            <a-form-model-item prop="secretName">
              <base-select
                resource="secrets"
                v-model="form.secretName"
                :params="secretsParams"
                version="v1"
                :need-params="true"
                filterable
                showSync
                :placeholder="$t('k8s.text_349')"
                @change="fetchPoolOpts" />
              <template #extra>
                {{$t('k8s.text_306')}} <help-link class="pl-1" :href="`/k8s-secret/create?storageType=${form.storageType}`">{{$t('k8s.text_350')}}</help-link>
              </template>
            </a-form-model-item>
          </a-col>
        </a-row>
      </a-form-model-item>
      <a-form-model-item
        :label="$t('k8s.text_351')"
        prop="clusterId">
        <a-select v-model:value="form.clusterId" :placeholder="$t('k8s.text_77')" @change="fetchPoolOpts">
          <a-select-option v-for="item in cephcsiOpts" :value="item.clusterId" :key="item.clusterId">{{item.clusterId}}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item
        label="Pool"
        prop="pool">
        <a-select v-model:value="form.pool" :placeholder="$t('k8s.text_352')">
          <a-select-option v-for="item in poolOpts" :value="item" :key="item">{{item}}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item
        :label="$t('k8s.text_353')"
        prop="csiFsType">
        <a-select v-model:value="form.csiFsType">
          <a-select-option value="ext4">ext4</a-select-option>
          <a-select-option value="xfs">xfs</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item :wrapper-col="{ span: 20, offset: 3 }">
        <a-button class="mr-2" type="primary" @click="handleConfirm" :loading="loading">{{$t('common.create')}}</a-button>
        <a-button @click="cancel">{{$t('k8s.text_162')}}</a-button>
      </a-form-model-item>
    </a-form-model>
    <base-dialog v-if="showCreateCephCSI" @cancel="() => showCreateCephCSI = false">
      <div slot="header">{{$t('k8s.text_354')}}</div>
      <div slot="body">{{$t('k8s.text_355')}}</div>
      <div slot="footer">
        <a-button type="primary" @click="createCephCSI">{{$t('common.create')}}</a-button>
      </div>
    </base-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import _ from 'lodash'
import ClusterSelect from '@K8S/sections/ClusterSelect'
import NamespaceSelect from '@K8S/sections/NamespaceSelect'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'StorageClassCreate',
  components: {
    ClusterSelect,
    NamespaceSelect,
  },
  mixins: [k8sCreateMixin],
  data () {
    const initCluster = _.get(this.$route, 'query.cluster') || this.$store.state.common.k8s.cluster
    return {
      loading: false,
      form: {
        storageType: 'cephCSI',
        name: undefined,
        cluster: initCluster,
        secretNamespace: undefined,
        secretName: undefined,
        clusterId: undefined,
        pool: undefined,
        csiFsType: 'ext4',
      },
      rules: {
        name: [
          { required: true, message: this.$t('k8s.text_60') },
        ],
        cluster: [
          { required: true, message: this.$t('k8s.text_30') },
        ],
        secretNamespace: [
          { required: true, message: this.$t('k8s.text_61') },
        ],
        secretName: [
          { required: true, message: this.$t('k8s.text_349') },
        ],
        clusterId: [
          { required: true, message: this.$t('k8s.text_356') },
        ],
        pool: [
          { required: true, message: this.$t('k8s.text_357') },
        ],
      },
      secretNamespace: '',
      cephcsiOpts: [],
      poolOpts: [],
      showCreateCephCSI: false,
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'scope', 'isAdminMode']),
    secretsParams () {
      if (this.secretNamespace && this.form.cluster) {
        return {
          type: 'yunion.io/ceph-csi',
          namespace: this.secretNamespace,
          cluster: this.form.cluster,
          limit: 0,
        }
      }
      return {}
    },
  },
  watch: {
    'form.cluster': {
      handler (val) {
        if (val) {
          this.fetchCephcsiOpts(val)
          this.fetchClusterStatus(val)
          this.fetchPoolOpts()
        }
      },
      immediate: true,
    },
  },
  methods: {
    onClusterInput (v) {
      this.form.cluster = v
      this.setCluster(v)
    },
    onSecretNamespaceChange (e) {
      this.form.secretNamespace = e
      this.secretNamespaceChange(e)
      this.fetchPoolOpts()
    },
    async fetchClusterStatus (cluster) {
      const { data } = await new this.$Manager('kubeclusters', 'v1').get({
        id: `${cluster}/components-status`,
      })
      if (data && data.cephCSI && data.cephCSI.created === false) this.showCreateCephCSI = true
    },
    createCephCSI () {
      this.$router.push({
        path: '/k8s-kubecomponent/create',
        query: {
          kubeComponent: 'cephCSI',
          cluster: this.form.cluster,
        },
      })
    },
    async fetchPoolOpts () {
      const { clusterId, secretName, secretNamespace, cluster } = this.form
      if (clusterId && secretName && secretNamespace && cluster) {
        const params = {
          cephCSIRBD: {
            clusterId,
            secretName,
            secretNamespace,
          },
          cluster,
          name: 'rbd-climc',
          provisioner: 'rbd.csi.ceph.com',
        }
        const { data } = await new this.$Manager('storageclasses', 'v1').performClassAction({
          action: 'connection-test',
          data: params,
        })
        if (data && data.cephCSIRBD && data.cephCSIRBD.pools) {
          this.poolOpts = data.cephCSIRBD.pools
          this.form.pool = data.cephCSIRBD.pools[0]
        }
      }
    },
    async fetchCephcsiOpts (cluster) {
      const { data } = await new this.$Manager('kubeclusters', 'v1').get({
        id: `${cluster}/component-setting`,
        params: { type: 'cephCSI' },
      })
      if (data && data.cephCSI && data.cephCSI.config) {
        this.cephcsiOpts = data.cephCSI.config
        if (this.cephcsiOpts.length) {
          this.form.clusterId = this.cephcsiOpts[0].clusterId
        }
      }
    },
    secretNamespaceChange (e) {
      this.secretNamespace = e
    },
    doCreate (values) {
      const data = {
        cephCSIRBD: {
          clusterId: values.clusterId,
          csiFsType: values.csiFsType,
          imageFeatures: 'layering',
          pool: values.pool,
          secretName: values.secretName,
          secretNamespace: values.secretNamespace,
        },
        cluster: values.cluster,
        name: values.name,
        provisioner: 'rbd.csi.ceph.com',
      }
      return new this.$Manager('storageclasses', 'v1').create({ data })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doCreate(this.form)
        this.loading = false
        this.$message.success(this.$t('k8s.text_184'))
        this.$router.push('/k8s-storageclass')
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    cancel () {
      this.$router.push('/k8s-storageclass')
    },
  },
}
</script>
