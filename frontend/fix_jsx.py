import os

path = r'C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\components\WeatherAnimations.tsx'

with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Fix the broken comments inside JSX
c = c.replace("/* style={{", "")
c = c.replace("}] }} */", "")
c = c.replace("opacity: opacity }} */", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
