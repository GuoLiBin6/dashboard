<template>
  <div class="h-100 position-relative">
    <div class="dashboard-card-wrap" :style="wrapStyle">
      <div class="dashboard-card-header" style="margin-bottom:0">
        <div class="dashboard-card-header-left">
          <span :style="headerStyle">{{ fd.name || $t('dashboard.title_bar') }}</span>
          <icon class="ml-2" type="loading" v-if="loading" /></div>
        <div class="dashboard-card-header-right">
          <slot name="actions" :handle-edit="handleEdit" />
        </div>
      </div>
      <div v-if="desc" class="dashboard-card-body flex-column justify-content-center" :style="descStyle">
        {{ desc }}
      </div>
    </div>
    <base-drawer v-model:visible="visible" :title="$t('dashboard.text_5')" @ok="handleSubmit" @cancel="handleCancel">
      <a-form-model ref="formRef" :model="fd" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('dashboard.text_6')" prop="name">
          <a-input v-model:value="fd.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('dashboard.explain')" prop="desc">
          <a-input v-model:value="fd.desc" />
        </a-form-model-item>
        <a-form-model-item :label="$t('dashboard.background')">
          <div class="d-flex flex-wrap" style="line-height: 30px">
            <a-tooltip class="color-item" v-for="(item, index) in colorList" :key="index">
              <template slot="title">
                {{ item.key }}
              </template>
              <a-tag :color="item.color" @click="changeColor(item.color)" :style="item.color === '#FFFFFF' ? {border:'solid #ccc 1px'} : {}">
                <icon type="check" v-if="item.color === fd.color" :style="item.color === '#FFFFFF' ? {color:'#333'} : {}" />
              </a-tag>
            </a-tooltip>
          </div>
        </a-form-model-item>
      </a-form-model>
    </base-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import BaseDrawer from '@Dashboard/components/BaseDrawer'
import { colorList } from '@/utils/theme/utils'

export default {
  name: 'Title',
  components: {
    BaseDrawer,
  },
  props: {
    options: {
      type: Object,
      required: true,
    },
    params: Object,
    edit: Boolean,
  },
  data () {
    const initialNameValue = (this.params && this.params.name) || this.$t('dashboard.title_bar')
    const initialDesc = (this.params && this.params.desc) || ''
    const initialColor = (this.params && this.params.color) || '#FFFFFF'
    return {
      data: [],
      visible: false,
      loading: false,
      fd: {
        name: initialNameValue,
        desc: initialDesc,
        color: initialColor,
      },
      rules: {
        name: [
          { required: true, message: this.$t('dashboard.text_8') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 18,
        },
        labelCol: {
          span: 6,
        },
      },
      colorList: [
        ...colorList,
        {
          key: this.$t('dashboard.color_white'),
          color: '#FFFFFF',
        },
      ],
    }
  },
  computed: {
    ...mapGetters(['scope', 'userInfo']),
    desc () {
      return this.fd.desc
    },
    bgColor () {
      return (this.params && this.params.color) || '#FFFFFF'
    },
    headerStyle () {
      const ret = {
        fontSize: '1.3em',
        fontWeight: 'bold',
      }
      if (!this.desc) {
        ret.height = '50px'
        ret.lineHeight = '50px'
      }
      if (this.params && this.params.color && this.params.color !== '#FFFFFF') {
        ret.color = '#fff'
      }
      return ret
    },
    wrapStyle () {
      const ret = {
        padding: '12px 15px',
      }
      if (this.params && this.params.color && this.params.color !== '#FFFFFF') {
        ret.background = this.params.color
      }
      return ret
    },
    descStyle () {
      if (this.params && this.params.color && this.params.color !== '#FFFFFF') {
        return { color: '#fff' }
      }
      return {}
    },
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.$emit('update', this.options.i, {
      ...this.fd,
    })
  },
  methods: {
    changeColor (color) {
      this.fd.color = color
    },
    refresh () {
      return function () {}
    },
    handleEdit () {
      this.visible = true
    },
    async handleSubmit () {
      try {
        await this.$refs.formRef.validate()
        this.$emit('update', this.options.i, { ...this.fd })
        this.visible = false
      } catch (error) {
        throw error
      }
    },
    handleCancel () {
      this.fd.color = (this.params && this.params.color) || '#fff'
    },
  },
}
</script>
<style scoped lang="less">
.color-item {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  cursor: pointer;
  margin-right: 8px;
  padding-left: 0px;
  padding-right: 0px;
  text-align: center;
  color: #fff;
  font-weight: 700;
  i {
    font-size: 14px;
  }
}
</style>
