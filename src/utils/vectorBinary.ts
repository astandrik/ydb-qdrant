export function vectorToFloatBinary(vector: number[]): Buffer {
  if (vector.length === 0) {
    return Buffer.from([1]);
  }

  const buffer = Buffer.alloc(vector.length * 4 + 1);

  for (let i = 0; i < vector.length; i += 1) {
    const value = vector[i];
    if (!Number.isFinite(value)) {
      throw new Error(`Non-finite value in vector at index ${i}: ${value}`);
    }
    buffer.writeFloatLE(value, i * 4);
  }

  buffer.writeUInt8(1, vector.length * 4);

  return buffer;
}

export function vectorToBitBinary(vector: number[]): Buffer {
  if (vector.length === 0) {
    return Buffer.from([10]);
  }

  const byteCount = Math.ceil(vector.length / 8);
  const buffer = Buffer.alloc(byteCount + 1);

  for (let i = 0; i < vector.length; i += 1) {
    const value = vector[i];
    if (!Number.isFinite(value)) {
      throw new Error(`Non-finite value in vector at index ${i}: ${value}`);
    }
    if (value > 0) {
      const byteIndex = Math.floor(i / 8);
      const bitIndex = i % 8;
      buffer[byteIndex] |= 1 << bitIndex;
    }
  }

  buffer.writeUInt8(10, byteCount);

  return buffer;
}
