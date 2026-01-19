/**
 * Women Safety System - LoRa Communication Implementation
 * Implements LoRa packet transmission and encoding
 */

#include "lora_comm.h"
#include "config.h"
#include <LoRa.h> // Using Sandeep Mistry's LoRa library for ESP32
#include <esp_log.h>
#include <esp_timer.h>
#include <string.h>

static const char *TAG = "LORA_COMM";
static uint16_t sequence_counter = 0;

/**
 * Initialize LoRa module
 */
bool lora_init(void) {
  ESP_LOGI(TAG, "Initializing LoRa module...");

  // Set LoRa pins
  LoRa.setPins(LORA_CS_PIN, LORA_RST_PIN, LORA_DIO0_PIN);

  // Initialize LoRa at configured frequency
  if (!LoRa.begin(LORA_FREQUENCY)) {
    ESP_LOGE(TAG, "LoRa initialization failed!");
    return false;
  }

  // Configure LoRa parameters for optimal emergency transmission
  LoRa.setSpreadingFactor(LORA_SPREADING_FACTOR);
  LoRa.setSignalBandwidth(LORA_BANDWIDTH);
  LoRa.setTxPower(LORA_TX_POWER);
  LoRa.setSyncWord(LORA_SYNC_WORD);

  ESP_LOGI(TAG, "LoRa initialized successfully");
  ESP_LOGI(TAG, "Frequency: %.2f MHz", LORA_FREQUENCY / 1E6);
  ESP_LOGI(TAG, "Spreading Factor: %d", LORA_SPREADING_FACTOR);

  return true;
}

/**
 * Calculate CRC16 checksum (CCITT standard)
 */
uint16_t lora_calculate_crc16(const uint8_t *data, size_t length) {
  uint16_t crc = 0xFFFF;

  for (size_t i = 0; i < length; i++) {
    crc ^= (uint16_t)data[i] << 8;
    for (uint8_t j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }

  return crc;
}

/**
 * Get current sequence number and increment
 */
uint16_t lora_get_sequence_number(void) { return sequence_counter++; }

/**
 * Send emergency packet via LoRa
 */
bool lora_send_packet(uint8_t packet_type, uint8_t battery_level) {
  if (!lora_is_ready()) {
    ESP_LOGW(TAG, "LoRa not ready for transmission");
    return false;
  }

  // Create packet
  emergency_packet_t packet;
  packet.magic[0] = MAGIC_BYTE_1;
  packet.magic[1] = MAGIC_BYTE_2;
  packet.device_id = DEVICE_ID;
  packet.packet_type = packet_type;
  packet.battery_level = battery_level;
  packet.timestamp =
      (uint16_t)(esp_timer_get_time() / 1000000); // Seconds since boot
  packet.sequence_number = lora_get_sequence_number();

  // Calculate checksum (exclude checksum field itself)
  packet.checksum =
      lora_calculate_crc16((uint8_t *)&packet, sizeof(emergency_packet_t) - 2);

  // Log packet details
  const char *type_str = packet_type == PACKET_TYPE_EMERGENCY ? "EMERGENCY"
                         : packet_type == PACKET_TYPE_CANCEL  ? "CANCEL"
                                                              : "HEARTBEAT";
  ESP_LOGI(TAG, "Sending %s packet #%d", type_str, packet.sequence_number);

  // Begin LoRa packet
  LoRa.beginPacket();

  // Write packet bytes
  LoRa.write((uint8_t *)&packet, sizeof(emergency_packet_t));

  // Send packet (blocking - takes ~50-200ms depending on SF)
  bool success =
      LoRa.endPacket(true); // true = wait for transmission to complete

  if (success) {
    ESP_LOGI(TAG, "Packet transmitted successfully");
  } else {
    ESP_LOGE(TAG, "Packet transmission failed");
  }

  return success;
}

/**
 * Check if LoRa is ready to transmit
 */
bool lora_is_ready(void) {
  // Check if LoRa is currently transmitting
  return !LoRa.isTransmitting();
}
