import app_config
import subprocess

git_commit = "d3e1325380a83bdc1ecbd699126a39dacb592e36"

if app_config.readConfig('enable_debug'):
    subprocess.Popen(f'./HoMoLab-console.exe {git_commit}')
else:
    subprocess.Popen(f'./HoMoLab.exe {git_commit}')