package com.safety.womenalert;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Women Safety System - API Client
 * HTTP client for backend communication
 */
public class ApiClient {
    
    private static final String TAG = "ApiClient";
    private static final int TIMEOUT_MS = 10000;  // 10 seconds
    
    private final Context context;
    
    public ApiClient(Context context) {
        this.context = context;
    }
    
    public boolean sendEmergencyAlert(int deviceId, double latitude, double longitude, 
                                      int batteryLevel, int sequenceNumber, String[] contacts) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("WomenSafetyPrefs", 
                Context.MODE_PRIVATE);
            String backendUrl = prefs.getString("backendUrl", "");
            
            if (backendUrl.isEmpty()) {
                Log.e(TAG, "Backend URL not configured");
                return false;
            }
            
            // Build JSON payload
            JSONObject payload = new JSONObject();
            payload.put("deviceId", deviceId);
            payload.put("latitude", latitude);
            payload.put("longitude", longitude);
            payload.put("batteryLevel", batteryLevel);
            payload.put("sequenceNumber", sequenceNumber);
            payload.put("timestamp", System.currentTimeMillis());
            
            JSONArray contactsArray = new JSONArray();
            for (String contact : contacts) {
                if (contact != null && !contact.isEmpty()) {
                    contactsArray.put(contact);
                }
            }
            payload.put("emergencyContacts", contactsArray);
            
            // Create connection
            URL url = new URL(backendUrl + "/api/emergency");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(TIMEOUT_MS);
            conn.setReadTimeout(TIMEOUT_MS);
            
            // Send request
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Read response
            int responseCode = conn.getResponseCode();
            
            if (responseCode == HttpURLConnection.HTTP_OK || 
                responseCode == HttpURLConnection.HTTP_CREATED) {
                
                BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                
                Log.i(TAG, "Backend response: " + response.toString());
                return true;
                
            } else {
                Log.e(TAG, "Backend error: HTTP " + responseCode);
                return false;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending emergency alert", e);
            return false;
        }
    }
}
