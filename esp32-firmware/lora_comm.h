/**
 * Women Safety System - LoRa Communication Interface
 * Defines packet structure and communication functions
 */

#ifndef LORA_COMM_H
#define LORA_COMM_H

#include <stdbool.h>
#include <stdint.h>

// Emergency Packet Structure (12 bytes total)
typedef struct __attribute__((packed)) {
  uint8_t magic[2];         // [0-1] Magic bytes: 0xEF 0xFD
  uint16_t device_id;       // [2-3] Device ID
  uint8_t packet_type;      // [4] Packet type (emergency/cancel/heartbeat)
  uint8_t battery_level;    // [5] Battery level (0-100%)
  uint16_t timestamp;       // [6-7] Timestamp (seconds since boot)
  uint16_t sequence_number; // [8-9] Sequence number
  uint16_t checksum;        // [10-11] CRC16 checksum
} emergency_packet_t;

/**
 * Initialize LoRa module
 * Returns: true on success, false on failure
 */
bool lora_init(void);

/**
 * Send emergency packet via LoRa
 * @param packet_type: Type of packet (EMERGENCY/CANCEL/HEARTBEAT)
 * @param battery_level: Current battery level (0-100%)
 * Returns: true on success, false on failure
 */
bool lora_send_packet(uint8_t packet_type, uint8_t battery_level);

/**
 * Calculate CRC16 checksum
 * @param data: Pointer to data buffer
 * @param length: Length of data
 * Returns: CRC16 checksum value
 */
uint16_t lora_calculate_crc16(const uint8_t *data, size_t length);

/**
 * Get current sequence number (auto-increments)
 * Returns: Current sequence number
 */
uint16_t lora_get_sequence_number(void);

/**
 * Check if LoRa is ready to transmit
 * Returns: true if ready, false otherwise
 */
bool lora_is_ready(void);

#endif // LORA_COMM_H
