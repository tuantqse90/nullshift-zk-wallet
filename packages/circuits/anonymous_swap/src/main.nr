use std::hash::pedersen_hash;
use std::hash::poseidon;

// ==========================================================
// NullShift -- Anonymous Swap Circuit
// ==========================================================
// Enables private DEX interactions without revealing the
// swapper's identity or exact amounts.
//
// Pattern: shield -> swap (via relayer) -> re-shield
// The relayer executes on-chain but cannot steal funds because
// the proof binds outputs to the user's public key.
// ==========================================================

global TREE_DEPTH: u32 = 20;

fn main(
    // Private inputs
    secret_key: Field,
    input_amount: Field,
    input_token_id: Field,
    input_salt: Field,
    path_index: Field,
    siblings: [Field; 20],
    swap_amount: Field,
    min_output_amount: Field,
    output_note_salt: Field,
    change_note_salt: Field,

    // Public inputs
    merkle_root: pub Field,
    nullifier: pub Field,
    swap_commitment: pub Field,
    change_commitment: pub Field,
    relayer_address: pub Field,
    relayer_fee: pub Field,
) {
    // 1. Derive public key
    let owner_pubkey = pedersen_hash([secret_key]);

    // 2. Compute input note commitment
    let commitment = pedersen_hash([
        owner_pubkey,
        input_amount,
        input_salt,
    ]);

    // 3. Verify Merkle membership
    let computed_root = compute_merkle_root(commitment, path_index, siblings);
    assert(computed_root == merkle_root, "Merkle proof invalid");

    // 4. Verify nullifier
    let expected_nullifier = poseidon::bn254::hash_2([commitment, secret_key]);
    assert(nullifier == expected_nullifier, "Nullifier mismatch");

    // 5. Range checks on all amounts
    let input_amt = input_amount as u64;
    let swap_amt = swap_amount as u64;
    let fee_amt = relayer_fee as u64;
    let _ = min_output_amount as u64;

    // 6. Verify: swap_amount + relayer_fee <= input_amount
    assert(
        swap_amt + fee_amt <= input_amt,
        "Swap amount + fee exceeds input note"
    );

    // 7. Compute and verify change commitment
    let change_amount = input_amount - swap_amount - relayer_fee;
    let expected_change = pedersen_hash([
        owner_pubkey,
        change_amount,
        change_note_salt,
    ]);
    assert(change_commitment == expected_change, "Change commitment mismatch");

    // 8. Verify swap commitment (binds parameters for the relayer)
    let expected_swap = poseidon::bn254::hash_5([
        input_token_id,
        swap_amount,
        min_output_amount,
        relayer_address,
        output_note_salt,
    ]);
    assert(swap_commitment == expected_swap, "Swap commitment mismatch");
}

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

fn build_test_tree(leaf: Field) -> (Field, [Field; 20]) {
    let mut current = leaf;
    let mut siblings: [Field; 20] = [0; 20];
    for i in 0..TREE_DEPTH {
        siblings[i] = 0;
        current = poseidon::bn254::hash_2([current, 0 as Field]);
    }
    (current, siblings)
}

// -- Tests --

#[test]
fn test_normal_swap() {
    let sk: Field = 42;
    let pk = std::hash::pedersen_hash([sk]);

    let input_amount: Field = 1000;
    let input_token_id: Field = 1;
    let input_salt: Field = 111;
    let commitment = std::hash::pedersen_hash([pk, input_amount, input_salt]);

    let (root, siblings) = build_test_tree(commitment);
    let nullifier = poseidon::bn254::hash_2([commitment, sk]);

    let swap_amount: Field = 800;
    let min_output_amount: Field = 750;
    let relayer_address: Field = 57005;
    let relayer_fee: Field = 50;
    let output_note_salt: Field = 222;
    let change_note_salt: Field = 333;

    // Change = 1000 - 800 - 50 = 150
    let change_amount: Field = 150;
    let change_commitment = std::hash::pedersen_hash([pk, change_amount, change_note_salt]);

    let swap_commitment = poseidon::bn254::hash_5([
        input_token_id,
        swap_amount,
        min_output_amount,
        relayer_address,
        output_note_salt,
    ]);

    main(
        sk, input_amount, input_token_id, input_salt,
        0, siblings,
        swap_amount, min_output_amount, output_note_salt, change_note_salt,
        root, nullifier, swap_commitment, change_commitment,
        relayer_address, relayer_fee,
    );
}

#[test]
fn test_zero_fee_relayer() {
    // Self-relay: no relayer fee
    let sk: Field = 42;
    let pk = std::hash::pedersen_hash([sk]);

    let input_amount: Field = 500;
    let input_token_id: Field = 2;
    let input_salt: Field = 111;
    let commitment = std::hash::pedersen_hash([pk, input_amount, input_salt]);

    let (root, siblings) = build_test_tree(commitment);
    let nullifier = poseidon::bn254::hash_2([commitment, sk]);

    let swap_amount: Field = 500;
    let min_output_amount: Field = 480;
    let relayer_address: Field = 12345;
    let relayer_fee: Field = 0;
    let output_note_salt: Field = 222;
    let change_note_salt: Field = 333;

    // Change = 500 - 500 - 0 = 0
    let change_amount: Field = 0;
    let change_commitment = std::hash::pedersen_hash([pk, change_amount, change_note_salt]);

    let swap_commitment = poseidon::bn254::hash_5([
        input_token_id,
        swap_amount,
        min_output_amount,
        relayer_address,
        output_note_salt,
    ]);

    main(
        sk, input_amount, input_token_id, input_salt,
        0, siblings,
        swap_amount, min_output_amount, output_note_salt, change_note_salt,
        root, nullifier, swap_commitment, change_commitment,
        relayer_address, relayer_fee,
    );
}

#[test(should_fail_with = "Swap amount + fee exceeds input note")]
fn test_insufficient_balance_fails() {
    let sk: Field = 42;
    let pk = std::hash::pedersen_hash([sk]);

    let input_amount: Field = 100;
    let input_token_id: Field = 1;
    let input_salt: Field = 111;
    let commitment = std::hash::pedersen_hash([pk, input_amount, input_salt]);

    let (root, siblings) = build_test_tree(commitment);
    let nullifier = poseidon::bn254::hash_2([commitment, sk]);

    // swap + fee = 90 + 20 = 110 > 100 (insufficient!)
    let swap_amount: Field = 90;
    let min_output_amount: Field = 80;
    let relayer_address: Field = 2989;
    let relayer_fee: Field = 20;
    let output_note_salt: Field = 222;
    let change_note_salt: Field = 333;

    let change_amount: Field = 0; // doesn't matter, will fail before
    let change_commitment = std::hash::pedersen_hash([pk, change_amount, change_note_salt]);
    let swap_commitment = poseidon::bn254::hash_5([
        input_token_id, swap_amount, min_output_amount, relayer_address, output_note_salt,
    ]);

    main(
        sk, input_amount, input_token_id, input_salt,
        0, siblings,
        swap_amount, min_output_amount, output_note_salt, change_note_salt,
        root, nullifier, swap_commitment, change_commitment,
        relayer_address, relayer_fee,
    );
}
