package com.calorie.foodtracker;

import android.appwidget.AppWidgetManager;
import android.os.Build;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

@CapacitorPlugin(name = "FoodWidget")
public class FoodWidgetPlugin extends Plugin {
    @PluginMethod
    public void updateToday(PluginCall call) {
        JSONObject data = call.getData();
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("food_widget", Context.MODE_PRIVATE);
        prefs.edit()
            .putString("date", data.optString("date", ""))
            .putInt("calories", data.optInt("calories", 0))
            .putInt("targetCalories", data.optInt("targetCalories", 2000))
            .putInt("protein", Math.round((float) data.optDouble("protein", 0)))
            .putInt("carbs", Math.round((float) data.optDouble("carbs", 0)))
            .putInt("fat", Math.round((float) data.optDouble("fat", 0)))
            .apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, FoodWidgetProvider.class));
        FoodWidgetProvider.updateAll(context, manager, ids);
        call.resolve();
    }

    @PluginMethod
    public void pinWidget(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("桌面快捷添加需要 Android 8.0 或更高版本，请通过桌面的小组件列表添加。");
            return;
        }
        AppWidgetManager manager = AppWidgetManager.getInstance(getContext());
        if (!manager.isRequestPinAppWidgetSupported()) {
            call.reject("当前桌面启动器不支持快捷添加，请长按桌面并从小组件列表添加。");
            return;
        }
        boolean requested = manager.requestPinAppWidget(
            new ComponentName(getContext(), FoodWidgetProvider.class), null, null);
        if (requested) call.resolve();
        else call.reject("桌面没有接受添加请求，请从桌面小组件列表添加。");
    }
}
