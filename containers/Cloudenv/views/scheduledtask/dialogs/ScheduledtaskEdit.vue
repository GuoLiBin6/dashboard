<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ title }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('cloudenv.text_431')" class="mt-3" :count="params.data.length" :action="title" />
      <dialog-table v-if="params.columns && params.columns.length" :data="params.data" :columns="columns" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        hideRequiredMark>
        <a-form-model-item v-if="isServer" :label="$t('cloudenv.text_440')" prop="servers">
          <list-select
            v-model:value="form.servers"
            :list-props="resourceProps"
            :multiple="true"
            :formatter="formatter" />
        </a-form-model-item>
        <a-form-model-item v-if="isTag" :label="$t('cloudenv.text_16')" class="mb-0" prop="tag">
          <tag :value="form.tag" @change="v => form.tag = v" :extra="$t('cloudenv.text_441')" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import Tag from '@/sections/Tag'
import ListSelect from '@/sections/ListSelect'
import validateForm from '@/utils/validate'
import ResourcePropsMixin from '../mixins/resourceProps'

export default {
  name: 'ScheduledtaskEditDialog',
  components: {
    Tag,
    ListSelect,
  },
  mixins: [DialogMixin, WindowsMixin, ResourcePropsMixin],
  data () {
    const getInitTags = (labels) => {
      const tag = {}
      labels.forEach((v) => {
        const arr = v.replace('user:', '').split(':')
        tag[`user:${arr[0]}`] = arr[1]
      })
      return tag
    }
    const labels = this.params.data[0].labels
    return {
      loading: false,
      form: {
        servers: labels,
        tag: getInitTags(labels),
      },
      rules: {
        tag: [
          { required: true, message: this.$t('cloudenv.text_451') },
          { validator: validateForm('tagName') },
        ],
      },
    }
  },
  computed: {
    isServer () {
      return this.params.data.every((item) => item.label_type === 'id')
    },
    isTag () {
      return this.params.data.every((item) => item.label_type === 'tag')
    },
    title () {
      return this.params.title || this.$t('cloudenv.text_454')
    },
    columns () {
      const showColumns = ['name', 'status', 'resource_type']
      return this.params.columns.filter(v => showColumns.includes(v.field))
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      const manager = new this.$Manager('scheduledtasks', 'v1')
      try {
        await this.$refs.formRef.validate()
        const params = {}
        if (this.isServer) {
          params.labels = this.form.servers
        } else if (this.isTag) {
          const tags = Object.keys(this.form.tag).map((k) => {
            return `${k}:${this.form.tag[k]}`
          })
          params.labels = tags
        }
        const ids = this.params.data.map(item => item.id)
        const res = await manager.performAction({
          id: ids[0],
          action: 'set-labels',
          data: {
            labels: params.labels,
          },
        })
        this.$bus.$emit('ScheduledtasksListSingleRefresh', ids)
        this.isServer && this.$bus.$emit('RelatedResourceServerListSidePageRefresh', res.data.labels)
        this.isTag && this.$bus.$emit('RelatedResourceTagListSidePageRefresh', res.data.labels)
        this.params.success && this.params.success(res.data.labels)
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    formatter (val) {
      return `${val.name}`
    },
  },
}
</script>
