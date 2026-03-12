use std::hash::pedersen_hash;
use std::hash::poseidon;

// ==========================================================
// NullShift -- Withdraw (Unshield) Circuit
// ==========================================================
// Proves ownership of a shielded note and authorizes withdrawal
// to a public address. Supports partial withdrawals with change.
// ==========================================================

global TREE_DEPTH: u32 = 20;

fn main(
    // Private inputs
    secret_key: Field,
    amount: Field,
    salt: Field,
    path_index: Field,
    siblings: [Field; 20],
    change_salt: Field,

    // Public inputs
    merkle_root: pub Field,
    nullifier: pub Field,
    recipient_address: pub Field,
    withdraw_amount: pub Field,
    change_commitment: pub Field,
) {
    // 1. Derive public key from secret key
    let owner_pubkey = pedersen_hash([secret_key]);

    // 2. Compute note commitment
    let commitment = pedersen_hash([owner_pubkey, amount, salt]);

    // 3. Verify Merkle membership
    let computed_root = compute_merkle_root(commitment, path_index, siblings);
    assert(computed_root == merkle_root, "Merkle proof invalid");

    // 4. Verify nullifier
    let expected_nullifier = poseidon::bn254::hash_2([commitment, secret_key]);
    assert(nullifier == expected_nullifier, "Nullifier mismatch");

    // 5. Range checks
    let note_amount = amount as u64;
    let w_amount = withdraw_amount as u64;
    assert(w_amount <= note_amount, "Withdraw amount exceeds note balance");

    // 6. Compute change amount
    let change_amount = amount - withdraw_amount;

    // 7. Verify change commitment
    let expected_change = pedersen_hash([owner_pubkey, change_amount, change_salt]);
    assert(
        change_commitment == expected_change,
        "Change commitment mismatch"
    );

    // 8. Bind recipient to the proof (prevents relayer from redirecting)
    // recipient_address is a public input, verified on-chain
    let _ = recipient_address;
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

// Helper: build single-leaf test tree
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
fn test_full_withdraw() {
    let sk: Field = 42;
    let pk = std::hash::pedersen_hash([sk]);
    let amount: Field = 1000;
    let salt: Field = 111;
    let commitment = std::hash::pedersen_hash([pk, amount, salt]);

    let (root, siblings) = build_test_tree(commitment);
    let nullifier = poseidon::bn254::hash_2([commitment, sk]);

    let recipient: Field = 0xDEAD;
    let withdraw_amount: Field = 1000; // full withdraw
    let change_salt: Field = 222;
    let change_amount: Field = 0; // no change
    let change_commitment = std::hash::pedersen_hash([pk, change_amount, change_salt]);

    main(
        sk, amount, salt, 0, siblings, change_salt,
        root, nullifier, recipient, withdraw_amount, change_commitment,
    );
}

#[test]
fn test_partial_withdraw() {
    let sk: Field = 42;
    let pk = std::hash::pedersen_hash([sk]);
    let amount: Field = 1000;
    let salt: Field = 111;
    let commitment = std::hash::pedersen_hash([pk, amount, salt]);

    let (root, siblings) = build_test_tree(commitment);
    let nullifier = poseidon::bn254::hash_2([commitment, sk]);

    let recipient: Field = 0xBEEF;
    let withdraw_amount: Field = 600; // partial
    let change_salt: Field = 333;
    let change_amount: Field = 400; // 1000 - 600
    let change_commitment = std::hash::pedersen_hash([pk, change_amount, change_salt]);

    main(
        sk, amount, salt, 0, siblings, change_salt,
        root, nullifier, recipient, withdraw_amount, change_commitment,
    );
}

#[test(should_fail_with = "Withdraw amount exceeds note balance")]
fn test_overdraw_fails() {
    let sk: Field = 42;
    let pk = std::hash::pedersen_hash([sk]);
    let amount: Field = 100;
    let salt: Field = 111;
    let commitment = std::hash::pedersen_hash([pk, amount, salt]);

    let (root, siblings) = build_test_tree(commitment);
    let nullifier = poseidon::bn254::hash_2([commitment, sk]);

    let recipient: Field = 0xDEAD;
    let withdraw_amount: Field = 200; // more than note has!
    let change_salt: Field = 222;
    // change would be negative, but we still build a fake commitment
    let fake_change = std::hash::pedersen_hash([pk, 0 as Field, change_salt]);

    main(
        sk, amount, salt, 0, siblings, change_salt,
        root, nullifier, recipient, withdraw_amount, fake_change,
    );
}
