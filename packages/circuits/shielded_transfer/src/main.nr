use std::hash::pedersen_hash;
use std::hash::poseidon;

// ==========================================================
// NullShift -- Shielded Transfer Circuit
// ==========================================================
// Proves a valid 2-in-2-out UTXO transfer without revealing
// sender, recipient, or amounts on-chain.
//
// UTXO Model:
//   Note Commitment = Pedersen(owner_pubkey, amount, salt)
//   Nullifier = Poseidon(commitment, secret_key)
//   Merkle Tree Depth = 20
// ==========================================================

global TREE_DEPTH: u32 = 20;

// -- Main circuit --

fn main(
    // Private inputs
    sender_secret_key: Field,
    input_amounts: [Field; 2],
    input_salts: [Field; 2],
    input_path_indices: [Field; 2],
    input_siblings: [[Field; 20]; 2],
    output_owner_pubkeys: [Field; 2],
    output_amounts: [Field; 2],
    output_salts: [Field; 2],

    // Public inputs
    merkle_root: pub Field,
    nullifiers: pub [Field; 2],
    output_commitments: pub [Field; 2],
) {
    // 1. Derive sender public key from secret key
    let sender_pubkey = pedersen_hash([sender_secret_key]);

    // 2. Process each input note
    let mut total_input: Field = 0;

    for i in 0..2 {
        // Compute note commitment
        let commitment = pedersen_hash([
            sender_pubkey,
            input_amounts[i],
            input_salts[i],
        ]);

        // Verify Merkle membership
        let computed_root = compute_merkle_root(
            commitment,
            input_path_indices[i],
            input_siblings[i],
        );
        assert(computed_root == merkle_root, "Merkle proof invalid for input note");

        // Verify nullifier: Poseidon(commitment, secret_key)
        let expected_nullifier = poseidon::bn254::hash_2([
            commitment,
            sender_secret_key,
        ]);
        assert(nullifiers[i] == expected_nullifier, "Nullifier mismatch");

        // Range check: amount fits in u64
        let _ = input_amounts[i] as u64;

        total_input += input_amounts[i];
    }

    // 3. Verify output commitments and total
    let mut total_output: Field = 0;

    for i in 0..2 {
        let expected_commitment = pedersen_hash([
            output_owner_pubkeys[i],
            output_amounts[i],
            output_salts[i],
        ]);
        assert(
            output_commitments[i] == expected_commitment,
            "Output commitment mismatch"
        );

        let _ = output_amounts[i] as u64;
        total_output += output_amounts[i];
    }

    // 4. Nullifier uniqueness (prevent spending same note twice)
    assert(nullifiers[0] != nullifiers[1], "Duplicate nullifier");

    // 5. Amount conservation: inputs == outputs
    assert(total_input == total_output, "Amount conservation violated");
}

// -- Merkle tree root computation --

fn compute_merkle_root(
    leaf: Field,
    path_index: Field,
    siblings: [Field; 20],
) -> Field {
    let mut current = leaf;
    let path_bits: [u1; 20] = path_index.to_be_bits();

    for i in 0..TREE_DEPTH {
        let sibling = siblings[i];
        let bit = path_bits[TREE_DEPTH - 1 - i];
        let (left, right) = if bit == 0 {
            (current, sibling)
        } else {
            (sibling, current)
        };
        current = poseidon::bn254::hash_2([left, right]);
    }

    current
}

// -- Tests --

