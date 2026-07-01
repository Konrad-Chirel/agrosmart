import json
import os
import re

transcript_path = r'C:\Users\kevin\.gemini\antigravity\brain\211f90ed-d090-4546-9a54-a15cca45f2ba\.system_generated\logs\transcript_full.jsonl'
target_timestamp = "2026-06-29T08:53:00Z"

# We want the content of all files that were modified AFTER target_timestamp.
# The best way to get their original content is to find the FIRST time they were viewed/read in the transcript BEFORE target_timestamp.
# Since view_file has line numbers "1: code", we need to strip them.

files_to_restore = [
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\screens\DashboardScreen.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\backend\app\Services\PompeService.php",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\screens\ManualProgrammingScreen.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\screens\CultureDetailScreen.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\services\AgrosmartService.ts",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\screens\AlertsScreen.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\navigation\RootNavigator.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\screens\CropsScreen.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\services\api.ts",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\components\Screen.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\screens\DetailedForecastScreen.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\screens\WeeklyScheduleScreen.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\screens\WeatherScreen.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\components\CultureCard.tsx",
    r"C:\Users\kevin\.gemini\antigravity\scratch\agrosmart\agrosmart-main\frontend\src\components\WeatherAnimations.tsx"
]

file_contents = {}

def parse_view_file(output):
    # output contains lines like:
    # 1: import { MaterialIcons } from "@expo/vector-icons";
    # 2: ...
    lines = output.split('\n')
    parsed_lines = []
    started = False
    for line in lines:
        match = re.match(r'^\d+:\s(.*)$', line)
        if match:
            parsed_lines.append(match.group(1))
            started = True
        elif not started and "Showing lines" not in line and "File Path:" not in line and line.strip():
            # some lines might not have prefix if it wasn't view_file but plain text, but view_file always adds numbers.
            pass
        elif started and not re.match(r'^\d+:', line) and "The above content does NOT show the entire file" not in line and "Completed At:" not in line:
            # this handles multi-line strings in view_file if they aren't prefixed
            parsed_lines.append(line)
    return "\n".join(parsed_lines)

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            d = json.loads(line)
            # Find view_file outputs
            if d.get('type') == 'TOOL_RESPONSE':
                content = d.get('content', '')
                if 'File Path:' in content:
                    # extract file path
                    match = re.search(r'File Path: `file:///(.*?)`', content)
                    if match:
                        fp = match.group(1).replace('/', '\\')
                        # only take the FIRST occurrence
                        if fp in files_to_restore and fp not in file_contents:
                            # if it shows the ENTIRE file
                            if "Total Lines:" in content and "Showing lines 1 to" in content:
                                # if the file was shown entirely or partially
                                # actually, to be safe, we want the full file.
                                file_contents[fp] = parse_view_file(content)
        except Exception:
            pass

for fp, content in file_contents.items():
    print(f"Restored from view_file: {fp}")
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
