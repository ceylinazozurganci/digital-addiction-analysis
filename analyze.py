import pandas as pd
import numpy as np
import json
import os

csv_path = "user_behavior_dataset.csv"

if not os.path.exists(csv_path):
    print(f"Error: {csv_path} not found.")
    exit(1)

df = pd.read_csv(csv_path)
print("Dataset Shape:", df.shape)
print("Columns:", df.columns.tolist())
print("\nMissing values:\n", df.isnull().sum())
print("\nSummary Statistics:\n", df.describe())

# Check categorical columns
print("\nDevice Models:", df['Device Model'].value_counts().to_dict())
print("\nOperating Systems:", df['Operating System'].value_counts().to_dict())
print("\nGender:", df['Gender'].value_counts().to_dict())
print("\nUser Behavior Class:", df['User Behavior Class'].value_counts().sort_index().to_dict())

# Section 1: Overview stats
total_users = int(len(df))
avg_screen_time = float(df['Screen On Time (hours/day)'].mean())
median_screen_time = float(df['Screen On Time (hours/day)'].median())
std_screen_time = float(df['Screen On Time (hours/day)'].std())
min_screen_time = float(df['Screen On Time (hours/day)'].min())
max_screen_time = float(df['Screen On Time (hours/day)'].max())

avg_app_usage = float(df['App Usage Time (min/day)'].mean())
median_app_usage = float(df['App Usage Time (min/day)'].median())
min_app_usage = float(df['App Usage Time (min/day)'].min())
max_app_usage = float(df['App Usage Time (min/day)'].max())

avg_data_usage = float(df['Data Usage (MB/day)'].mean())
median_data_usage = float(df['Data Usage (MB/day)'].median())
min_data_usage = float(df['Data Usage (MB/day)'].min())
max_data_usage = float(df['Data Usage (MB/day)'].max())

avg_battery_drain = float(df['Battery Drain (mAh/day)'].mean())
avg_apps_installed = float(df['Number of Apps Installed'].mean())
avg_age = float(df['Age'].mean())

# Section 2: Boxplot stats for Screen On Time
q1_screen = float(df['Screen On Time (hours/day)'].quantile(0.25))
q3_screen = float(df['Screen On Time (hours/day)'].quantile(0.75))
iqr_screen = q3_screen - q1_screen
lower_whisker_screen = float(max(min_screen_time, q1_screen - 1.5 * iqr_screen))
upper_whisker_screen = float(min(max_screen_time, q3_screen + 1.5 * iqr_screen))
outliers_screen = df[(df['Screen On Time (hours/day)'] < lower_whisker_screen) | (df['Screen On Time (hours/day)'] > upper_whisker_screen)]['Screen On Time (hours/day)'].tolist()

print(f"\nScreen Time Boxplot Stats: Min={min_screen_time}, Q1={q1_screen:.2f}, Median={median_screen_time:.2f}, Q3={q3_screen:.2f}, Max={max_screen_time}, IQR={iqr_screen:.2f}")
print(f"Outliers: {outliers_screen}")

# Section 3: Correlation between App Usage and Screen On Time
corr_app_screen = float(df['App Usage Time (min/day)'].corr(df['Screen On Time (hours/day)']))
slope, intercept = np.polyfit(df['App Usage Time (min/day)'], df['Screen On Time (hours/day)'], 1)
print(f"Corr(App Usage, Screen On Time): {corr_app_screen:.4f}, Trendline: y = {slope:.4f}x + {intercept:.4f}")

# Section 4: Age & Gender
print("\nAge min/max:", df['Age'].min(), df['Age'].max())
age_bins = [18, 29, 39, 49, 60]
age_labels = ['18-29', '30-39', '40-49', '50-59']
df['Age Group'] = pd.cut(df['Age'], bins=age_bins, labels=age_labels, right=True)

