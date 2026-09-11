import scopeApp from '@scope/store/modules/app'

// 将 scope 下的 app store 模块挂到全局的 app 命名空间，兼容老代码里对 state.app / app/* 的访问
export default scopeApp
