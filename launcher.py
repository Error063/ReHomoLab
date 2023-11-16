import app_config
import subprocess

if app_config.readConfig('enable_debug'):
    subprocess.Popen('./HoMoLab-console.exe')
else:
    subprocess.Popen('./HoMoLab.exe')