import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Prover } from '../src/prover';

describe('Prover', () => {
  let prover: Prover;

  beforeAll(() => {
    prover = new Prover();

    // Register deposit circuit artifact
    const depositArtifact = JSON.parse(
      readFileSync(resolve(__dirname, '../../circuits/deposit/target/deposit.json'), 'utf-8'),
    );
    prover.registerCircuit('deposit', depositArtifact);
  });

  it('generates and verifies a deposit proof', async () => {
    // Commitment pre-computed: pedersen_hash([12345, 1000000, 99999])
    const commitment = '0x2d7e7bb7b8e5019d596924609399db611f0800e269cf7d9cb7134a2b0cb2f895';

    const result = await prover.generateDepositProof({
      ownerPubkey: '0x0000000000000000000000000000000000000000000000000000000000003039' as `0x${string}`,
      amount: '1000000',
      salt: '0x000000000000000000000000000000000000000000000000000000000001869f' as `0x${string}`,
      commitment,
    });

    expect(result.proof).toBeInstanceOf(Uint8Array);
    expect(result.proof.length).toBeGreaterThan(0);
    expect(result.publicInputs.length).toBe(1);
    expect(result.publicInputs[0]).toBe(commitment);
    expect(result.circuit).toBe('deposit');
    expect(result.provingTimeMs).toBeGreaterThan(0);

    // Verify locally
    const valid = await prover.verifyProof(result);
    expect(valid).toBe(true);
  }, 120_000);

  it('rejects proof with wrong inputs', async () => {
    // Wrong commitment should fail witness generation
    await expect(
      prover.generateDepositProof({
        ownerPubkey: '0x0000000000000000000000000000000000000000000000000000000000003039' as `0x${string}`,
        amount: '1000000',
        salt: '0x000000000000000000000000000000000000000000000000000000000001869f' as `0x${string}`,
        commitment: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
      }),
    ).rejects.toThrow();
  });
});
