// ============================================================
// NullShift SDK -- Proof Generation
// ============================================================
// Loads Noir circuit artifacts and generates ZK proofs
// via Barretenberg WASM backend.
// ============================================================

import type { CircuitType, ProofResult, ProofProgress, Bytes32 } from '@nullshift/common';

/** Proof generation input types per circuit */
export interface ShieldedTransferInput {
  senderSecretKey: string;
  inputNotes: Array<{
    amount: string;
    salt: string;
    pathIndex: number;
    siblings: string[];
  }>;
  outputNotes: Array<{
    ownerPubkey: string;
    amount: string;
    salt: string;
  }>;
  merkleRoot: string;
}

export interface DepositInput {
  ownerPubkey: string;
  amount: string;
  salt: string;
  /** The Pedersen commitment (must match pedersen_hash([ownerPubkey, amount, salt])) */
  commitment: string;
}

export interface WithdrawInput {
  secretKey: string;
  amount: string;
  salt: string;
  pathIndex: number;
  siblings: string[];
  changeSalt: string;
  merkleRoot: string;
  recipientAddress: string;
  withdrawAmount: string;
}

export interface SwapInput {
  secretKey: string;
  inputAmount: string;
  inputTokenId: string;
  inputSalt: string;
  pathIndex: number;
  siblings: string[];
  swapAmount: string;
  minOutputAmount: string;
  outputNoteSalt: string;
  changeNoteSalt: string;
  merkleRoot: string;
  relayerAddress: string;
  relayerFee: string;
}

/** Progress callback */
export type OnProgress = (progress: ProofProgress) => void;

/** Circuit artifact loaded from compiled Noir JSON */
interface CircuitArtifact {
  bytecode: string;
  abi: {
    parameters: Array<{
      name: string;
      type: { kind: string };
      visibility: string;
    }>;
  };
}

/** Noir backend instance */
interface NoirBackend {
  generateProof(witness: Map<number, string>): Promise<{ proof: Uint8Array; publicInputs: string[] }>;
  verifyProof(proofData: { proof: Uint8Array; publicInputs: string[] }): Promise<boolean>;
  destroy(): Promise<void>;
}

/** Noir program instance */
interface NoirProgram {
  execute(inputs: Record<string, unknown>): Promise<{ witness: Map<number, string> }>;
}

export class Prover {
  private initialized = false;
  private backends: Map<CircuitType, NoirBackend> = new Map();
  private programs: Map<CircuitType, NoirProgram> = new Map();
  private artifacts: Map<CircuitType, CircuitArtifact> = new Map();

  /** Register a circuit artifact (call before initialize) */
  registerCircuit(type: CircuitType, artifact: CircuitArtifact): void {
    this.artifacts.set(type, artifact);
  }

  /** Initialize the prover -- load WASM and set up backends */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamic import to support environments without WASM
      const { Noir } = await import('@noir-lang/noir_js' as string);
      const { BarretenbergBackend } = await import(
        '@noir-lang/backend_barretenberg' as string
      );

