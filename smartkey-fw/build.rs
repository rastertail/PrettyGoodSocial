fn main() {
    cc::Build::new()
        .file("c25519/src/f25519.c")
        .file("c25519/src/fprime.c")
        .file("c25519/src/sha512.c")
        .file("c25519/src/ed25519.c")
        .file("c25519/src/morph25519.c")
        .file("c25519/src/edsign.c")
        .include("c25519/src")
        .no_default_flags(true)
        .flag("-mmcu=atmega328p")
        .compile("c25519");
}
