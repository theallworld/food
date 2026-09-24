package com.calorie.foodtracker;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
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
        String storedTheme = prefs.getString("theme", "system");
        boolean darkTheme = "dark".equals(storedTheme) || ("system".equals(storedTheme)
            && (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK)
                == android.content.res.Configuration.UI_MODE_NIGHT_YES);
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
            int primaryText = Color.parseColor(darkTheme ? "#F8FAFC" : "#111827");
            int mutedText = Color.parseColor(darkTheme ? "#A8B4C8" : "#526173");
            int statusText = Color.parseColor(darkTheme ? "#A7F3D0" : "#047857");
            views.setInt(R.id.widget_root, "setBackgroundResource", darkTheme ? R.drawable.food_widget_background_dark : R.drawable.food_widget_background_light);
            views.setImageViewResource(R.id.widget_glow_one, darkTheme ? R.drawable.food_widget_glow_dark_one : R.drawable.food_widget_glow_day_one);
            views.setImageViewResource(R.id.widget_glow_two, darkTheme ? R.drawable.food_widget_glow_dark_two : R.drawable.food_widget_glow_day_two);
            views.setImageViewResource(R.id.widget_glow_three, darkTheme ? R.drawable.food_widget_glow_dark_three : R.drawable.food_widget_glow_day_three);
            views.setInt(R.id.widget_protein_card, "setBackgroundResource", darkTheme ? R.drawable.food_widget_macro_background_dark : R.drawable.food_widget_macro_background_light);
            views.setInt(R.id.widget_carbs_card, "setBackgroundResource", darkTheme ? R.drawable.food_widget_macro_background_dark : R.drawable.food_widget_macro_background_light);
            views.setInt(R.id.widget_fat_card, "setBackgroundResource", darkTheme ? R.drawable.food_widget_macro_background_dark : R.drawable.food_widget_macro_background_light);
            views.setInt(R.id.widget_status, "setBackgroundResource", darkTheme ? R.drawable.food_widget_chip_dark : R.drawable.food_widget_chip_light);
            for (int textId : new int[] { R.id.widget_calories, R.id.widget_protein, R.id.widget_carbs, R.id.widget_fat }) {
                views.setTextColor(textId, primaryText);
            }
            for (int textId : new int[] { R.id.widget_date, R.id.widget_target }) {
                views.setTextColor(textId, mutedText);
            }
            views.setTextColor(R.id.widget_status, statusText);
            views.setTextColor(R.id.widget_protein_label, Color.parseColor(darkTheme ? "#F87171" : "#C23B45"));
            views.setTextColor(R.id.widget_carbs_label, Color.parseColor(darkTheme ? "#60A5FA" : "#2769C7"));
            views.setTextColor(R.id.widget_fat_label, Color.parseColor(darkTheme ? "#FBBF24" : "#956000"));
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
            if (android.os.Build.VERSION.SDK_INT >= 31) {
                android.content.res.ColorStateList track = android.content.res.ColorStateList.valueOf(Color.parseColor(darkTheme ? "#303C56" : "#D8E1E8"));
                views.setColorStateList(R.id.widget_calories_progress, "setProgressBackgroundTintList", track);
                views.setColorStateList(R.id.widget_protein_progress, "setProgressBackgroundTintList", track);
                views.setColorStateList(R.id.widget_carbs_progress, "setProgressBackgroundTintList", track);
                views.setColorStateList(R.id.widget_fat_progress, "setProgressBackgroundTintList", track);
            }
            Intent launch = new Intent(context, MainActivity.class);
            launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pending = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pending);
            manager.updateAppWidget(id, views);
        }
    }
}