      for (const [type, artifact] of this.artifacts) {
        const backend = new BarretenbergBackend(artifact);
        const program = new Noir(artifact, backend);
        this.backends.set(type, backend);
        this.programs.set(type, program);
      }
    } catch (err) {
      throw new Error(
        `Failed to initialize Noir backend: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    this.initialized = true;
  }

  /** Generate a shielded transfer proof */
  async generateShieldedTransferProof(
    params: ShieldedTransferInput,
    onProgress?: OnProgress,
  ): Promise<ProofResult> {
    const inputs = {
      sender_secret_key: params.senderSecretKey,
      input_amounts: params.inputNotes.map((n) => n.amount),
      input_salts: params.inputNotes.map((n) => n.salt),
      input_path_indices: params.inputNotes.map((n) => n.pathIndex.toString()),
      input_siblings: params.inputNotes.map((n) => n.siblings),
      output_owner_pubkeys: params.outputNotes.map((n) => n.ownerPubkey),
      output_amounts: params.outputNotes.map((n) => n.amount),
      output_salts: params.outputNotes.map((n) => n.salt),
      merkle_root: params.merkleRoot,
      nullifiers: ['0', '0'], // Computed by circuit
      output_commitments: ['0', '0'], // Computed by circuit
    };

    return this.generateProof('shielded_transfer', inputs, onProgress);
  }

  /** Generate a deposit proof */
  async generateDepositProof(
    params: DepositInput,
    onProgress?: OnProgress,
  ): Promise<ProofResult> {
    const inputs = {
      owner_pubkey: params.ownerPubkey,
      amount: params.amount,
      salt: params.salt,
      commitment: params.commitment,
    };

    return this.generateProof('deposit', inputs, onProgress);
  }

  /** Generate a withdraw proof */
  async generateWithdrawProof(
    params: WithdrawInput,
    onProgress?: OnProgress,
  ): Promise<ProofResult> {
    const inputs = {
      secret_key: params.secretKey,
      amount: params.amount,
      salt: params.salt,
      path_index: params.pathIndex.toString(),
      siblings: params.siblings,
      change_salt: params.changeSalt,
      merkle_root: params.merkleRoot,
      nullifier: '0', // Computed by circuit
      recipient_address: params.recipientAddress,
      withdraw_amount: params.withdrawAmount,
      change_commitment: '0', // Computed by circuit
    };

    return this.generateProof('withdraw', inputs, onProgress);
  }

  /** Generate an anonymous swap proof */
  async generateSwapProof(
    params: SwapInput,
    onProgress?: OnProgress,
  ): Promise<ProofResult> {
    const inputs = {
      secret_key: params.secretKey,
      input_amount: params.inputAmount,
      input_token_id: params.inputTokenId,
      input_salt: params.inputSalt,
      path_index: params.pathIndex.toString(),
      siblings: params.siblings,
      swap_amount: params.swapAmount,
      min_output_amount: params.minOutputAmount,
      output_note_salt: params.outputNoteSalt,
      change_note_salt: params.changeNoteSalt,
      merkle_root: params.merkleRoot,
      nullifier: '0',
      swap_commitment: '0',
      change_commitment: '0',
      relayer_address: params.relayerAddress,
      relayer_fee: params.relayerFee,
    };

    return this.generateProof('anonymous_swap', inputs, onProgress);
  }

  /** Core proof generation method */
  private async generateProof(
    circuit: CircuitType,
    inputs: Record<string, unknown>,
    onProgress?: OnProgress,
  ): Promise<ProofResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const program = this.programs.get(circuit);
    const backend = this.backends.get(circuit);

    if (!program || !backend) {
      throw new Error(`Circuit ${circuit} not registered. Call registerCircuit() first.`);
    }

    const startTime = Date.now();

    onProgress?.({
      circuit,
      stage: 'witnessing',
      percent: 10,
      elapsedMs: 0,
    });

    // Generate witness
    const { witness } = await program.execute(inputs);

    onProgress?.({
      circuit,
      stage: 'proving',
      percent: 40,
      elapsedMs: Date.now() - startTime,
    });

    // Generate proof
    const { proof, publicInputs } = await backend.generateProof(witness);

    const provingTimeMs = Date.now() - startTime;

    onProgress?.({
      circuit,
      stage: 'done',
      percent: 100,
      elapsedMs: provingTimeMs,
    });

    return {
      proof,
      publicInputs: publicInputs.map((p) => p as Bytes32),
      circuit,
      provingTimeMs,
    };
  }

  /** Verify a proof locally */
  async verifyProof(result: ProofResult): Promise<boolean> {
    const backend = this.backends.get(result.circuit);
    if (!backend) {
      throw new Error(`Backend not initialized for circuit ${result.circuit}`);
    }

    return backend.verifyProof({
      proof: result.proof,
      publicInputs: result.publicInputs,
    });
  }

  /** Clean up WASM resources */
  async destroy(): Promise<void> {
    for (const backend of this.backends.values()) {
      await backend.destroy();
    }
    this.backends.clear();
    this.programs.clear();
    this.initialized = false;
  }
}