age_group_stats = []
for grp in age_labels:
    sub = df[df['Age Group'] == grp]
    age_group_stats.append({
        "group": grp,
        "count": int(len(sub)),
        "mean_screen_time": round(float(sub['Screen On Time (hours/day)'].mean()), 2),
        "median_screen_time": round(float(sub['Screen On Time (hours/day)'].median()), 2),
        "mean_app_usage": round(float(sub['App Usage Time (min/day)'].mean()), 1)
    })
print("Age Group Stats:", age_group_stats)

gender_stats = []
for g in ['Female', 'Male']:
    sub = df[df['Gender'] == g]
    gender_stats.append({
        "gender": g,
        "gender_tr": "Kadın" if g == "Female" else "Erkek",
        "count": int(len(sub)),
        "mean_screen_time": round(float(sub['Screen On Time (hours/day)'].mean()), 2),
        "median_screen_time": round(float(sub['Screen On Time (hours/day)'].median()), 2),
        "mean_app_usage": round(float(sub['App Usage Time (min/day)'].mean()), 1),
        "mean_battery_drain": round(float(sub['Battery Drain (mAh/day)'].mean()), 1),
        "mean_data_usage": round(float(sub['Data Usage (MB/day)'].mean()), 1)
    })
print("Gender Stats:", gender_stats)

# Age & Gender cross group
cross_stats = []
for grp in age_labels:
    for g in ['Female', 'Male']:
        sub = df[(df['Age Group'] == grp) & (df['Gender'] == g)]
        cross_stats.append({
            "group": grp,
            "gender": g,
            "gender_tr": "Kadın" if g == "Female" else "Erkek",
            "count": int(len(sub)),
            "mean_screen_time": round(float(sub['Screen On Time (hours/day)'].mean()), 2)
        })

# Section 5: Battery Drain & Data Usage relationships
corr_app_battery = float(df['App Usage Time (min/day)'].corr(df['Battery Drain (mAh/day)']))
corr_screen_battery = float(df['Screen On Time (hours/day)'].corr(df['Battery Drain (mAh/day)']))
corr_app_data = float(df['App Usage Time (min/day)'].corr(df['Data Usage (MB/day)']))
corr_screen_data = float(df['Screen On Time (hours/day)'].corr(df['Data Usage (MB/day)']))

slope_batt, intercept_batt = np.polyfit(df['App Usage Time (min/day)'], df['Battery Drain (mAh/day)'], 1)
slope_data, intercept_data = np.polyfit(df['App Usage Time (min/day)'], df['Data Usage (MB/day)'], 1)

print(f"Corr(App Usage, Battery Drain): {corr_app_battery:.4f}")
print(f"Corr(Screen Time, Battery Drain): {corr_screen_battery:.4f}")
print(f"Corr(App Usage, Data Usage): {corr_app_data:.4f}")
print(f"Corr(Screen Time, Data Usage): {corr_screen_data:.4f}")

# Section 6: User Behavior Class
class_stats = []
for c in sorted(df['User Behavior Class'].unique()):
    sub = df[df['User Behavior Class'] == c]
    screen_sub = sub['Screen On Time (hours/day)']
    q1 = float(screen_sub.quantile(0.25))
    q3 = float(screen_sub.quantile(0.75))
    iqr = q3 - q1
    class_stats.append({
        "class": int(c),
        "count": int(len(sub)),
        "percentage": round(float(len(sub) / len(df) * 100), 2),
        "mean_screen_time": round(float(screen_sub.mean()), 2),
        "median_screen_time": round(float(screen_sub.median()), 2),
        "min_screen_time": round(float(screen_sub.min()), 2),
        "max_screen_time": round(float(screen_sub.max()), 2),
        "q1_screen_time": round(q1, 2),
        "q3_screen_time": round(q3, 2),
        "mean_app_usage": round(float(sub['App Usage Time (min/day)'].mean()), 1),
        "mean_battery_drain": round(float(sub['Battery Drain (mAh/day)'].mean()), 1),
        "mean_data_usage": round(float(sub['Data Usage (MB/day)'].mean()), 1),
        "mean_apps_installed": round(float(sub['Number of Apps Installed'].mean()), 1)
    })
