import os.path

from flask import Flask, render_template, jsonify, request, redirect, make_response

from libmiyoushe import bbs

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
    gid = bbs.getGame(game)[1]
    return render_template('homepage.html', page_api=f'/api/homepage?type=feed&gid={gid}',
                           forums_api=f'/api/forum_list?gid={gid}')


@app.route('/<game>/forum')
def forum_page(game):
    gid = bbs.getGame(game)[1]
    forum_id = request.args.get('forum_id', '26')
    return render_template('homepage.html', page_api=f'/api/homepage?type=forum&gid={gid}&forum_id={forum_id}',
                           forums_api=f'/api/forum_list?gid={gid}')


@app.route('/api/<actions>')
def api(actions):
    match actions:
        case 'homepage':
            page_type = request.args.get('type', 'feed')
            gid = request.args.get('gid', '2')
            page = request.args.get('page', '1')
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
            forum_list = bbs.Forum.getAllForum()[gid] if gid != '-1' else bbs.Forum.getAllForum()
            return jsonify(forum_list)
        case 'game_list':
            query_game = request.args.get('game', 'all')
            return jsonify(bbs.getGame(query_game))
        case 'current_user':
            user = bbs.User()
            return jsonify({'nickname': user.getNickname(), "uid": user.getUid(), "avatar": user.getAvatar(), 'isLogin': user.isLogin})
        case _:
            return '405 Method Not Allowed', 405


@app.route('/')
def main():
    return redirect('/ys')


if __name__ == '__main__':
    window = webview.create_window('homolab', app, min_size=(1000, 800))
    webview.start(debug=True)
