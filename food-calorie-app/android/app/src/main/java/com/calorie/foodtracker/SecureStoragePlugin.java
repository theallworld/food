package com.calorie.foodtracker;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "SecureStorage")
public class SecureStoragePlugin extends Plugin {
    private static final String PREFS = "food_secure_storage";
    private static final String KEY_ALIAS = "food_api_key_v1";
    private static final String CIPHER = "AES/GCM/NoPadding";

    @PluginMethod
    public void getApiKey(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String encoded = prefs.getString("ciphertext", null);
            String encodedIv = prefs.getString("iv", null);
            String value = "";
            if (encoded != null && encodedIv != null) {
                byte[] iv = Base64.decode(encodedIv, Base64.NO_WRAP);
                Cipher cipher = Cipher.getInstance(CIPHER);
                cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), new GCMParameterSpec(128, iv));
                byte[] plaintext = cipher.doFinal(Base64.decode(encoded, Base64.NO_WRAP));
                value = new String(plaintext, StandardCharsets.UTF_8);
            }
            call.resolve(new com.getcapacitor.JSObject().put("value", value));
        } catch (Exception error) {
            call.reject("无法读取安全保存的 API Key", error);
        }
    }

    @PluginMethod
    public void setApiKey(PluginCall call) {
        String value = call.getString("value", "");
        if (value == null || value.isEmpty()) {
            clearApiKey(call);
            return;
        }
        try {
            Cipher cipher = Cipher.getInstance(CIPHER);
            cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey());
            byte[] ciphertext = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            boolean saved = prefs.edit()
                .putString("ciphertext", Base64.encodeToString(ciphertext, Base64.NO_WRAP))
                .putString("iv", Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP))
                .commit();
            if (!saved) {
                call.reject("无法保存 API Key");
                return;
            }
            call.resolve();
        } catch (Exception error) {
            call.reject("无法安全保存 API Key", error);
        }
    }

    @PluginMethod
    public void clearApiKey(PluginCall call) {
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().clear().commit();
        call.resolve();
    }

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        java.security.Key existing = keyStore.getKey(KEY_ALIAS, null);
        if (existing instanceof SecretKey) return (SecretKey) existing;

        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build());
        return generator.generateKey();
    }
}
