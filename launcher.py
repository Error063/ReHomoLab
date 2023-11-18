import app_config
import subprocess

git_commit = "0ba60c0d45cabaf487fce84fdb3b1ea291455b66"

if app_config.readConfig('enable_debug'):
    subprocess.Popen(f'./HoMoLab-console.exe {git_commit}')
else:
    subprocess.Popen(f'./HoMoLab.exe {git_commit}')