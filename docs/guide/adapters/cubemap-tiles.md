# Cubemap tiles

<Badges module="cubemap-tiles-adapter"/>

::: module
Reduce the initial loading time and used bandwidth by slicing big cubemap panoramas into many small tiles.

This adapter is available in the [@photo-sphere-viewer/cubemap-tiles-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/cubemap-tiles-adapter) package.
:::

```js:line-numbers
import { CubemapTilesAdapter } from '@photo-sphere-viewer/cubemap-tiles-adapter';

const viewer = new Viewer({
    adapter: CubemapTilesAdapter,
    panorama: {
        faceSize: 6000,
        nbTiles: 8,
        baseUrl: {
            left: 'left_low.jpg',
            front: 'front_low.jpg',
            right: 'right_low.jpg',
            back: 'back_low.jpg',
            top: 'top_low.jpg',
            bottom: 'bottom_low.jpg',
        },
        tileUrl: (face, col, row) => {
            return `${face}_${col}_${row}.jpg`;
        },
    },
});
```

## Example

::: code-demo

```yaml
title: PSV Cubemap Tiles Demo
packages:
    - name: cubemap-adapter
    - name: cubemap-tiles-adapter
```

<<< ./demos-src/cubemap-tiles.js{js:line-numbers}

:::

::: tip Positions definitions
With this adapter, pixel positions require an additional `textureFace` attribute (example: `{ textureFace: 'front', textureX: 200, textureY: 800 }`). The position refers to the full size of the face (first level when using multi-levels tiles).
:::

## Configuration

#### `baseBlur`

-   type: `boolean`
-   default: `true`

Applies a blur filter to the base image (option `baseUrl`).

#### `showErrorTile`

-   type: `boolean`
-   default: `true`

Shows a warning sign on tiles that cannot be loaded.

#### `antialias`

-   type: `boolean`
-   default: `true`

Applies antialiasing to high resolutions tiles.

## Panorama options

When using this adapter, the `panorama` option and the `setPanorama()` method accept an object to configure the tiles.

You may choose to provide a single tiles configuration or multiple configurations which will be applied at different zoom levels, this allows to serve files adapted to the current zoom level and achieve very high resolutions without consuming too much bandwidth.

:::: tabs

::: tab Single level

#### `faceSize` (required)

-   type: `number`

Size in pixel of a face of the cube.

#### `nbTiles` (required)

-   type: `number`

Number of columns and rows on a face. Each tile must be square. Must be power of two (2, 4, 8, 16) and the maximum value is 16.

#### `tileUrl` (required)

-   type: `function: (face, col, row) => string`

Function used to build the URL of a tile. `face` will be one of `'left'|'front'|'right'|'back'|'top'|'bottom'`.
If the function returns `null` the corresponding tile will not be loaded.

#### `pmtiles` (optional)

-   type: `string | File`

