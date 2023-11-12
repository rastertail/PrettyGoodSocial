import * as ed from '@noble/ed25519';

const main = async () => {
    const logs = document.getElementById('logs')! as HTMLTextAreaElement;
    const do_challenge = document.getElementById('do_challenge')! as HTMLButtonElement;

    logs.value = "";

    const priv_key = ed.utils.randomPrivateKey();
    const pub_key = await ed.getPublicKeyAsync(priv_key);
    const priv_base64 = btoa(String.fromCharCode.apply(null, priv_key));
    const pub_base64 = btoa(String.fromCharCode.apply(null, pub_key));

    logs.value += 'Private key: ' + priv_base64 + '\n';
    logs.value += 'Public key: ' + pub_base64 + '\n';

    const encoder = new TextEncoder();

    do_challenge.addEventListener('click', async () => {
        const transaction = new Uint8Array(16);
        self.crypto.getRandomValues(transaction);

        const transaction_base64 = btoa(String.fromCharCode.apply(null, transaction));
        logs.value += 'Transaction ID: ' + transaction_base64 + '\n';

        const challenge_res = await fetch("/api/challenge", {
            method: "POST",
            body: transaction_base64,
        });
        if (challenge_res.status != 200) {
            logs.value += 'Error: ' + challenge_res.status + '\n';
        } else {
            const challenge = await challenge_res.text();
            logs.value += 'Challenge: ' + challenge + '\n';

            const register_req = JSON.stringify({
                t: transaction_base64,
                c: challenge,
                k: pub_base64,
                name: "test",
            });
            const sig = await ed.signAsync(encoder.encode(register_req), priv_key);

            const register_res = await fetch("/api/display_name", {
                method: "POST",
                body: register_req,
                headers: {
                    'X-Signature': btoa(String.fromCharCode.apply(null, sig))
                },
            });
            logs.value += await register_res.text() + '\n';
        }
    });
};

main();