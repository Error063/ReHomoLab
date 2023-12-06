import os.path
import pprint
import sys
import time
from functools import wraps

import libmiyoushe
from flask import Flask, render_template, jsonify, request, redirect, make_response, send_file
from libmiyoushe import configs

import app_config
from base import bbs, auth
from base import lib_base

import base

app = Flask(__name__)

if os.path.exists('./_internal'):
    path_prefix = './_internal/'
else:
    path_prefix = './'

replace_list = [[r'<a href="https://(?:www\.miyoushe|bbs\.mihoyo|m\.miyoushe)\.com/.+?/article/(\d+)".+?target="_blank"', '<a onclick=showArticle({}) ']]


def before_request(function, agreement_bypass=False):
    @wraps(function)
    def wrapper(*args, **kwargs):
        print(request.url)
        pprint.pprint(request.data.decode())
        config = app_config.readMutiConfig()
        ua = str(request.user_agent.string)
        if (not config['accept_agreement']) or agreement_bypass:
            return render_template('agreement.html')
        if ua == base.user_agent:
            return function(*args, **kwargs)
        elif config['enable_debug'] or config['using_flask']:
            return function(*args, **kwargs)
        else:
            return "<h1>该页面无法使用浏览器直接访问</h1>", 403

    return wrapper


@app.route('/dynamic_css')
@before_request
def dynamic_css():
    color_set = base.systemColorSet()[0]
    insert_css_text = ':root{--personal-color: ' + color_set + ' !important;}'
    with open(f'{path_prefix}static/app/css/dark.css') as f:
        match app_config.readConfig('color_mode'):
            case 'light':
                insert_css_text = insert_css_text
            case 'dark':
                insert_css_text += '\n' + f.read()
            case 'auto':
                insert_css_text += '\n@media (prefers-color-scheme: dark) {\n' + f.read() + '\n}'
            case _:
                pass
    resp = make_response(insert_css_text)
    resp.content_type = "text/css"
    return resp


@app.route('/favicon.ico')
@before_request
def favicon():
    return send_file('./static/appicon.ico')


@app.route('/<game>')
@before_request
def game_main(game):
    return render_template('homepage.html')


@app.route('/<game>/forum')
@before_request
def forum_page(game):
    return render_template('homepage.html')


@app.route('/<game>/vote')
def vote(game):
    return 'hello world'


