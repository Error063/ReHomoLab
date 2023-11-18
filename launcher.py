import app_config
import subprocess

git_commit = "022cfe0e5a5005eed73edf37d6acc8332a6b8a23"

if app_config.readConfig('enable_debug'):
    subprocess.Popen(f'./HoMoLab-console.exe {git_commit}')
else:
    subprocess.Popen(f'./HoMoLab.exe {git_commit}')