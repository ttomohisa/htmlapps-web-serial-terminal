# Browser Kitty Web Serial Terminal - Raspberry Pi Pico UART echo test
# Pico is powered/debugged over USB. Browser Kitty connects to a separate 3.3 V USB-UART adapter.
#
# Wiring for UART0:
#   USB-UART TXD -> Pico GP1 (UART0 RX)
#   USB-UART RXD -> Pico GP0 (UART0 TX)
#   USB-UART GND -> Pico GND
# Do not connect the adapter VCC when the Pico is already powered by USB.

import time
from machine import Pin, UART

BAUD = 115200
BITS = 8
PARITY = None   # None, 0=even, 1=odd
STOP = 1

uart = UART(
    0,
    baudrate=BAUD,
    bits=BITS,
    parity=PARITY,
    stop=STOP,
    tx=Pin(0),
    rx=Pin(1),
    timeout=0,
    timeout_char=0,
    rxbuf=4096,
    txbuf=4096,
)

print("BK-PICO-UART-ECHO ready")
print("UART0 GP0=TX GP1=RX baud=%d bits=%d parity=%s stop=%d" %
      (BAUD, BITS, str(PARITY), STOP))

rx_total = 0
last_report = time.ticks_ms()

while True:
    if uart.any():
        data = uart.read()
        if data:
            rx_total += len(data)
            uart.write(data)
            print("UART RX bytes=%d total=%d hex=%s" %
                  (len(data), rx_total, " ".join("%02X" % b for b in data)))

    now = time.ticks_ms()
    if time.ticks_diff(now, last_report) >= 5000:
        print("UART heartbeat total=%d" % rx_total)
        last_report = now

    time.sleep_ms(1)
