import os
import sys
import threading
import time
import zipfile
from tkinter import messagebox

import pystray
import requests
import webview
from PIL import Image
from pystray import MenuItem
from webview import Window

from gui_server import app


app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
mdui_css = os.path.join(app_dir, 'static', 'mdui', 'css', 'mdui.min.css')
mdui_js = os.path.join(app_dir, 'static', 'mdui', 'js', 'mdui.min.js')
jquery_js = os.path.join(app_dir, 'static', 'jquery', 'js', 'jquery.min.js')
tmp = os.path.join(app_dir, 'tmp.zip')
try:
    if not os.path.exists(mdui_css) and not os.path.exists(mdui_js):
        print("The resources of mdui is missing, downloading...", end='')
        messagebox.showinfo("请稍后", "正在下载mdui组件...")
        conn = requests.get('https://cdn.w3cbus.com/mdui.org/mdui-v1.0.1.zip')
        print('\tdownloaded, writing to file...', end='')
        with open(tmp, mode='wb') as f:
            f.write(conn.content)
        zipfile.ZipFile(tmp).extractall(os.path.join(app_dir, 'static', 'mdui'))
        os.remove(tmp)
        print('\tfinished!')
    if not os.path.exists(jquery_js):
        print("The resources of jQuery is missing, downloading...", end='')
        messagebox.showinfo("请稍后", "正在下载jQuery组件...")
        conn = requests.get('https://cdn.bootcdn.net/ajax/libs/jquery/3.7.1/jquery.min.js')
        print('\t downloaded, writing to file...', end='')
        if not os.path.exists(os.path.dirname(jquery_js)):
            os.makedirs(os.path.dirname(jquery_js))
        with open(jquery_js, mode='wb') as f:
            f.write(conn.content)
        print('\tfinished!')
except:
    print('\nAn error was occurred and download had been interrupted, exiting...')
    messagebox.showerror("错误", "下载组件时出现错误，正在退出...")
    sys.exit(255)


window: Window = None

is_window_created = False


def openWindow():
    global window, is_window_created
    if not is_window_created:
        window = webview.create_window('Re: HoMoLab', app, min_size=(1200, 800))
        is_window_created = True
        webview.start(debug=True)
        window = None
        is_window_created = False
        icon.notify("窗口已关闭，点击托盘图标以打开", "Re: HoMoLab")
    else:
        window.hide()
        time.sleep(0.1)
        window.show()


def kill_self():
    try:
        window.destroy()
    finally:
        os._exit(0)


menu = (MenuItem('显示应用', action=openWindow, default=True), MenuItem('退出', lambda: kill_self()))
image = Image.open("static/appicon.png")
icon = pystray.Icon("name", image, "Re: HoMoLab", menu)
tray_thread = threading.Thread(target=icon.run)
tray_thread.start()
openWindow()