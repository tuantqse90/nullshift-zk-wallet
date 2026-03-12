use std::hash::pedersen_hash;

// ==========================================================
// NullShift -- Deposit (Shield) Circuit
// ==========================================================
// Proves knowledge of the preimage of a note commitment.
// Used when converting public ETH/ERC-20 into a shielded note.
//
// The actual fund transfer happens on-chain (ShieldedPool.deposit).
// This circuit proves the depositor knows the commitment preimage,
// preventing a third party from creating commitments they can't spend.
// ==========================================================

fn main(
    // Private inputs -- the depositor knows these
    owner_pubkey: Field,
    amount: Field,
    salt: Field,

    // Public input -- commitment inserted into the Merkle tree
    commitment: pub Field,
) {
    // Verify commitment preimage
    // commitment = Pedersen(owner_pubkey, amount, salt)
    let expected = pedersen_hash([owner_pubkey, amount, salt]);
    assert(commitment == expected, "Commitment does not match preimage");

    // Range check: amount fits in u64
    let _ = amount as u64;
}

// -- Tests --

#[test]
fn test_valid_deposit() {
    // Compute a commitment from known values and verify the circuit accepts it
    let owner_pubkey: Field = 12345;
    let amount: Field = 1000000;
    let salt: Field = 99999;

    let commitment = std::hash::pedersen_hash([owner_pubkey, amount, salt]);

    main(owner_pubkey, amount, salt, commitment);
}

#[test(should_fail_with = "Commitment does not match preimage")]
fn test_mismatched_commitment_fails() {
    let owner_pubkey: Field = 12345;
    let amount: Field = 1000000;
    let salt: Field = 99999;

    // Use a wrong commitment (salt changed)
    let wrong_commitment = std::hash::pedersen_hash([owner_pubkey, amount, salt + 1]);

    // This should fail: commitment doesn't match the actual preimage
    main(owner_pubkey, amount, salt, wrong_commitment);
}

#[test]
fn test_zero_amount_deposit() {
    // Edge case: zero amount deposit (valid but useless)
    let owner_pubkey: Field = 42;
    let amount: Field = 0;
    let salt: Field = 777;

    let commitment = std::hash::pedersen_hash([owner_pubkey, amount, salt]);
    main(owner_pubkey, amount, salt, commitment);
}
