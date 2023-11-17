import json
import os
import pathlib

home_dir = str(pathlib.Path.home())
run_dir = os.path.join(home_dir, '.rehomolab')
config_dir = os.path.join(run_dir, 'configs')
app_config = os.path.join(config_dir, 'app.json')

app_config_template = {
    'desc': '',
    'config': {
        'demo_mode': False,
        'color_mode': 'auto',
        'accept_agreement': False,
        'enable_debug': False,
        'default_area': 'ys',
        'daily_note_time_delay': 300
    }
}

app_config_value_type = {
    'demo_mode': {
        'display_string': '演示模式',
        'type': 'boolean',
        'upload_type': "boolean",
        "is_disabled": True
    },
    'color_mode': {
        'display_string': '外观颜色',
        'type': 'list',
        'upload_type': "string",
        'values_form': '#!from_default_set!#',
        'default_set': {
            'auto': '自动',
            'light': '浅色',
            'dark': '深色'
        },
        "is_disabled": False
    },
    'accept_agreement': {
        'display_string': '同意协议',
        'type': 'boolean',
        'upload_type': "boolean",
        "is_disabled": True
    },
    'enable_debug': {
        'display_string': '调试模式',
        'type': 'boolean',
        'upload_type': "boolean",
        "is_disabled": False
    },
    'default_area': {
        'display_string': '启动时默认显示分区',
        'type': 'list',
        'upload_type': "string",
        'values_form': '#!from_remote*game_api!#',
        "is_disabled": False

},
    'daily_note_time_delay': {
        'display_string': '每日便笺更新频率（秒）',
        'type': 'number',
        'upload_type': "number",
        "is_disabled": False
    }
}

if not os.path.exists(config_dir):
    os.makedirs(config_dir)

try:
    with open(app_config) as f:
        current_config = json.load(f)
except:
    current_config = app_config_template
    with open(app_config, 'w') as f:
        json.dump(current_config, f, indent=2, ensure_ascii=False)

for config in app_config_template['config']:
    if not (config in current_config['config']):
        current_config['config'][config] = app_config_template['config'][config]
with open(app_config, 'w') as f:
    json.dump(current_config, f, indent=2, ensure_ascii=False)


def writeConfig(key, value, reload=False):
    global current_config
    if reload:
        with open(app_config) as f:
            current_config = json.load(f)
    current_config['config'][key] = value
    if not os.path.exists(config_dir):
        os.makedirs(config_dir)
    with open(app_config, 'w') as f:
        json.dump(current_config, f, indent=2, ensure_ascii=False)
    return True


def readConfig(key, reload=False):
    global current_config
    if reload:
        with open(app_config) as f:
            current_config = json.load(f)
    return current_config['config'][key]


def writeMutiConfigs(config: dict, reload=False):
    global current_config
    if reload:
        with open(app_config) as f:
            current_config = json.load(f)
    if list(config.keys()).sort() == list(app_config_template['config'].keys()).sort():
        current_config['config'] = config
        if not os.path.exists(config_dir):
            os.makedirs(config_dir)
        with open(app_config, 'w') as f:
            json.dump(current_config, f, indent=2, ensure_ascii=False)
        return True
    else:
        return False


def readMutiConfig(reload=False):
    global current_config
    if reload:
        with open(app_config) as f:
            current_config = json.load(f)
    return current_config['config']


def getExistKeys():
    return app_config_value_type
