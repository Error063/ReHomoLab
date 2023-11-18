import app_config
import subprocess

git_commit = "de5f1f320609751ee6abd3483235dc600bf7fdf4"

if app_config.readConfig('enable_debug'):
    subprocess.Popen(f'./HoMoLab-console.exe {git_commit}')
else:
    subprocess.Popen(f'./HoMoLab.exe {git_commit}')