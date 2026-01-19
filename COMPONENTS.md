# Hardware Components & Cost Analysis

This document lists all required hardware components with specifications and cost estimates.

## Required Components (Per Unit)

### 1. ESP32 Development Board

**Recommended:** ESP32-DevKitC V4

**Specifications:**
- Microcontroller: ESP32-WROOM-32
- Flash: 4MB
- RAM: 520KB
- GPIO: 34 programmable pins
- Power: 5V via USB or 3.3V
- Size: 55mm × 28mm

**Cost:** $5-10 USD

**Suppliers:**
- Amazon, AliExpress, Digi-Key, Mouser

---

### 2. LoRa Module (ESP32)

**Recommended:** SX1276/SX1278 LoRa Module (RFM95W compatible)

**Specifications:**
- Chipset: Semtech SX1276
- Frequency: 868 MHz (EU) / 915 MHz (US) / 433 MHz (Asia)
- Transmit Power: Up to +20 dBm
- Sensitivity: -148 dBm
- Range: 2-5 km (urban), 10-15 km (rural)
- Interface: SPI
- Antenna: U.FL connector (requires external antenna)

**Cost:** $3-8 USD

**Suppliers:**
- AliExpress, Amazon, eBay

**Alternative:** Hope RFM95W module ($8-12 USD)

---

### 3. Emergency Button

**Recommended:** Momentary Push Button (Normally Open)

**Specifications:**
- Type: SPST Momentary
- Actuation Force: 100-200g
- Contact Resistance: <100mΩ
- Durability: >100,000 cycles
- Mounting: Panel mount or PCB mount

**Color Options:**
- Red (recommended for emergency)
- Large button (12-16mm) for panic situations

**Cost:** $1-2 USD

**Suppliers:**
- Amazon, AliExpress, Adafruit

**Upgrade Option:** Waterproof button ($3-5 USD)

---

### 4. LoRa Antenna (ESP32)

**Recommended:** 868/915 MHz Spring Antenna

**Specifications:**
- Frequency: 868/915 MHz
- Gain: 2-3 dBi
- Connector: U.FL or SMA
- Length: 80-100mm

**Cost:** $1-3 USD

**Alternative:** Helical antenna with SMA connector ($5-8 USD for better range)

---

### 5. Android LoRa Receiver Module

**Option A: USB LoRa Adapter**

**Recommended:** USB Serial LoRa Module (CH340 + SX1276)

**Specifications:**
- Chipset: SX1276 + CH340 USB-to-Serial
- Interface: USB-A or USB-C
- Power: 5V from USB
- Driver: USB CDC (no special drivers needed on Android)

**Cost:** $15-25 USD

**Suppliers:**
- AliExpress, eBay (search: "USB LoRa module")

**Option B: Bluetooth LoRa Module**

**Specifications:**
- Bluetooth 4.0/5.0 + SX1276
- Battery powered
- Pairing with Android phone

**Cost:** $20-30 USD

**Pros/Cons:**
- USB: Cheaper, more reliable, requires OTG cable
- Bluetooth: Wireless, requires battery, more expensive

---

### 6. Battery (Optional - for Portable ESP32)

**Recommended:** 18650 Li-ion Battery + Charger Module

**Specifications:**
- Capacity: 2000-3000 mAh
- Voltage: 3.7V nominal
- Charger: TP4056 module (USB charging)
- Battery life: 24-48 hours (with heartbeat every 60s)

**Cost:** 
- Battery: $3-5 USD
- Charger module: $1-2 USD

**Alternative:** LiPo battery (3.7V 2000mAh) - $5-8 USD

---

### 7. Enclosure (Optional)

**Recommended:** Weatherproof ABS Plastic Box

**Specifications:**
- Size: 80mm × 60mm × 30mm
- Material: ABS plastic
- Rating: IP54 (dust/water resistant)
- Mounting: Screw holes or adhesive

**Cost:** $3-5 USD

**Alternative:** 3D printed enclosure (STL files can be provided) - ~$2-3 in filament

---

### 8. Miscellaneous

**Wires and Connectors:**
- Dupont jumper wires (male-to-female): $1-2
- USB-C or Micro-USB cable: $1-2

**USB OTG Cable (for Android):**
- USB-C to USB-A adapter: $2-3 USD

