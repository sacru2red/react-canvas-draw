import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { LazyBrush } from 'lazy-brush'
import ResizeObserver from 'resize-observer-polyfill'
import CoordinateSystem, { IDENTITY } from './coordinateSystem'
import drawImage from './drawImage'
import {
  DefaultState,
  DisabledState,
  DrawingState,
  PanState,
  ScaleOrPanState,
  TouchPanState,
  WaitForPinchState,
} from './interactionStateMachine'
import makePassiveEventOption from './makePassiveEventOption'
import {
  CanvasDrawApi,
  CanvasDrawProps,
  CoordinateSystemView,
  Line,
  Point,
  ResolvedCanvasDrawProps,
} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPointLike(value: unknown): value is Point {
  if (!isRecord(value)) return false
  return typeof value.x === 'number' && typeof value.y === 'number'
}

function midPointBtw(p1: Point, p2: Point) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2,
  }
}

const canvasStyle: React.CSSProperties = {
  display: 'block',
  position: 'absolute',
}

// The order of these is important: grid > drawing > temp > interface
const canvasTypes = ['grid', 'drawing', 'temp', 'interface'] as const

const DEFAULT_PROPS: ResolvedCanvasDrawProps = {
  onChange: undefined,
  loadTimeOffset: 5,
  lazyRadius: 12,
  brushRadius: 10,
  brushColor: '#444',
  catenaryColor: '#0a0302',
  gridColor: 'rgba(150,150,150,0.17)',
  backgroundColor: '#FFF',
  hideGrid: false,
  canvasWidth: 400,
  canvasHeight: 400,
  disabled: false,
  imgSrc: '',
  saveData: '',
  immediateLoading: false,
  hideInterface: false,
  gridSizeX: 25,
  gridSizeY: 25,
  gridLineWidth: 0.5,
  hideGridX: false,
  hideGridY: false,
  enablePanAndZoom: false,
  mouseZoomFactor: 0.01,
  zoomExtents: { min: 0.33, max: 3 },
  clampLinesToDocument: false,
  className: undefined,
  style: undefined,
}

type InteractionState =
  | DefaultState
  | DisabledState
  | PanState
  | WaitForPinchState
  | DrawingState
  | ScaleOrPanState
  | TouchPanState

type CanvasDrawRuntime = CanvasDrawApi & {
  interactionSM: InteractionState
  chainLength?: number
  canvasObserver?: ResizeObserver
  canvasContainer?: HTMLDivElement | null
  image?: HTMLImageElement
  redrawImage: () => void
  drawImage: () => void
  drawGrid: (ctx?: CanvasRenderingContext2D | null) => void
  drawInterface: (
    ctx: CanvasRenderingContext2D | null | undefined,
    pointer: Point,
    brush: Point,
  ) => void
  clearWindow: (ctx?: CanvasRenderingContext2D | null) => void
  clearExceptErasedLines: () => void
  simulateDrawingLines: (args: { lines: Line[] | undefined; immediate: boolean }) => void
  setCanvasSize: (canvas: HTMLCanvasElement, width: number, height: number) => void
  inClientSpace: (
    ctxs: Array<CanvasRenderingContext2D | null | undefined>,
    action: () => void,
  ) => void
  loop: (opts?: { once?: boolean }) => void
  applyView: () => void
  handleCanvasResize: (entries: ResizeObserverEntry[]) => void
}

