const LENS_MODEL_KEY = 'com.apple.quicktime.camera.lens_model';
const MODEL_KEY = 'com.apple.quicktime.model';
const MAX_MOOV_SIZE = 20_000_000;
const CONTAINER_ATOMS = new Set(['moov', 'trak', 'udta']);

interface Atom {
  type: string;
  start: number;
  headerSize: number;
  size: number;
}

function readType(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

function readAtomHeader(view: DataView, offset: number, end: number): Atom | null {
  if (offset + 8 > end) return null;
  let size = view.getUint32(offset);
  const type = readType(view, offset + 4);
  let headerSize = 8;
  if (size === 1) {
    if (offset + 16 > end) return null;
    size = Number(view.getBigUint64(offset + 8));
    headerSize = 16;
  } else if (size === 0) {
    size = end - offset;
  }
  if (size < headerSize || offset + size > end) return null;
  return { type, start: offset, headerSize, size };
}

function* childAtoms(view: DataView, start: number, end: number): Generator<Atom> {
  let offset = start;
  while (true) {
    const atom = readAtomHeader(view, offset, end);
    if (!atom) return;
    yield atom;
    offset += atom.size;
  }
}

// Reads only top-level headers so the (large) media data is never loaded into memory.
async function findMoov(file: Blob): Promise<{ view: DataView; headerSize: number } | null> {
  let offset = 0;
  while (offset + 8 <= file.size) {
    const header = new DataView(await file.slice(offset, offset + 16).arrayBuffer());
    const type = readType(header, 4);
    let size = header.getUint32(0);
    let headerSize = 8;
    if (size === 1) {
      if (header.byteLength < 16) return null;
      size = Number(header.getBigUint64(8));
      headerSize = 16;
    } else if (size === 0) {
      size = file.size - offset;
    }
    if (size < headerSize) return null;

    if (type === 'moov') {
      if (size > MAX_MOOV_SIZE) return null;
      const view = new DataView(await file.slice(offset, offset + size).arrayBuffer());
      return { view, headerSize };
    }
    offset += size;
  }
  return null;
}

const utf8 = new TextDecoder();

// QuickTime "mdta" metadata: a `keys` atom lists names, and `ilst` items reference them by 1-based index.
function parseMetaAtom(view: DataView, meta: Atom, into: Map<string, string>) {
  let bodyStart = meta.start + meta.headerSize;
  // Some writers make `meta` a full atom with 4 bytes of version/flags before the children.
  if (bodyStart + 8 <= view.byteLength && readType(view, bodyStart + 4) !== 'hdlr') {
    bodyStart += 4;
  }
  const end = meta.start + meta.size;

  const keys: string[] = [];
  let ilst: Atom | null = null;

  for (const child of childAtoms(view, bodyStart, end)) {
    if (child.type === 'keys') {
      const keysEnd = child.start + child.size;
      let offset = child.start + child.headerSize + 4;
      const count = view.getUint32(offset);
      offset += 4;
      for (let i = 0; i < count && offset + 8 <= keysEnd; i++) {
        const keySize = view.getUint32(offset);
        if (keySize < 8 || offset + keySize > keysEnd) break;
        const bytes = new Uint8Array(view.buffer, view.byteOffset + offset + 8, keySize - 8);
        keys.push(utf8.decode(bytes));
        offset += keySize;
      }
    } else if (child.type === 'ilst') {
      ilst = child;
    }
  }

  if (!ilst) return;

  const ilstEnd = ilst.start + ilst.size;
  for (const item of childAtoms(view, ilst.start + ilst.headerSize, ilstEnd)) {
    const keyIndex = view.getUint32(item.start + 4);
    const key = keys[keyIndex - 1];
    if (!key) continue;

    for (const data of childAtoms(view, item.start + item.headerSize, item.start + item.size)) {
      if (data.type !== 'data') continue;
      const valueType = view.getUint32(data.start + data.headerSize) & 0xffffff;
      if (valueType !== 1) continue; // 1 = UTF-8 string
      const valueStart = data.start + data.headerSize + 8;
      const bytes = new Uint8Array(view.buffer, view.byteOffset + valueStart, data.start + data.size - valueStart);
      into.set(key, utf8.decode(bytes).trim());
      break;
    }
  }
}

function collectMetadata(view: DataView, start: number, end: number, into: Map<string, string>) {
  for (const atom of childAtoms(view, start, end)) {
    if (atom.type === 'meta') {
      parseMetaAtom(view, atom, into);
    } else if (CONTAINER_ATOMS.has(atom.type)) {
      collectMetadata(view, atom.start + atom.headerSize, atom.start + atom.size, into);
    }
  }
}

export async function readCameraModel(file: Blob): Promise<string | null> {
  try {
    const moov = await findMoov(file);
    if (!moov) return null;

    const metadata = new Map<string, string>();
    collectMetadata(moov.view, moov.headerSize, moov.view.byteLength, metadata);

    return metadata.get(LENS_MODEL_KEY) || metadata.get(MODEL_KEY) || null;
  } catch (error) {
    console.warn('Could not read camera metadata:', error);
    return null;
  }
}
