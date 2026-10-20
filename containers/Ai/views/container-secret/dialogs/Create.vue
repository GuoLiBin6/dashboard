<template>
  <base-dialog :width="700" @cancel="cancelDialog">
    <div slot="header">{{ $t('common.create') }} - {{ $t('aice.container_secret') }}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <a-form-model-item :label="$t('common.name')" prop="name">
          <a-input
            v-model:value="form.name"
            :placeholder="$t('common.tips.input', [$t('common.name')])" />
        </a-form-model-item>
          <a-form-model-item :label="$t('aice.container_secret')" :extra="$t('aice.container_secret.env_hint') + ' ' + $t('aice.container_secret.add_pair')">
          <div v-for="(item, index) in items" :key="item.id" class="d-flex align-items-start mb-2">
            <a-input
              v-model:value="item.key"
              :placeholder="$t('aice.container_secret.key')"
              class="mr-2"
              style="flex: 1; min-width: 0" />
            <span class="mr-2 mt-2">=</span>
            <a-input
              v-model:value="item.value"
              :placeholder="$t('aice.container_secret.value')"
              class="mr-2"
              style="flex: 1; min-width: 0" />
            <a-button
              type="danger"
              shape="circle"
              icon="delete"
              size="small"
              class="mt-1"
              :disabled="items.length <= 1"
              @click="removeRow(index)" />
          </div>
          <a-button type="dashed" block icon="plus" @click="addRow">
            {{ $t('aice.container_secret.add_pair') }}
          </a-button>
          <div v-if="blobError" class="text-danger mt-1">{{ blobError }}</div>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" :loading="loading" @click="handleConfirm">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { uuid } from '@/utils/utils'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ContainerSecretCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      blobError: '',
      form: {
        name: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('common.tips.input', [this.$t('common.name')]) },
        ],
      },
      items: [
        { id: uuid(), key: '', value: '' },
      ],
    }
  },
  methods: {
    addRow () {
      this.items.push({ id: uuid(), key: '', value: '' })
      this.blobError = ''
    },
    removeRow (index) {
      if (this.items.length <= 1) return
      this.items.splice(index, 1)
      this.blobError = ''
    },
    buildBlob () {
      const blob = {}
      for (const item of this.items) {
        const k = (item.key || '').trim()
        const v = (item.value || '').trim()
        if (k) blob[k] = v
      }
      return blob
    },
    async handleConfirm () {
      this.blobError = ''
      try {
        await this.$refs.formRef.validate()
      } catch (e) {
        return
      }
      const blob = this.buildBlob()
      if (Object.keys(blob).length === 0) {
        this.blobError = this.$t('common.tips.input', [this.$t('aice.container_secret')])
        return
      }
      this.loading = true
      try {
        const manager = new this.$Manager('credentials', 'v1')
        const createData = {
          type: 'container_secret',
          name: this.form.name || '',
          blob,
        }
        if (this.$store.getters.scope === 'project') {
          const uid = this.$store.getters.userInfo?.id
          if (uid) createData.user_id = uid
        }
        await manager.create({ data: createData })
        this.$message.success(this.$t('common.success'))
        this.params.callback && this.params.callback()
        this.cancelDialog()
      } catch (e) {
        throw e
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.mr-2 {
  margin-right: 8px;
}
.mb-2 {
  margin-bottom: 8px;
}
.mt-1 {
  margin-top: 4px;
}
.mt-2 {
  margin-top: 8px;
}
</style>
