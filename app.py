import base64
import os
import platform
import sys
import threading
import time
import webbrowser
import zipfile
from io import BytesIO
from math import ceil
from tkinter import messagebox

import pystray
import requests
import webview
from PIL import Image
from libmiyoushe import games
from pystray import MenuItem

import app_config
import base
import gui_server
from gui_server import app

appicon_base64 = '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'

py_version = list(map(int, platform.python_version().split('.')))
if not (py_version[0] >= 3 and py_version[1] >= 10):
    print(f'Python 3.10 or above version is required! The app is running on Pyhon {platform.python_version()} now!')
    messagebox.showerror("错误", f"不支持当前Python版本! ({platform.python_version()})")
    sys.exit(-1)

app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
requirements_js = [
    {
        'name': 'mdui',
        'res_path': os.path.join(app_dir, 'static', 'mdui'),
        'is_exist': os.path.exists(os.path.join(app_dir, 'static', 'mdui', 'css', 'mdui.min.css')) and os.path.exists(
            os.path.join(app_dir, 'static', 'mdui', 'js', 'mdui.min.js')),
        'download_url': 'https://cdn.w3cbus.com/mdui.org/mdui-v1.0.1.zip',
        'is_zip': True,
        'zip_name': os.path.join(app_dir, 'tmp.zip')
    }, {
        'name': 'jQuery',
        'res_path': os.path.join(app_dir, 'static', 'jquery', 'js', 'jquery.min.js'),
        'is_exist': os.path.exists(os.path.join(app_dir, 'static', 'jquery', 'js', 'jquery.min.js')),
        'download_url': 'https://cdn.bootcdn.net/ajax/libs/jquery/3.7.1/jquery.min.js',
        'is_zip': False,
        'zip_name': ''
    }, {
        'name': 'Viewer.js - js',
        'res_path': os.path.join(app_dir, 'static', 'viewerjs', 'js', 'viewer.min.js'),
        'is_exist': os.path.exists(os.path.join(app_dir, 'static', 'viewerjs', 'js', 'viewer.min.js')),
        'download_url': 'https://cdn.bootcdn.net/ajax/libs/viewerjs/1.11.5/viewer.min.js',
        'is_zip': False,
        'zip_name': ''
    }, {
        'name': 'Viewer.js - css',
        'res_path': os.path.join(app_dir, 'static', 'viewerjs', 'css', 'viewer.min.css'),
        'is_exist': os.path.exists(os.path.join(app_dir, 'static', 'viewerjs', 'css', 'viewer.min.css')),
        'download_url': 'https://cdn.bootcdn.net/ajax/libs/viewerjs/1.11.5/viewer.min.css',
        'is_zip': False,
        'zip_name': ''
    }, {
        'name': 'Geetest 3 - SDK',
        'res_path': os.path.join(app_dir, 'static', 'geetest-sdk', 'js', 'gt.0.4.9.js'),
        'is_exist': os.path.exists(os.path.join(app_dir, 'static', 'geetest-sdk', 'js', 'gt.0.4.9.js')),
        'download_url': 'https://static.geetest.com/static/js/gt.0.4.9.js',
        'is_zip': False,
        'zip_name': ''
    },
]

for requirement in requirements_js:
    try:
        if not requirement['is_exist']:
            print(f"The resources of {requirement['name']} is missing, downloading...", end='')
            messagebox.showinfo("请稍后", f"正在下载{requirement['name']}...")
            conn = requests.get(requirement['download_url'])
            print('\tdownloaded, writing to file...', end='')
            if requirement['is_zip']:
                with open(requirement['zip_name'], mode='wb') as f:
                    f.write(conn.content)
                zipfile.ZipFile(requirement['zip_name']).extractall(requirement['res_path'])
                os.remove(requirement['zip_name'])
            else:
                if not os.path.exists(os.path.dirname(requirement['res_path'])):
                    os.makedirs(os.path.dirname(requirement['res_path']))
                with open(requirement['res_path'], mode='wb') as f:
                    f.write(conn.content)
            print('\tfinished!')
    except:
        print('\nAn error was occurred and download had been interrupted, exiting...')
        messagebox.showerror("错误", "下载组件时出现错误，正在退出...")
        sys.exit(255)


