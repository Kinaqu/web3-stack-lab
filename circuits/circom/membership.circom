pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";

// Merkle membership proof with leaf bound to user:
// leaf = Poseidon(user, nonce)
//
// Public inputs: root, user
// Private inputs: nonce, pathElements[], pathIndices[]
template Membership(depth) {
    // Public
    signal input root;
    signal input user;

    // Private
    signal input nonce;
    signal input pathElements[depth];
    signal input pathIndices[depth]; // 0/1

    // leaf = Poseidon(user, nonce)
    component leafHash = Poseidon(2);
    leafHash.inputs[0] <== user;
    leafHash.inputs[1] <== nonce;

    component h[depth];
    signal cur[depth + 1];
    signal left[depth];
    signal right[depth];

    cur[0] <== leafHash.out;

    var i;
    for (i = 0; i < depth; i++) {
        // Enforce boolean
        pathIndices[i] * (pathIndices[i] - 1) === 0;

        // Quadratic-safe selector:
        // left  = cur + b*(sib-cur)
        // right = sib + b*(cur-sib)
        left[i]  <== cur[i] + pathIndices[i] * (pathElements[i] - cur[i]);
        right[i] <== pathElements[i] + pathIndices[i] * (cur[i] - pathElements[i]);

        h[i] = Poseidon(2);
        h[i].inputs[0] <== left[i];
        h[i].inputs[1] <== right[i];

        cur[i + 1] <== h[i].out;
    }

    root === cur[depth];
}

component main { public [root, user] } = Membership(4);