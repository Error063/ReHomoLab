import os.path
import zipfile

from flask import Flask, render_template, jsonify, request, redirect, make_response
from tkinter import Tk, messagebox
import requests
from libmiyoushe import bbs
from libmiyoushe import base as lib_base

import base

import webview

app = Flask(__name__)

color_mode = 'dark'


@app.route('/css')
def css():
    color_set = base.systemColorSet()
    insert_css_text = ':root{--personal-color: ' + color_set[0] + ' !important;}'
    with open('./static/css/dark.css') as f:
        match color_mode:
            case 'light':
                insert_css_text = insert_css_text
            case 'dark':
                insert_css_text += '\n' + f.read()
            case 'auto':
                insert_css_text += '\n@media (prefers-color-scheme: dark) {\n' + f.read() + '\n}'
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
        case 'connection_test':
            return str(lib_base.connectionTest()).lower()
        case 'homepage':
            page_type = request.args.get('type', 'feed')
            gid = request.args.get('gid', '2')
            page = request.args.get('page', '1')
            if gid.isalpha():
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
                    forum = bbs.Forum(forum_id, gid, page)
                    return jsonify(forum.articles)
                case _:
                    return '405 Method Not Allowed', 405
        case 'forum_list':
            gid = request.args.get('gid', '-1')
            if gid.isdigit():
                forum_list = bbs.Forum.getAllForum()[gid] if gid != '-1' else bbs.Forum.getAllForum()
                return jsonify(forum_list)
            elif gid.isalpha():
                forum_list = bbs.Forum.getAllForum()[str(bbs.getGame(gid)[1])]
                return jsonify(forum_list)
            else:
                forum_list = bbs.Forum.getAllForum()
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
            article_action = request.args.get('action', 'main_page')
            article = bbs.Article(post_id)

        case _:
            return '405 Method Not Allowed', 405


@app.route('/')
def main():
    return redirect('/ys')


@app.errorhandler(Exception)
def pageError(err):
    if 'Connection Failed!' in str(err):
        return 'Connection Failed!', 503

