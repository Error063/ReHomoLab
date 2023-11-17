import os
import shutil
import zipfile
import re

import base

if os.system('git -v') == 0:
    current_git_commit = ''.join(list(os.popen('git rev-parse HEAD')))
    with open('base.py', encoding='utf8') as f:
        base_code = f.read()
    with open('base.py', encoding='utf8', mode='w') as f:
        f.write(re.sub(r'git_commit = ".+?"',
                       'git_commit = "{}"'.format(current_git_commit.strip()),
                       base_code))
else:
    current_git_commit = base.git_commit

print('Build window-based application')
os.system('pyinstaller --noconfirm --onedir --windowed --icon "./static/appicon.ico" --name "HoMoLab" --add-data "./static;static/" --add-data "./templates;templates/"  "./app.py"')
print('Build console-based application')
os.system('pyinstaller --noconfirm --onedir --console --icon "./static/appicon.ico" --name "HoMoLab-console" --add-data "./static;static/" --add-data "./templates;templates/"  "./app.py"')
print('Build application launcher')
os.system('pyinstaller -w -i "./static/appicon.ico" "./launcher.py"')

print('Copy console main program to main folder')
shutil.copy('./dist/HoMoLab-console/HoMoLab-console.exe', './dist/HoMoLab/')
print('Copy launcher program to main folder')
shutil.copy('./dist/launcher/launcher.exe', './dist/HoMoLab/')

print('Clear some junk file')
shutil.rmtree('./dist/HoMoLab-console')
shutil.rmtree('./dist/launcher')

print('Compress the folder')
with zipfile.ZipFile(f'./dist/HoMoLab-{base.app_version}-{current_git_commit[:12]}.zip', "w", zipfile.ZIP_DEFLATED) as zip:
    for path, dirnames, filenames in os.walk('./dist/HoMoLab'):
        fpath = path.replace('./dist/HoMoLab', '')
        print(fpath)
        for filename in filenames:
            zip.write(os.path.join(path, filename), os.path.join(fpath, filename))