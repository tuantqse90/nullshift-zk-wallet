import { describe, it, expect } from 'vitest';
import {
  hexToBytes,
  bytesToHex,
  bigintToField,
  fieldToBigint,
} from '../src/crypto';

describe('Crypto Utils', () => {
  describe('hexToBytes', () => {
    it('converts hex to 32 bytes', () => {
      const bytes = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000003039');
      expect(bytes.length).toBe(32);
      expect(bytes[30]).toBe(0x30);
      expect(bytes[31]).toBe(0x39);
    });

    it('pads short hex to 32 bytes', () => {
      const bytes = hexToBytes('0xff' as `0x${string}`);
      expect(bytes.length).toBe(32);
      expect(bytes[31]).toBe(0xff);
      expect(bytes[0]).toBe(0);
    });
  });

  describe('bytesToHex', () => {
    it('converts bytes to 0x-prefixed hex', () => {
      const bytes = new Uint8Array(32);
      bytes[31] = 0x42;
      const hex = bytesToHex(bytes);
      expect(hex).toBe('0x0000000000000000000000000000000000000000000000000000000000000042');
    });
  });

  describe('bigintToField', () => {
    it('converts bigint to 64-char hex field', () => {
      const field = bigintToField(12345n);
      expect(field).toBe('0x0000000000000000000000000000000000000000000000000000000000003039');
    });

    it('converts zero', () => {
      const field = bigintToField(0n);
      expect(field).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
    });
  });

  describe('fieldToBigint', () => {
    it('converts field hex to bigint', () => {
      const val = fieldToBigint('0x0000000000000000000000000000000000000000000000000000000000003039');
      expect(val).toBe(12345n);
    });

    it('roundtrips with bigintToField', () => {
      const original = 999999999n;
      const roundtripped = fieldToBigint(bigintToField(original));
      expect(roundtripped).toBe(original);
    });
  });
});
