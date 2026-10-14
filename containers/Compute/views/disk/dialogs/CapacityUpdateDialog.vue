<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.disk_perform_resize')}}</div>
    <div slot="body">
      <a-alert type="warning" class="mb-2">
        <template #message>
          <div>
            <p>{{$t('compute.text_403')}}</p>
            <p>{{$t('compute.text_404')}}<span v-show="listData.length > 1">{{$t('compute.text_407_1')}}</span></p>
            <p v-show="params.data[0].provider === 'Aws'">{{$t('compute.text_406')}}</p>
            <p v-show="!params.data[0].provider">{{$t('compute.text_407')}}</p>
          </div>
        </template>
      </a-alert>
      <dialog-selected-tips :count="params.data.length" :action="$t('compute.disk_perform_resize')" :name="$t('dictionary.disk')" />
      <div class="d-flex mt-1 mb-2" v-if="listData.length > 1">
        <span style="width: 100px;">{{$t('compute.resize_same_capacity')}}:</span>
        <a-switch v-model:checked="showSingleForm" />
      </div>
      <dialog-table :data="listData" :columns="columns" :vxe-grid-props="vxeGridProps" />
      <a-form-model
        v-if="listData.length === 1 || showSingleForm"
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item class="d-flex" prop="size">
          <template #label>
            <span style="width: 100px;">{{$t('compute.text_397')}}</span>
          </template>
          <a-input-number class="ml-2" :min="(params.data[0].disk_size / 1024) || 1" :max="100000" step="10" v-model:value="form.size" /> GB
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
import * as R from 'ramda'
import { h } from 'vue'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'DiskCapacityUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const diskSizes = this.params.data.map(item => item.disk_size)
    return {
      loading: false,
      form: {
        size: Math.max(...diskSizes) / 1024,
      },
      rules: {
        size: [
          { required: true, message: this.$t('compute.text_408') },
        ],
      },
      listData: R.clone(this.params.data).map(item => ({ ...item, size: item.disk_size / 1024 })),
      vxeGridProps: {
        editConfig: {
          trigger: 'click',
          mode: 'cell',
          showIcon: false,
          showStatus: true,
        },
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
      showSingleForm: false,
    }
  },
  computed: {
    columns () {
      return [
        ...(this.params.columns.filter(item => ['name', 'guest', 'disk_size'].includes(item.field))),
        ...(this.listData.length === 1 || this.showSingleForm ? []
          : [{
            field: 'size',
            title: this.$t('compute.disk_resize_after_capacity'),
            width: 200,
            editRender: {
              name: '$input',
              props: { type: 'number', min: (this.params.data[0].disk_size / 1024) || 1, max: 100000, step: 10 },
            },
            slots: {
              default: ({ row }) => {
                const size = parseInt(row.size + '')
                const showSize = size && size >= this.params.data[0].disk_size / 1024 ? size : (this.params.data[0].disk_size / 1024 || 1)
                return [
                  h('span', {}, [
                    h('span', {}, `${showSize}G`),
                    ' ',
                    h('i', { class: 'vxe-icon--edit-outline' }),
                  ]),
                ]
              },
            },
          }]
        ),
      ]
    },
  },
  methods: {
    doCreate (data) {
      return new this.$Manager('disks').performAction({
        id: data.id,
        action: 'resize',
        data: {
          size: data.value_size,
        },
      })
    },
    doCreate2 (data) {
      return new this.$Manager('servers').performAction({
        id: data.guests[0].id,
        action: 'resize-disk',
        data: {
          disk: data.id,
          size: data.value_size,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        const listData = R.clone(this.listData)
        if (listData.length === 1 || this.showSingleForm) {
          await this.$refs.formRef.validate()
          listData.forEach(item => {
            item.value_size = this.form.size * 1024
          })
        } else {
          listData.forEach(item => {
            item.value_size = Math.max(parseInt(item.size + ''), item.disk_size / 1024) * 1024
          })
        }
        for (let i = 0; i < listData.length; i++) {
          const item = listData[i]
          if (item.guest_count && item.guest_count >= 1) {
            await this.doCreate2(item)
          } else {
            await this.doCreate(item)
          }
        }
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        // validate / resize failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
