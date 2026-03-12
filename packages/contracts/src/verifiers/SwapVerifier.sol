// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Aztec
pragma solidity >=0.8.4;

import {BaseUltraVerifier} from "./BaseUltraVerifier.sol";

library SwapVerificationKey {
    function verificationKeyHash() internal pure returns(bytes32) {
        return 0x37528582461382055553c5a2e01b2a48542ee0e093dae503d02a1a8367533304;
    }

    function loadVerificationKey(uint256 _vk, uint256 _omegaInverseLoc) internal pure {
        assembly {
            mstore(add(_vk, 0x00), 0x0000000000000000000000000000000000000000000000000000000000008000) // vk.circuit_size
            mstore(add(_vk, 0x20), 0x0000000000000000000000000000000000000000000000000000000000000006) // vk.num_inputs
            mstore(add(_vk, 0x40), 0x2d1ba66f5941dc91017171fa69ec2bd0022a2a2d4115a009a93458fd4e26ecfb) // vk.work_root
            mstore(add(_vk, 0x60), 0x3063edaa444bddc677fcd515f614555a777997e0a9287d1e62bf6dd004d82001) // vk.domain_inverse
            mstore(add(_vk, 0x80), 0x11a2ae0973f3d0f61352975156d7842b4b45a265e5b562fd5dd4071e8e71eec0) // vk.Q1.x
            mstore(add(_vk, 0xa0), 0x1c253a2f3197247bff5254d11a3a88c1213b681d8236f5aa1ee45da71e897535) // vk.Q1.y
            mstore(add(_vk, 0xc0), 0x085c86c77aca6b6be1ae73d417a89241a7a560b0b49bdb1f6159e2e189de847d) // vk.Q2.x
            mstore(add(_vk, 0xe0), 0x175736ff165ed96153ca5dd1d00c5ff7b81757142d1817c0d94eaa2cb1090d53) // vk.Q2.y
            mstore(add(_vk, 0x100), 0x0fe28294863b2d724f53624d3cf8cc6ea010dcf0e90f5ec76052386e88a47a83) // vk.Q3.x
            mstore(add(_vk, 0x120), 0x129455e47318ae0208f2bdba185ce387797f9aed2ba337e3f339f9e979d9e29c) // vk.Q3.y
            mstore(add(_vk, 0x140), 0x090496faac01070f4ca44cb268a185d585d235ea6a7cddcc1f9d4f83b66a7af5) // vk.Q4.x
            mstore(add(_vk, 0x160), 0x1c26b3d28e4642c602b2516b42b4283bb8d939cab44a3785086b70bfda0d0be6) // vk.Q4.y
            mstore(add(_vk, 0x180), 0x2f379a3dd21ff62d790e172df0aff4b6345f22bdc57db6ce9887df2a1e598ff9) // vk.Q_M.x
            mstore(add(_vk, 0x1a0), 0x15eced94ffba8abb62324c38ce27ba47ab4e1812c4b7bf2dbedcf28b91192b6d) // vk.Q_M.y
            mstore(add(_vk, 0x1c0), 0x1893b436e8929f8b0f880b02ddc27106846ce76e2034aad1a0332e213ce23cb2) // vk.Q_C.x
            mstore(add(_vk, 0x1e0), 0x1d8d10740e068f45736099935bd9e111a75e685de6378dcbf2007dd1cbcec644) // vk.Q_C.y
            mstore(add(_vk, 0x200), 0x25aa4fa0f23c164f7913ea5fe370a6a1ad4b5775b426470402bb8dffe747811b) // vk.Q_ARITHMETIC.x
            mstore(add(_vk, 0x220), 0x1e26028ac05f5b53dfd6e25561dc7b96c6dd1df54e650106d57047b079e4392e) // vk.Q_ARITHMETIC.y
            mstore(add(_vk, 0x240), 0x252413f31d382437c0cd1471714c3511576895ca7e2cdcacf9178e7ce3d7a47b) // vk.QSORT.x
            mstore(add(_vk, 0x260), 0x0eef054c3b767659e63543d278cb1da17a996881f3d4063c991db5efdb5cb3bb) // vk.QSORT.y
            mstore(add(_vk, 0x280), 0x12f01878e72ae66b63d634f0bbd2828549fad395631a29222f911cde2ca8839d) // vk.Q_ELLIPTIC.x
            mstore(add(_vk, 0x2a0), 0x2e1640edfbbf086afaa333a65b71a4e884fd330fb53ed591e8763a2042f7497b) // vk.Q_ELLIPTIC.y
            mstore(add(_vk, 0x2c0), 0x0a03fe8fea87a8e606f190c8988126b3424cfa2cbdba722268d55e5546414fa4) // vk.Q_AUX.x
            mstore(add(_vk, 0x2e0), 0x0198d0b3e3af0698da52c43734f98bd4f08b307184ac8f6330c472efb7bdc6e5) // vk.Q_AUX.y
            mstore(add(_vk, 0x300), 0x2319902e34c6b62a182f9e298dcc17280e64a23d92e635f33ca447739cd60554) // vk.SIGMA1.x
            mstore(add(_vk, 0x320), 0x16347123a2a6ef6eff2ac4b19e7f954de0ed64aa42e035dd8a7028036589fb37) // vk.SIGMA1.y
            mstore(add(_vk, 0x340), 0x03716b1284e6bcc9a6c5dce0f2b5bdc9554136f4ac302d723fb559961673577d) // vk.SIGMA2.x
            mstore(add(_vk, 0x360), 0x0d9472a6dbbf61fad17acb6b785c43e5ae5c63769f232b8b63aa388c3ae27408) // vk.SIGMA2.y
            mstore(add(_vk, 0x380), 0x26c9abfef606aed8d6181f30b34828f1a4571c21dca3a55f837dfcc1f52e54fc) // vk.SIGMA3.x
            mstore(add(_vk, 0x3a0), 0x1177eed998de337079ebfcf4bb8302531f44211c4f32e916adb072eb13cc4918) // vk.SIGMA3.y
            mstore(add(_vk, 0x3c0), 0x2d587450227d7458c4721495bb96181f3c04480acb49bd064ff94ba9363be7d7) // vk.SIGMA4.x
            mstore(add(_vk, 0x3e0), 0x026ce75677012d88c4e1853f39429e073c036a5f45715c2a13d491dc15585729) // vk.SIGMA4.y
            mstore(add(_vk, 0x400), 0x14fa3d2f7838cd2b628013fbcc4a5964f90f86fee3c44f90f15b66cbb883b16d) // vk.TABLE1.x
            mstore(add(_vk, 0x420), 0x087cff60b464aea188316044a5bdd7ad11e09061a6bbb1538a16ea2043d818bb) // vk.TABLE1.y
            mstore(add(_vk, 0x440), 0x0edc0845445f3a9214ca8c4ce8bfd53897d91e27fc085631d7fb2a1225d3c40e) // vk.TABLE2.x
            mstore(add(_vk, 0x460), 0x30521fd3f90d6823143b31aa19fdb95c3622a2ebcfe40878a9b926f9bb595870) // vk.TABLE2.y
            mstore(add(_vk, 0x480), 0x030ac1cc92a28b967df7160de3f4bb3d18ea9b4e815b5c595a4cb7cae56db7c6) // vk.TABLE3.x
            mstore(add(_vk, 0x4a0), 0x2465a7e5d40cdae7124e40609f69a02cdbae4b8de36519517a574e2a2c8201fd) // vk.TABLE3.y
            mstore(add(_vk, 0x4c0), 0x0d3a5fd296b6cb7657205032d326c1126531247361cfb572fe626cdbc274fe6a) // vk.TABLE4.x
            mstore(add(_vk, 0x4e0), 0x2c76ae3fdcd620f284426dc5c68ba0a2c4b08dda0c3a6ccb925a93efdc34eeff) // vk.TABLE4.y
            mstore(add(_vk, 0x500), 0x0948cb4308e6e06501f95f05ba0175877a8d25fcec660d13d8f0a69bd75da3d3) // vk.TABLE_TYPE.x
            mstore(add(_vk, 0x520), 0x2625b209abd7ab197541baef55ce7f6c9247280270b3c843bf47c3c423f22c98) // vk.TABLE_TYPE.y
            mstore(add(_vk, 0x540), 0x177390d2418d65833f9e8881c12967f999a64f1e91edf62123cca121c2f11ad7) // vk.ID1.x
            mstore(add(_vk, 0x560), 0x22b0962994d3051d6de82e028cf6a58aa52845d6bf0a4cb732b62334735152fc) // vk.ID1.y
            mstore(add(_vk, 0x580), 0x0a43570c95234c5ced5a16a7588dd15a8561228b56eda8d3edd7df0f22ebd6bf) // vk.ID2.x
            mstore(add(_vk, 0x5a0), 0x0d6727c64bd7ffbb8aab252f5f49240a596f005d7e694b16d38ee475dcad8a37) // vk.ID2.y
            mstore(add(_vk, 0x5c0), 0x1841fc4bbd3dad428a2f34fba38c6926dc7a1465c394d965edca78153f48daf7) // vk.ID3.x
            mstore(add(_vk, 0x5e0), 0x2ebfb77b6441f28921246100b3db3c5277e23a2d3d5889f9830037913f5f0dc4) // vk.ID3.y
            mstore(add(_vk, 0x600), 0x0ae2f1654af430b2ef24461e026bfbbeea11832e26476932c205172bdfc58a62) // vk.ID4.x
            mstore(add(_vk, 0x620), 0x034609d08ca150792c423d4820a3aeceba40cf521012045cf42fdbb505db4df8) // vk.ID4.y
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

contract SwapVerifier is BaseUltraVerifier {
    function getVerificationKeyHash() public pure override(BaseUltraVerifier) returns (bytes32) {
        return SwapVerificationKey.verificationKeyHash();
    }

    function loadVerificationKey(uint256 vk, uint256 _omegaInverseLoc) internal pure virtual override(BaseUltraVerifier) {
        SwapVerificationKey.loadVerificationKey(vk, _omegaInverseLoc);
    }
}
