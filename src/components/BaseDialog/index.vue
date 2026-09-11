<template>
  <!-- 默认支持拖拽 -->
  <a-modal
    v-if="drag"
    :open="true"
    :destroy-on-close="true"
    :keyboard="false"
    :zIndex="zIndex"
    :width="width"
    :mask-closable="false"
    @cancel="cancel"
    v-bind="modalProps"
    :wrap-class-name="wrapClassName">
    <template v-slot:title>
      <div class="base-dialog-header">
        <slot name="header">
          <template v-if="legacyHeaderVnodes.length">
            <component
              v-for="(vn, idx) in legacyHeaderVnodes"
              :key="'lh-' + idx"
              :is="vn" />
          </template>
          <template v-else>Dialog default header</template>
        </slot>
      </div>
    </template>
    <div class="base-dialog-body scroll-dialog-body">
      <slot name="body">
        <template v-if="legacyBodyVnodes.length">
          <component
            v-for="(vn, idx) in legacyBodyVnodes"
            :key="'lb-' + idx"
            :is="vn" />
        </template>
        <template v-else>Dialog default body</template>
      </slot>
    </div>
    <template v-slot:footer>
      <div class="base-dialog-footer">
        <slot name="footer">
          <template v-if="legacyFooterVnodes.length">
            <component
              v-for="(vn, idx) in legacyFooterVnodes"
              :key="'lf-' + idx"
              :is="vn" />
          </template>
          <template v-else>Dialog default footer</template>
        </slot>
      </div>
    </template>
  </a-modal>
  <!-- 不支持支持拖拽 -->
  <a-modal
    v-else
    :open="true"
    :destroy-on-close="true"
    :keyboard="false"
    :zIndex="zIndex"
    :width="width"
    :mask-closable="false"
    @cancel="cancel"
    v-bind="modalProps"
    :wrap-class-name="wrapClassName">
    <template v-slot:title>
      <div class="base-dialog-header">
        <slot name="header">
          <template v-if="legacyHeaderVnodes.length">
            <component
              v-for="(vn, idx) in legacyHeaderVnodes"
              :key="'lh2-' + idx"
              :is="vn" />
          </template>
          <template v-else>Dialog default header</template>
        </slot>
      </div>
    </template>
    <div class="base-dialog-body scroll-dialog-body">
      <slot name="body">
        <template v-if="legacyBodyVnodes.length">
          <component
            v-for="(vn, idx) in legacyBodyVnodes"
            :key="'lb2-' + idx"
            :is="vn" />
        </template>
        <template v-else>Dialog default body</template>
      </slot>
    </div>
    <template v-slot:footer>
      <div class="base-dialog-footer">
        <slot name="footer">
          <template v-if="legacyFooterVnodes.length">
            <component
              v-for="(vn, idx) in legacyFooterVnodes"
              :key="'lf2-' + idx"
              :is="vn" />
          </template>
          <template v-else>Dialog default footer</template>
        </slot>
      </div>
    </template>
  </a-modal>
</template>

<script>
import { Comment, Fragment, cloneVNode } from 'vue'
import { bindDialogDrag, unbindDialogDrag } from '@/directives/drag'

function flattenVnodes (vnodes) {
  const out = []
  const walk = (arr) => {
    if (!arr) return
    const list = Array.isArray(arr) ? arr : [arr]
    for (let i = 0; i < list.length; i++) {
      const vn = list[i]
      if (!vn || vn.type === Comment) continue
      if (vn.type === Fragment) {
        walk(vn.children)
      } else {
        out.push(vn)
      }
    }
  }
  walk(vnodes)
  return out
}

function pickLegacySlotVnodes (vm, slotName) {
  const d = flattenVnodes(vm.$slots.default?.() || [])
  const out = []
  for (let i = 0; i < d.length; i++) {
    const vn = d[i]
    const name = vn.props && vn.props.slot
    if (name === slotName) {
      out.push(cloneVNode(vn, { slot: undefined }))
    }
  }
  return out
}

export default {
  name: 'BaseDialog',
  props: {
    width: {
      type: [Number, String],
      default: 800,
    },
    modalProps: {
      type: Object,
      default: () => ({}),
    },
    zIndex: {
      type: Number,
      default: 1000,
    },
    drag: {
      type: Boolean,
      default: true,
    },
  },
  data () {
    return {
      dragWrapId: `bdw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    }
  },
  provide: {
    inBaseDialog: true,
  },
  computed: {
    wrapClassName () {
      return `base-dialog-wrap ${this.dragWrapId}`
    },
    // Vue 3 编译器不会把子节点上的 `slot="header|body|footer"` 变成具名插槽，它们会落在 default 里；
    // 旧业务弹框大量依赖 BaseDialog + div slot="xxx"，这里从 default 中按 props.slot 分流。
    legacyHeaderVnodes () {
      return pickLegacySlotVnodes(this, 'header')
    },
    legacyBodyVnodes () {
      return pickLegacySlotVnodes(this, 'body')
    },
    legacyFooterVnodes () {
      return pickLegacySlotVnodes(this, 'footer')
    },
  },
  mounted () {
    if (this.drag) this.setupDialogDrag()
  },
  beforeUnmount () {
    this.teardownDialogDrag()
  },
  methods: {
    setupDialogDrag () {
      const tryBind = () => {
        const wrap = document.querySelector(`.${this.dragWrapId}`)
        if (!wrap) return false
        const header = wrap.querySelector('.ant-modal-header')
        if (!header) return false
        this._dragWrap = wrap
        bindDialogDrag(wrap)
        return true
      }
      if (tryBind()) return
      this._dragMo = new MutationObserver(() => {
        if (tryBind() && this._dragMo) {
          this._dragMo.disconnect()
          this._dragMo = null
        }
      })
      this._dragMo.observe(document.body, { childList: true, subtree: true })
    },
    teardownDialogDrag () {
      if (this._dragMo) {
        this._dragMo.disconnect()
        this._dragMo = null
      }
      if (this._dragWrap) {
        unbindDialogDrag(this._dragWrap)
        this._dragWrap = null
      }
    },
    cancel () {
      this.$emit('cancel')
    },
  },
}
</script>

<style lang="less">
// wrap 挂到 body，需非 scoped；分割线与内容同宽，并保留线与内容间距
.base-dialog-wrap {
  .ant-modal-header {
    position: relative;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: none;
    cursor: move;
    user-select: none;
    box-shadow: none;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1px;
      background: #f0f0f0;
    }
  }
  .ant-modal-body {
    padding-top: 0;
  }
  .ant-modal-footer {
    position: relative;
    margin-top: 16px;
    padding-top: 12px;
    border-top: none;
    box-shadow: none;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: 1px;
      background: #f0f0f0;
    }
  }
}
</style>
