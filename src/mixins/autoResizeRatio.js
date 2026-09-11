export default {
  data () {
    return {
      resizeRatio: 1,
    }
  },
  computed: {
    autoResizeRatioContainerStyle () {
      return {
        transformOrigin: 'left top 0px',
        transform: `scale(${this.resizeRatio}, ${this.resizeRatio})`,
        left: `${(document.body.clientWidth - (1920 * this.resizeRatio)) / 2}px`,
        display: 'flex',
        width: '1920px',
        height: '940px',
        justifyContent: 'center',
        position: 'absolute',
      }
    },
  },
  beforeUnmount () {
    window.removeEventListener('resize', this._onResize)
    if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf)
  },
  mounted () {
    this._onResize = () => {
      if (this._resizeRaf) return
      this._resizeRaf = requestAnimationFrame(() => {
        this._resizeRaf = 0
        this.autoResizeContainer()
      })
    }
    this.autoResizeContainer()
    window.addEventListener('resize', this._onResize, { passive: true })
  },
  methods: {
    autoResizeContainer () {
      const clientWidth = document.body.clientWidth
      const clientHeight = document.body.clientHeight
      this.ratioX = clientWidth / 1920
      this.ratioY = clientHeight / 940
      let ratio = Math.min(this.ratioX, this.ratioY)
      if (clientWidth <= 1024 && clientHeight <= 768) {
        ratio = Math.max(this.ratioX, this.ratioY)
      }
      this.resizeRatio = ratio
    },
  },
}
