<template>
  <div>
    <a-card
      class="position-relative card-wrap"
      hoverable
      style="width: 240px"
      :body-style="cardBodyStyle"
      :head-style="cardHeadStyle">
        <template #extra v-if="showSingleActions(listItem)">
          <actions :options="getOptions(listItem, 'singleActions')" :row="listItem.data" button-type="link" button-size="small" />
        </template>
        <div class="p-2 d-flex justify-content-center align-items-center position-relative" style="height: 180px;">
          <img
            :ref="`img${listKey}`"
            style="width: 120px;"
            alt=""
            :src="getData(listItem.data, 'url')"
            @error="imgError(listItem, `img${listKey}`)" />
          <div class="link_copy" @click="copyLink(listItem.data)">{{ $t('common.copy_link') }}</div>
        </div>
        <div class="text-wrap position-relative">
          <a-card-meta>
            <template #title>
              <div class="card-title" :title="getData(listItem.data, 'title')">{{ getData(listItem.data, 'title') }}</div>
            </template>
            <template #description>
              <template v-if="cardFields['content']">
                <div class="card-content-item mb-2" v-for="value in getData(listItem.data, 'content')" :key="value.field">
                  <span>{{value.title}}：</span><slot-dom :dom="getDom(value, listItem.data)" />
                </div>
              </template>
              <template v-else>
                <div class="mutiline-text-truncate mb-2" :title="getData(listItem.data, 'description')">
                  {{ getData(listItem.data, 'description') }}
                </div>
                <div class="mutiline-text-truncate mb-2" :title="getData(listItem.data, 'desc')" v-if="cardFields['desc']" style="font-size: 12px">
                  {{ getData(listItem.data, 'desc') }}
                </div>
              </template>
            </template>
          </a-card-meta>
          <div class="primary-btn-wrap position-absolute mb-2">
            <actions :options="getOptions(listItem, 'primaryActions')" :row="listItem.data" :button-block="true" />
          </div>
        </div>
    </a-card>
  </div>
</template>

<script>
import Actions from '@/components/PageList/Actions'
import invalidImg from '../../assets/images/invalidImg.svg'
import CardMixin from './card'

export default {
  name: 'VerticalCard',
  components: {
    Actions,
    SlotDom: {
      props: ['dom'],
      render () {
        return this.dom
      },
    },
  },
  mixins: [CardMixin],
  props: {
    singleActions: {
      type: Array,
    },
    cardFields: {
      type: Object,
      required: true,
      validator: val => val.url && val.title,
    },
    listItem: {
      type: Object,
      required: true,
    },
    listKey: {
      type: String,
      required: true,
    },
  },
  data () {
    return {
      imageDefault: invalidImg,
      // ant-design-vue 4 CSS-in-JS 优先级更高，用 inline style 覆盖
      cardBodyStyle: { padding: 0 },
      // head 下移，给「复制链接」留出一行，避免与下拉操作重叠
      cardHeadStyle: {
        position: 'absolute',
        top: '28px',
        padding: 0,
        right: 0,
        borderBottom: 0,
        minHeight: 'auto',
        zIndex: 1,
        background: 'transparent',
      },
    }
  },
  methods: {
    copyLink (data) {
      const text = data.url || this.getData(data, 'url')
      this.$copyText(text)
      this.$message.success(this.$t('common.copy'))
    },
  },
}
</script>
<style lang="less" scoped>
@import '../../../src/styles/less/theme';

.card-wrap.ant-card {
  .text-wrap {
    height: 200px;
    padding: 24px;
    background-color: #efefefa1;
    color: @border-color-base;
    .primary-btn-wrap {
      bottom: 8px;
      left: 24px;
      right: 24px;
    }
  }
  .card-title {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  // 每个字段独占一行并居中：启用状态 / 状态
  .card-content-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    font-size: 12px;
    :deep(.status),
    :deep(.status-wrapper) {
      display: inline-flex;
      width: auto;
      max-width: none;
      overflow: visible;
      vertical-align: middle;
    }
    :deep(.status-inner-row) {
      width: auto;
      min-width: auto;
    }
    :deep(.status-text),
    :deep(.status-text-flex) {
      flex: 0 0 auto;
      min-width: auto;
      overflow: visible;
      text-overflow: unset;
      white-space: nowrap;
    }
  }
  :deep(.ant-card-meta-title) {
    text-align: center;
    color: @primary-color;
  }
  :deep(.ant-card-meta-description) {
    text-align: center;
  }
}
.link_copy {
  position: absolute;
  top: 4px;
  right: 8px;
  cursor: pointer;
  color: @primary-color;
  font-size: 12px;
  line-height: 20px;
  padding: 0 4px;
  display: none;
  z-index: 2;
}
.card-wrap:hover .link_copy {
  display: block;
}
</style>
