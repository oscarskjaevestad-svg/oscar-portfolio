"""
Shrink InMoov STL files into the small meshes the 3D viewer loads.

    python tools/meshes.py <folder of .stl files>

Binary STL repeats every corner of every triangle as three floats. Most
corners are shared, so this keeps each corner once, stores it as three
16-bit integers inside the part's bounding box (well under 0.01 mm of
error on a 200 mm part), and refers to corners by index. A 250 KB STL
becomes about 40 KB.

File layout, little-endian:
    "OSM1"                     magic
    uint32 vertex count, uint32 triangle count
    float32[3] min, float32[3] size        bounding box, mm
    uint16[3 * vertices]                    quantised positions
    uint16 or uint32[3 * triangles]         indices (uint32 past 65535 vertices)

The parts are InMoov by Gaël Langevin, licensed CC BY-NC.
"""
import struct
import sys
from pathlib import Path

import numpy as np

PARTS = {  # source file -> published name
    "Auriculaire3.stl": "little-finger",
    "Index3.stl": "index-finger",
    "thumb5.stl": "thumb",
    "WristlargeV4.stl": "wrist",
    "robpart2V4.stl": "forearm",
}


def read_stl(path):
    data = path.read_bytes()
    (count,) = struct.unpack_from("<I", data, 80)
    if 84 + count * 50 != len(data):
        raise ValueError(f"{path.name}: not a binary STL")
    rec = np.frombuffer(data, dtype=np.dtype([("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")]), count=count, offset=84)
    return rec["v"].reshape(-1, 3)


def pack(corners):
    lo, hi = corners.min(0), corners.max(0)
    size = np.maximum(hi - lo, 1e-6)
    q = np.round((corners - lo) / size * 65535).astype("<u2")
    unique, index = np.unique(q, axis=0, return_inverse=True)
    tris = index.reshape(-1, 3)
    tris = tris[(tris[:, 0] != tris[:, 1]) & (tris[:, 1] != tris[:, 2]) & (tris[:, 0] != tris[:, 2])]
    itype = "<u2" if len(unique) <= 65535 else "<u4"
    head = b"OSM1" + struct.pack("<II6f", len(unique), len(tris), *lo, *size)
    return head + unique.astype("<u2").tobytes() + tris.astype(itype).tobytes(), len(unique), len(tris)


if __name__ == "__main__":
    src = Path(sys.argv[1])
    out = Path(__file__).resolve().parent.parent / "parts"
    out.mkdir(exist_ok=True)
    for name, slug in PARTS.items():
        blob, nv, nt = pack(read_stl(src / name))
        (out / f"{slug}.bin").write_bytes(blob)
        print(f"{slug:14s} {nv:6d} vertices {nt:6d} triangles {len(blob)/1024:6.1f} KB")
