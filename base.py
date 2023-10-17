import platform


if platform.system() == 'Windows':
    import winreg


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

