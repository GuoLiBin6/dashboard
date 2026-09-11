declare module 'virtual:dialog-registry' {
  const loaders: Record<string, () => Promise<{ default: any }>>
  export default loaders
}

declare module 'virtual:sidepage-registry' {
  const loaders: Record<string, () => Promise<{ default: any }>>
  export default loaders
}
