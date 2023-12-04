import app_config
import subprocess

git_commit = "9c89675be54ffcbe5207a8d61505ad8dd948cdfa"

if app_config.readConfig('enable_debug'):
    subprocess.Popen(f'./HoMoLab-console.exe {git_commit}')
else:
    subprocess.Popen(f'./HoMoLab.exe {git_commit}')