**PCB (Optional - for production):**
- Custom PCB design
- Cost per board (bulk): $5-10 USD

---

## Total Cost Breakdown

### Minimal Configuration (Breadboard Prototype)

| Component | Cost (USD) |
|-----------|------------|
| ESP32 DevKit | $7 |
| SX1276 LoRa Module | $5 |
| Emergency Button | $1.50 |
| LoRa Antenna (ESP32) | $2 |
| Android USB LoRa Adapter | $20 |
| Jumper Wires | $1.50 |
| USB OTG Cable | $2 |
| **Total per unit** | **~$39** |

### Production Configuration (with Battery & Enclosure)

| Component | Cost (USD) |
|-----------|------------|
| ESP32 DevKit | $7 |
| SX1276 LoRa Module | $5 |
| Emergency Button | $1.50 |
| LoRa Antenna (ESP32) | $2 |
| Android USB LoRa Adapter | $20 |
| 18650 Battery + Charger | $5 |
| Weatherproof Enclosure | $4 |
| Custom PCB | $8 |
| Miscellaneous | $2.50 |
| **Total per unit** | **~$55** |

### Bulk Pricing (100+ units)

- ESP32: $4-5
- LoRa modules: $2-3
- Total per unit (bulk): **~$30-40**

---

## Android Phone Requirements

**Minimum Specifications:**
- OS: Android 7.0 (API 24) or higher
- USB OTG support (most phones since 2015)
- GPS/Location services
- Cellular/Wi-Fi for backend communication

**Recommended:** Any mid-range Android phone (2020+)

**Not Required:**
- High-end specifications
- Large storage
- Flagship features

---

## Backend Infrastructure Costs

### Hosting (VPS)

| Provider | Plan | Cost/Month |
|----------|------|------------|
| DigitalOcean | Basic Droplet (1GB RAM) | $6 |
| AWS EC2 | t3.micro | $8-10 |
| Google Cloud | e2-micro | $7 |
| Heroku | Basic dyno | $7 |

**Recommendation:** DigitalOcean or AWS for reliability

### Twilio (SMS & Calls)

| Service | Cost |
|---------|------|
| Phone Number | $1-2/month |
| SMS (outbound) | $0.0079 per message (US) |
| Voice Calls | $0.013 per minute (US) |

**Example Monthly Cost (10 emergencies/month):**
- Phone number: $1.50
- SMS (30 messages, 3 contacts): $0.24
- Calls (10 calls × 0.5 min): $0.07
- **Total:** ~$2/month

### Database

| Option | Cost |
|--------|------|
| MongoDB Atlas (Free tier) | $0 (512MB) |
| PostgreSQL (Self-hosted) | Included in VPS |
| AWS RDS (Micro) | $15/month |

**Recommendation:** MongoDB Atlas free tier or self-hosted PostgreSQL

---

## Alternative Components

### Budget Option (<$25 per unit)

- Use ESP8266 instead of ESP32: -$2
- Smaller button: -$0.50
- No enclosure: -$4
- DIY antenna: -$1
- **Total:** ~$22

### Premium Option (>$80 per unit)

- ESP32-WROVER (more RAM): +$5
- High-gain antenna (5dBi): +$10
- Waterproof button: +$3
- Professional enclosure: +$10
- Better battery (4000mAh): +$5
- **Total:** ~$88

---

## Where to Buy

### International Suppliers
- **AliExpress**: Cheapest, 2-4 weeks shipping
- **Amazon**: Fast shipping (1-2 days), higher cost
- **eBay**: Good deals, variable shipping

### Electronics Distributors
- **Digi-Key**: Reliable, fast, higher cost
- **Mouser**: Similar to Digi-Key
- **SparkFun**: Quality modules, tutorials
- **Adafruit**: Beginner-friendly, good support

### Local Options
- Check local electronics markets
- Maker spaces often have bulk discounts
- University/college electronics labs

---

## Scaling Considerations

### For 10 units:
- Hardware: ~$390 (minimal) to $550 (production)
- Backend: ~$10-15/month

### For 100 units:
- Hardware: ~$3000-4000 (bulk pricing)
- Backend: ~$20-30/month (more resources needed)

### For 1000 units:
- Hardware: ~$25,000-35,000
- Backend: ~$50-100/month
- Consider custom PCB manufacturing
- Negotiate bulk pricing with suppliers
