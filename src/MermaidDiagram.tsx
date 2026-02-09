import { useState, useRef, useCallback, useEffect } from 'react'

const MIN_SCALE = 0.2
const MAX_SCALE = 15
const SCALE_STEP = 1.2

interface ZoomPanMermaidProps {
  svg: string
}

export function ZoomPanMermaid({ svg }: ZoomPanMermaidProps) {
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const panStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))

  const fitToViewport = useCallback(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return
    const svgEl = content.querySelector('svg') as SVGSVGElement | null
    if (!svgEl) return

    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    if (vw <= 0 || vh <= 0) return

    const w = svgEl.width.baseVal?.value ?? svgEl.getBBox().width
    const h = svgEl.height.baseVal?.value ?? svgEl.getBBox().height
    if (w <= 0 || h <= 0) return

    const newScale = clampScale(Math.min(vw / w, vh / h))
    setScale(newScale)
    setTranslate({
      x: (vw - w * newScale) / 2,
      y: (vh - h * newScale) / 2,
    })
  }, [])

  const zoomIn = useCallback(() => setScale((s) => clampScale(s * SCALE_STEP)), [])
  const zoomOut = useCallback(() => setScale((s) => clampScale(s / SCALE_STEP)), [])

  const exitFullscreen = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!document.fullscreenElement) return
    const doc = document as Document & { exitFullscreen?: () => Promise<void>; webkitExitFullscreen?: () => Promise<void> }
    if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {})
    else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen().catch(() => {})
  }, [])

  const enterFullscreen = useCallback(() => {
    const el = viewportRef.current
    if (!el || document.fullscreenElement) return
    const elAny = el as HTMLElement & { requestFullscreen?: () => Promise<void>; webkitRequestFullscreen?: () => Promise<void> }
    if (elAny.requestFullscreen) elAny.requestFullscreen().catch(() => {})
    else if (elAny.webkitRequestFullscreen) elAny.webkitRequestFullscreen().catch(() => {})
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const delta = e.deltaY > 0 ? 1 / SCALE_STEP : SCALE_STEP
      setScale((s) => clampScale(s * delta))
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      panStartRef.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y }
      setIsPanning(true)
    }

    const onMouseMove = (e: MouseEvent) => {
      const start = panStartRef.current
      if (start === null) return
      setTranslate({ x: start.tx + (e.clientX - start.x), y: start.ty + (e.clientY - start.y) })
    }

    const onMouseUp = () => {
      panStartRef.current = null
      setIsPanning(false)
    }

    const onMouseLeave = () => {
      panStartRef.current = null
      setIsPanning(false)
    }

    viewport.addEventListener('wheel', onWheel, { passive: false })
    viewport.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    viewport.addEventListener('mouseleave', onMouseLeave)
    return () => {
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      viewport.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [translate.x, translate.y])

  useEffect(() => {
    const t = setTimeout(fitToViewport, 80)
    return () => clearTimeout(t)
  }, [svg, fitToViewport])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      if (document.fullscreenElement) {
        requestAnimationFrame(() => setTimeout(fitToViewport, 120))
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    }
  }, [fitToViewport])

  return (
    <div
      className={`mermaid-zoom-container${isFullscreen ? ' mermaid-zoom-container--fullscreen' : ''}`}
    >
      <div className="mermaid-zoom-toolbar">
        <button type="button" className="mermaid-zoom-btn" onClick={zoomIn} title="Zoom avant">
          +
        </button>
        <button type="button" className="mermaid-zoom-btn" onClick={zoomOut} title="Zoom arrière">
          −
        </button>
        <button type="button" className="mermaid-zoom-btn" onClick={fitToViewport} title="Ajuster à l'écran">
          Reset
        </button>
        <button
          type="button"
          className="mermaid-zoom-btn mermaid-zoom-btn--fullscreen"
          onClick={isFullscreen ? exitFullscreen : enterFullscreen}
          title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
        >
          {isFullscreen ? '✕' : '⛶'}
        </button>
        <span className="mermaid-zoom-label">{Math.round(scale * 100)}%</span>
      </div>
      <div
        ref={viewportRef}
        className="mermaid-zoom-viewport"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div
          ref={contentRef}
          className="mermaid-zoom-content"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <div className="mermaid-zoom-svg-inner" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      </div>
      <p className="mermaid-zoom-hint">Scroll: zoom · Drag: pan</p>
    </div>
  )
}
