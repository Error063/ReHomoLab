import app_config
import base
import subprocess

if app_config.readConfig('enable_debug'):
    subprocess.Popen(f'./HoMoLab-console.exe {base.git_commit}')
else:
    subprocess.Popen(f'./HoMoLab.exe {base.git_commit}')