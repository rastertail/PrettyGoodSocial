const text = document.getElementById('text')! as HTMLTextAreaElement;
const do_post = document.getElementById('do_post')! as HTMLButtonElement;

const encoder = new TextEncoder();

do_post.addEventListener('click', async () => {
    do_post.disabled = true;
    do_post.innerText = "Waiting...";

    const port = await navigator.serial.requestPort({ filters: [{ usbVendorId: 0x2341 }] });
    await port.open({ baudRate: 57600 });

    do_post.innerText = "Signing...";

    const data = encoder.encode(text.value);
    const len = new Uint8Array(1);
    len[0] = data.length;

    const writer = port.writable.getWriter();
    await writer.write(len);
    await writer.write(data);
    await writer.ready;
    await writer.close();

    const reader = port.readable.getReader();
    let bytes_read = 0
    while (bytes_read < 64) {
        const { value, done } = await reader.read();
        console.log(value);
        if (done) {
            break;
        }
        bytes_read += value.length;
    }
    await reader.cancel();

    await port.close();

    do_post.disabled = false;
    do_post.innerText = "Post";
});