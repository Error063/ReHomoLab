import os.path
import pprint
import time

from flask import Flask, render_template, jsonify, request, redirect, make_response, Markup
from libmiyoushe import bbs, auth
from libmiyoushe import base as lib_base

import base

app = Flask(__name__)

color_mode = 'auto'

if os.path.exists('./_internal'):
    path_prefix = './_internal/'
else:
    path_prefix = './'


@app.route('/dynamic_css')
def dynamic_css():
    color_set = base.systemColorSet()[0]
    print(color_set)
    insert_css_text = ':root{--personal-color: ' + color_set + ' !important;}'
    with open(f'{path_prefix}static/app/css/dark.css') as f:
        match color_mode:
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
def favicon():
    return '404 Not Found', 404


@app.route('/<game>')
def game_main(game):
    return render_template('homepage.html')


@app.route('/<game>/forum')
def forum_page(game):
    return render_template('homepage.html')


@app.route('/api/<actions>', methods=['GET'])
def api(actions):
    match actions:
        case 'login':
            with open(f"{path_prefix}templates/login.html", encoding='utf8') as f:
                login_page = f.read()
            auth.loginByWeb(gui_page=login_page, open_webview=False)
            return ''
        case 'logout':
            auth.logout()
            return ''
        case 'connection_test':
            return str(lib_base.connectionTest()).lower()
        case 'homepage':
            page_type = request.args.get('type', 'feed')
            gid = request.args.get('gid', '2')
            page = request.args.get('page', '1')
            if not gid.isdigit():
                gid = str(bbs.getGame(gid)[1])
            match page_type:
                case 'feed':
                    articles = bbs.Page(gid, page_type)
                    return jsonify(articles.articles)
                case 'official':
                    official_type = request.args.get('official_type', 'news')
                    articles = bbs.Page(gid, official_type, page)
                    return jsonify(articles.articles)
                case 'forum':
                    forum_id = request.args.get('forum_id', '26')
                    forum = bbs.Forum(forum_id, gid, page, sort_type=1)
                    pprint.pprint(forum.articles, indent=4)
                    return jsonify(forum.articles)
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
            article = bbs.Article(post_id)
            match article_action:
                case 'raw':
                    return article.result
                case 'content':
                    content = article.getContent()
                    resp = make_response(content)
                    resp.content_type = "text/html"
                    return resp
                case 'video':
                    return article.getVideo()
                case _:
                    pass
        case _:
            return '405 Method Not Allowed', 405


@app.route('/')
def main():
    return redirect('/ys')


@app.errorhandler(Exception)
def pageError(err):
    if 'Connection Failed!' in str(err):
        return 'Connection Failed!', 503