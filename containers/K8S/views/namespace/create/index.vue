<template>
  <div>
    <page-header :title="$t('k8s.text_294')" />
    <!-- <a-tabs v-model="activedTab">
      <a-tab-pane :tab="$t('k8s.text_231')" key="FormCreate" />
      <a-tab-pane :tab="$t('k8s.text_232')" key="InputCreate" />
      <a-tab-pane :tab="$t('k8s.text_233')" key="UploadCreate" />
    </a-tabs> -->
    <page-body needMarginBottom>
      <component :is="activedTab" ref="FormCreateRef" />
    </page-body>
    <page-footer>
      <template #right>
        <a-button class="mr-3" type="primary" @click="confirm" :loading="loading">{{$t('k8s.create')}}</a-button>
        <a-button @click="cancel">{{$t('k8s.text_213')}}</a-button>
      </template>
    </page-footer>
  </div>
</template>

<script>
import FormCreate from './components/FormCreate'
import InputCreate from './components/InputCreate'
import UploadCreate from './components/UploadCreate'

export default {
  name: 'K8SNamespaceCreate',
  components: {
    FormCreate,
    InputCreate,
    UploadCreate,
  },
  data () {
    return {
      loading: false,
      activedTab: 'FormCreate',
    }
  },
  methods: {
    async confirm () {
      try {
        this.loading = true
        await this.$refs.FormCreateRef.doCreate()
        this.loading = false
        this.cancel()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    cancel () {
      this.$router.push('/k8s-namespace')
    },
  },
}
</script>
