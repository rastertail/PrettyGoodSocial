#![no_std]
#![no_main]

use panic_halt as _;

const PRIVATE_KEY: &'static [u8; 48] = include_bytes!("./signing.der");
const PUBLIC_KEY: &'static [u8; 44] = include_bytes!("./public.der");

#[link(name = "c25519")]
extern "C" {
    fn edsign_sign(
        signature: *mut u8,
        public: *const u8,
        secret: *const u8,
        message: *const u8,
        message_len: u32,
    );
}

#[arduino_hal::entry]
fn main() -> ! {
    let dp = arduino_hal::Peripherals::take().unwrap();
    let pins = arduino_hal::pins!(dp);

    let mut serial = arduino_hal::default_serial!(dp, pins, 57600);

    let button = pins.d2.into_floating_input();
    let mut led = pins.d3.into_output();

    let mut data_buf = [0u8; 256];

    loop {
        led.set_low();
        let len = serial.read_byte();

        if len > 0 {
            for i in 0..len {
                data_buf[i as usize] = serial.read_byte();
            }

            let mut signature = [0u8; 64];
            unsafe {
                edsign_sign(
                    (&mut signature).as_mut_ptr(),
                    PUBLIC_KEY[12..].as_ptr(),
                    PRIVATE_KEY[16..].as_ptr(),
                    (&data_buf).as_ptr(),
                    len as _,
                );
            }

            led.set_high();
            while button.is_high() {}

            for b in signature {
                serial.write_byte(b);
            }
        } else {
            led.set_high();
            while button.is_high() {}

            for b in &PUBLIC_KEY[12..] {
                serial.write_byte(*b);
            }
        }
    }
}
