package com.calorie.foodtracker;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {
    @PluginMethod
    public void setTheme(PluginCall call) {
        boolean dark = "dark".equals(call.getString("theme", "light"));
        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            // Keep the status bar transparent so the animated app background can flow
            // behind the system icons; CSS safe-area padding keeps app content clear.
            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(dark ? Color.parseColor("#03060B") : Color.WHITE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                window.setStatusBarContrastEnforced(false);
                window.setNavigationBarContrastEnforced(false);
            }
            View decor = window.getDecorView();
            int flags = decor.getSystemUiVisibility();
            flags &= ~(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
            flags |= View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
            if (!dark) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            decor.setSystemUiVisibility(flags);
            decor.postDelayed(() -> {
                android.view.WindowInsets insets = decor.getRootWindowInsets();
                if (insets == null) return;
                int topInsetPx = Math.max(insets.getSystemWindowInsetTop(), insets.getStableInsetTop());
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && insets.getDisplayCutout() != null) {
                    topInsetPx = Math.max(topInsetPx, insets.getDisplayCutout().getSafeInsetTop());
                }
                if (topInsetPx > 0 && getBridge() != null && getBridge().getWebView() != null) {
                    int topInsetDp = Math.round(topInsetPx / getContext().getResources().getDisplayMetrics().density);
                    getBridge().getWebView().evaluateJavascript(
                        "document.documentElement.style.setProperty('--app-top-inset','" + topInsetDp + "px')",
                        null
                    );
                }
            }, 120);
            call.resolve();
        });
    }
}
