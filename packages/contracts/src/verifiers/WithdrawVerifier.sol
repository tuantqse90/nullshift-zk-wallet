// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Aztec
pragma solidity >=0.8.4;

import {BaseUltraVerifier} from "./BaseUltraVerifier.sol";

library WithdrawVerificationKey {
    function verificationKeyHash() internal pure returns(bytes32) {
        return 0xef9dd13a9f782a818fdd20f362c48784c5eb5181ad84b5c273122af065601576;
    }

    function loadVerificationKey(uint256 _vk, uint256 _omegaInverseLoc) internal pure {
        assembly {
            mstore(add(_vk, 0x00), 0x0000000000000000000000000000000000000000000000000000000000008000) // vk.circuit_size
            mstore(add(_vk, 0x20), 0x0000000000000000000000000000000000000000000000000000000000000005) // vk.num_inputs
            mstore(add(_vk, 0x40), 0x2d1ba66f5941dc91017171fa69ec2bd0022a2a2d4115a009a93458fd4e26ecfb) // vk.work_root
            mstore(add(_vk, 0x60), 0x3063edaa444bddc677fcd515f614555a777997e0a9287d1e62bf6dd004d82001) // vk.domain_inverse
            mstore(add(_vk, 0x80), 0x13e7c4a1de62378e0610a3d4e3207faf3b41cd4f1d4eeeeb853b4fe045f2750c) // vk.Q1.x
            mstore(add(_vk, 0xa0), 0x19433ea8d634c358820ab0711557f7366dfc00167900dcde78108ba86f31d226) // vk.Q1.y
            mstore(add(_vk, 0xc0), 0x101cc22b26730552600905a4a484ff90c9f6f21557ce67423e6dfe0d21ab8a7b) // vk.Q2.x
            mstore(add(_vk, 0xe0), 0x11db864c3d0c221bdf347139406a0ed0df2038d8c8ef8a6f3253536eabeecba5) // vk.Q2.y
            mstore(add(_vk, 0x100), 0x18879f7c223fb6647dc52302e8df05a53ba6ffefad05615dc306758bfdd99521) // vk.Q3.x
            mstore(add(_vk, 0x120), 0x2c7835d3fa7270a1e9612b8cb3548c8bfa89571185eb253114288ee455288f9d) // vk.Q3.y
            mstore(add(_vk, 0x140), 0x2d83cfffe22330fed6984e290974cf0ebf3fc047c074ac441647bdca0d0b5110) // vk.Q4.x
            mstore(add(_vk, 0x160), 0x2b5d914fa2eac18816bb0ccf4ab9c7e184415a1847dabf92d4e16519af792a6d) // vk.Q4.y
            mstore(add(_vk, 0x180), 0x21b002754f56033e83d31798c902e7481ec421dc60600b56ef3e63650a956666) // vk.Q_M.x
            mstore(add(_vk, 0x1a0), 0x08bfb520f9dd9dc8af86ced7e1e9b7a800529ca755cbdaec40184303d00fc2d3) // vk.Q_M.y
            mstore(add(_vk, 0x1c0), 0x0eaf3103a40e21bb5fb9567d79f4549e27e8c55d9a041997ff8e93a1a383734b) // vk.Q_C.x
            mstore(add(_vk, 0x1e0), 0x2b87c9294edb06e6246305b265e5d4e470e9064d1a11ba1f159eb1d51cc405e4) // vk.Q_C.y
            mstore(add(_vk, 0x200), 0x277fa3d337a3d4bb8c09f2b9ae1a90f0908b38035a625bf077f37a09539fed08) // vk.Q_ARITHMETIC.x
            mstore(add(_vk, 0x220), 0x0d96ba22d8ed1f34792c1672b561a60b47a2b037bc35634e2a50dcf8379c1740) // vk.Q_ARITHMETIC.y
            mstore(add(_vk, 0x240), 0x0b7855e16b0df7e1fe92246cfb53f660fb44a3921c8b638bf78259710c2920fa) // vk.QSORT.x
            mstore(add(_vk, 0x260), 0x0b0ac11e6dbb6c1791a5658ed7765350f886e08061ed2f6fcafefdf1cf806ba6) // vk.QSORT.y
            mstore(add(_vk, 0x280), 0x0c5bf66a48c08e313248fc41c02a1eaceb54eef8e0de5fe888acd14419db702d) // vk.Q_ELLIPTIC.x
            mstore(add(_vk, 0x2a0), 0x1ce7b0e93de16fed51143d62c5304e194ae74ca2ad7efba160dac356e04a83c7) // vk.Q_ELLIPTIC.y
            mstore(add(_vk, 0x2c0), 0x24c39a2d602bca44c1f14b97c653ca8769e0ef5e74402eb2c1bbd57f60c5e0ef) // vk.Q_AUX.x
            mstore(add(_vk, 0x2e0), 0x2f1c7f71818cfd09813670dbb265b5b426dec4849e8e7c4f9635f8c5e6a54ca1) // vk.Q_AUX.y
            mstore(add(_vk, 0x300), 0x0a6f772359ea3af95188ffeb403b83311ab6f9ba77abf6fa1cba3e4a955a8450) // vk.SIGMA1.x
            mstore(add(_vk, 0x320), 0x04ac452b1be257df6e28a1b593d17d3ffec1e6085519c6b09fcd3fb5155cc057) // vk.SIGMA1.y
            mstore(add(_vk, 0x340), 0x11399e9946bd0dc443906c8af65ad6be3ae17055c8f4a95f12273d6b3d42454a) // vk.SIGMA2.x
            mstore(add(_vk, 0x360), 0x29267444b35515fa98c6cdc89d0b6591e4c9fed3755cf1eea0f9f7ec0b746298) // vk.SIGMA2.y
            mstore(add(_vk, 0x380), 0x1a34118f0ec30d97553a3ff5b8caba68fad0ec1db9e6e5bfee22295b3acdf28c) // vk.SIGMA3.x
            mstore(add(_vk, 0x3a0), 0x30501e3d1d21509bfc7abd5a8002945071d4a5141cd1baaa03a6df17949fe0c1) // vk.SIGMA3.y
            mstore(add(_vk, 0x3c0), 0x0a2403c3f6318bac7acb2b5ace498d7836d84b076c24725d28bbc09c278fb652) // vk.SIGMA4.x
            mstore(add(_vk, 0x3e0), 0x21188c51dc0933a678a11d2a98f843a3b3ce3073432178f8d63684195d8cc129) // vk.SIGMA4.y
            mstore(add(_vk, 0x400), 0x14fa3d2f7838cd2b628013fbcc4a5964f90f86fee3c44f90f15b66cbb883b16d) // vk.TABLE1.x
            mstore(add(_vk, 0x420), 0x087cff60b464aea188316044a5bdd7ad11e09061a6bbb1538a16ea2043d818bb) // vk.TABLE1.y
            mstore(add(_vk, 0x440), 0x0edc0845445f3a9214ca8c4ce8bfd53897d91e27fc085631d7fb2a1225d3c40e) // vk.TABLE2.x
            mstore(add(_vk, 0x460), 0x30521fd3f90d6823143b31aa19fdb95c3622a2ebcfe40878a9b926f9bb595870) // vk.TABLE2.y
            mstore(add(_vk, 0x480), 0x030ac1cc92a28b967df7160de3f4bb3d18ea9b4e815b5c595a4cb7cae56db7c6) // vk.TABLE3.x
            mstore(add(_vk, 0x4a0), 0x2465a7e5d40cdae7124e40609f69a02cdbae4b8de36519517a574e2a2c8201fd) // vk.TABLE3.y
            mstore(add(_vk, 0x4c0), 0x0d3a5fd296b6cb7657205032d326c1126531247361cfb572fe626cdbc274fe6a) // vk.TABLE4.x
            mstore(add(_vk, 0x4e0), 0x2c76ae3fdcd620f284426dc5c68ba0a2c4b08dda0c3a6ccb925a93efdc34eeff) // vk.TABLE4.y
            mstore(add(_vk, 0x500), 0x1451100a6bbc9aab131ce08de3d3c809d2005a30a9fb044d1c25e1375e205947) // vk.TABLE_TYPE.x
            mstore(add(_vk, 0x520), 0x151e00385748604cead8589d2b11bdd79ae8a35cd428b53e34e68944c80ad2ae) // vk.TABLE_TYPE.y
            mstore(add(_vk, 0x540), 0x229c6804508300c84b7696d7eec97b0cb95a7a4075df12e202e3aac70e39a86a) // vk.ID1.x
            mstore(add(_vk, 0x560), 0x14b786deb5dac01d69cd8c5d94a6700c1c647f9b30a2873a44af222eac7f3e96) // vk.ID1.y
            mstore(add(_vk, 0x580), 0x01bc33f3f6a26808fbcd8a343334ee346eca99b89a97df9c5827b483cac7371e) // vk.ID2.x
            mstore(add(_vk, 0x5a0), 0x0be58ac37646130c3486e403a282b2482cc33872dba60ef6c67360fa40f877f1) // vk.ID2.y
            mstore(add(_vk, 0x5c0), 0x05e6d17c7a69b1e7d92d0ae92822396f874396e4eae2257c2a21cdaed8de4d85) // vk.ID3.x
            mstore(add(_vk, 0x5e0), 0x056e7972b6e986c4eb846481390a633a0568afbc606f07aebff1d7a4980a8dba) // vk.ID3.y
            mstore(add(_vk, 0x600), 0x27bd45f8a153edad324164edb8cd7c010b66f439a10296261025e8d3bd89d8ac) // vk.ID4.x
            mstore(add(_vk, 0x620), 0x247d5cc7b939b7a384f8dd354b56cae6a569b5cb5bed5e0f5c091c620177c12a) // vk.ID4.y
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

contract WithdrawVerifier is BaseUltraVerifier {
    function getVerificationKeyHash() public pure override(BaseUltraVerifier) returns (bytes32) {
        return WithdrawVerificationKey.verificationKeyHash();
    }

    function loadVerificationKey(uint256 vk, uint256 _omegaInverseLoc) internal pure virtual override(BaseUltraVerifier) {
        WithdrawVerificationKey.loadVerificationKey(vk, _omegaInverseLoc);
    }
}
