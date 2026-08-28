// Minimal OffscreenCanvas + ImageBitmap shims for pipeline.test.ts

class MockOffscreenCanvas {
  width: number;
  height: number;
  _data: Uint8ClampedArray;

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
    this._data = new Uint8ClampedArray(w * h * 4);
  }

  getContext(_type: string) {
    const self = this;
    return {
      drawImage(img: { _data: Uint8ClampedArray }) {
        const src = img._data;
        if (!src) return;
        // For uniform-color test images, copy the first pixel color to all canvas pixels
        const r = src[0], g = src[1], b = src[2], a = src[3];
        for (let i = 0; i < self._data.length; i += 4) {
          self._data[i] = r; self._data[i + 1] = g;
          self._data[i + 2] = b; self._data[i + 3] = a;
        }
      },
      getImageData(_x: number, _y: number, _w: number, _h: number) {
        return { data: self._data, width: self.width, height: self.height };
      },
    };
  }
}

// @ts-expect-error shim
global.OffscreenCanvas = MockOffscreenCanvas;
// @ts-expect-error shim
global.WebSocket = class { readyState = 1; send() {} close() {} onopen = null; onmessage = null; onerror = null; onclose = null; };
