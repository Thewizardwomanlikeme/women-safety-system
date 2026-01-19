/**
 * Women Safety System - ESP32 Main Firmware
 *
 * Emergency button detection with 3-second confirmation delay
 * LoRa transmission on confirmed emergency
 * Cancel functionality during delay period
 */

#include "config.h"
#include "lora_comm.h"
#include <Arduino.h>
#include <esp_log.h>
#include <esp_timer.h>

static const char *TAG = "MAIN";

// Emergency state machine
typedef enum {
  STATE_IDLE,
  STATE_DELAY,     // 3-second delay after first press
  STATE_CONFIRMED, // Emergency confirmed, sending alert
  STATE_CANCELLED  // Emergency cancelled during delay
} emergency_state_t;

// Global state variables
static volatile emergency_state_t current_state = STATE_IDLE;
static volatile uint32_t button_press_time = 0;
static volatile bool button_pressed = false;
static esp_timer_handle_t emergency_timer = NULL;

// Function prototypes
void setup(void);
void loop(void);
void IRAM_ATTR button_isr_handler(void);
void emergency_timer_callback(void *arg);
void handle_emergency_confirmed(void);
void handle_emergency_cancelled(void);
void update_led_status(void);
uint8_t read_battery_level(void);

/**
 * ISR: Button interrupt handler
 */
void IRAM_ATTR button_isr_handler(void) {
  uint32_t now = millis();

  // Debounce check
  if (now - button_press_time < BUTTON_DEBOUNCE_MS) {
    return;
  }

  button_press_time = now;
  button_pressed = true;
}

/**
 * Timer callback: Emergency delay timer expired
 */
void emergency_timer_callback(void *arg) {
  if (current_state == STATE_DELAY) {
    current_state = STATE_CONFIRMED;
    ESP_LOGI(TAG, "Emergency CONFIRMED - 3 seconds elapsed");
  }
}

/**
 * Read battery level (0-100%)
 */
uint8_t read_battery_level(void) {
#ifdef BATTERY_ADC_PIN
  int adc_value = analogRead(BATTERY_ADC_PIN);
  float voltage = (adc_value / 4095.0) * 3.3 * 2; // Assuming voltage divider

  // Map voltage to percentage
  float percentage = ((voltage - BATTERY_VOLTAGE_MIN) /
                      (BATTERY_VOLTAGE_MAX - BATTERY_VOLTAGE_MIN)) *
                     100.0;

  // Clamp to 0-100
  if (percentage < 0)
    percentage = 0;
  if (percentage > 100)
    percentage = 100;

  return (uint8_t)percentage;
#else
  return 100; // Default to 100% if no battery monitoring
#endif
}

/**
 * Handle confirmed emergency
 */
void handle_emergency_confirmed(void) {
  ESP_LOGI(TAG, "EMERGENCY TRIGGERED!");

  uint8_t battery = read_battery_level();

  // Send emergency packet via LoRa
  bool sent = lora_send_packet(PACKET_TYPE_EMERGENCY, battery);

  if (sent) {
    ESP_LOGI(TAG, "Emergency alert transmitted successfully");

    // Blink LED rapidly to indicate success
    for (int i = 0; i < 10; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(100);
      digitalWrite(LED_PIN, LOW);
      delay(100);
    }
  } else {
    ESP_LOGE(TAG, "Failed to transmit emergency alert");

    // Retry once
    delay(500);
    sent = lora_send_packet(PACKET_TYPE_EMERGENCY, battery);
    if (sent) {
      ESP_LOGI(TAG, "Emergency alert transmitted on retry");
    }
  }

  // Return to idle state
  current_state = STATE_IDLE;
}

/**
 * Handle cancelled emergency
 */
void handle_emergency_cancelled(void) {
  ESP_LOGI(TAG, "Emergency CANCELLED by user");

  uint8_t battery = read_battery_level();

  // Send cancel packet via LoRa
  lora_send_packet(PACKET_TYPE_CANCEL, battery);

  // Turn off LED
  digitalWrite(LED_PIN, LOW);

  // Return to idle state
  current_state = STATE_CANCELLED;
  delay(1000); // Brief delay before returning to idle
  current_state = STATE_IDLE;
}

/**
 * Update LED status based on current state
 */
void update_led_status(void) {
  static uint32_t last_blink = 0;
  static bool led_state = false;

  switch (current_state) {
  case STATE_IDLE:
  case STATE_CANCELLED:
    digitalWrite(LED_PIN, LOW);
    break;

  case STATE_DELAY:
    // Blink LED during delay period
    if (millis() - last_blink > LED_BLINK_MS) {
      led_state = !led_state;
      digitalWrite(LED_PIN, led_state);
      last_blink = millis();
    }
    break;

  case STATE_CONFIRMED:
    digitalWrite(LED_PIN, HIGH);
    break;
  }
}

/**
 * Arduino setup function
 */
void setup(void) {
  // Initialize serial for debugging
  Serial.begin(115200);
  delay(1000);

  ESP_LOGI(TAG, "Women Safety System - ESP32 Firmware");
  ESP_LOGI(TAG, "Device ID: 0x%04X", DEVICE_ID);

  // Configure GPIO pins
  pinMode(BUTTON_PIN, INPUT_PULLUP); // Button with pull-up (active LOW)
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Attach button interrupt (falling edge = button pressed)
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), button_isr_handler,
                  FALLING);

  // Initialize LoRa
  if (!lora_init()) {
    ESP_LOGE(TAG, "FATAL: LoRa initialization failed");
    while (1) {
      // Blink LED to indicate error
      digitalWrite(LED_PIN, HIGH);
      delay(1000);
      digitalWrite(LED_PIN, LOW);
      delay(1000);
    }
  }

  // Create emergency timer (one-shot)
  const esp_timer_create_args_t timer_args = {
      .callback = &emergency_timer_callback, .name = "emergency_timer"};
  esp_timer_create(&timer_args, &emergency_timer);

  ESP_LOGI(TAG, "System initialized - Ready for emergencies");

  // Send heartbeat to confirm system is alive
  lora_send_packet(PACKET_TYPE_HEARTBEAT, read_battery_level());
}

/**
 * Arduino loop function
 */
void loop(void) {
  // Check if button was pressed (from ISR)
  if (button_pressed) {
    button_pressed = false;

    switch (current_state) {
    case STATE_IDLE:
      // First press - start 3-second delay
      ESP_LOGI(TAG, "Button pressed - Starting 3-second delay");
      ESP_LOGI(TAG, "Press again within 3 seconds to CANCEL");

      current_state = STATE_DELAY;

      // Start 3-second timer
      esp_timer_start_once(emergency_timer,
                           EMERGENCY_DELAY_MS * 1000); // microseconds
      break;

    case STATE_DELAY:
      // Second press during delay - cancel emergency
      ESP_LOGI(TAG, "Button pressed during delay - Cancelling emergency");

      // Stop timer
      esp_timer_stop(emergency_timer);

      handle_emergency_cancelled();
      break;

    default:
      // Ignore button presses in other states
      break;
    }
  }

  // Handle confirmed emergency
  if (current_state == STATE_CONFIRMED) {
    handle_emergency_confirmed();
  }

  // Update LED status
  update_led_status();

  // Small delay to prevent tight loop
  delay(10);
}