@app.route('/api/<actions>', methods=['GET', 'POST'])
@before_request
def api(actions):
    match actions:
        case 'login':
            match request.args.get('method', 'web'):
                case 'web':
                    with open(f"{path_prefix}templates/login.html", encoding='utf8') as f:
                        login_page = f.read()
                    auth.loginByWeb(gui_page=login_page, open_webview=False)
                    return ''
                case 'mmt':
                    mmt = auth.createLoginMmt()
                    return mmt
                case 'pwd':
                    if request.method.lower() == 'post':
                        login_json = request.json
                        account = login_json['account']
                        password = login_json['password']
                        mmt = login_json['mmt']
                        geetest = login_json['geetest']
                        login_ticket = auth.getLoginTicketByPassword(account, password, mmt, True, geetest)['token']
                        if login_ticket == '':
                            return {'resp': False}
                        else:
                            return {'resp': auth.login(login_ticket)}
                    else:
                        return '405 Method Not Allowed', 405
                case 'sms':
                    if request.method.lower() == 'post':
                        if request.args.get('type') == 'create':
                            login_json = request.json
                            account = login_json['account']
                            mmt = login_json['mmt']
                            geetest = login_json['geetest']
                            return {'resp': auth.getLoginTicketBySms.createSms(account, mmt, geetest)}
                        elif request.args.get('type') == 'verify':
                            login_json = request.json
                            account = login_json['account']
                            code = login_json['code']
                            login_ticket = auth.getLoginTicketBySms.verifySms(account, code)['token']
                            if login_ticket == '':
                                return {'resp': False}
                            else:
                                return {'resp': auth.login(login_ticket)}
                    else:
                        return '405 Method Not Allowed', 405
                case _:
                    return ''

        case 'logout':
            auth.logout()
            return ''
        case 'account':
            match request.args.get('method', 'exist_list'):
                case 'exist_list':
                    user_dict = dict()
                    current_uid = libmiyoushe.get_current_user()
                    for uid in libmiyoushe.getExistUser():
                        nickname = bbs.User(uid).getNickname()
                        user_dict[uid] = {
                            'uid': uid,
                            'nickname': nickname,
                            'is_current': str(uid) == str(current_uid)
                        }
                    return user_dict
                case 'set':
                    uid = request.args.get('uid')
                    libmiyoushe.set_current_user(uid)
                    return ''
                case 'remove':
                    uid = request.args.get('uid')
                    configs.clearAccount(uid)
                    return ''
                case _:
                    return '405 Method Not Allowed', 405

        case 'homepage':
            page_type = request.args.get('type', 'feed')
            gid = request.args.get('gid', '2')
            page = request.args.get('page', '1')
            if not gid.isdigit():
                gid = str(bbs.getGame(gid)[1])
            match page_type:
                case 'feed':
                    articles = bbs.Page(gid, page_type)
                    return jsonify({'articles': articles.articles, 'last_id': '#!self_add!#'})
                case 'official':
                    official_type = request.args.get('official_type', 'news')
                    articles = bbs.Page(gid, official_type, page)

                    return jsonify({'articles': articles.articles, 'last_id': '#!self_add!#'})
                case 'forum':
                    forum_id = request.args.get('forum_id', '26')
                    forum = bbs.Forum(forum_id, gid, page, sort_type=1)
                    return jsonify({'articles': forum.articles, 'last_id': str(forum.last_id)})
                case _:
                    return '405 Method Not Allowed', 405

        case 'forum_list':
            gid = request.args.get('gid', '-1')
            if gid.isdigit() and gid != '-1':
                forum_list = bbs.Forum.getAllForum()[gid] if gid != '-1' else bbs.Forum.getAllForum()
                return jsonify(forum_list)
            elif gid == '-1':
                forum_list = bbs.Forum.getAllForum()
                return jsonify(forum_list)
            else:
                forum_list = bbs.Forum.getAllForum()[str(bbs.getGame(gid)[1])]
                return jsonify(forum_list)
        case 'game_list':
            query_game = request.args.get('game', 'all')
            return jsonify(bbs.getGame(query_game))
        case 'current_user':
            user = bbs.User()
            return jsonify({'nickname': user.getNickname(), "uid": user.getUid(), "avatar": user.getAvatar(),
                            'isLogin': user.isLogin})
        case 'article':
            post_id = request.args.get('post_id')
            article_action = request.args.get('action', 'raw')
            article = bbs.Article(post_id, replace_list)
            match article_action:
                case 'raw':
                    return article.result
                case _:
                    return '405 Method Not Allowed', 405

        case 'comment':
            page_id = request.args.get('post_id')
            gid = request.args.get('gid')
            page = request.args.get('page', '1')
            rank_by = request.args.get('rank_by', 'hot')
            if not gid.isdigit():
                gid = str(bbs.getGame(gid)[1])
            match rank_by:
                case 'earliest':
                    comment = bbs.Comments(page_id, gid, page, orderby=1, rank_by_hot=False)
                case 'latest':
                    comment = bbs.Comments(page_id, gid, page, orderby=2, rank_by_hot=False)
                case 'master':
                    comment = bbs.Comments(page_id, gid, page, only_master=True, rank_by_hot=False)
                case _:
                    comment = bbs.Comments(page_id, gid, page, rank_by_hot=True)
            return {
                'comments': comment.comments,
                'is_last': comment.isLastFlag
            }

        case 'root_comment':
            reply_id = request.args.get('reply_id')
            post_id = request.args.get('post_id')
            return bbs.RootComment(post_id, reply_id).comment

        case 'sub_comment':
            floor_id = request.args.get('floor_id')
            post_id = request.args.get('post_id')
            last_id = request.args.get('last_id', '0')
            comment = bbs.SubComments(post_id, floor_id, last_id=last_id)
            return {
                'comments': comment.comments,
                'is_last': comment.isLastFlag,
                'last_id': comment.last_id
            }

        case 'validate':
            match request.args.get('method', 'create'):
                case 'create':
                    return auth.GeetestVerification.createVerification()
                case 'verify':
                    if request.method.upper() == 'POST':
                        result = auth.GeetestVerification.verifyVerification(request.json)
                        return result
                    else:
                        return '405 Method Not Allowed', 405

        case "like":
            post_id = request.args.get('post_id')
            reply_id = request.args.get('reply_id', '')
            cancel = request.args.get('is_cancel', 'False').lower() == 'true'
            if reply_id:
                return list(bbs.Actions.upvoteReply(reply_id, post_id, cancel))
            else:
                return list(bbs.Actions.upvotePost(post_id, cancel))

        case "collect":
            post_id = request.args.get('post_id')
            cancel = request.args.get('is_cancel', 'False').lower() == 'true'
            return list(bbs.Actions.collectPost(post_id, cancel))

        case _:
            return '405 Method Not Allowed', 405


@app.route('/app-api/<actions>')
def app_api(actions):
    match actions:
        case 'app_config':
            config = {'version': base.app_version, 'git_commit': base.git_commit[:7], 'python_version': sys.version, 'first_open': base.first_open, 'local_config': app_config.readMutiConfig()}
            base.first_open = False
            return config
        case 'heartbeat':
            return {'t': int(time.time() * 1000)}
        case 'connection_test':
            return str(lib_base.connectionTest()).lower()
        case 'setting':
            if request.method.lower() == 'get':
                setting_key = request.args.get('key')
                setting_value = request.args.get('value')
                if setting_value.lower() == 'true':
                    setting_value = True
                elif setting_value.lower() == 'false':
                    setting_value = False
                return {'resp': app_config.writeConfig(setting_key, setting_value)}
            elif request.method.lower() == 'post':
                return {'resp': app_config.writeMutiConfigs(dict(request.json))}
            else:
                return '405 Method Not Allowed', 405
        case 'get_settings':
            return {'config': app_config.readMutiConfig(), 'pairs': app_config.getExistKeys()}
        case 'quit':
            os._exit(0)
            return ''
        case _:
            return '405 Method Not Allowed', 405


@app.route('/')
@before_request
def main():
    return redirect(f'/{app_config.readConfig("default_area")}')


@app.errorhandler(Exception)
def pageError(err):
    if 'Connection Failed!' in str(err):
        return 'Connection Failed!', 503
    elif 'Authentication error' in str(err):
        return 'Authentication Error', 403