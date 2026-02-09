/// <reference types="vite/client" />

declare module 'svg-pan-zoom' {
  interface SvgPanZoomOptions {
    controlIconsEnabled?: boolean
    fit?: boolean
    center?: boolean
    minZoom?: number
    maxZoom?: number
    zoomScaleSensitivity?: number
    onZoom?: (zoom: number) => void
  }
  interface SvgPanZoomInstance {
    zoomIn(): void
    zoomOut(): void
    resize(): void
    fit(): void
    center(): void
    getZoom(): number
    destroy(): void
  }
  function svgPanZoom(svg: SVGElement | string, options?: SvgPanZoomOptions): SvgPanZoomInstance
  export default svgPanZoom
}
