<script>
import { h } from 'vue'

export default {
  name: 'FullScreenLayout',
  render () {
    const content = typeof this.$slots.default === 'function' ? this.$slots.default() : this.$slots.default
    return h('div', { class: 'app-container', style: { height: '100%', minHeight: '100vh' } }, content)
  },
}
</script>