Instead of individual tiles URLs, tiles can be read directly from a [PMTiles](https://pmtiles.io) archive. A `string` is interpreted as the URL of the archive and requires HTTP Range and CORS support (S3, CloudFront, nginx...). A `File` is read locally.

#### `tileToZxy` (optional)

-   type: `function: (face, col, row, level) => [z, x, y]`

Converts tile coordinates to PMTiles coordinates, only used with `pmtiles`. Defaults to a 3x2 grid packing of the 6 faces (see [below](#reading-from-a-pmtiles-archive)).

#### `flipTopBottom`

See the [cubemap adapter configuration](./cubemap.md#panorama-options).

#### `baseUrl` (recommended)

-   type: `any`

URL of a low resolution complete panorama image to display while the tiles are loading. It accepts the same format as the standard [cubemap adapter](./cubemap.md#panorama-options).

:::

::: tab Multiple levels

#### `levels` (required)

-   type: `array`

Array of available tiles configurations. Each element is an object with `faceSize` and `nbTiles` (see "Single level"). The best size will be choosen depending on the current zoom level and viewer size.

```js:line-numbers
levels: [
    {
        faceSize: 3000,
        nbTiles: 4,
    },
    {
        faceSize: 6000,
        nbTiles: 8,
    },
    {
        faceSize: 12000,
        nbTiles: 16,
    },
]
```

#### `tileUrl` (required)

-   type: `function: (face, col, row, level) => string`

Function used to build the URL of a tile. `face` will be one of `'left'|'front'|'right'|'back'|'top'|'bottom'`.
If the function returns `null` the corresponding tile will not be loaded.

#### `pmtiles` (optional)

-   type: `string | File`

Instead of individual tiles URLs, tiles can be read directly from a [PMTiles](https://pmtiles.io) archive. A `string` is interpreted as the URL of the archive and requires HTTP Range and CORS support (S3, CloudFront, nginx...). A `File` is read locally.

#### `tileToZxy` (optional)

-   type: `function: (face, col, row, level) => [z, x, y]`

Converts tile coordinates to PMTiles coordinates, only used with `pmtiles`. Defaults to a 3x2 grid packing of the 6 faces (see [below](#reading-from-a-pmtiles-archive)).

#### `flipTopBottom`

See the [cubemap adapter configuration](./cubemap.md#panorama-options).

#### `baseUrl` (recommended)

-   type: `any`

URL of a low resolution complete panorama image to display while the tiles are loading. It accepts the same format as the standard [cubemap adapter](./cubemap.md#panorama-options).

:::

::::

## Reading from a PMTiles archive

All the tiles of the panorama (optionally multiple zoom levels) can be stored in a single [PMTiles](https://pmtiles.io) archive and read directly by the adapter, without any tile server.

```js:line-numbers
panorama: {
    faceSize: 6000,
    nbTiles: 8,
    baseUrl: {
        left: 'left_low.jpg',
        front: 'front_low.jpg',
        right: 'right_low.jpg',
        back: 'back_low.jpg',
        top: 'top_low.jpg',
        bottom: 'bottom_low.jpg',
    },
    pmtiles: 'https://my-bucket.s3.amazonaws.com/panorama.pmtiles',
},
```

The `pmtiles` option accepts an URL of the archive or a local `File`. Remote archives must be served with HTTP Range and CORS support, for example an S3 bucket configured with the following CORS rules:

```json
[
    {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET"],
        "AllowedHeaders": ["Range"],
        "ExposeHeaders": ["Content-Range", "Accept-Ranges"]
    }
]
```

By default the 6 faces are packed in a 3x2 grid inside the PMTiles square, with `z = log2(nbTiles) + 2`, `x = faceCol * nbTiles + col` and `y = faceRow * nbTiles + row` where `faceCol`/`faceRow` is the position of the face in the grid (`left`/`right`/`top` on the first row, `bottom`/`back`/`front` on the second). The `tileToZxy` option allows to use any other layout:

```js:line-numbers
tileToZxy: (face, col, row, level) => [level, col, row],
```

Tiles missing from the archive are silently skipped, keeping the previous level content, which is equivalent to the `tileUrl` function returning `null`.

It is still recommended to provide a `baseUrl` to display a preview while the tiles are loading.

## Preparing the panorama

The tiles can be easily generated using [ImageMagick](https://imagemagick.org) tool.

Let's say you have a cubemap where each face is 6.000x6.000 pixels and you want to split them into 8x8 tiles, use the following command for each face:

```
magick.exe front.jpg \
  -crop 750x750 -quality 95 \
  -set filename:tile "%[fx:page.x/750]_%[fx:page.y/750]" \
  -set filename:orig %t \
  %[filename:orig]_%[filename:tile].jpg
```

You can also use this [online tool](https://pinetools.com/split-image).

::: tip Performances
It is recommanded to not exceed tiles with a size of 1024x1024 pixels, thus limiting the maximum panorama size to 16.384x16.384 pixels by face (1.6 Gigapixels in total).
:::
