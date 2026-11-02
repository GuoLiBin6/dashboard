<template>
  <div id="k8s-xterm" ref="xtermWrapper" class="mt-3">
    <div id="xterm" style="min-height: 600px;" />
  </div>
</template>

<script>
import querystring from 'qs'
import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'
import 'xterm/src/xterm.css'
import io from 'socket.io-client'

// xterm 默认前景是纯白 #fff，而页面正文是 rgba(255,255,255,.88)（黑底上等效
// #e0e0e0）。终端底色本来就是黑，明暗模式下都保留，但正文统一压到 #e0e0e0，
// 避免终端比页面其他文字更刺眼；ANSI 色相不动，只调默认前景 / 光标 / 选中态。
const TERM_THEME = {
  foreground: '#e0e0e0',
  background: '#000000',
  cursor: '#e0e0e0',
  cursorAccent: '#000000',
  selection: 'rgba(255, 255, 255, 0.25)',
}

export default {
  name: 'Xterm',
  props: {
    connectParams: {
      type: String,
      required: true,
    },
    height: {
      type: Number,
      default: 600,
    },
  },
  data () {
    return {
      socket: null,
      term: null,
    }
  },
  watch: {
    connectParams: {
      handler (val, oval) {
        if (val) {
          this.initTerminal()
        } else {
          this.socket && this.socket.close()
          this._resetDom()
        }
      },
      immediate: true,
    },
    height (val, oval) {
      if (val) {
        const terminalDom = document.getElementById('xterm')
        terminalDom.style.minHeight = val + 'px'
        this.term && this.term.fit()
      }
    },
  },
  beforeUnmount () {
    this._socketClose()()
  },
  methods: {
    _resetDom () {
      const wrapper = this.$refs.xtermWrapper
      const terminalDom = document.getElementById('xterm')
      if (terminalDom && wrapper) {
        wrapper.removeChild(terminalDom)
      }
    },
    _createDom () {
      this._resetDom()
      const wrapper = this.$refs.xtermWrapper
      const newTerminalDom = document.createElement('div')
      newTerminalDom.setAttribute('id', 'xterm')
      wrapper.appendChild(newTerminalDom)
      newTerminalDom.style.minHeight = this.height + 'px'
      return newTerminalDom
    },
    initTerminal () {
      if (!this.connectParams) return
      const param = querystring.parse(this.connectParams)
      Terminal.applyAddon(fit)
      this.socket = io(param.api_server, {
        transports: ['websocket'],
        path: '/connect',
        query: {
          access_token: param.access_token,
        },
      })
      this.term = new Terminal({
        cols: 80,
        rows: 24,
        ScrollBar: true,
        // 明暗模式统一用同一套前景（见 TERM_THEME）
        theme: TERM_THEME,
      })
      const terminalDom = this._createDom()
      this.term.open(terminalDom)
      this.term.focus()
      // term.fit()
      this.term.on('resize', size => {
        this.socket.emit('resize', [size.cols, size.rows])
      })
      this.term.on('data', data => this.socket.emit('input', data))
      this.term.on('keypress', (val, e) => {
        e.preventDefault()
      })
      this.socket.on('output', arrayBuffer => {
        this.term.write(arrayBuffer)
      })
      this.socket.on('disconnection', this._socketClose())
      this.socket.on('connect_error', this._socketClose())
      this.socket.on('disconnect', this._socketClose())
      this.socket.on('disconnecting', this._socketClose())
      window.addEventListener('resize', () => {
        this.term.fit()
      })
      this.term.fit()
    },
    _socketClose () {
      return () => {
        console.log('Connection lose!!!')
        this.socket && this.socket.close()
        this.$emit('close')
      }
    },
  },
}
</script>
