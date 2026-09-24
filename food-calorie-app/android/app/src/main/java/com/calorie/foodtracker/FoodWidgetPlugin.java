package com.calorie.foodtracker;

import android.appwidget.AppWidgetManager;
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
    public void setTheme(PluginCall call) {
        String theme = call.getString("theme", "system");
        if (!"dark".equals(theme) && !"light".equals(theme)) theme = "system";
        Context context = getContext();
        context.getSharedPreferences("food_widget", Context.MODE_PRIVATE).edit().putString("theme", theme).apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, FoodWidgetProvider.class));
        FoodWidgetProvider.updateAll(context, manager, ids);
        call.resolve();
    }

    @PluginMethod
    public void clearToday(PluginCall call) {
        Context context = getContext();
        context.getSharedPreferences("food_widget", Context.MODE_PRIVATE).edit().clear().apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, FoodWidgetProvider.class));
        FoodWidgetProvider.updateAll(context, manager, ids);
        call.resolve();
    }

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
            .putInt("proteinTarget", data.optInt("proteinTarget", 130))
            .putInt("carbsTarget", data.optInt("carbsTarget", 220))
            .putInt("fatTarget", data.optInt("fatTarget", 65))
            .apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, FoodWidgetProvider.class));
        FoodWidgetProvider.updateAll(context, manager, ids);
        call.resolve();
    }

}
