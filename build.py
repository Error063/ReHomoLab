import os
import shutil
import zipfile

import base

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
with zipfile.ZipFile(f'./dist/HoMoLab-{base.app_version}.zip', "w", zipfile.ZIP_DEFLATED) as zip:
    for path, dirnames, filenames in os.walk('./dist/HoMoLab'):
        fpath = path.replace('./dist/HoMoLab', '')
        print(fpath)
        for filename in filenames:
            zip.write(os.path.join(path, filename), os.path.join(fpath, filename))