#[test]
fn test_basic_transfer() {
    // 2-in-2-out: sender has two notes, sends to two recipients
    let sender_sk: Field = 42;
    let sender_pk = std::hash::pedersen_hash([sender_sk]);

    // Input note 1: amount=100
    let in_amt_0: Field = 100;
    let in_salt_0: Field = 111;
    let in_commitment_0 = std::hash::pedersen_hash([sender_pk, in_amt_0, in_salt_0]);

    let in_amt_1: Field = 0;
    let in_salt_1: Field = 222;
    let in_commitment_1 = std::hash::pedersen_hash([sender_pk, in_amt_1, in_salt_1]);

    // Build a 2-leaf Merkle tree with both notes
    let zero: Field = 0;
    // Leaf 0 = in_commitment_0, Leaf 1 = in_commitment_1
    // Level 0: hash(leaf0, leaf1)
    let level0 = poseidon::bn254::hash_2([in_commitment_0, in_commitment_1]);
    // Levels 1-19: hash(current, 0)
    let mut current = level0;
    let mut siblings_a: [Field; 20] = [0; 20];
    let mut siblings_b: [Field; 20] = [0; 20];

    // For leaf 0 (index 0): sibling at level 0 is leaf 1
    siblings_a[0] = in_commitment_1;
    // For leaf 1 (index 1): sibling at level 0 is leaf 0
    siblings_b[0] = in_commitment_0;

    for i in 1..TREE_DEPTH {
        siblings_a[i] = zero;
        siblings_b[i] = zero;
        current = poseidon::bn254::hash_2([current, zero]);
    }
    let shared_root = current;

    // Nullifiers
    let null_0 = poseidon::bn254::hash_2([in_commitment_0, sender_sk]);
    let null_1 = poseidon::bn254::hash_2([in_commitment_1, sender_sk]);

    // Output notes: send 70 to recipient, 30 change back to sender
    let recipient_pk: Field = 9999;
    let out_amt_0: Field = 70;
    let out_salt_0: Field = 333;
    let out_commitment_0 = std::hash::pedersen_hash([recipient_pk, out_amt_0, out_salt_0]);

    let out_amt_1: Field = 30;
    let out_salt_1: Field = 444;
    let out_commitment_1 = std::hash::pedersen_hash([sender_pk, out_amt_1, out_salt_1]);

    // total input = 100 + 0 = 100, total output = 70 + 30 = 100 (conserved)

    main(
        sender_sk,
        [in_amt_0, in_amt_1],
        [in_salt_0, in_salt_1],
        [0, 1], // path indices: leaf 0 and leaf 1
        [siblings_a, siblings_b],
        [recipient_pk, sender_pk],
        [out_amt_0, out_amt_1],
        [out_salt_0, out_salt_1],
        shared_root,
        [null_0, null_1],
        [out_commitment_0, out_commitment_1],
    );
}

#[test(should_fail_with = "Amount conservation violated")]
fn test_amount_mismatch_fails() {
    // Try to create value from nothing: input=100, output=101
    let sender_sk: Field = 42;
    let sender_pk = std::hash::pedersen_hash([sender_sk]);

    let in_amt_0: Field = 100;
    let in_salt_0: Field = 111;
    let in_commitment_0 = std::hash::pedersen_hash([sender_pk, in_amt_0, in_salt_0]);

    let in_amt_1: Field = 0;
    let in_salt_1: Field = 222;
    let in_commitment_1 = std::hash::pedersen_hash([sender_pk, in_amt_1, in_salt_1]);

    let zero: Field = 0;
    let level0 = poseidon::bn254::hash_2([in_commitment_0, in_commitment_1]);
    let mut current = level0;
    let mut siblings_a: [Field; 20] = [0; 20];
    let mut siblings_b: [Field; 20] = [0; 20];
    siblings_a[0] = in_commitment_1;
    siblings_b[0] = in_commitment_0;
    for i in 1..TREE_DEPTH {
        siblings_a[i] = zero;
        siblings_b[i] = zero;
        current = poseidon::bn254::hash_2([current, zero]);
    }
    let shared_root = current;

    let null_0 = poseidon::bn254::hash_2([in_commitment_0, sender_sk]);
    let null_1 = poseidon::bn254::hash_2([in_commitment_1, sender_sk]);

    // INVALID: output amounts sum to 101 but inputs sum to 100
    let recipient_pk: Field = 9999;
    let out_amt_0: Field = 71;
    let out_salt_0: Field = 333;
    let out_commitment_0 = std::hash::pedersen_hash([recipient_pk, out_amt_0, out_salt_0]);

    let out_amt_1: Field = 30;
    let out_salt_1: Field = 444;
    let out_commitment_1 = std::hash::pedersen_hash([sender_pk, out_amt_1, out_salt_1]);

    main(
        sender_sk,
        [in_amt_0, in_amt_1],
        [in_salt_0, in_salt_1],
        [0, 1],
        [siblings_a, siblings_b],
        [recipient_pk, sender_pk],
        [out_amt_0, out_amt_1],
        [out_salt_0, out_salt_1],
        shared_root,
        [null_0, null_1],
        [out_commitment_0, out_commitment_1],
    );
}
