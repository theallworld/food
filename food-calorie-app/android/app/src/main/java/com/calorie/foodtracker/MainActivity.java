package com.calorie.foodtracker;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(FoodWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
