<template>
  <div>
    <page-header :title="$t('system.text_167', [$t('dictionary.domain')])" />
    <page-body>
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('system.text_101')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('system.text_168')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <div slot="right">
        <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('common.create') }}</a-button>
        <a-button class="ml-3" @click="handleCancel">{{ $t('dialog.cancel') }}</a-button>
      </div>
    </page-footer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { escapeHTML } from '@/utils/utils'

export default {
  name: 'DomainCreateIndex',
  data () {
    return {
      loading: false,
      submiting: false,
      form: {
        name: undefined,
        description: undefined,
      },
      rules: {
        name: [
          {
            required: true,
            message: this.$t('system.text_170'),
          },
        ],
      },
    }
  },
  computed: {
    ...mapGetters(['l3PermissionEnable']),
    domain () {
      return this.$route.query.domain
    },
    isClone () {
      return !!this.domain
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.fetchCreate()
        this.$router.push('/domain')
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
    async fetchCreate () {
      const manager = new this.$Manager('domains', 'v1')
      try {
        const { data } = await manager.create({
          data: {
            name: escapeHTML(this.form.name),
            description: this.form.description,
          },
        })
        return data
      } catch (err) {
        throw err
      }
    },
    handleCancel () {
      this.$router.push('/domain')
    },
  },
}
</script>