print("\nUser Behavior Class Stats:\n", json.dumps(class_stats, indent=2))

# Section 7: Distribution curve data for slider
sorted_screen_times = sorted(df['Screen On Time (hours/day)'].tolist())

# Prepare full dataset JSON for frontend plotly
records = []
for _, row in df.iterrows():
    records.append({
        "id": int(row['User ID']),
        "model": str(row['Device Model']),
        "os": str(row['Operating System']),
        "app_usage": float(row['App Usage Time (min/day)']),
        "screen_time": float(row['Screen On Time (hours/day)']),
        "battery": float(row['Battery Drain (mAh/day)']),
        "apps_installed": int(row['Number of Apps Installed']),
        "data_usage": float(row['Data Usage (MB/day)']),
        "age": int(row['Age']),
        "gender": str(row['Gender']),
        "gender_tr": "Kadın" if row['Gender'] == 'Female' else "Erkek",
        "behavior_class": int(row['User Behavior Class']),
        "age_group": str(row['Age Group'])
    })

output_data = {
    "meta": {
        "title": "Ekranlarımızın Ardında",
        "subtitle": "Telefonlarımızı nasıl kullanıyoruz ve dijital alışkanlıklarımız bize ne anlatıyor?",
        "total_users": total_users,
        "time_series_present": False,
        "specific_app_names_present": False
    },
    "overview": {
        "total_users": total_users,
        "avg_screen_time": round(avg_screen_time, 2),
        "median_screen_time": round(median_screen_time, 2),
        "std_screen_time": round(std_screen_time, 2),
        "min_screen_time": round(min_screen_time, 1),
        "max_screen_time": round(max_screen_time, 1),
        "avg_app_usage": round(avg_app_usage, 1),
        "median_app_usage": round(median_app_usage, 1),
        "min_app_usage": round(min_app_usage, 1),
        "max_app_usage": round(max_app_usage, 1),
        "avg_data_usage": round(avg_data_usage, 1),
        "median_data_usage": round(median_data_usage, 1),
        "min_data_usage": round(min_data_usage, 1),
        "max_data_usage": round(max_data_usage, 1),
        "avg_battery_drain": round(avg_battery_drain, 1),
        "avg_apps_installed": round(avg_apps_installed, 1),
        "avg_age": round(avg_age, 1)
    },
    "screen_time_boxplot": {
        "min": min_screen_time,
        "q1": round(q1_screen, 2),
        "median": round(median_screen_time, 2),
        "q3": round(q3_screen, 2),
        "max": max_screen_time,
        "iqr": round(iqr_screen, 2),
        "lower_whisker": round(lower_whisker_screen, 2),
        "upper_whisker": round(upper_whisker_screen, 2),
        "outliers": outliers_screen,
        "values": sorted_screen_times
    },
    "correlation_app_screen": {
        "r": round(corr_app_screen, 4),
        "r_squared": round(corr_app_screen ** 2, 4),
        "slope": round(slope, 6),
        "intercept": round(intercept, 4)
    },
    "demographics": {
        "age_groups": age_group_stats,
        "gender": gender_stats,
        "cross_groups": cross_stats
    },
    "consumption_correlations": {
        "app_battery": {
            "r": round(corr_app_battery, 4),
            "slope": round(slope_batt, 4),
            "intercept": round(intercept_batt, 4)
        },
        "screen_battery": {
            "r": round(corr_screen_battery, 4)
        },
        "app_data": {
            "r": round(corr_app_data, 4),
            "slope": round(slope_data, 4),
            "intercept": round(intercept_data, 4)
        },
        "screen_data": {
            "r": round(corr_screen_data, 4)
        }
    },
    "behavior_classes": class_stats,
    "raw_records": records
}

with open("data.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print("\nSuccessfully generated data.json!")
