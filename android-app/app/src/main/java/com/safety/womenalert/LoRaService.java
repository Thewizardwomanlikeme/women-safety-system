package com.safety.womenalert;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;
import com.hoho.android.usbserial.util.SerialInputOutputManager;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.List;
import java.util.concurrent.Executors;

/**
 * Women Safety System - LoRa Background Service
 * Listens for LoRa packets from ESP32 via USB serial adapter
 */
public class LoRaService extends Service implements SerialInputOutputManager.Listener {
    
    private static final String TAG = "LoRaService";
    private static final String CHANNEL_ID = "LoRaServiceChannel";
    private static final int NOTIFICATION_ID = 1;
    
    private static final int PACKET_SIZE = 12;
    private static final byte MAGIC_BYTE_1 = (byte) 0xEF;
    private static final byte MAGIC_BYTE_2 = (byte) 0xFD;
    private static final byte PACKET_TYPE_EMERGENCY = 0x01;
    private static final byte PACKET_TYPE_CANCEL = 0x02;
    
    private UsbSerialPort serialPort;
    private SerialInputOutputManager ioManager;
    private EmergencyHandler emergencyHandler;
    
    private byte[] packetBuffer = new byte[PACKET_SIZE];
    private int bufferIndex = 0;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "LoRa Service created");
        
        emergencyHandler = new EmergencyHandler(this);
        createNotificationChannel();
        connectToLoRaDevice();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification notification = createNotification("Monitoring for emergencies...");
        startForeground(NOTIFICATION_ID, notification);
        
        return START_STICKY;
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "LoRa Service destroyed");
        
        if (ioManager != null) {
            ioManager.stop();
        }
        
        if (serialPort != null) {
            try {
                serialPort.close();
            } catch (IOException e) {
                Log.e(TAG, "Error closing serial port", e);
            }
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "LoRa Monitoring Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitors LoRa emergency signals");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private Notification createNotification(String contentText) {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Women Safety Alert")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
    
    private void connectToLoRaDevice() {
        UsbManager manager = (UsbManager) getSystemService(Context.USB_SERVICE);
        List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber()
            .findAllDrivers(manager);
        
        if (availableDrivers.isEmpty()) {
            Log.w(TAG, "No USB serial devices found");
            return;
        }
        
        // Use first available driver
        UsbSerialDriver driver = availableDrivers.get(0);
        UsbDeviceConnection connection = manager.openDevice(driver.getDevice());
        
        if (connection == null) {
            Log.e(TAG, "Failed to open USB device connection");
            return;
        }
        
        serialPort = driver.getPorts().get(0);
        
        try {
            serialPort.open(connection);
            serialPort.setParameters(9600, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
            
            // Start IO manager
            ioManager = new SerialInputOutputManager(serialPort, this);
            Executors.newSingleThreadExecutor().submit(ioManager);
            
            Log.i(TAG, "Connected to LoRa device via USB serial");
            
        } catch (IOException e) {
            Log.e(TAG, "Error opening serial port", e);
            try {
                serialPort.close();
            } catch (IOException ignored) {}
        }
    }
    
    @Override
    public void onNewData(byte[] data) {
        // Process incoming LoRa data
        for (byte b : data) {
            if (bufferIndex == 0) {
                // Look for magic byte 1
                if (b == MAGIC_BYTE_1) {
                    packetBuffer[bufferIndex++] = b;
                }
            } else if (bufferIndex == 1) {
                // Verify magic byte 2
                if (b == MAGIC_BYTE_2) {
                    packetBuffer[bufferIndex++] = b;
                } else {
                    bufferIndex = 0;  // Reset if invalid
                }
            } else {
                // Collect rest of packet
                packetBuffer[bufferIndex++] = b;
                
                if (bufferIndex == PACKET_SIZE) {
                    parsePacket(packetBuffer);
                    bufferIndex = 0;  // Reset for next packet
                }
            }
        }
    }
    
    @Override
    public void onRunError(Exception e) {
        Log.e(TAG, "Serial communication error", e);
    }
    
    private void parsePacket(byte[] packet) {
        try {
            // Verify checksum
            if (!verifyChecksum(packet)) {
                Log.w(TAG, "Invalid packet checksum");
                return;
            }
            
            // Extract packet fields
            int deviceId = ((packet[2] & 0xFF) << 8) | (packet[3] & 0xFF);
            byte packetType = packet[4];
            int batteryLevel = packet[5] & 0xFF;
            int timestamp = ((packet[6] & 0xFF) << 8) | (packet[7] & 0xFF);
            int sequenceNumber = ((packet[8] & 0xFF) << 8) | (packet[9] & 0xFF);
            
            Log.i(TAG, String.format("Received packet - Device: 0x%04X, Type: 0x%02X, " +
                "Battery: %d%%, Seq: %d", deviceId, packetType, batteryLevel, sequenceNumber));
            
            // Handle emergency packet
            if (packetType == PACKET_TYPE_EMERGENCY) {
                Log.w(TAG, "EMERGENCY ALERT RECEIVED!");
                handleEmergency(deviceId, batteryLevel, sequenceNumber);
            } else if (packetType == PACKET_TYPE_CANCEL) {
                Log.i(TAG, "Emergency cancelled");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error parsing packet", e);
        }
    }
    
    private boolean verifyChecksum(byte[] packet) {
        int receivedChecksum = ((packet[10] & 0xFF) << 8) | (packet[11] & 0xFF);
        int calculatedChecksum = calculateCRC16(packet, PACKET_SIZE - 2);
        return receivedChecksum == calculatedChecksum;
    }
    
    private int calculateCRC16(byte[] data, int length) {
        int crc = 0xFFFF;
        
        for (int i = 0; i < length; i++) {
            crc ^= (data[i] & 0xFF) << 8;
            for (int j = 0; j < 8; j++) {
                if ((crc & 0x8000) != 0) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = crc << 1;
                }
            }
        }
        
        return crc & 0xFFFF;
    }
    
    private void handleEmergency(int deviceId, int batteryLevel, int sequenceNumber) {
        // Trigger emergency handler
        emergencyHandler.handleEmergency(deviceId, batteryLevel, sequenceNumber);
        
        // Update notification
        Notification notification = createNotification("EMERGENCY ALERT TRIGGERED!");
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.notify(NOTIFICATION_ID, notification);
    }
}
