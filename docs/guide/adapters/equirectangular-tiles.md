# Equirectangular tiles

<Badges module="equirectangular-tiles-adapter"/>

::: module
Reduce the initial loading time and used bandwidth by slicing big equirectangular panoramas into many smaller tiles.

This adapter is available in the [@photo-sphere-viewer/equirectangular-tiles-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/equirectangular-tiles-adapter) package.
:::

```js:line-numbers
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';

const viewer = new Viewer({
    adapter: EquirectangularTilesAdapter,
    panorama: {
        width: 12000,
        cols: 16,
        rows: 8,
        baseUrl: 'panorama_low.jpg',
        tileUrl: (col, row) => {
            return `panorama_${col}_${row}.jpg`;
        },
    },
});
```

## Example

::: code-demo

```yaml
title: PSV Equirectangular Tiles Demo
packages:
    - name: equirectangular-tiles-adapter
```

<<< ./demos-src/equirectangular-tiles.js{js:line-numbers}

:::

::: tip Positions definitions
With this adapter, pixel positions refer to the full size of the panorama (first level when using multi-levels tiles).
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

#### `resolution`

See the [equirectangular adapter configuration](./equirectangular.md#resolution).

## Panorama options

When using this adapter, the `panorama` option and the `setPanorama()` method accept an object to configure the tiles.

You may choose to provide a single tiles configuration or multiple configurations which will be applied at different zoom levels, this allows to serve files adapted to the current zoom level and achieve very high resolutions without consuming too much bandwidth.

:::: tabs

::: tab Single level

#### `width` (required)

-   type: `number`

Total width of the panorama, the height is always width / 2.

#### `cols` (required)

-   type: `number`

Number of columns, must be power of two (4, 8, 16, 32, 64) and the maximum value is 64.

#### `rows` (required)

-   type: `number`

Number of rows, must be power of two (2, 4, 8, 16, 32) and the maximum value is 32.

#### `tileUrl` (required)

-   type: `function: (col, row) => string`

Function used to build the URL of a tile.
If the function returns `null` the corresponding tile will not be loaded.

#### `pmtiles` (optional)

-   type: `string | File`

Instead of individual tiles URLs, tiles can be read directly from a [PMTiles](https://pmtiles.io) archive. A `string` is interpreted as the URL of the archive and requires HTTP Range and CORS support (S3, CloudFront, nginx...). A `File` is read locally.

#### `tileToZxy` (optional)

-   type: `function: (col, row, level) => [z, x, y]`

Converts tile coordinates to PMTiles coordinates, only used with `pmtiles`. Defaults to `z = log2(cols)`, `x = col`, `y = row` (see [below](#reading-from-a-pmtiles-archive)).

#### `baseUrl` (recommended)

-   type: `string`

URL of a low resolution complete panorama image to display while the tiles are loading.

#### `basePanoData`

-   type: `object | function<Image, object>`

Panorama configuration associated to low resolution first image, following the same format as [`panoData` configuration object](../config.md#panodata).

:::

::: tab Multiple levels

#### `levels` (required)

-   type: `array`

Array of available tiles configurations. Each element is an object with `width`, `cols` and `rows` (see "Single level"). The best size will be choosen depending on the current zoom level and viewer size.

```js:line-numbers
levels: [
    {
        width: 6144,
        cols: 16,
        rows: 8,
    },
    {
        width: 12288,
        cols: 32,
        rows: 16,
    },
    {
        width: 24576,
        cols: 64,
        rows: 32,
    },
]
```

#### `tileUrl` (required)

-   type: `function: (col, row, level) => string`

Function used to build the URL of a tile.
If the function returns `null` the corresponding tile will not be loaded.

#### `pmtiles` (optional)

-   type: `string | File`

Instead of individual tiles URLs, tiles can be read directly from a [PMTiles](https://pmtiles.io) archive. A `string` is interpreted as the URL of the archive and requires HTTP Range and CORS support (S3, CloudFront, nginx...). A `File` is read locally.

#### `tileToZxy` (optional)

-   type: `function: (col, row, level) => [z, x, y]`

Converts tile coordinates to PMTiles coordinates, only used with `pmtiles`. Defaults to `z = log2(cols)`, `x = col`, `y = row` (see [below](#reading-from-a-pmtiles-archive)).

#### `baseUrl` (recommended)

-   type: `string`

URL of a low resolution complete panorama image to display while the tiles are loading.

#### `basePanoData`

-   type: `object | function<Image, object>`

Panorama configuration associated to low resolution first image, following the same format as [`panoData` configuration object](../config.md#panodata).

:::

::::

## Reading from a PMTiles archive

All the tiles of the panorama (optionally multiple zoom levels) can be stored in a single [PMTiles](https://pmtiles.io) archive and read directly by the adapter, without any tile server.

```js:line-numbers
panorama: {
    width: 12000,
    cols: 16,
    rows: 8,
    baseUrl: 'panorama_low.jpg',
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

By default the PMTiles coordinates are deduced from the tiles configuration: `z = log2(cols)`, `x = col` and `y = row`, meaning the archive must have been built with the panorama split into a pyramid of `cols x rows` tiles, stored in the `x`/`y` range of the `2^z` square. The `tileToZxy` option allows to use any other layout, for example if the archive contains the tiles of a standard web map:

```js:line-numbers
tileToZxy: (col, row, level) => [level, col, row],
```

Tiles missing from the archive are silently skipped, keeping the previous level content, which is equivalent to the `tileUrl` function returning `null`.

It is still recommended to provide a `baseUrl` to display a preview while the tiles are loading.

## Preparing the panorama

The tiles can be easily generated using [ImageMagick](https://imagemagick.org) tool.

Let's say you have a 12.000x6.000 pixels panorama you want to split in 16 columns and 8 rows, use the following command:

```
magick.exe panorama.jpg \
  -crop 750x750 -quality 95 \
  -set filename:tile "%[fx:page.x/750]_%[fx:page.y/750]" \
  -set filename:orig %t \
  %[filename:orig]_%[filename:tile].jpg
```

You can also use this [online tool](https://pinetools.com/split-image).

::: tip Performances
It is recommanded to not exceed tiles with a size of 1024x1024 pixels, thus limiting the maximum panorama size to 65.536x32.768 pixels (2 Gigapixels).
:::
