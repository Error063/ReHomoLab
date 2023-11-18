import os
import shutil
import zipfile
import re

import base

print('Remove previous build folder')
try:
    shutil.rmtree('./dist')
except FileNotFoundError:
    pass

print('Get git info')
if os.system('git -v') == 0 and os.path.exists('./.git'):
    current_git_commit = (''.join(list(os.popen('git rev-parse HEAD')))).strip()
    if current_git_commit.startswith('fatal'):
        current_git_commit = base.git_commit
    else:
        with open('base.py', encoding='utf8') as f:
            base_code = f.read()
        with open('base.py', encoding='utf8', mode='w') as f:
            f.write(re.sub(r'git_commit = ".+?"', 'git_commit = "{}"'.format(current_git_commit), base_code))
else:
    current_git_commit = base.git_commit

with open('launcher.py', encoding='utf8') as f:
    launcher_code = f.read()
with open('launcher.py', encoding='utf8', mode='w') as f:
    f.write(re.sub(r'git_commit = ".+?"', 'git_commit = "{}"'.format(current_git_commit), launcher_code))
print(current_git_commit)

print('Set a flag for building')
with open('base.py', encoding='utf8') as f:
    base_code = f.read()
# print(base_code.replace('in_build = False', 'in_build = True'))
with open('base.py', encoding='utf8', mode='w') as f:
    f.write(base_code.replace('in_build = False', 'in_build = True'))

print('Generate the version file for application')
with open('./version.template.txt', encoding='utf8') as f:
    version_file = f.read()
version_file = version_file.replace('#version_tuple#', str(tuple(map(int, base.app_version.split(".")))))
version_file = version_file.replace('#version#', str(base.app_version))

print('Build window-based application')
with open('./tmp.txt', encoding='utf8', mode='w') as f:
    f.write(version_file.replace('#original_file_name#', "HoMoLab.exe"))
os.system('pyinstaller --noconfirm --onedir --windowed --icon "./static/appicon.ico" --name "HoMoLab" --add-data "./static;static/" --add-data "./templates;templates/" --version-file ./tmp.txt  "./app.py"')
print('Build console-based application')
with open('./tmp.txt', encoding='utf8', mode='w') as f:
    f.write(version_file.replace('#original_file_name#', "HoMoLab-console.exe"))
os.system('pyinstaller --noconfirm --onedir --console --icon "./static/appicon.ico" --name "HoMoLab-console" --add-data "./static;static/" --add-data "./templates;templates/" --version-file ./tmp.txt "./app.py"')
print('Build application launcher')
with open('./tmp.txt', encoding='utf8', mode='w') as f:
    f.write(version_file.replace('#original_file_name#', "launcher.exe"))
os.system('pyinstaller -w -i "./static/appicon.ico" --version-file ./tmp.txt "./launcher.py"')

with open('base.py', encoding='utf8') as f:
    base_code = f.read()
with open('base.py', encoding='utf8', mode='w') as f:
    f.write(base_code.replace('in_build = True', 'in_build = False'))

print('Copy console main program to main folder')
shutil.copy('./dist/HoMoLab-console/HoMoLab-console.exe', './dist/HoMoLab/')
print('Copy launcher program to main folder')
shutil.copy('./dist/launcher/launcher.exe', './dist/HoMoLab/')

print('Clear some junk file')
shutil.rmtree('./dist/HoMoLab-console')
shutil.rmtree('./dist/launcher')
shutil.rmtree('./build')

print('Compress the folder')
with zipfile.ZipFile(f'./dist/HoMoLab-{base.app_version}-{current_git_commit[:7]}-win.zip', "w", zipfile.ZIP_DEFLATED) as zip:
    for path, dirnames, filenames in os.walk('./dist/HoMoLab'):
        fpath = path.replace('./dist/HoMoLab', '')
        print(fpath)
        for filename in filenames:
            zip.write(os.path.join(path, filename), os.path.join(fpath, filename))