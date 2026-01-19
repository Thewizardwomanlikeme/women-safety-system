/**
 * Women Safety System - ESP32 Configuration
 * Hardware pin definitions and system parameters
 */

#ifndef CONFIG_H
#define CONFIG_H

// Hardware Pin Definitions
#define BUTTON_PIN          GPIO_NUM_0      // Emergency button (pull-up)
#define LED_PIN             GPIO_NUM_2      // Status LED
#define LORA_SCK_PIN        GPIO_NUM_5      // LoRa SPI Clock
#define LORA_MISO_PIN       GPIO_NUM_19     // LoRa SPI MISO
#define LORA_MOSI_PIN       GPIO_NUM_27     // LoRa SPI MOSI
#define LORA_CS_PIN         GPIO_NUM_18     // LoRa Chip Select
#define LORA_RST_PIN        GPIO_NUM_14     // LoRa Reset
#define LORA_DIO0_PIN       GPIO_NUM_26     // LoRa DIO0 (IRQ)

// LoRa Configuration
#define LORA_FREQUENCY      868E6           // 868 MHz (Europe) - Change to 915E6 for US
#define LORA_BANDWIDTH      125E3           // 125 kHz
#define LORA_SPREADING_FACTOR 7             // SF7 for faster transmission
#define LORA_TX_POWER       20              // 20 dBm (max power)
#define LORA_SYNC_WORD      0x12            // Private network sync word

// Device Configuration
#define DEVICE_ID           0x0001          // Unique device identifier (change per device)

// Timing Configuration (milliseconds)
#define BUTTON_DEBOUNCE_MS  50              // Button debounce delay
#define EMERGENCY_DELAY_MS  3000            // 3-second confirmation delay
#define LED_BLINK_MS        200             // LED blink rate in emergency mode
#define HEARTBEAT_INTERVAL_MS 60000         // Send heartbeat every 60 seconds

// Packet Types
#define PACKET_TYPE_EMERGENCY   0x01
#define PACKET_TYPE_CANCEL      0x02
#define PACKET_TYPE_HEARTBEAT   0x03

// Magic Bytes for packet identification
#define MAGIC_BYTE_1        0xEF
#define MAGIC_BYTE_2        0xFD

// Battery Monitoring (if using battery)
#define BATTERY_ADC_PIN     GPIO_NUM_34     // ADC pin for battery voltage
#define BATTERY_VOLTAGE_MAX 4.2             // Max battery voltage (Li-ion)
#define BATTERY_VOLTAGE_MIN 3.0             // Min battery voltage

#endif // CONFIG_H
