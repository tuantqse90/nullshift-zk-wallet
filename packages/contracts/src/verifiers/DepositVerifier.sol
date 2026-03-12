// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Aztec
pragma solidity >=0.8.4;

import {BaseUltraVerifier} from "./BaseUltraVerifier.sol";

library DepositVerificationKey {
    function verificationKeyHash() internal pure returns(bytes32) {
        return 0xb8cd26b17f05c7d3b9b39435f55b69e408618a6d464d92a885ad299147483ee7;
    }

    function loadVerificationKey(uint256 _vk, uint256 _omegaInverseLoc) internal pure {
        assembly {
            mstore(add(_vk, 0x00), 0x0000000000000000000000000000000000000000000000000000000000008000) // vk.circuit_size
            mstore(add(_vk, 0x20), 0x0000000000000000000000000000000000000000000000000000000000000001) // vk.num_inputs
            mstore(add(_vk, 0x40), 0x2d1ba66f5941dc91017171fa69ec2bd0022a2a2d4115a009a93458fd4e26ecfb) // vk.work_root
            mstore(add(_vk, 0x60), 0x3063edaa444bddc677fcd515f614555a777997e0a9287d1e62bf6dd004d82001) // vk.domain_inverse
            mstore(add(_vk, 0x80), 0x14749b7adaeec2498582f85b165bce04fba8e2e6a8cbee4cfaa22685720721f8) // vk.Q1.x
            mstore(add(_vk, 0xa0), 0x21c4399122a8d657a7782333df028ec821dbc13e319c458d4c57da1f06221d85) // vk.Q1.y
            mstore(add(_vk, 0xc0), 0x0961d5e20a9f2dc97bdb4219dee68e0bbac5be2720d635679d3cfcf3c10e71d5) // vk.Q2.x
            mstore(add(_vk, 0xe0), 0x1328f2c510128edb426a326f1706d058c79ffac593a5846650b7ce2da8e70301) // vk.Q2.y
            mstore(add(_vk, 0x100), 0x17b69873816ae9c84139df3b22f2a72ec52e6511078cdbc385690712d1ff912d) // vk.Q3.x
            mstore(add(_vk, 0x120), 0x244cfdba277cf74f65767632dedc0ddb2f865f2f525ee974317981cba7710821) // vk.Q3.y
            mstore(add(_vk, 0x140), 0x222f4783475c5a2f6271577db9f79c4bfb5c3ec28f62e46ca4482257bb0d0fb0) // vk.Q4.x
            mstore(add(_vk, 0x160), 0x1272e38ed8abfa760a6eb895decd82fadadaee9caa4301af90e2efe96eb1b8d2) // vk.Q4.y
            mstore(add(_vk, 0x180), 0x13f0c49832e9cfbe5e288d8e3414e089fff2bd5dc786141ed6b797f0b1e731b2) // vk.Q_M.x
            mstore(add(_vk, 0x1a0), 0x05f6ec50d46308d0aa918b960b2200cdd7a6f00ca53fab87e9c66478f59921d9) // vk.Q_M.y
            mstore(add(_vk, 0x1c0), 0x09cef3e2a665ec61a37e6198a6ffea2b9cb5034dcfada7062fe55037f34bd425) // vk.Q_C.x
            mstore(add(_vk, 0x1e0), 0x0a4d0a7a051fa1bdc3a22eec9f2221d9aabb2fedbf75cc8538fbf8704489eec5) // vk.Q_C.y
            mstore(add(_vk, 0x200), 0x03cc5f4ba77da6463191ebcb7ec91588063be3cc8699e9faa1678519d23cf271) // vk.Q_ARITHMETIC.x
            mstore(add(_vk, 0x220), 0x1b76f338c696842e649b6c66bc5f2ed62ee8d4bbb42c8f26d116a6522657b960) // vk.Q_ARITHMETIC.y
            mstore(add(_vk, 0x240), 0x28c34ff2658f88375148bec41535d0e068cbfbf38be901f3d326adb64f55dd8e) // vk.QSORT.x
            mstore(add(_vk, 0x260), 0x11ed1eefcaa87bc29aecf5d82a18acf57be4755f7b84cbb8a069519b18193ff6) // vk.QSORT.y
            mstore(add(_vk, 0x280), 0x119bf5504fae045b99a5412b7ef59d645acf04a49027b4151d3f76b4edc808d0) // vk.Q_ELLIPTIC.x
            mstore(add(_vk, 0x2a0), 0x1ca3a1f51a63c78849ac0f85769c9e2849b177f8b511e8872ee9b5acaa1cc8ad) // vk.Q_ELLIPTIC.y
            mstore(add(_vk, 0x2c0), 0x0046f1ebc880da78b63d32f799d73f0a72fd2ebd80d2b443832e846649d0e719) // vk.Q_AUX.x
            mstore(add(_vk, 0x2e0), 0x0e8b6bb4dfb890bd29dc9acc265a59a774369020424413e5832f0dfcc9ffae01) // vk.Q_AUX.y
            mstore(add(_vk, 0x300), 0x241a788f51ffe1fb08165853d3175a168854d4ee5b7109ef88cb7658cc805ca6) // vk.SIGMA1.x
            mstore(add(_vk, 0x320), 0x0309718abbd84689719106ff4b11d265bf896888be07f8b0fc65507731714219) // vk.SIGMA1.y
            mstore(add(_vk, 0x340), 0x0c04b721d4cf68bdacdae9c2a986f49e43c2b69ea49a306a8ba60c11f6c39788) // vk.SIGMA2.x
            mstore(add(_vk, 0x360), 0x02f7326aa924d950269b30751c70e568a29c936d49aa71ea46bd64ccf99f1ad6) // vk.SIGMA2.y
            mstore(add(_vk, 0x380), 0x1a091908cb59d91c1b1c92f13be935630767c5007baa36789a0732d69511daf0) // vk.SIGMA3.x
            mstore(add(_vk, 0x3a0), 0x29d80ed05458347dee4f365886c12c902c079fedb2303931cde5e2c60b43185c) // vk.SIGMA3.y
            mstore(add(_vk, 0x3c0), 0x257228bba09302f67c9ce9b31f26d789ff7c0a1b617233d5e063ad3828f8c62e) // vk.SIGMA4.x
            mstore(add(_vk, 0x3e0), 0x2cfac84f7d2f0254e2ec7e7171af2043d6353238ac3d17638cb1b90f8174eef5) // vk.SIGMA4.y
            mstore(add(_vk, 0x400), 0x14fa3d2f7838cd2b628013fbcc4a5964f90f86fee3c44f90f15b66cbb883b16d) // vk.TABLE1.x
            mstore(add(_vk, 0x420), 0x087cff60b464aea188316044a5bdd7ad11e09061a6bbb1538a16ea2043d818bb) // vk.TABLE1.y
            mstore(add(_vk, 0x440), 0x0edc0845445f3a9214ca8c4ce8bfd53897d91e27fc085631d7fb2a1225d3c40e) // vk.TABLE2.x
            mstore(add(_vk, 0x460), 0x30521fd3f90d6823143b31aa19fdb95c3622a2ebcfe40878a9b926f9bb595870) // vk.TABLE2.y
            mstore(add(_vk, 0x480), 0x030ac1cc92a28b967df7160de3f4bb3d18ea9b4e815b5c595a4cb7cae56db7c6) // vk.TABLE3.x
            mstore(add(_vk, 0x4a0), 0x2465a7e5d40cdae7124e40609f69a02cdbae4b8de36519517a574e2a2c8201fd) // vk.TABLE3.y
            mstore(add(_vk, 0x4c0), 0x0d3a5fd296b6cb7657205032d326c1126531247361cfb572fe626cdbc274fe6a) // vk.TABLE4.x
            mstore(add(_vk, 0x4e0), 0x2c76ae3fdcd620f284426dc5c68ba0a2c4b08dda0c3a6ccb925a93efdc34eeff) // vk.TABLE4.y
            mstore(add(_vk, 0x500), 0x03dd624a075d6702b2646c22ad0cb27e188b0bd8c77ee42cd3bb41f69216c1b6) // vk.TABLE_TYPE.x
            mstore(add(_vk, 0x520), 0x09b634a9d9c5d099c4b49b611e6da0bffc105bd632365da46bc4bdaa843057a7) // vk.TABLE_TYPE.y
            mstore(add(_vk, 0x540), 0x1690af35b2fd2ec075334bd5fb63d6444708553aae989c105067b83faf61e716) // vk.ID1.x
            mstore(add(_vk, 0x560), 0x2acf69b7fbea02f68d8c683630ac08cdf34fbc7895bf47d5664c34d5596564c5) // vk.ID1.y
            mstore(add(_vk, 0x580), 0x2a0b4e1a983a8f56a0187071daa717704bf256001155693eeda1a0b95d9b72b0) // vk.ID2.x
            mstore(add(_vk, 0x5a0), 0x0327629527c47e7c25ebd245be0134eb6c22cba4975a4c22768cd9a8de389c75) // vk.ID2.y
            mstore(add(_vk, 0x5c0), 0x0d4c0cf0254730ee51aab2261f5727ab777696a4552e200d3a98fe11a382925c) // vk.ID3.x
            mstore(add(_vk, 0x5e0), 0x17d290c14f4806a52e8ca8720e560d72da80a59ac9cf6e8982abe2c8f42a1891) // vk.ID3.y
            mstore(add(_vk, 0x600), 0x1d44892e25afd7b1b511cc354ea04890ebe4b3bba7a6d41d80f0378f1c2b0a85) // vk.ID4.x
            mstore(add(_vk, 0x620), 0x00d3e9ca3160e963d8c198a39b78178e523699e0eab49c7585f6c863b42973bf) // vk.ID4.y
            mstore(add(_vk, 0x640), 0x00) // vk.contains_recursive_proof
            mstore(add(_vk, 0x660), 0) // vk.recursive_proof_public_input_indices
            mstore(add(_vk, 0x680), 0x260e01b251f6f1c7e7ff4e580791dee8ea51d87a358e038b4efe30fac09383c1) // vk.g2_x.X.c1 
            mstore(add(_vk, 0x6a0), 0x0118c4d5b837bcc2bc89b5b398b5974e9f5944073b32078b7e231fec938883b0) // vk.g2_x.X.c0 
            mstore(add(_vk, 0x6c0), 0x04fc6369f7110fe3d25156c1bb9a72859cf2a04641f99ba4ee413c80da6a5fe4) // vk.g2_x.Y.c1 
            mstore(add(_vk, 0x6e0), 0x22febda3c0c0632a56475b4214e5615e11e6dd3f96e6cea2854a87d4dacc5e55) // vk.g2_x.Y.c0 
            mstore(_omegaInverseLoc, 0x05d33766e4590b3722701b6f2fa43d0dc3f028424d384e68c92a742fb2dbc0b4) // vk.work_root_inverse
        }
    }
}

contract DepositVerifier is BaseUltraVerifier {
    function getVerificationKeyHash() public pure override(BaseUltraVerifier) returns (bytes32) {
        return DepositVerificationKey.verificationKeyHash();
    }

    function loadVerificationKey(uint256 vk, uint256 _omegaInverseLoc) internal pure virtual override(BaseUltraVerifier) {
        DepositVerificationKey.loadVerificationKey(vk, _omegaInverseLoc);
    }
}
