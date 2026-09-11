<script>
/**
 * PageListLite — 与 PageList 等价的旁路入口（PageList 表格层已切到本目录 Table）。
 * 业务可继续用 <page-list>；<page-list-lite> 保留兼容。
 */
import PageList from '@/components/PageList/index.vue'

export default {
  name: 'PageListLite',
  extends: PageList,
}
</script>
