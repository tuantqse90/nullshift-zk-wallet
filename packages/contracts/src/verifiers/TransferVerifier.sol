// Verification Key Hash: 7731126a20ae70164063268d542d367c5f2151ba19e7b88f0c539c2cfcba0a53
// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Aztec
pragma solidity >=0.8.4;

import {BaseUltraVerifier} from "./BaseUltraVerifier.sol";

library TransferVerificationKey {
    function verificationKeyHash() internal pure returns(bytes32) {
        return 0x7731126a20ae70164063268d542d367c5f2151ba19e7b88f0c539c2cfcba0a53;
    }

    function loadVerificationKey(uint256 _vk, uint256 _omegaInverseLoc) internal pure {
        assembly {
            mstore(add(_vk, 0x00), 0x0000000000000000000000000000000000000000000000000000000000008000) // vk.circuit_size
            mstore(add(_vk, 0x20), 0x0000000000000000000000000000000000000000000000000000000000000005) // vk.num_inputs
            mstore(add(_vk, 0x40), 0x2d1ba66f5941dc91017171fa69ec2bd0022a2a2d4115a009a93458fd4e26ecfb) // vk.work_root
            mstore(add(_vk, 0x60), 0x3063edaa444bddc677fcd515f614555a777997e0a9287d1e62bf6dd004d82001) // vk.domain_inverse
            mstore(add(_vk, 0x80), 0x14efbc342d1de37199e1df3a9c457ea32f728339b2193f2b7d95799ccab64968) // vk.Q1.x
            mstore(add(_vk, 0xa0), 0x169ee4e6c713db71b05384ca4afe8187ec983815941caa1dc17161ee3406c073) // vk.Q1.y
            mstore(add(_vk, 0xc0), 0x2d3b6d64454b7abe79776a700b41a67466a69f02e701457b826b4e9baca75dd7) // vk.Q2.x
            mstore(add(_vk, 0xe0), 0x1f98f258b8889df0f3b381caafd42115f80c7f79f55e14a026a527e1c27dfba1) // vk.Q2.y
            mstore(add(_vk, 0x100), 0x01af032ff0ca2f93a2ebaba312916c1d1e4efd9188294d77993661165d22bb2d) // vk.Q3.x
            mstore(add(_vk, 0x120), 0x2a98f35948e11dac7f3f005396d001513f3c51b716839eeea719d69322e0ae2f) // vk.Q3.y
            mstore(add(_vk, 0x140), 0x05dd64614431472654cc8e802a820c6e7a17532d46893064f28676e1c8f02850) // vk.Q4.x
            mstore(add(_vk, 0x160), 0x2833be5c9d973fb44bbcd2061d73b7e2d06e00cd8780156edddcb5cb80e65797) // vk.Q4.y
            mstore(add(_vk, 0x180), 0x1dd38f4589273aac99bbf7a6c7a0bf37746d9e74438ed615593077f06eeeca1a) // vk.Q_M.x
            mstore(add(_vk, 0x1a0), 0x0e56360612659dd8a36179c3fefdb32bad8f3ab4da85abfbad55aa88e15a81a3) // vk.Q_M.y
            mstore(add(_vk, 0x1c0), 0x1ac21cb142aa0f9bd758d4196d926ce6b0e91187170b3f83ed6f8ccca4f3f72f) // vk.Q_C.x
            mstore(add(_vk, 0x1e0), 0x29cab0a6d2a551776dc0e52e24f9382a0ba36bdd96714b5da530d4ec9025c5ef) // vk.Q_C.y
            mstore(add(_vk, 0x200), 0x005a53ac450e291178ad469302fe9a97678e628c75d8022d0820b394222c840b) // vk.Q_ARITHMETIC.x
            mstore(add(_vk, 0x220), 0x077a874584f666ae5e15899db118d8df9e1b8edccb4278aa531fb51b51afcb87) // vk.Q_ARITHMETIC.y
            mstore(add(_vk, 0x240), 0x1096f4169cc6f35ac31fc6452ed53efa26d03443a05b97ce9b4ce495dc4a4cbd) // vk.QSORT.x
            mstore(add(_vk, 0x260), 0x20fd6185b080f2bbd9b70488687f349cea01aefb5f9fedc11911dbf91f345e6f) // vk.QSORT.y
            mstore(add(_vk, 0x280), 0x1b4555e1673602b233a539bde25fd84699c6888f657a19e97d843bee75d6bef7) // vk.Q_ELLIPTIC.x
            mstore(add(_vk, 0x2a0), 0x03c673ccc3b4359b35b8b50042662f6da663c405545aac5d47326c944dbf47e3) // vk.Q_ELLIPTIC.y
            mstore(add(_vk, 0x2c0), 0x0c5cf720fd1641954c0f48c689ae5cb17d0aea0af48eed458a3e4c76e5b3b920) // vk.Q_AUX.x
            mstore(add(_vk, 0x2e0), 0x1235fc888022ffe50cb94ab4772691a58fd88522f0bd0b25799f6e303293f6f8) // vk.Q_AUX.y
            mstore(add(_vk, 0x300), 0x1bade0e3da7e5ba5f4e779e4a817cb41b64ebd27ec505252abfe357263d5743e) // vk.SIGMA1.x
            mstore(add(_vk, 0x320), 0x017990f18acd2ceb60100d75428f011e54cd22c5f164808b9fdbe94ed7d09946) // vk.SIGMA1.y
            mstore(add(_vk, 0x340), 0x0af649ae1822bfb465e788744d73cf509589e789f927ce54c8ddfeac6c36bc2e) // vk.SIGMA2.x
            mstore(add(_vk, 0x360), 0x0451be8278fc42b0cf8631728c09c768ec548c3c5d6ee3676a2e1fe6fabc6956) // vk.SIGMA2.y
            mstore(add(_vk, 0x380), 0x21ba2e05d9510abc5d75bef8cacb71755f9b03f49da911f90370c7ab35017435) // vk.SIGMA3.x
            mstore(add(_vk, 0x3a0), 0x1a475428fb2254dc5fa52109a0b3837123823b5f43d1e0acac08651d87264c5e) // vk.SIGMA3.y
            mstore(add(_vk, 0x3c0), 0x2cbdb559c988766df2916e9bc4bb674687710d4a238ee21b6719553b7f862ddd) // vk.SIGMA4.x
            mstore(add(_vk, 0x3e0), 0x1463cc65612ba0d69a3e813d5e33889fde8f12e9d5e9e558c1f1037d8e0ab115) // vk.SIGMA4.y
            mstore(add(_vk, 0x400), 0x14fa3d2f7838cd2b628013fbcc4a5964f90f86fee3c44f90f15b66cbb883b16d) // vk.TABLE1.x
            mstore(add(_vk, 0x420), 0x087cff60b464aea188316044a5bdd7ad11e09061a6bbb1538a16ea2043d818bb) // vk.TABLE1.y
            mstore(add(_vk, 0x440), 0x0edc0845445f3a9214ca8c4ce8bfd53897d91e27fc085631d7fb2a1225d3c40e) // vk.TABLE2.x
            mstore(add(_vk, 0x460), 0x30521fd3f90d6823143b31aa19fdb95c3622a2ebcfe40878a9b926f9bb595870) // vk.TABLE2.y
            mstore(add(_vk, 0x480), 0x030ac1cc92a28b967df7160de3f4bb3d18ea9b4e815b5c595a4cb7cae56db7c6) // vk.TABLE3.x
            mstore(add(_vk, 0x4a0), 0x2465a7e5d40cdae7124e40609f69a02cdbae4b8de36519517a574e2a2c8201fd) // vk.TABLE3.y
            mstore(add(_vk, 0x4c0), 0x0d3a5fd296b6cb7657205032d326c1126531247361cfb572fe626cdbc274fe6a) // vk.TABLE4.x
            mstore(add(_vk, 0x4e0), 0x2c76ae3fdcd620f284426dc5c68ba0a2c4b08dda0c3a6ccb925a93efdc34eeff) // vk.TABLE4.y
            mstore(add(_vk, 0x500), 0x2e24cb25cb3c4314dfb7109db1427720614db6604ba84f54e887ed3d6888d2e9) // vk.TABLE_TYPE.x
            mstore(add(_vk, 0x520), 0x0be6dbcd045af1d856259948b30a891aaef1d61c0b5b42c3b9ffcfb866b48ada) // vk.TABLE_TYPE.y
            mstore(add(_vk, 0x540), 0x0145fa265542523e71aab59b1fb174e8a41681b199060293004ad4217daab09e) // vk.ID1.x
            mstore(add(_vk, 0x560), 0x24ad9e5af48b79f342bd34b72a2f814ebbfb128eb69d9c97cce79da7944dc39b) // vk.ID1.y
            mstore(add(_vk, 0x580), 0x0938884f40a01c22858fe43ac632dfdda86d6769ef5132ea3a93dd0ab12cf834) // vk.ID2.x
            mstore(add(_vk, 0x5a0), 0x1e88177d69d92dde3a052d65123b64939dadd40f5bfd487c4dd7c343af4a1081) // vk.ID2.y
            mstore(add(_vk, 0x5c0), 0x033da92e31111e199f705a2cbbe2da9f3b9e7058531b136351e17c83b5d9b8e3) // vk.ID3.x
            mstore(add(_vk, 0x5e0), 0x0c706c92fea410b638308b7f7683cc367e64f04a65ce0985d536f14c4f4bf547) // vk.ID3.y
            mstore(add(_vk, 0x600), 0x226b855094ca4ee06377ea6ee783dc2c33a621331fd89518cc1cc3ce993fb692) // vk.ID4.x
            mstore(add(_vk, 0x620), 0x2f6b0e8fd39b3e9aead12d8326cc3aaa0f418c3b0f69ecebc0e55a0c0d65e3ca) // vk.ID4.y
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

contract TransferVerifier is BaseUltraVerifier {
    function getVerificationKeyHash() public pure override(BaseUltraVerifier) returns (bytes32) {
        return TransferVerificationKey.verificationKeyHash();
    }

    function loadVerificationKey(uint256 vk, uint256 _omegaInverseLoc) internal pure virtual override(BaseUltraVerifier) {
        TransferVerificationKey.loadVerificationKey(vk, _omegaInverseLoc);
    }
}
