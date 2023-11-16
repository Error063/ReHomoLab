import platform
import random
import string

import libmiyoushe
from libmiyoushe import bbs, auth
from libmiyoushe import base as lib_base

libmiyoushe.account_file = r"C:\Users\czn20\.libhyperion\configs\accounts.json"


if platform.system() == 'Windows':
    import winreg

user_agent = f"HoMoLab/114.514 (Authcode: {''.join((''.join(random.sample(string.digits + string.ascii_letters, 32))).lower())})"
app_version = '0.0.1'
first_open = True


def systemColorSet():
    """
    从注册表中获取系统颜色
    :return:
    """
    if platform.system() == 'Windows':
        if winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\DWM"),
                               'ColorPrevalence')[0] == 1:
            color = hex(winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\DWM"),
                                            'ColorizationColor')[0]).split('0x')[-1]
        else:
            color = 'ffffff'
        light = winreg.QueryValueEx(
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize"),
            'AppsUseLightTheme')[0]
    else:
        color = '006400'
        light = 1
    if len(color) > 6:
        color = color[2:]
    return f'{int(color[0:2], 16)}, {int(color[2:4], 16)}, {int(color[4:6], 16)}', light