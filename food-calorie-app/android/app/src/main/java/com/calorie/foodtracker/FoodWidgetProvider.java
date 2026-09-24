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
        int proteinTarget = Math.max(1, prefs.getInt("proteinTarget", 130));
        int carbsTarget = Math.max(1, prefs.getInt("carbsTarget", 220));
        int fatTarget = Math.max(1, prefs.getInt("fatTarget", 65));
        int caloriePct = target <= 0 ? 0 : Math.min(100, Math.round(calories * 100f / target));
        int proteinPct = Math.min(100, Math.round(protein * 100f / proteinTarget));
        int carbsPct = Math.min(100, Math.round(carbs * 100f / carbsTarget));
        int fatPct = Math.min(100, Math.round(fat * 100f / fatTarget));
        String dateLabel = new SimpleDateFormat("M月d日 EEEE", Locale.CHINA).format(new Date());
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.food_widget);
            views.setTextViewText(R.id.widget_calories, String.valueOf(Math.max(0, target - calories)));
            views.setTextViewText(R.id.widget_target, "目标 " + target + " kcal");
            views.setTextViewText(R.id.widget_date, dateLabel);
            views.setTextViewText(R.id.widget_status, "已摄入 " + calories + " kcal");
            views.setTextViewText(R.id.widget_protein, protein + "/" + proteinTarget + "g");
            views.setTextViewText(R.id.widget_carbs, carbs + "/" + carbsTarget + "g");
            views.setTextViewText(R.id.widget_fat, fat + "/" + fatTarget + "g");
            views.setTextViewText(R.id.widget_protein_label, "蛋白质 · " + proteinPct + "%");
            views.setTextViewText(R.id.widget_carbs_label, "碳水 · " + carbsPct + "%");
            views.setTextViewText(R.id.widget_fat_label, "脂肪 · " + fatPct + "%");
            views.setProgressBar(R.id.widget_calories_progress, 100, caloriePct, false);
            views.setProgressBar(R.id.widget_protein_progress, 100, proteinPct, false);
            views.setProgressBar(R.id.widget_carbs_progress, 100, carbsPct, false);
            views.setProgressBar(R.id.widget_fat_progress, 100, fatPct, false);
            Intent launch = new Intent(context, MainActivity.class);
            launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pending = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pending);
            manager.updateAppWidget(id, views);
        }
    }
}
