import { FileSource, PMTiles } from 'pmtiles';

const archives = new Map<string, PMTiles>();

/**
 * Opens and caches a PMTiles archive
 * - a string is interpreted as an URL of the archive, requires HTTP Range and CORS support
 * - a File is read locally
 */
export function getPmtilesArchive(src: string | File): PMTiles {
    const key = typeof src === 'string' ? src : `${src.name}:${src.size}`;
    let archive = archives.get(key);
    if (!archive) {
        archive = typeof src === 'string' ? new PMTiles(src) : new PMTiles(new FileSource(src));
        archives.set(key, archive);
    }
    return archive;
}

/**
 * Default conversion of equirectangular tiles to PMTiles coordinates
 * z = log2(cols), x = col, y = row
 */
export function equirectToZxy(col: number, row: number, cols: number): [number, number, number] {
    return [Math.log2(cols), col, row];
}

const CUBE_FACES = ['left', 'right', 'top', 'bottom', 'back', 'front'];

/**
 * Default conversion of cubemap tiles to PMTiles coordinates
 * the 6 faces are packed in a 3x2 grid, z = log2(nbTiles) + 2
 */
export function cubemapToZxy(face: string, col: number, row: number, nbTiles: number): [number, number, number] {
    const faceIndex = CUBE_FACES.indexOf(face);
    const gridCol = faceIndex % 3;
    const gridRow = Math.floor(faceIndex / 3);
    return [Math.log2(nbTiles) + 2, gridCol * nbTiles + col, gridRow * nbTiles + row];
}
