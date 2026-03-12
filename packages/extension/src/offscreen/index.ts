// ============================================================
// NullShift -- Offscreen Document (WASM Proof Generation)
// ============================================================
// Runs in a hidden page with full DOM access, allowing
// WASM (Barretenberg) proof generation via Noir JS.
// ============================================================

import type { CircuitType, ProofResult } from '@nullshift/common';

// Cached backends and programs
let backends: Map<string, unknown> | null = null;
let programs: Map<string, unknown> | null = null;

// Circuit artifact URLs (bundled with extension)
const CIRCUIT_ARTIFACTS: Record<CircuitType, string> = {
  deposit: '/circuits/deposit.json',
  shielded_transfer: '/circuits/shielded_transfer.json',
  withdraw: '/circuits/withdraw.json',
  anonymous_swap: '/circuits/anonymous_swap.json',
};

// Listen for proof generation requests from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GENERATE_PROOF') {
    handleProofGeneration(message.payload)
      .then((result) => sendResponse({ payload: result }))
      .catch((error) => sendResponse({ error: (error as Error).message }));
    return true;
  }
});

async function initializeBackend(circuit: CircuitType): Promise<{
  backend: { generateProof: (w: unknown) => Promise<{ proof: Uint8Array; publicInputs: string[] }>; verifyProof: (p: unknown) => Promise<boolean> };
  program: { execute: (i: Record<string, unknown>) => Promise<{ witness: unknown }> };
}> {
  if (!backends) backends = new Map();
  if (!programs) programs = new Map();

  if (backends.has(circuit) && programs.has(circuit)) {
    return {
      backend: backends.get(circuit) as Awaited<ReturnType<typeof initializeBackend>>['backend'],
      program: programs.get(circuit) as Awaited<ReturnType<typeof initializeBackend>>['program'],
    };
  }

  // Load circuit artifact
  const artifactUrl = CIRCUIT_ARTIFACTS[circuit];
  const response = await fetch(artifactUrl);
  if (!response.ok) {
    throw new Error(`Failed to load circuit artifact: ${circuit}`);
  }
  const artifact = await response.json();

  // Dynamic import Noir packages
  const { Noir } = await import('@noir-lang/noir_js' as string);
  const { BarretenbergBackend } = await import('@noir-lang/backend_barretenberg' as string);

  const backend = new BarretenbergBackend(artifact);
  const program = new Noir(artifact, backend);

  backends.set(circuit, backend);
  programs.set(circuit, program);

  return { backend, program };
}

async function handleProofGeneration(params: {
  circuit: CircuitType;
  inputs: Record<string, unknown>;
}): Promise<ProofResult> {
  const startTime = Date.now();

  function reportProgress(stage: string, percent: number) {
    chrome.runtime.sendMessage({
      type: 'PROOF_PROGRESS',
      payload: {
        circuit: params.circuit,
        stage,
        percent,
        elapsedMs: Date.now() - startTime,
      },
    });
  }

  reportProgress('loading', 10);

  // Initialize backend for this circuit
  const { backend, program } = await initializeBackend(params.circuit);

  reportProgress('witnessing', 30);

  // Generate witness
  const { witness } = await program.execute(params.inputs);

  reportProgress('proving', 50);

  // Generate proof
  const { proof, publicInputs } = await backend.generateProof(witness);

  const provingTimeMs = Date.now() - startTime;

  reportProgress('done', 100);

  // Notify completion
  chrome.runtime.sendMessage({
    type: 'PROOF_COMPLETE',
    payload: {
      circuit: params.circuit,
      provingTimeMs,
    },
  });

  return {
    proof,
    publicInputs: publicInputs as `0x${string}`[],
    circuit: params.circuit,
    provingTimeMs,
  };
}