const CanvasDraw = forwardRef<CanvasDrawApi, CanvasDrawProps>(function CanvasDraw(rawProps, ref) {
  const props: ResolvedCanvasDrawProps = { ...DEFAULT_PROPS, ...rawProps }
  const apiRef = useRef<CanvasDrawRuntime | null>(null)
  if (!apiRef.current) {
    const coordSystem = new CoordinateSystem({
      scaleExtents: props.zoomExtents,
      documentSize: { width: props.canvasWidth, height: props.canvasHeight },
    })

    apiRef.current = {
      props,
      coordSystem,
      canvas: {},
      ctx: {},
      lines: [],
      erasedLines: [],
      points: [],
      mouseHasMoved: true,
      valuesChanged: true,
      isDrawing: false,
      isPressing: false,
      deferRedrawOnViewChange: false,
      interactionSM: new DefaultState(),

      // public API (real implementations are wired below)
      undo: () => {},
      eraseAll: () => {},
      clear: () => {},
      resetView: () => {},
      setView: (_view?: Partial<CoordinateSystemView>) => ({ scale: 1, x: 0, y: 0 }),
      getSaveData: () => '',
      getDataURL: () => '',
      loadSaveData: () => {},
      clampPointToDocument: (p) => p,
      drawPoints: () => {},
      saveLine: () => {},

      // internal functions (wired below)
      redrawImage: () => {},
      drawImage: () => {},
      drawGrid: () => {},
      drawInterface: () => {},
      clearWindow: () => {},
      clearExceptErasedLines: () => {},
      simulateDrawingLines: () => {},
      setCanvasSize: () => {},
      inClientSpace: () => {},
      loop: () => {},
      applyView: () => {},
      handleCanvasResize: () => {},
    }
  }

  const api = apiRef.current!
  api.props = props

  const rafIdRef = useRef<number | null>(null)
  const timeoutIdRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const prevInterfaceCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const prevPropsJsonRef = useRef<string>('')

  useImperativeHandle(ref, () => api, [])

  const triggerOnChange = useCallback(() => {
    const onChange = apiRef.current?.props?.onChange
    const runtime = apiRef.current
    if (onChange && runtime) {
      onChange(runtime)
    }
  }, [])

  const inClientSpace = useCallback(
    (ctxs: Array<CanvasRenderingContext2D | null | undefined>, action: () => void) => {
      ctxs.forEach((ctx) => {
        if (ctx) {
          ctx.save()
          ctx.setTransform(IDENTITY.a, IDENTITY.b, IDENTITY.c, IDENTITY.d, IDENTITY.e, IDENTITY.f)
        }
      })

      try {
        action()
      } finally {
        ctxs.forEach((ctx) => {
          if (ctx) {
            ctx.restore()
          }
        })
      }
    },
    [],
  )

  const clearWindow = useCallback(
    (ctx?: CanvasRenderingContext2D | null) => {
      inClientSpace([ctx], () => {
        if (ctx == null) {
          return
        }
        return ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      })
    },
    [inClientSpace],
  )

  const setCanvasSize = useCallback((canvas: HTMLCanvasElement, width: number, height: number) => {
    canvas.width = width
    canvas.height = height
    canvas.style.width = width.toString()
    canvas.style.height = height.toString()
  }, [])

  const clampPointToDocument = useCallback((point: Point) => {
    const p = apiRef.current
    if (!p) return point

    if (p.props.clampLinesToDocument) {
      return {
        x: Math.max(Math.min(point.x, p.props.canvasWidth), 0),
        y: Math.max(Math.min(point.y, p.props.canvasHeight), 0),
      }
    }
    return point
  }, [])

  const redrawImage = useCallback(() => {
    const p = apiRef.current
    if (!p) return
    p.image && p.image.complete && drawImage({ ctx: p.ctx.grid, img: p.image })
  }, [])

  const drawImageImpl = useCallback(() => {
    const p = apiRef.current
    if (!p) return
    if (!p.props.imgSrc) return

    p.image = new Image()
    // Prevent SecurityError "Tainted canvases may not be exported." #70
    p.image.crossOrigin = 'anonymous'
    p.image.onload = redrawImage
    p.image.src = p.props.imgSrc
  }, [redrawImage])

  const drawGrid = useCallback(
    (ctx?: CanvasRenderingContext2D | null) => {
      const p = apiRef.current
      if (!p) return
      if (p.props.hideGrid) return

      clearWindow(ctx)
      if (ctx == null) {
        return
      }

      const gridSize = 25
      const bounds = p.coordSystem.canvasBounds
      const viewMin = bounds ? bounds.viewMin : { x: NaN, y: NaN }
      const viewMax = bounds ? bounds.viewMax : { x: NaN, y: NaN }
      const minx = Math.floor(viewMin.x / gridSize - 1) * gridSize
      const miny = Math.floor(viewMin.y / gridSize - 1) * gridSize
      const maxx = viewMax.x + gridSize
      const maxy = viewMax.y + gridSize

      ctx.beginPath()
      ctx.setLineDash([5, 1])
      ctx.setLineDash([])
      ctx.strokeStyle = p.props.gridColor
      ctx.lineWidth = p.props.gridLineWidth

      if (!p.props.hideGridX) {
        let countX = minx
        const gridSizeX = p.props.gridSizeX
        while (countX < maxx) {
          countX += gridSizeX
          ctx.moveTo(countX, miny)
          ctx.lineTo(countX, maxy)
        }
        ctx.stroke()
      }

      if (!p.props.hideGridY) {
        let countY = miny
        const gridSizeY = p.props.gridSizeY
        while (countY < maxy) {
          countY += gridSizeY
          ctx.moveTo(minx, countY)
          ctx.lineTo(maxx, countY)
        }
        ctx.stroke()
      }
    },
    [clearWindow],
  )

  const drawInterface = useCallback(
    (ctx: CanvasRenderingContext2D | null | undefined, pointer: Point, brush: Point) => {
      const p = apiRef.current
      if (!p) return
      if (p.props.hideInterface) return
      if (ctx == null) return

      clearWindow(ctx)

      // Draw brush preview
      ctx.beginPath()
      ctx.fillStyle = p.props.brushColor
      ctx.arc(brush.x, brush.y, p.props.brushRadius, 0, Math.PI * 2, true)
      ctx.fill()

      // Draw mouse point (the one directly at the cursor)
      ctx.beginPath()
      ctx.fillStyle = p.props.catenaryColor
      ctx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2, true)
      ctx.fill()

      // Draw catenary
      if (p.lazy) {
        if (p.lazy.isEnabled()) {
          ctx.beginPath()
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.setLineDash([2, 4])
          ctx.strokeStyle = p.props.catenaryColor
          ctx.stroke()
        }
      }

      // Draw brush point (the one in the middle of the brush preview)
      ctx.beginPath()
      ctx.fillStyle = p.props.catenaryColor
      ctx.arc(brush.x, brush.y, 2, 0, Math.PI * 2, true)
      ctx.fill()
    },
    [clearWindow],
  )

  const drawPoints = useCallback(
    ({
      points,
      brushColor,
      brushRadius,
    }: {
      points: Point[]
      brushColor: string
      brushRadius: number
    }) => {
      const p = apiRef.current
      if (!p) return

      if (p.ctx.temp) {
        p.ctx.temp.lineJoin = 'round'
        p.ctx.temp.lineCap = 'round'
        p.ctx.temp.strokeStyle = brushColor
      }

      clearWindow(p.ctx.temp)
      if (p.ctx.temp) {
        p.ctx.temp.lineWidth = brushRadius * 2
      }

      let p1 = points[0]
      let p2 = points[1]

      if (p.ctx.temp) {
        p.ctx.temp.moveTo(p2.x, p2.y)
        p.ctx.temp.beginPath()
      }

      for (let i = 1, len = points.length; i < len; i++) {
        const midPoint = midPointBtw(p1, p2)
        if (p.ctx.temp) {
          p.ctx.temp.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y)
        }
        p1 = points[i]
        p2 = points[i + 1]
      }

      if (p.ctx.temp) {
        p.ctx.temp.lineTo(p1.x, p1.y)
        p.ctx.temp.stroke()
      }
    },
    [clearWindow],
  )

  const saveLine = useCallback(
    (params?: { brushColor: string; brushRadius: number }) => {
      const p = apiRef.current
      if (!p) return
      const { brushColor, brushRadius } = params || {}
      if (p.points.length < 2) return

      p.lines.push({
        points: [...p.points],
        brushColor: brushColor || p.props.brushColor,
        brushRadius: brushRadius || p.props.brushRadius,
      })

      p.points.length = 0

      inClientSpace([p.ctx.drawing, p.ctx.temp], () => {
        if (p.ctx.drawing && p.canvas.temp) {
          p.ctx.drawing.drawImage(
            p.canvas.temp,
            0,
            0,
            p.canvas.drawing ? p.canvas.drawing.width || NaN : NaN,
            p.canvas.drawing ? p.canvas.drawing.height || NaN : NaN,
          )
        }
      })

      clearWindow(p.ctx.temp)
      triggerOnChange()
    },
    [clearWindow, inClientSpace, triggerOnChange],
  )

  const clearExceptErasedLines = useCallback(() => {
    const p = apiRef.current
    if (!p) return
    p.lines = []
    p.valuesChanged = true
    clearWindow(p.ctx.drawing)
    clearWindow(p.ctx.temp)
  }, [clearWindow])

  const simulateDrawingLines = useCallback(
    ({ lines, immediate }: { lines: Line[] | undefined; immediate: boolean }) => {
      const p = apiRef.current
      if (!p) return

      let curTime = 0
      const timeoutGap = immediate ? 0 : p.props.loadTimeOffset

      if (!lines) {
        return
      }

      lines.forEach((line) => {
        const { points, brushColor, brushRadius } = line

        if (immediate) {
          drawPoints({ points, brushColor, brushRadius })
          p.points = points
          saveLine({ brushColor, brushRadius })
          return
        }

        for (let i = 1; i < points.length; i++) {
          curTime += timeoutGap
          window.setTimeout(() => {
            drawPoints({ points: points.slice(0, i + 1), brushColor, brushRadius })
          }, curTime)
        }

        curTime += timeoutGap
        window.setTimeout(() => {
          p.points = points
          saveLine({ brushColor, brushRadius })
        }, curTime)
      })
    },
    [drawPoints, saveLine],
  )

  const loop = useCallback(
    (opts: { once?: boolean } = {}) => {
      const p = apiRef.current
      if (!p) return

      const once = opts.once ?? false
      if (p.mouseHasMoved || p.valuesChanged) {
        if (p.lazy) {
          const pointer = p.lazy.getPointerCoordinates()
          const brush = p.lazy.getBrushCoordinates()
          drawInterface(p.ctx.interface, pointer, brush)
          p.mouseHasMoved = false
          p.valuesChanged = false
        }
      }

      if (!once) {
        rafIdRef.current = window.requestAnimationFrame(() => loop())
      }
    },
    [drawInterface],
  )

  const applyView = useCallback(() => {
    const p = apiRef.current
    if (!p) return
    if (!p.ctx.drawing) return

    canvasTypes
      .map((name) => p.ctx[name])
      .forEach((ctx) => {
        clearWindow(ctx)
        const m = p.coordSystem.transformMatrix
        if (ctx) {
          ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f)
        }
      })

    if (!p.deferRedrawOnViewChange) {
      if (p.ctx.grid) {
        drawGrid(p.ctx.grid)
      }
      redrawImage()
      loop({ once: true })

      const lines = p.lines
      p.lines = []
      simulateDrawingLines({ lines, immediate: true })
    }
  }, [clearWindow, drawGrid, loop, redrawImage, simulateDrawingLines])

  const handleCanvasResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      const p = apiRef.current
      if (!p) return
      const saveData = p.getSaveData()
      p.deferRedrawOnViewChange = true
      try {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          if (p.canvas.interface) setCanvasSize(p.canvas.interface, width, height)
          if (p.canvas.drawing) setCanvasSize(p.canvas.drawing, width, height)
          if (p.canvas.temp) setCanvasSize(p.canvas.temp, width, height)
          if (p.canvas.grid) setCanvasSize(p.canvas.grid, width, height)

          p.coordSystem.documentSize = { width, height }
          drawGrid(p.ctx.grid)
          p.drawImage()
          loop({ once: true })
        }
        p.loadSaveData(saveData, true)
      } finally {
        p.deferRedrawOnViewChange = false
      }
    },
    [drawGrid, loop, setCanvasSize],
  )

  const resetView = useCallback(() => {
    apiRef.current!.coordSystem.resetView()
  }, [])

  const setView = useCallback((view?: Partial<CoordinateSystemView>) => {
    return apiRef.current!.coordSystem.setView(view)
  }, [])

  const getSaveData = useCallback(() => {
    const p = apiRef.current
    if (!p) return ''
    return JSON.stringify({
      lines: p.lines,
      width: p.props.canvasWidth,
      height: p.props.canvasHeight,
    })
  }, [])

  const getDataURL = useCallback(
    (fileType: string, useBgImage: boolean, backgroundColour: string) => {
      const p = apiRef.current
      if (!p) return 'Canvas not found'
      const canvasToExport = p.canvas.drawing
      if (!canvasToExport) return 'Canvas not found'

      const context = canvasToExport.getContext('2d')
      if (!context) return 'Canvas context not found'

      const width = canvasToExport.width
      const height = canvasToExport.height
      const storedImageData = context.getImageData(0, 0, width, height)
      const compositeOperation = context.globalCompositeOperation
      context.globalCompositeOperation = 'destination-over'

      if (useBgImage) {
        if (!p.props.imgSrc) return 'Background image source not set'
        p.drawImage()
      } else if (backgroundColour != null) {
        context.fillStyle = backgroundColour
        context.fillRect(0, 0, width, height)
      }

      if (!fileType) fileType = 'png'
      const imageData = canvasToExport.toDataURL(`image/${fileType}`)

      context.clearRect(0, 0, width, height)
      context.putImageData(storedImageData, 0, 0)
      context.globalCompositeOperation = compositeOperation

      return imageData
    },
    [],
  )

  const loadSaveData = useCallback(
    (saveData: unknown, immediate = apiRef.current?.props?.immediateLoading) => {
      const p = apiRef.current
      if (!p) return
      if (typeof saveData !== 'string') {
        throw new Error('saveData needs to be of type string!')
      }

      const parsed: unknown = JSON.parse(saveData)
      if (!isRecord(parsed)) {
        throw new Error('saveData needs to be a JSON object!')
      }

      const lines = parsed.lines
      const width = parsed.width
      const height = parsed.height
      if (!Array.isArray(lines)) {
        throw new Error('saveData.lines needs to be an array!')
      }
      if (typeof width !== 'number' || typeof height !== 'number') {
        throw new Error('saveData.width/height need to be numbers!')
      }

      p.clear()

      if (width === p.props.canvasWidth && height === p.props.canvasHeight) {
        simulateDrawingLines({ lines, immediate: !!immediate })
      } else {
        const scaleX = p.props.canvasWidth / width
        const scaleY = p.props.canvasHeight / height
        const scaleAvg = (scaleX + scaleY) / 2

        simulateDrawingLines({
          lines: lines.map((line: Line) => ({
            ...line,
            points: line.points.map((pt: unknown) => ({
              x: isPointLike(pt) ? pt.x * scaleX : NaN,
              y: isPointLike(pt) ? pt.y * scaleY : NaN,
            })),
            brushRadius: line.brushRadius * scaleAvg,
          })),
          immediate: !!immediate,
        })
      }
    },
    [simulateDrawingLines],
  )

  const undo = useCallback(() => {
    const p = apiRef.current
    if (!p) return
    let lines: Line[] | undefined = []
    if (p.lines.length) {
      lines = p.lines.slice(0, -1)
    } else if (p.erasedLines.length) {
      const popped = p.erasedLines.pop()
      lines = popped ? [popped] : undefined
    }
    p.clearExceptErasedLines()
    p.simulateDrawingLines({ lines, immediate: true })
    triggerOnChange()
  }, [triggerOnChange])

  const eraseAll = useCallback(() => {
    const p = apiRef.current
    if (!p) return
    p.erasedLines.push(...p.lines)
    p.clearExceptErasedLines()
    triggerOnChange()
  }, [triggerOnChange])

  const clear = useCallback(() => {
    const p = apiRef.current
    if (!p) return
    p.erasedLines = []
    p.clearExceptErasedLines()
    p.resetView()
  }, [])

  // 이벤트 핸들러들
  const handleWheel = useCallback((e: WheelEvent) => {
    const p = apiRef.current
    if (!p) return
    p.interactionSM = p.interactionSM.handleMouseWheel(e, p)
  }, [])

  const handleDrawStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const p = apiRef.current
    if (!p) return
    // React SyntheticEvent -> native event로 상태머신에 전달
    const evt = e.nativeEvent
    p.interactionSM = p.interactionSM.handleDrawStart(evt, p)
    p.mouseHasMoved = true
  }, [])

  const handleDrawMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const p = apiRef.current
    if (!p) return
    const evt = e.nativeEvent
    p.interactionSM = p.interactionSM.handleDrawMove(evt, p)
    p.mouseHasMoved = true
  }, [])

  const handleDrawEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const p = apiRef.current
    if (!p) return
    const evt = e.nativeEvent
    p.interactionSM = p.interactionSM.handleDrawEnd(evt, p)
    p.mouseHasMoved = true
  }, [])

  // api 오브젝트에 메서드/헬퍼 연결(상태머신이 "인스턴스"처럼 접근 가능하도록)
  api.inClientSpace = inClientSpace
  api.clearWindow = clearWindow
  api.setCanvasSize = setCanvasSize
  api.clampPointToDocument = clampPointToDocument
  api.drawPoints = drawPoints
  api.saveLine = saveLine
  api.clearExceptErasedLines = clearExceptErasedLines
  api.simulateDrawingLines = simulateDrawingLines
  api.loop = loop
  api.drawInterface = drawInterface
  api.drawGrid = drawGrid
  api.redrawImage = redrawImage
  api.drawImage = drawImageImpl
  api.applyView = applyView
  api.handleCanvasResize = handleCanvasResize

  api.undo = undo
  api.eraseAll = eraseAll
  api.clear = clear
  api.resetView = resetView
  api.setView = setView
  api.getSaveData = getSaveData
  api.getDataURL = getDataURL
  api.loadSaveData = loadSaveData

  // coordSystem view listener는 한 번만 부착
  useEffect(() => {
    const p = apiRef.current
    if (!p) return
    p.coordSystem.attachViewChangeListener(p.applyView)
    // detach API가 없어 cleanup은 생략
  }, [])

  // mount 동작들
  useEffect(() => {
    const p = apiRef.current
    if (!p) return

    p.lazy = new LazyBrush({
      radius: p.props.lazyRadius * window.devicePixelRatio,
      enabled: true,
      initialPoint: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    })
    p.chainLength = p.props.lazyRadius * window.devicePixelRatio

    p.canvasObserver = new ResizeObserver((entries) => p.handleCanvasResize(entries))
    if (containerRef.current) {
      p.canvasObserver.observe(containerRef.current)
    }

    p.drawImage()
    p.loop()

    timeoutIdRef.current = window.setTimeout(() => {
      const initX = window.innerWidth / 2
      const initY = window.innerHeight / 2
      if (p.lazy && p.chainLength) {
        p.lazy.update({ x: initX - p.chainLength / 4, y: initY }, { both: true })
        p.lazy.update({ x: initX + p.chainLength / 4, y: initY }, { both: false })
      }
      p.mouseHasMoved = true
      p.valuesChanged = true
      p.clearExceptErasedLines()

      if (p.props.saveData) {
        p.loadSaveData(p.props.saveData)
      }
    }, 100)

    return () => {
      if (timeoutIdRef.current != null) {
        window.clearTimeout(timeoutIdRef.current)
      }
      if (rafIdRef.current != null) {
        window.cancelAnimationFrame(rafIdRef.current)
      }
      if (p.canvasObserver && containerRef.current) {
        p.canvasObserver.unobserve(containerRef.current)
      }
      if (prevInterfaceCanvasRef.current) {
        prevInterfaceCanvasRef.current.removeEventListener('wheel', handleWheel)
      }
    }
  }, [handleWheel])

  // props 변화 대응 (클래스 componentDidUpdate 이식)
  useEffect(() => {
    const p = apiRef.current
    if (!p) return
    p.chainLength = p.props.lazyRadius * window.devicePixelRatio
    if (p.lazy) {
      p.lazy.setRadius(p.props.lazyRadius * window.devicePixelRatio)
    }
  }, [props.lazyRadius])

  useEffect(() => {
    const p = apiRef.current
    if (!p) return
    if (p.props.saveData) {
      p.loadSaveData(p.props.saveData)
    }
  }, [props.saveData])

  useEffect(() => {
    const json = JSON.stringify(props)
    if (prevPropsJsonRef.current !== '' && prevPropsJsonRef.current !== json) {
      const p = apiRef.current
      if (p) {
        p.valuesChanged = true
      }
    }
    prevPropsJsonRef.current = json
  }, [props])

  useEffect(() => {
    const p = apiRef.current
    if (!p) return
    p.coordSystem.scaleExtents = p.props.zoomExtents
  }, [props.zoomExtents])

  useEffect(() => {
    const p = apiRef.current
    if (!p) return
    if (!p.props.enablePanAndZoom) {
      p.coordSystem.resetView()
    }
  }, [props.enablePanAndZoom])

  useEffect(() => {
    const p = apiRef.current
    if (!p) return
    p.drawImage()
  }, [props.imgSrc])

  const setContainer = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el
    apiRef.current && (apiRef.current.canvasContainer = el)
  }, [])

  const setCanvasRef = useCallback(
    (name: (typeof canvasTypes)[number]) => (canvas: HTMLCanvasElement | null) => {
      const p = apiRef.current
      if (!p) return

      p.canvas[name] = canvas
      p.ctx[name] = canvas ? canvas.getContext('2d') || undefined : undefined

      const isInterface = name === 'interface'
      if (isInterface && canvas) {
        p.coordSystem.canvas = canvas

        // wheel listener를 interface canvas에 직접 부착 (non-passive 옵션)
        if (prevInterfaceCanvasRef.current && prevInterfaceCanvasRef.current !== canvas) {
          prevInterfaceCanvasRef.current.removeEventListener('wheel', handleWheel)
        }
        canvas.addEventListener('wheel', handleWheel, makePassiveEventOption())
        prevInterfaceCanvasRef.current = canvas
      }
    },
    [handleWheel],
  )

  return (
    <div
      className={props.className}
      style={{
        display: 'block',
        background: props.backgroundColor,
        touchAction: 'none',
        width: props.canvasWidth,
        height: props.canvasHeight,
        ...props.style,
      }}
      ref={setContainer}
    >
      {canvasTypes.map((name) => {
        const isInterface = name === 'interface'
        return (
          <canvas
            key={name}
            ref={setCanvasRef(name)}
            style={{ ...canvasStyle }}
            onMouseDown={isInterface ? handleDrawStart : undefined}
            onMouseMove={isInterface ? handleDrawMove : undefined}
            onMouseUp={isInterface ? handleDrawEnd : undefined}
            onMouseOut={isInterface ? handleDrawEnd : undefined}
            onTouchStart={isInterface ? handleDrawStart : undefined}
            onTouchMove={isInterface ? handleDrawMove : undefined}
            onTouchEnd={isInterface ? handleDrawEnd : undefined}
            onTouchCancel={isInterface ? handleDrawEnd : undefined}
          />
        )
      })}
    </div>
  )
})

export default CanvasDraw
