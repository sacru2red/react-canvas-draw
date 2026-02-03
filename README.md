<div align="center">
<h1>React Canvas Draw</h1>
</div>

> A simple yet powerful canvas-drawing component for React ([Demo](https://sacru2red.github.io/react-canvas-draw/))

[![npm package][npm-badge]][npm] [![downloads][downloads-badge]][npmtrends] [![MIT License][license-badge]][license]

[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors) [![PRs Welcome][prs-badge]][prs]

[![Watch on GitHub][github-watch-badge]][github-watch] [![Star on GitHub][github-star-badge]][github-star]

[![Edit 6lv410914w](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/6lv410914w)

## Installation

Install via NPM:

```
npm install react-canvas-draw --save
```

or YARN:

```
yarn add react-canvas-draw
```

## Usage

```javascript
import React from 'react'
import ReactDOM from 'react-dom'
import CanvasDraw from 'react-canvas-draw'

ReactDOM.render(<CanvasDraw />, document.getElementById('root'))
```

For more examples, like saving and loading a drawing ==> look into the [`/demo/src` folder](https://github.com/sacru2red/react-canvas-draw/tree/main/demo/src).

### Props

These are the defaultProps of CanvasDraw. You can pass along any of these props to customize the CanvasDraw component. Examples of how to use the props are also shown in the [`/demo/src` folder](https://github.com/sacru2red/react-canvas-draw/tree/main/demo/src).

```javascript
  static defaultProps = {
    onChange: null
    loadTimeOffset: 5,
    lazyRadius: 30,
    brushRadius: 12,
    brushColor: "#444",
    catenaryColor: "#0a0302",
    gridColor: "rgba(150,150,150,0.17)",
    hideGrid: false,
    canvasWidth: 400,
    canvasHeight: 400,
    disabled: false,
    imgSrc: "",
    saveData: null,
    immediateLoading: false,
    hideInterface: false,
    gridSizeX: 25,
    gridSizeY: 25,
    gridLineWidth: 0.5,
    hideGridX: false,
    hideGridY: false
    enablePanAndZoom: false,
    mouseZoomFactor: 0.01,
    zoomExtents: { min: 0.33, max: 3 },
  };
```

### Functions

Useful functions that you can call, e.g. when having a reference to this component:

- `getSaveData()` returns the drawing's save-data as a stringified object
- `loadSaveData(saveData: String, immediate: Boolean)` loads a previously saved drawing using the saveData string, as well as an optional boolean flag to load it immediately, instead of live-drawing it.
- `getDataURL(fileType, useBgImage, backgroundColour)` will export the canvas to a data URL, which can subsequently be used to share or manipulate the image file.
- `clear()` clears the canvas completely, including previously erased lines, and resets the view. After a clear, `undo()` will have no effect.
- `eraseAll()` clears the drawn lines but retains their data; calling `undo()` can restore the erased lines. _Note: erased lines are not included in the save data._
- `resetView()` resets the canvas' view to defaults. Has no effect if the `enablePanAndZoom` property is `false`.
- `undo()` removes the latest change to the drawing. This includes everything drawn since the last MouseDown event.

## Local Development

이 프로젝트는 현재 **Vite** 기반으로 로컬 개발/데모를 실행합니다.

- `npm install`
- `npm run dev` (demo 개발 서버)
- `npm run build` (라이브러리 빌드: `es/`, `lib/`, `umd/` + 타입 `type/`)

## Tips

If you want to save large strings, like the stringified JSON of a drawing, I recommend you use [pieroxy/lz-string](https://github.com/pieroxy/lz-string) for compression. It's LZ compression will bring down your long strings to only ~10% of its original size.

## Acknowledgement

The [lazy-brush](https://github.com/dulnan/lazy-brush) project as well as its demo app by [dulnan](https://github.com/dulnan) have been a heavy influence.

I borrowed a lot of the logic and actually used lazy-brush during the push to v1 of react-canvas-draw. Without it, react-canvas-draw would most likely still be pre v1 and wouldn't feel as good.

## Contributors

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!

## License

MIT, see [LICENSE](https://github.com/sacru2red/react-canvas-draw/blob/main/LICENSE) for details.

[npm-badge]: https://img.shields.io/npm/v/react-canvas-draw.png?style=flat-square
[npm]: https://www.npmjs.org/package/react-canvas-draw
[node]: https://nodejs.org
[downloads-badge]: https://img.shields.io/npm/dm/react-canvas-draw.svg?style=flat-square
[npmtrends]: http://www.npmtrends.com/react-canvas-draw
[license-badge]: https://img.shields.io/npm/l/react-canvas-draw.svg?style=flat-square
[license]: https://github.com/sacru2red/react-canvas-draw/blob/main/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[github-watch-badge]: https://img.shields.io/github/watchers/sacru2red/react-canvas-draw.svg?style=social
[github-watch]: https://github.com/sacru2red/react-canvas-draw/watchers
[github-star-badge]: https://img.shields.io/github/stars/sacru2red/react-canvas-draw.svg?style=social
[github-star]: https://github.com/sacru2red/react-canvas-draw/stargazers
