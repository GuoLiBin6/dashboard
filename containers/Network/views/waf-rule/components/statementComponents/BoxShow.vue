<template>
  <div class="box-show-container">{{value}}</div>
</template>

<script>

export default {
  name: 'BoxShow',
  props: {
    value: String,
  },
  data () {
    return {
    }
  },
  computed: {
  },
  watch: {
  },
  created () {
  },
  methods: {
  },
}
</script>
<style scoped>
.box-show-container{
  width: 100%;
  min-height: 32px;
  border: 1px solid #e8e8e8;
  padding: 0 11px;
  line-height: 32px;
  word-wrap: break-word;
  margin-top: 5px;
}
</style>
