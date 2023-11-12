async function get_serial() {
    const port = await navigator.serial.requestPort({ filters: [{ usbVendorId: 0x2341 }] });
    await port.open({ baudRate: 57600 });
    return port;
}

async function read_public_key(port): Promise<string> {
    const req = new Uint8Array(1);
    req[0] = 0;

    const writer = port.writable.getWriter();
    await writer.write(req);
    await writer.ready;
    await writer.close();

    const reader = port.readable.getReader();
    let bytes_read = 0;
    const key = new Uint8Array(44);
    while (bytes_read < 44) {
        const { value, done } = await reader.read();
        key.set(value, bytes_read)
        if (done) {
            break;
        }
        bytes_read += value.length;
    }
    await reader.cancel();

    const decoder = new TextDecoder();
    return decoder.decode(key);
}

async function sign(port, data: Uint8Array): Promise<string> {
    if (data.length > 256) {
        throw new Error("Data too large");
    }

    const len = new Uint8Array(1);
    len[0] = data.length;

    const writer = port.writable.getWriter();
    await writer.write(len);
    await writer.write(data);
    await writer.ready;
    await writer.close();

    const reader = port.readable.getReader();
    let bytes_read = 0;
    const sig = new Uint8Array(88);
    while (bytes_read < 88) {
        const { value, done } = await reader.read();
        sig.set(value, bytes_read)
        if (done) {
            break;
        }
        bytes_read += value.length;
    }
    await reader.cancel();

    const decoder = new TextDecoder();
    return decoder.decode(sig);
}

async function signed_request(endpoint: string, data: any): Promise<Response> {
    const public_key = localStorage.getItem('public_key');
    if (public_key == null) {
        throw new Error("No public key enrolled");
    }

    const transaction = new Uint8Array(16);
    self.crypto.getRandomValues(transaction);
    const transaction_base64 = btoa(String.fromCharCode.apply(null, transaction));

    const challenge_res = await fetch("/api/challenge", {
        method: "POST",
        body: transaction_base64,
    });
    if (challenge_res.status != 200) {
        return challenge_res;
    }

    const challenge = await challenge_res.text();

    data.t = transaction_base64;
    data.c = challenge;
    data.k = public_key;
    const body = JSON.stringify(data);

    console.log(body);

    const encoder = new TextEncoder();
    const port = await get_serial();
    const sig = await sign(port, encoder.encode(body));
    await port.close();

    return await fetch(endpoint, {
        method: "POST",
        body: body,
        headers: {
            'X-Signature': sig
        },
    });
}

const text = document.getElementById('text')! as HTMLTextAreaElement;
const do_enroll = document.getElementById('do_enroll')! as HTMLButtonElement;
const do_post = document.getElementById('do_post')! as HTMLButtonElement;

do_enroll.addEventListener('click', async () => {
    do_enroll.disabled = true;
    do_enroll.innerText = "Waiting...";

    const port = await get_serial();
    const public_key = await read_public_key(port);
    await port.close();

    localStorage.setItem('public_key', public_key);

    do_enroll.disabled = false;
    do_enroll.innerText = "Enroll";
});

do_post.addEventListener('click', async () => {
    do_post.disabled = true;
    do_post.innerText = "Waiting...";

    const content = text.value;
    await signed_request("/api/post", { content: content });
    text.value = "";

    do_post.disabled = false;
    do_post.innerText = "Post";
});