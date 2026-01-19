# Deployment Guide

This guide covers deployment of all system components: ESP32 firmware, Android app, and Node.js backend.

## Table of Contents

1. [ESP32 Firmware Deployment](#esp32-firmware-deployment)
2. [Android App Deployment](#android-app-deployment)
3. [Backend Deployment](#backend-deployment)
4. [System Testing](#system-testing)

---

## ESP32 Firmware Deployment

### Prerequisites

- ESP32 development board
- USB cable
- Computer (Windows/Mac/Linux)
- Internet connection

### Method 1: Using PlatformIO (Recommended)

**Step 1: Install PlatformIO**

VS Code:
1. Open VS Code
2. Install "PlatformIO IDE" extension
3. Restart VS Code

**Step 2: Open Project**

```bash
cd esp32-firmware
code .
```

**Step 3: Configure Device**

Edit `platformio.ini` if needed:
```ini
upload_port = /dev/cu.usbserial-0001  ; Mac
; upload_port = COM3                  ; Windows
; upload_port = /dev/ttyUSB0          ; Linux
```

**Step 4: Build and Upload**

```bash
pio run --target upload
```

Or use VS Code PlatformIO buttons:
- Click "Upload" (→) in the bottom toolbar

**Step 5: Monitor Serial Output**

```bash
pio device monitor
```

Or click "Serial Monitor" in VS Code.

---

### Method 2: Using Arduino IDE

**Step 1: Install Arduino IDE**

Download from: https://www.arduino.cc/en/software

**Step 2: Add ESP32 Board Support**

1. Open Arduino IDE
2. Go to File → Preferences
3. Add to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Tools → Board → Boards Manager
5. Search "ESP32" and install "esp32 by Espressif Systems"

**Step 3: Install LoRa Library**

1. Sketch → Include Library → Manage Libraries
2. Search "LoRa" by Sandeep Mistry
3. Click Install

**Step 4: Open Firmware**

1. File → Open
2. Select `esp32-firmware/main.c`
3. Rename to `main.ino` (Arduino requires .ino extension)

**Step 5: Configure Board**

- Tools → Board → ESP32 Arduino → ESP32 Dev Module
- Tools → Port → [Select your ESP32 port]
- Tools → Upload Speed → 921600

**Step 6: Upload**

Click Upload button (→) or Ctrl+U

---

### Method 3: Using ESP-IDF

**Step 1: Install ESP-IDF**

```bash
mkdir -p ~/esp
cd ~/esp
git clone --recursive https://github.com/espressif/esp-idf.git
cd esp-idf
./install.sh esp32
source export.sh
```

**Step 2: Build Firmware**

```bash
cd esp32-firmware
idf.py build
```

**Step 3: Flash Firmware**

```bash
idf.py -p /dev/cu.usbserial-0001 flash
```

**Step 4: Monitor**

```bash
idf.py -p /dev/cu.usbserial-0001 monitor
```

---

### Configuration

**Edit `config.h` before uploading:**

```c
// Set unique device ID per device
#define DEVICE_ID           0x0001  // Change for each device

// Set LoRa frequency for your region
#define LORA_FREQUENCY      868E6   // Europe
// #define LORA_FREQUENCY   915E6   // US/Australia
// #define LORA_FREQUENCY   433E6   // Asia
```

---

## Android App Deployment

### Prerequisites

- Android Studio (Hedgehog or later)
- Android device or emulator (API 24+)
- USB debugging enabled

### Step 1: Install Android Studio

Download from: https://developer.android.com/studio

### Step 2: Open Project

```bash
cd android-app
```

Open in Android Studio:
1. File → Open
2. Select `android-app` folder
3. Wait for Gradle sync

### Step 3: Configure App

**Update backend URL in app:**

1. Open `MainActivity.java`
2. Or create a settings screen for users

Default backend URL: `https://your-backend.com`

### Step 4: Add Layout XML Files

Create `app/src/main/res/layout/activity_main.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:id="@+id/statusText"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Status: Not Running"
        android:textSize="16sp"
        android:padding="16dp" />

    <Switch
        android:id="@+id/serviceSwitch"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Enable Safety Service"
        android:padding="16dp" />

    <EditText
        android:id="@+id/contact1Input"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Emergency Contact 1 (+1234567890)"
        android:inputType="phone" />

    <EditText
        android:id="@+id/contact2Input"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Emergency Contact 2 (+1234567890)"
        android:inputType="phone" />

    <EditText
        android:id="@+id/contact3Input"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Emergency Contact 3 (+1234567890)"
        android:inputType="phone" />

    <EditText
        android:id="@+id/backendUrlInput"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Backend URL"
        android:inputType="textUri" />

    <Button
        android:id="@+id/saveButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Save Settings" />

</LinearLayout>
```

Create `app/src/main/res/xml/device_filter.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Allow any USB serial device -->
    <usb-device class="255" subclass="0" protocol="0" />
</resources>
```

### Step 5: Build APK

**Debug Build:**
```bash
./gradlew assembleDebug
```

APK location: `app/build/outputs/apk/debug/app-debug.apk`

**Release Build (signed):**

1. Build → Generate Signed Bundle/APK
2. Choose APK
3. Create or select keystore
4. Fill in keystore details
5. Choose release variant
6. Click Finish

### Step 6: Install APK

**Via USB:**
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Via File:**
1. Copy APK to phone
2. Open file manager
3. Tap APK file
4. Allow install from unknown sources
5. Install

---

## Backend Deployment

### Option 1: DigitalOcean Droplet

**Step 1: Create Droplet**

1. Go to digitalocean.com
2. Create → Droplets
3. Choose Ubuntu 22.04
4. Basic plan ($6/month)
5. Add SSH key
6. Create

**Step 2: Connect to Server**

```bash
ssh root@your_droplet_ip
```

**Step 3: Install Node.js**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Verify
```

**Step 4: Install PM2**

```bash
sudo npm install -g pm2
```

**Step 5: Clone/Upload Code**

```bash
mkdir -p /var/www/women-safety
cd /var/www/women-safety

# Upload files via SCP or git
# scp -r backend/* root@your_ip:/var/www/women-safety/
```

**Step 6: Install Dependencies**

```bash
npm install
```

**Step 7: Configure Environment**

```bash
cp .env.example .env
nano .env
```

Edit values:
```bash
PORT=3000
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
MONGODB_URI=mongodb://localhost:27017/women_safety
```

**Step 8: Install MongoDB (Optional)**

```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**Step 9: Start Server**

```bash
pm2 start server.js --name women-safety
pm2 save
pm2 startup
```

**Step 10: Configure Firewall**

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Node.js
sudo ufw enable
```

**Step 11: Setup Nginx (Optional)**

```bash
sudo apt-get install nginx

sudo nano /etc/nginx/sites-available/women-safety
```

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/women-safety /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Step 12: Setup SSL with Let's Encrypt**

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

---

### Option 2: Heroku

**Step 1: Install Heroku CLI**

```bash
npm install -g heroku
heroku login
```

**Step 2: Create App**

```bash
cd backend
heroku create women-safety-backend
```

**Step 3: Set Environment Variables**

```bash
heroku config:set TWILIO_ACCOUNT_SID=your_sid
heroku config:set TWILIO_AUTH_TOKEN=your_token
heroku config:set TWILIO_PHONE_NUMBER=+1234567890
```

**Step 4: Deploy**

```bash
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a women-safety-backend
git push heroku main
```

**Step 5: Verify**

```bash
heroku logs --tail
heroku open
```

---

### Option 3: AWS EC2

Similar to DigitalOcean, but:

1. Launch EC2 instance (t2.micro for free tier)
2. Configure security groups (ports 22, 80, 443, 3000)
3. Connect via SSH
4. Follow same steps as DigitalOcean

---

## System Testing

### End-to-End Test

1. **Flash ESP32**
   - Upload firmware
   - Verify serial output shows "System initialized"

2. **Start Android App**
   - Install APK
   - Grant all permissions
   - Enter emergency contacts
   - Enter backend URL
   - Start LoRa service
   - Connect USB LoRa adapter

3. **Start Backend**
   - Verify server running on port 3000
   - Test health endpoint: `curl http://localhost:3000/health`

4. **Trigger Emergency**
   - Press ESP32 button
   - Wait 3 seconds
   - Check ESP32 serial: "Emergency TRIGGERED"
   - Check Android logs: "Emergency received"
   - Check backend logs: "Emergency alert received"
   - Verify SMS/calls delivered

---

## Troubleshooting

**ESP32 not uploading:**
- Check USB cable (use data cable, not charge-only)
- Hold BOOT button while uploading
- Check port selection

**Android app crashes:**
- Check logcat: `adb logcat`
- Verify all permissions granted
- Check USB LoRa adapter connection

**Backend not starting:**
- Check port 3000 not in use: `lsof -i :3000`
- Verify environment variables set
- Check MongoDB/database connection

**No alerts sent:**
- Verify Twilio credentials in `.env`
- Check Twilio account balance
- Verify phone numbers in E.164 format
- Check backend logs for errors
