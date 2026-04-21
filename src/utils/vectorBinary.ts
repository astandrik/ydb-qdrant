const IS_LITTLE_ENDIAN =
    new Uint8Array(new Uint16Array([0x00ff]).buffer)[0] === 0xff;

export function vectorToFloatBinary(vector: number[]): Buffer {
    if (vector.length === 0) {
        return Buffer.from([1]);
    }

    const buffer = Buffer.alloc(vector.length * 4 + 1);

    for (let i = 0; i < vector.length; i += 1) {
        const value = vector[i];
        if (!Number.isFinite(value)) {
            throw new Error(
                `Non-finite value in vector at index ${i}: ${value}`
            );
        }
        if (IS_LITTLE_ENDIAN) {
            buffer.writeFloatLE(value, i * 4);
        } else {
            buffer.writeFloatBE(value, i * 4);
        }
    }

    buffer.writeUInt8(1, vector.length * 4);

    return buffer;
}
