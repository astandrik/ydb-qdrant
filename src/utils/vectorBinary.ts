export function vectorToFloatBinary(vector: number[]): Buffer {
  if (vector.length === 0) {
    return Buffer.from([1]);
  }

  const isLittleEndian =
    new Uint8Array(new Uint16Array([0x00ff]).buffer)[0] === 0xff;

  const buffer = Buffer.alloc(vector.length * 4 + 1);

  for (let i = 0; i < vector.length; i += 1) {
    const value = vector[i];
    if (!Number.isFinite(value)) {
      throw new Error(`Non-finite value in vector at index ${i}: ${value}`);
    }
    if (isLittleEndian) {
      buffer.writeFloatLE(value, i * 4);
    } else {
      buffer.writeFloatBE(value, i * 4);
    }
  }

  buffer.writeUInt8(1, vector.length * 4);

  return buffer;
}

export function vectorToBitBinary(vector: number[]): Buffer {
  // Mirrors YDB's TKnnBitVectorSerializer (Knn::ToBinaryStringBit) layout:
  // - Packed bits as integers written in native endianness
  // - Then 1 byte: count of unused bits in the last data byte
  // - Then 1 byte: format marker (10 = BitVector)
  //
  // Source: https://raw.githubusercontent.com/ydb-platform/ydb/0b506f56e399e0b4e6a6a4267799da68a3164bf7/ydb/library/yql/udfs/common/knn/knn-serializer.h

  const bitLen = vector.length;
  const dataByteLen = Math.ceil(bitLen / 8);
  const totalLen = dataByteLen + 2; // +1 unused-bit-count +1 format marker
  const buffer = Buffer.alloc(totalLen);

  const isLittleEndian =
    new Uint8Array(new Uint16Array([0x00ff]).buffer)[0] === 0xff;

  let offset = 0;

  const writeU64 = (v: bigint) => {
    if (isLittleEndian) {
      buffer.writeBigUInt64LE(v, offset);
    } else {
      buffer.writeBigUInt64BE(v, offset);
    }
    offset += 8;
  };

  const writeU32 = (v: number) => {
    if (isLittleEndian) {
      buffer.writeUInt32LE(v, offset);
    } else {
      buffer.writeUInt32BE(v, offset);
    }
    offset += 4;
  };

  const writeU16 = (v: number) => {
    if (isLittleEndian) {
      buffer.writeUInt16LE(v, offset);
    } else {
      buffer.writeUInt16BE(v, offset);
    }
    offset += 2;
  };

  const writeU8 = (v: number) => {
    buffer.writeUInt8(v, offset);
    offset += 1;
  };

  let accumulator = 0n;
  let filledBits = 0;

  for (let i = 0; i < vector.length; i += 1) {
    const value = vector[i];
    if (!Number.isFinite(value)) {
      throw new Error(`Non-finite value in vector at index ${i}: ${value}`);
    }

    if (value > 0) {
      accumulator |= 1n;
    }

    filledBits += 1;
    if (filledBits === 64) {
      writeU64(accumulator);
      accumulator = 0n;
      filledBits = 0;
    }

    accumulator <<= 1n;
  }

  accumulator >>= 1n;
  filledBits += 7;

  const tailWriteIf = (bits: 64 | 32 | 16 | 8) => {
    if (filledBits < bits) {
      return;
    }

    if (bits === 64) {
      writeU64(accumulator & 0xffff_ffff_ffff_ffffn);
      filledBits -= 64;
      return;
    }

    if (bits === 32) {
      writeU32(Number(accumulator & 0xffff_ffffn));
      accumulator >>= 32n;
      filledBits -= 32;
      return;
    }

    if (bits === 16) {
      writeU16(Number(accumulator & 0xffffn));
      accumulator >>= 16n;
      filledBits -= 16;
      return;
    }

    writeU8(Number(accumulator & 0xffn));
    accumulator >>= 8n;
    filledBits -= 8;
  };

  tailWriteIf(64);
  tailWriteIf(32);
  tailWriteIf(16);
  tailWriteIf(8);

  // After tail writes, we must have < 8 "filledBits" left.
  const unusedBitsInLastByte = 7 - filledBits;
  writeU8(unusedBitsInLastByte);
  writeU8(10);

  return buffer;
}
