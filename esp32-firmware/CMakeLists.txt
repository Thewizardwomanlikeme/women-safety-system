# Women Safety System - ESP32 Firmware Build Configuration
# ESP-IDF CMake build system

cmake_minimum_required(VERSION 3.16)

# Project name
set(PROJECT_NAME "women_safety_esp32")

# Include ESP-IDF build system
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

# Set main component sources
set(COMPONENT_SRCS 
    "main.c"
    "lora_comm.c"
)

set(COMPONENT_ADD_INCLUDEDIRS ".")

# Register component
register_component()

# Project definition
project(${PROJECT_NAME})

# Component dependencies
set(COMPONENT_REQUIRES 
    driver 
    esp_timer 
    nvs_flash
)
