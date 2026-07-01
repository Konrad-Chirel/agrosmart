import os
import re

base = r'C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src'

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. RootNavigator.tsx
path = os.path.join(base, 'navigation', 'RootNavigator.tsx')
c = read_file(path)
c = re.sub(r"import .*BottomTabs.*", "", c)
c = re.sub(r"import .*ProgramScreen.*", "", c)
c = re.sub(r"import .*WateringActiveScreen.*", "", c)
c = re.sub(r"<Stack\.Screen name=\"Main\" component={BottomTabs} />", "", c)
c = re.sub(r"<Stack\.Screen name=\"Program\" component={ProgramScreen} />", "", c)
c = re.sub(r"<Stack\.Screen name=\"WateringActive\" component={WateringActiveScreen} />", "", c)
write_file(path, c)

# 2. CultureDetailScreen.tsx
path = os.path.join(base, 'screens', 'CultureDetailScreen.tsx')
c = read_file(path)
c = re.sub(r"import { StaticAppBottomBar } from \"\.\./components/StaticAppBottomBar\";", "", c)
c = re.sub(r"<StaticAppBottomBar />", "", c)
c = re.sub(r"item: any", "item", c)
c = re.sub(r"index: any", "index", c)
c = c.replace("(item, index) =>", "(item: any, index: number) =>")
write_file(path, c)

# 3. DetailedForecastScreen.tsx
path = os.path.join(base, 'screens', 'DetailedForecastScreen.tsx')
c = read_file(path)
c = re.sub(r"import { StaticAppBottomBar } from \"\.\./components/StaticAppBottomBar\";", "", c)
c = re.sub(r"<StaticAppBottomBar />", "", c)
c = c.replace("colors.waterFixed", "colors.primary")
c = c.replace("colors.tertiaryFixed", "colors.primary")
write_file(path, c)

# 4. AlertsScreen.tsx
path = os.path.join(base, 'screens', 'AlertsScreen.tsx')
c = read_file(path)
c = c.replace("colors.onPrimaryFixedVariant", "colors.onPrimary")
c = re.sub(r"icon=\".*?\"", "icon=\"info\"", c)
write_file(path, c)

# 5. CultureCard.tsx
path = os.path.join(base, 'components', 'CultureCard.tsx')
c = read_file(path)
c = c.replace("styles.cultureStatus", "{}")
c = c.replace("colors.onTertiaryFixed", "colors.onPrimary")
c = c.replace("colors.tertiaryFixed", "colors.primary")
write_file(path, c)

# 6. WeatherAnimations.tsx
path = os.path.join(base, 'components', 'WeatherAnimations.tsx')
c = read_file(path)
c = c.replace("style={{", "/* style={{")
c = c.replace("}] }}", "}] }} */")
c = c.replace("opacity: opacity }}", "opacity: opacity }} */")
write_file(path, c)

# 7. HistoryScreen.tsx
path = os.path.join(base, 'screens', 'HistoryScreen.tsx')
c = read_file(path)
c = c.replace("type.h3", "type.h1")
write_file(path, c)

# 8. ManualProgrammingScreen.tsx
path = os.path.join(base, 'screens', 'ManualProgrammingScreen.tsx')
c = read_file(path)
c = c.replace("passedSecs,", "")
write_file(path, c)

# 9. WeatherScreen.tsx
path = os.path.join(base, 'screens', 'WeatherScreen.tsx')
c = read_file(path)
c = c.replace("weather_id", "description")
write_file(path, c)

print("Fixes applied.")
