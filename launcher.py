import app_config
import subprocess

git_commit = "111"

if app_config.readConfig('enable_debug'):
    subprocess.Popen(f'./HoMoLab-console.exe {git_commit}')
else:
    subprocess.Popen(f'./HoMoLab.exe {git_commit}')