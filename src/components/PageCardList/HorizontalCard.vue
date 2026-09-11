<template>
  <div>
    <a-card
      class="position-relative card-wrap"
      hoverable
      style="width: 340px"
      :body-style="cardBodyStyle"
      :head-style="cardHeadStyle">
      <template #extra v-if="showSingleActions(item)">
        <actions :options="getOptions(item, 'singleActions')" :row="item.data" button-type="link" button-size="small" />
      </template>
      <a-row>
        <a-col :span="8">
          <div class="ml-2 position-relative" style="height: 100px;width: 100px;margin-top: 24px;">
            <img
              :ref="`img${listKey}`"
              class="w-100 h-100 border"
              :alt="getData(item.data, 'description')"
              :src="getData(item.data, 'url')"
              @error="imgError(item, `img${listKey}`)" />
            <div class="link_copy" @click="copyLink(item.data)">{{ $t('common.copy_link') }}</div>
          </div>
        </a-col>
        <a-col :span="16">
          <div class="text-wrap position-relative">
            <a-card-meta>
              <template #title>
                <div class="card-title" :title="getData(item.data, 'title')">{{ getData(item.data, 'title') }}</div>
              </template>
              <template #description v-if="cardFields['content']">
                <div class="card-content-item mb-2" v-for="value in getData(item.data, 'content')" :key="value.field">
                  <span>{{value.title}}：</span><slot-dom :dom="getDom(value, item.data)" />
                </div>
              </template>
            </a-card-meta>
            <div class="primary-btn-wrap position-absolute mb-2">
              <actions :options="getOptions(item, 'primaryActions')" :row="item.data" :button-block="true" />
            </div>
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script>
import Actions from '@/components/PageList/Actions'
import invalidImg from '../../assets/images/invalidImg.svg'
import CardMixin from './card'

export default {
  name: 'HorizontalCard',
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
      item: this.listItem,
      cardBodyStyle: { padding: 0 },
      cardHeadStyle: {
        position: 'absolute',
        padding: 0,
        right: 0,
        borderBottom: 0,
        minHeight: 'auto',
        zIndex: 99,
      },
    }
  },
  watch: {
    listItem (newVal) {
      this.item = newVal
    },
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

.card-wrap {
  .text-wrap {
    height: 200px;
    padding: 24px;
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
  .card-content-item {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    font-size: 12px;
    :deep(.status),
    :deep(.status-wrapper) {
      display: inline-flex;
      width: auto;
      max-width: 100%;
      vertical-align: middle;
    }
    :deep(.status-inner-row) {
      width: auto;
    }
  }
}
.link_copy {
  position: absolute;
  top: 0px;
  right: 0px;
  cursor: pointer;
  color: @primary-color;
  font-size: 12px;
  padding: 5px 10px;
  display: none;
  z-index: 2;
}
.card-wrap:hover .link_copy {
  display: block;
}
</style>
