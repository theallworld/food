package com.calorie.foodtracker;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class FoodWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        updateAll(context, manager, ids);
    }

    public static void updateAll(Context context, AppWidgetManager manager, int[] ids) {
        SharedPreferences prefs = context.getSharedPreferences("food_widget", Context.MODE_PRIVATE);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        boolean isToday = today.equals(prefs.getString("date", ""));
        int calories = isToday ? prefs.getInt("calories", 0) : 0;
        int target = prefs.getInt("targetCalories", 2000);
        int protein = isToday ? prefs.getInt("protein", 0) : 0;
        int carbs = isToday ? prefs.getInt("carbs", 0) : 0;
        int fat = isToday ? prefs.getInt("fat", 0) : 0;
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.food_widget);
            views.setTextViewText(R.id.widget_calories, String.valueOf(calories));
            views.setTextViewText(R.id.widget_target, "/ " + target + " kcal");
            views.setTextViewText(R.id.widget_protein, protein + "g");
            views.setTextViewText(R.id.widget_carbs, carbs + "g");
            views.setTextViewText(R.id.widget_fat, fat + "g");
            Intent launch = new Intent(context, MainActivity.class);
            launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pending = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pending);
            manager.updateAppWidget(id, views);
        }
    }
}