close_now = False
load = False


def openWindow():
    global load
    load = True


def kill_self(icon_in):
    icon_in.stop()
    for i in webview.windows:
        i.destroy()
    os._exit(0)


class Detector(threading.Thread):
    def run(self):
        window_loaded = False
        while True:
            if len(webview.windows) > 0:
                window_loaded = True
            else:
                if close_now:
                    kill_self(icon)
                if window_loaded:
                    icon.notify("窗口已关闭，点击托盘图标以打开", "Re: HoMoLab")
                window_loaded = False
            time.sleep(0.5)


class DailyNoteChecker(threading.Thread):
    def run(self):
        while True:
            if app_config.readConfig('accept_agreement') and int(app_config.readConfig('daily_note_time_delay')) >= 300 and not app_config.readConfig('using_flask'):
                try:
                    genshin_note = games.Genshin.dailyNote()['data']
                    showText_genshin = f'树脂：{genshin_note["current_resin"]}/{genshin_note["max_resin"]} {"树脂溢出" if (genshin_note["current_resin"] >= genshin_note["max_resin"]) else "剩余恢复时间：" + str(ceil(int(genshin_note["resin_recovery_time"]) / 60 / 60)) + "小时"}\n每日委托：{genshin_note["finished_task_num"]}/{genshin_note["total_task_num"]} {"委托奖励未领取！" if not genshin_note["is_extra_task_reward_received"] else "全部完成"}\n洞天宝钱：{genshin_note["current_home_coin"]}/{genshin_note["max_home_coin"]}'
                    genshin_expedition_ongoing = 0
                    genshin_expedition_finished = 0
                    for expedition in genshin_note['expeditions']:
                        match expedition['status']:
                            case 'Ongoing':
                                genshin_expedition_ongoing += 1
                            case 'Finished':
                                genshin_expedition_finished += 1
                    showText_genshin += f'\n探索派遣：{genshin_note["current_expedition_num"]}/{genshin_note["max_expedition_num"]} 已完成：{genshin_expedition_finished}；正在探索：{genshin_expedition_ongoing}'
                    icon.notify(showText_genshin, "每日便笺：原神")
                except:
                    icon.notify('内容获取失败！', "每日便笺：原神")
                time.sleep(int(app_config.readConfig('daily_note_time_delay')) - 30)
            time.sleep(30)


if __name__ == '__main__':
    if sys.argv[-1] != base.git_commit and base.in_build:
        messagebox.showerror("错误", f"无法直接打开该程序，请使用launcher.exe以启动该程序。")
        sys.exit(1)
    else:
        if app_config.readConfig('using_flask'):
            menu = (MenuItem('显示应用', action=openWindow, default=True), MenuItem('退出', kill_self))
        else:
            menu = (MenuItem('退出', kill_self))
        byte_data = base64.b64decode(appicon_base64)
        image_data = BytesIO(byte_data)
        image = Image.open(image_data)
        icon = pystray.Icon("name", image, "Re: HoMoLab", menu)
        tray_thread = threading.Thread(target=icon.run)
        tray_thread.start()
        if not app_config.readConfig('using_flask'):
            dnc = DailyNoteChecker()
            dnc.start()
            openWindow()
            detector = Detector()
            detector.start()
        try:
            if app_config.readConfig('using_flask'):
                print('url: http://127.0.0.1:5000')
                webbrowser.open_new('http://127.0.0.1:5000')
                app.run('127.0.0.1', 5000)
            else:
                while True:
                    if load:
                        load = False
                        webview.create_window('Re: HoMoLab', app, min_size=(1400, 800))
                        webview.start(debug=app_config.readConfig('enable_debug', True), user_agent=base.user_agent)
                    time.sleep(1)
        except:
            print(f"Failed to initialize the pywebview, using flask original server as backbone.")
            print('url: http://127.0.0.1:5000')
            app_config.writeConfig('using_flask', True)
            webbrowser.open_new('http://127.0.0.1:5000')
            app.run('127.0.0.1', 5000)