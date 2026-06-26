import * as THREE from 'three'

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.Camera | null = null

/**
 * 截图捕获工具
 * 由 R3F 内部组件在挂载时注册引用，外部 UI 按钮调用 capture()
 */
export const screenshotCapture = {
  /** 由 R3F 内部组件调用，注册渲染器 / 场景 / 相机引用 */
  set(gl: THREE.WebGLRenderer, s: THREE.Scene, c: THREE.Camera) {
    renderer = gl
    scene = s
    camera = c
  },

  /** 手动渲染一帧并导出为 PNG 的 dataURL，失败返回 null */
  capture(): string | null {
    if (!renderer || !scene || !camera) return null
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL('image/png')
  },

  /** 捕获并自动下载 */
  download(filename = `scene-${Date.now()}.png`) {
    const dataUrl = this.capture()
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },
}
