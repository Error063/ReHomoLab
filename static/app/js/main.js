console.log(`===================================================\nRe: HoMoLab   ----   By Error063\n===================================================\nApp init at ${new Date().toString()}.`);

let page_api;
let forum_api;
let current_url = location.href;
let game_api = '/api/game_list';
let current_user_api = '/api/current_user';
let article_element = document.querySelector("#right-items");
let forum_element = document.querySelector('#forums');
let right_element = document.querySelector('#right');
let game_element = document.getElementsByClassName('switch-game')[0];
let menu = document.getElementById('menu');
let submenu = document.getElementById('submenu');
let account_menu = document.getElementById('account-menu');
let post_menu = document.getElementById('post-menu');
let page = '';
let last_scroll_size = 0;
let bottomNotice = true;
let game = location.href.split('/').slice(3)[0];
let current_window = 0;
let new_detect = false;
let is_login = false;
let app_config;
let locks = {postcard_render: false, comment_render: false}
window.geetest_activated = false;

document.querySelector('#forum-logo').setAttribute('style', `background-image: url('https://upload-bbs.mihoyo.com/game/${game}/app_icon.png');`)
document.querySelector('#recommend').setAttribute('onclick', `load_page('/${game}')`)

if (location.href.split('/').length <= 4){
    page_api = `/api/homepage?type=feed&gid=${game}`
}else{
    page_api = `/api/homepage?type=forum&forum_id=${getQueryString(current_url, 'forum_id')}&gid=${game}`
}

forum_api = `/api/forum_list?gid=${game}`

let HtmlUtil = {
    /*1.用浏览器内部转换器实现html编码（转义）*/
    htmlEncode: function (html) {
        //1.首先动态创建一个容器标签元素，如DIV
        let temp = document.createElement("div");
        //2.然后将要转换的字符串设置为这个元素的innerText或者textContent
        (temp.textContent !== undefined) ? (temp.textContent = html) : (temp.innerText = html);
        //3.最后返回这个元素的innerHTML，即得到经过HTML编码转换的字符串了
        let output = temp.innerHTML;
        temp = null;
        return output;
    },
    /*2.用浏览器内部转换器实现html解码（反转义）*/
    htmlDecode: function (text) {
        //1.首先动态创建一个容器标签元素，如DIV
        let temp = document.createElement("div");
        //2.然后将要转换的字符串设置为这个元素的innerHTML(ie，火狐，google都支持)
        temp.innerHTML = text;
        //3.最后返回这个元素的innerText或者textContent，即得到经过HTML解码的字符串了。
        let output = temp.innerText || temp.textContent;
        temp = null;
        return output;
    },
    /*3.用正则表达式实现html编码（转义）*/
    htmlEncodeByRegExp: function (str) {
        let temp = "";
        if (str.length === 0) return "";
        temp = str.replace(/&/g, "&");
        temp = temp.replace(/</g, "\<");
        temp = temp.replace(/>/g, "\>");
        temp = temp.replace(/\s/g, " ");
        temp = temp.replace(/\'/g, "\'");
        temp = temp.replace(/\"/g, "\"");
        return temp;
    },
    /*4.用正则表达式实现html解码（反转义）*/
    htmlDecodeByRegExp: function (str) {
        let temp = "";
        if (str.length === 0) return "";
        temp = str.replace(/&/g, "&");
        temp = temp.replace(/</g, "<");
        temp = temp.replace(/>/g, ">");
        temp = temp.replace(/ /g, " ");
        temp = temp.replace(/'/g, "\'");
        temp = temp.replace(/"/g, "\"");
        return temp;
    },
    /*5.用正则表达式实现html编码（转义）（另一种写法）*/
    html2Escape: function (sHtml) {
        return sHtml.replace(/[<>&"]/g, function (c) {
            return {'<': '<', '>': '>', '&': '&', '"': '"'}[c];
        });
    },
    /*6.用正则表达式实现html解码（反转义）（另一种写法）*/
    escape2Html: function (str) {
        let arrEntities = {'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"'};
        return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function (all, t) {
            return arrEntities[t];
        });
    }
};

function formatDate(objDate,fmt){
　　let o = {
　　　　"M+" : objDate.getMonth()+1, //月份
　　　　"d+" : objDate.getDate(), //日
　　　　"h+" : objDate.getHours()%12 === 0 ? 12 : objDate.getHours()%12, //小时
　　　　"H+" : objDate.getHours(), //小时
　　　　"m+" : objDate.getMinutes(), //分
　　　　"s+" : objDate.getSeconds(), //秒
　　　　"q+" : Math.floor((objDate.getMonth()+3)/3), //季度
　　　　"S" : objDate.getMilliseconds() //毫秒
　　};
　　if(/(y+)/.test(fmt))
　　　　fmt=fmt.replace(RegExp.$1, (objDate.getFullYear()+"").substr(4 - RegExp.$1.length));
　　for(var k in o)
　　　　if(new RegExp("("+ k +")").test(fmt))
　　fmt = fmt.replace(RegExp.$1, (RegExp.$1.length===1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
　　return fmt;
}

function apiConnect(url, failed_warning=true) {
    /* 连接api的封装 */
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                if(failed_warning){
                    mdui.snackbar({
                        message: '<span style="color: red;font-weight: bold;font-size: 20px">内容获取失败！</span>',
                        position: 'right-top',
                        timeout: 0
                    });
                }

                reject(new Error(`Request failed with status ${xhr.status}`));
            }
        };
        xhr.onerror = () => {
            if(failed_warning) {
                mdui.snackbar({
                    message: '<span style="color: red;font-weight: bold;font-size: 20px">网络连接失败！</span>',
                    position: 'right-top',
                    timeout: 0
                });
            }
            reject(new Error('Request failed'));
        };
        xhr.send();
    });
}

function checkUpdateAndMessage() {
    apiConnect('https://app-api.error063.work/homolab/info.json', false).then((res) => {
        let online_config = JSON.parse(res);
        // if(online_config.version > local_config.version){
        //     mdui.alert('有可用更新', '有可用更新');
        // }
        let msg;
        for (let i = 0; i < online_config.message.length; i++) {
            msg = online_config.message[i];
            mdui.alert(msg.content, msg.title);
        }
    })
    // apiConnect('/app-api/app_config', false).then((res) => {
    //     let local_config = JSON.parse(res);
    //     if(local_config['cloud_conn']){
    //
    //     }else{
    //         console.log('Cannot connect to the developer\'s api because the user setting!')
    //     }
    // })
}

function load_page(url) {
    /* 将页面跳转到指定的url或执行指定的操作 */
    article_element.innerHTML = ''
    document.getElementsByClassName('topbar-progress-bar')[0].setAttribute('style', 'visibility: visible;')
    switch (url) {
        case 'reload':
            location.reload();
            break;
        case 'back':
            history.back();
            break;
        case 'home':
            location.href = `/${game}`
            break;
        default:
            location.href = url
            break;
    }
}

function getQueryString(url_string, name) {
    /**
     * 根据传入的url链接，返回需要查询的请求字符串的值
     **/
    let vars = url_string.split('?')[1].split("&");
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split("=");
        if (pair[0] === name) {
            return pair[1];
        }
    }
    return '';
}

function addArticle() {
    /**
     * 向页面添加一组文章卡片
     **/
    if(locks.postcard_render){
        console.log('Cannot add more post cards because the previous action is not finished!');
    }else{
        locks.postcard_render = true
        for(let i=0; i<2; i++){
            apiConnect(page_api + `&page=${page}`).then((res) => {
                let article_set = JSON.parse(res);
                let articles = article_set['articles'];
                let page_get = article_set['last_id'];
                if (articles.length > 0 && bottomNotice) {
                    if(page_get === '#!self_add!#'){
                        page++;
                    }else {
                        page = page_get;
                    }
                    for (let i = 0; i < articles.length; i++) {
                        article_element.innerHTML += `<div class="postCard fix mdui-ripple mdui-hoverable" articleId="${articles[i].post_id}" ${articles[i]['collect'] ? 'collected' : ''} ${articles[i]['upvote'] ? 'upvoted' : ''}><div class="user" onclick="" style="cursor: pointer"><img class="avatar" src="${articles[i].authorAvatar}"/><div class="userinfo"><div class="nickname">${articles[i].authorName}</div><div class="describe">${articles[i].authorDescribe}</div></div></div><div class="articleInfo" onclick="" style="cursor: pointer"><div class="image"><div class="articleCover" style="${articles[i].cover === '' ? `background-color: rgba(var(--personal-color), 0.1)` : `background-image: url('${articles[i].cover}')`}"></div></div><div class="info"><h3 class="articleTitle">${articles[i].title}</h3><div class="articleDescribe">${articles[i].describe}</div></div></div></div>`
                    }
                }
            })
        }
        locks.postcard_render = false
    }


}

function copy(text) {
    /**
     * 复制文本并弹出操作信息
     **/
    navigator.clipboard.writeText(text).then(function () {
        /* clipboard successfully set */
        mdui.snackbar({
            message: '复制成功',
            position: 'right-top',
            timeout: 1000
        });
    }, function () {
        /* clipboard successfully set */
        mdui.snackbar({
            message: '复制失败',
            position: 'right-top',
            timeout: 1000
        });
    }, 2000)
}

function showArticle(postId) {
    /**
     * 在原有页面的基础上添加一层遮罩以显示文章内容
     **/
    if(new_detect){
        console.log('Cannot append the new article window because the previous window is not ready or interrupted!')
        return undefined;
    }
    let new_overlay = document.createElement('div');
    new_overlay.classList.add('overlay');
    new_overlay.innerHTML += `<div class="overlay-window article-overlay"><div class="overlay-window-wrapper"><div class="overlay-window-topbar"><button class="mdui-btn mdui-btn-icon mdui-btn-dense mdui-color-theme-accent mdui-ripple overlay-window-close-btn"><i class="mdui-icon material-icons">close</i></button></div><div class='overlay-window-main'></div></div></div>`;
    let overlay_window = new_overlay.getElementsByClassName('overlay-window-main')[0];
    // overlay_window.innerHTML = '';
    let article_main = document.createElement('div');
    article_main.classList.add('article-main');
    article_main.innerHTML = '<div class="loading"><div class="mdui-spinner mdui-spinner-colorful spinner"></div></div>'
    let title = document.createElement('h1');
    let release_time = document.createElement('p')
    release_time.classList.add('release-time')
    let quill_post = document.createElement('div');
    quill_post.classList.add('ql-editor');
    let article_right = document.createElement('div');
    article_right.classList.add('article-right');
    function renderPage(postId) {
        apiConnect(`/api/article?post_id=${postId}&action=raw`).then((res) => {
            let post_raw = JSON.parse(res);
            if (post_raw['retcode'] === 0){
                title.innerText = post_raw['data']['post']['post']['subject'];
                release_time.innerText = '发布时间：' + formatDate(new Date(parseInt(post_raw['data']['post']['post']['created_at']) * 1000), 'yyyy-MM-dd hh:mm:ss')
                let render_type = post_raw["data"]['post']['post']['view_type'];
                switch (render_type) {
                    case 1:
                        quill_post.innerHTML = HtmlUtil.htmlDecodeByRegExp(post_raw["data"]['post']['post']['content']);
                        try {
                            let vod_lists = post_raw["data"]["post"]["vod_list"];
                            let resolutions = document.getElementsByName('resolution');
                            let videoClass = document.getElementsByClassName('video');
                            let mhyvods = document.getElementsByClassName('mhy-vod');
                            for (let i = 0; i < vod_lists.length; i++) {
                                mhyvods[i].innerHTML += `<video controls class="video" width="100%"></video>`;
                                mhyvods[i].innerHTML += '<p><label for="resolution">清晰度：</label>';
                                mhyvods[i].innerHTML += `<select name="resolution" id="resolution" class="resolution" style="width: 100px;" onchange="resolutionChange(${i})"></select></p>`;
                                let vod_list = vod_lists[i];
                                let cover = vod_list['cover'];
                                let vods = vod_list['resolutions'];
                                videoClass[i].poster = cover;
                                let options = ''
                                for (let j = 0;j < vods.length; j++) {
                                    options += `<option value="${vods[j]['url']}">${vods[j]['definition']}</option>`;
                                }
                                resolutions[i].innerHTML = options;
                                resolutionChange(i);
                                videoClass[i].pause();
                            }
                        }catch (e) {
                            console.log(e);
                        }
                        break;
                    case 2:
                        let res_json = JSON.parse(post_raw["data"]['post']['post']['content']);
                        let ql_image, ql_image_box, img, para;
                        for (let i = 0; i < res_json['imgs'].length; i++) {
                            ql_image = document.createElement('div');
                            ql_image_box = document.createElement('div');
                            img = document.createElement('img');
                            ql_image.classList.add('ql-image');
                            ql_image_box.classList.add('ql-image-box');
                            img.src = res_json['imgs'][i];
                            ql_image_box.appendChild(img);
                            ql_image.appendChild(ql_image_box);
                            quill_post.appendChild(ql_image);
                        }
                        para = document.createElement('p');
                        para.innerText = res_json.describe?res_json.describe:'';
                        quill_post.appendChild(para);
                        break;
                    case 5:
                        let desc_content = post_raw["data"]["post"]['post']["content"];
                        quill_post.innerHTML = `<div class="mhy-vod"><video controls width="100%" class="video"></video><p><label for="resolution">清晰度：</label><select name="resolution" id="resolution" style="width: 100px;" onchange="resolutionChange(0)"></select></p></div><p>${desc_content.replaceAll('\n', '</p><p>')}</p>`;
                        let vod_list = post_raw["data"]["post"]["vod_list"][0];
                        let cover = vod_list['cover'];
                        let vods = vod_list['resolutions'];
                        let resolutions = document.getElementById('resolution');
                        let videoClass = document.getElementsByClassName('video')[0];
                        videoClass.poster = cover;
                        for (let i = 0;i < vods.length; i++) {
                            resolutions.options.add(new Option(vods[i]['definition'], vods[i]['url']));
                        }
                        resolutions.options[0].select = true;
                        new mdui.Select(resolutions);
                        resolutionChange(0);
                        videoClass.pause();
                        break;
                }
                let author_div = document.createElement('div');
                author_div.classList.add('author');
                author_div.innerHTML = `<img class="avatar" src="${post_raw['data']['post']['user']['avatar_url']}"/><div class="userinfo"><div class="nickname">${post_raw['data']['post']['user']['nickname']}</div><div class="describe">${post_raw['data']['post']['user']['certification']['label'].length > 0?post_raw['data']['post']['user']['certification']['label']:post_raw['data']['post']['user']['introduce']}</div></div>`;
                article_right.appendChild(author_div);

                let article_actions = document.createElement('div');
                article_actions.classList.add('article-actions');

                let like = document.createElement('div');
                like.classList.add('article-like');
                let like_btn = document.createElement('button');
                like_btn.classList.add('mdui-btn');
                like_btn.classList.add('mdui-btn-icon');
                like_btn.classList.add('mdui-ripple');
                like_btn.innerHTML = '<i class="mdui-icon material-icons">thumb_up</i>';
                if(parseInt(post_raw['data']['post']['self_operation']['attitude']) !== 0){
                    like_btn.style.color = 'yellow';
                }
                like.appendChild(like_btn);
                let like_num = document.createElement('span');
                like_num.textContent = post_raw['data']['post']['stat']['like_num'];
                like.appendChild(like_num);
                article_actions.appendChild(like)

                let collect = document.createElement('div');
                collect.classList.add('article-collect');
                let collect_btn = document.createElement('button');
                collect_btn.classList.add('mdui-btn');
                collect_btn.classList.add('mdui-btn-icon');
                collect_btn.classList.add('mdui-ripple');
                collect_btn.innerHTML = '<i class="mdui-icon material-icons">star</i>';
                if(post_raw['data']['post']['self_operation']['is_collected']){
                    collect_btn.style.color = 'yellow';
                }
                collect.appendChild(collect_btn);
                let collect_num = document.createElement('span');
                collect_num.textContent = post_raw['data']['post']['stat']['bookmark_num'];
                collect.appendChild(collect_num);
                article_actions.appendChild(collect);

                let reply = document.createElement('div');
                reply.classList.add('article-replies');
                let reply_btn = document.createElement('button');
                reply_btn.classList.add('mdui-btn');
                reply_btn.classList.add('mdui-btn-icon');
                reply_btn.classList.add('mdui-ripple');
                reply_btn.innerHTML = '<i class="mdui-icon material-icons">mode_comment</i>';
                reply.appendChild(reply_btn)
                let reply_num = document.createElement('span');
                reply_num.textContent = post_raw['data']['post']['stat']['reply_num'];
                reply.appendChild(reply_num);
                article_actions.appendChild(reply);

                let reply_rank = document.createElement('select');
                reply_rank.classList.add('reply-rank')
                reply_rank.innerHTML += '<option value="hot">按热度排序</option>'
                reply_rank.innerHTML += '<option value="earliest">按最早发布时间排序</option>'
                reply_rank.innerHTML += '<option value="latest">按最晚发布时间排序</option>'
                reply_rank.innerHTML += '<option value="master">只看楼主</option>'
                article_actions.appendChild(reply_rank);
                new mdui.Select(reply_rank);
                reply_rank.addEventListener('change', (e) => {
                    let target = e.target;
                    let aimed_comment = target.parentElement.parentElement.getElementsByClassName('article-comment')[0];
                    aimed_comment.innerHTML = '';
                    aimed_comment.setAttribute('rank_by', target.options[target.selectedIndex].value)
                    article_comment.setAttribute("comment-page", "0");
                    article_comment.setAttribute("is_last", 'false');
                    locks.comment_render = false;
                    renderCommentsTree(aimed_comment);
                });
                article_right.appendChild(article_actions);

                let article_comment = document.createElement('div');
                article_comment.classList.add('article-comment');

                article_comment.setAttribute("comment-page", "0");
                article_comment.setAttribute("post_id", postId);
                article_comment.setAttribute("is_last", "false");
                article_comment.setAttribute("rank_by", "hot");
                article_comment.addEventListener('scroll', (e) => {
                    let element = e.target;
                    if (-100 <= element.scrollTop + element.clientHeight - element.scrollHeight && element.scrollTop + element.clientHeight - element.scrollHeight <= -90) {
                        renderCommentsTree(element);
                    }
                })
                renderCommentsTree(article_comment);
                article_right.appendChild(article_comment);
            }
            else if(post_raw['retcode'] === 1034){
                window.geetest_activated = true;
                mdui.alert('点击继续以完成人机验证', '似乎触发了访问风控...', () =>{
                    apiConnect('/api/validate?method=create').then((res) => {
                        let geetest_validate = JSON.parse(res);
                        initGeetest({
                            gt: geetest_validate.gt,
                            challenge: geetest_validate.challenge,
                            new_captcha: true,
                            product: 'bind'
                        }, (captchaObj) => {
                            captchaObj.onReady(function(){
                                captchaObj.verify();
                            }).onSuccess(function(){
                                let result = captchaObj.getValidate();
                                let verify_xhr = new XMLHttpRequest();
                                verify_xhr.open('post', '/api/validate?method=verify')
                                verify_xhr.onload = () => {
                                    renderPage(postId);
                                }
                                verify_xhr.setRequestHeader('Content-Type', 'application/json')
                                let result_send = {
                                    geetest_challenge: result.geetest_challenge,
                                    geetest_validate: result.geetest_validate,
                                    geetest_seccode: result.geetest_seccode,
                                }
                                verify_xhr.send(JSON.stringify(result_send))
                            }).onError(function(){
                                mdui.alert('验证码加载失败！', '错误', () => {
                                    load_page('reload')
                                }, {
                                    confirmText: '继续',
                                })
                            })
                        })
                    })
                    load_page('reload');
                }, {
                    confirmText: '继续',
                });
            }
            else{
                mdui.alert(`api返回的retcode为：${post_raw['retcode']}`, '访问失败！', () =>{
                    load_page('reload');
                }, {
                    confirmText: '好',
                });
            }
        })
    }
    renderPage(postId)
    article_main.innerHTML = '';
    article_main.appendChild(title);
    article_main.appendChild(release_time)
    article_main.appendChild(quill_post);
    overlay_window.appendChild(article_main);
    overlay_window.appendChild(article_right);
    new_overlay.addEventListener('click', (e) => {
        if(e.target.classList.contains('overlay')){
            e.target.remove();
        }
    })
    new_overlay.getElementsByClassName('overlay-window-close-btn')[0].addEventListener('click', function (e) {
        if(window.geetest_activated){
            load_page('reload');
        }else{
           let target_element = e.target;
            do{
                if(target_element.classList.contains('overlay')){
                    target_element.remove();
                    break;
                }else {
                    target_element = target_element.parentElement;
                }
            } while (target_element !== null)
        }

    })
    new_overlay.getElementsByClassName('overlay-window-close-btn')[0].addEventListener('dblclick', function (e) {
        e.preventDefault();
        if(window.geetest_activated){
            load_page('reload');
        }else{
            let target_element = e.target;
            let overlays = document.getElementsByClassName('overlay')
            for (let i = 0; i < overlays.length; i++) {
                let current_overlay = overlays[i];
                if(!(current_overlay.classList.contains('loading_outter'))){
                    current_overlay.remove()
                }
            }
        }
    })
    document.body.appendChild(new_overlay)
}

function renderCommentsTree(article_comment) {
    if(locks.comment_render){
        console.log('Cannot add more comments because the previous action is not finished!');
    }else{
        locks.comment_render = true;
        let post_id = article_comment.getAttribute("post_id");
        let rank_by = article_comment.getAttribute("rank_by");
        let new_page = parseInt(article_comment.getAttribute("comment-page")) + 1;
        article_comment.setAttribute("comment-page", new_page.toString())
        let flag = article_comment.getAttribute("is_last");
        if(flag === 'false'){
            apiConnect(`/api/comment?post_id=${post_id}&gid=${game}&page=${new_page.toString()}&rank_by=${rank_by}`).then((res) => {
                let result = JSON.parse(res);
                for (let comment of result.comments) {
                    let piece_reply = document.createElement('div');
                    piece_reply.classList.add('piece-reply');
                    piece_reply.classList.add('mdui-ripple');
                    piece_reply.classList.add('mdui-hoverable');
                    piece_reply.setAttribute("reply_id", comment.reply_id);
                    piece_reply.setAttribute("floor_id", comment.floor_id);
                    piece_reply.setAttribute("post_id", comment.post_id);
                    piece_reply.addEventListener('click', (e) => {
                        let element = e.target;
                        let flag = false;
                        do {  //通过向上循环查找来得到鼠标右击区域范围
                            if (element.classList.contains('piece-reply')) {
                                flag = true;
                                break;
                            }else if(element.tagName.toString().toLowerCase() === 'img'){
                                break;
                            }
                            else {
                                element = element.parentElement;
                            }
                        } while (element !== null)
                        if(flag){
                            let post_id = element.getAttribute("post_id");
                            let floor_id = element.getAttribute("floor_id");
                            let reply_id = element.getAttribute("reply_id");
                            showCommentDetail(post_id, reply_id, floor_id);
                        }

                    });
                    let reply_user = document.createElement('div');
                    reply_user.classList.add('reply-user');
                    let user_avatar = document.createElement('img');
                    user_avatar.classList.add('reply-user-avatar');
                    user_avatar.src = comment.avatar;
                    let user_nickname = document.createElement('div');
                    user_nickname.classList.add('reply-user-nickname');
                    user_nickname.innerText = comment.username;
                    reply_user.appendChild(user_avatar);
                    reply_user.appendChild(user_nickname);
                    piece_reply.appendChild(reply_user);
                    let comment_main = document.createElement('div');
                    comment_main.classList.add('comment-main');
                    comment_main.classList.add('ql-editor');
                    comment_main.innerHTML = comment.content;
                    for (const commentMainElement of comment_main.getElementsByTagName('img')) {
                        if(commentMainElement.classList.contains('emoticon-image')){
                            continue;
                        }
                        new Viewer(commentMainElement);
                    }
                    piece_reply.appendChild(comment_main);
                    article_comment.appendChild(piece_reply);
                }
                if(result.is_last || result.comments.length === 0) {
                    let piece_reply = document.createElement('div');
                    piece_reply.classList.add('piece-reply');
                    piece_reply.innerHTML = "<p style='text-align: center;line-height: 2.5;'>没有更多了</p>";
                    article_comment.appendChild(piece_reply);
                    piece_reply.style.height = '40px'
                    article_comment.setAttribute("is_last", 'true')
                }
            })
        }
        locks.comment_render = false;
    }

}

function showCommentDetail(post_id, reply_id, floor_id) {
    let new_overlay = document.createElement('div');
    new_overlay.classList.add('overlay');
    new_overlay.addEventListener('click', (e) => {
        if(e.target.classList.contains('overlay')){
            e.target.remove();
        }
    })
    new_overlay.innerHTML = '<div class="reply-detail-window-outer"><div class="reply-detail-window"></div></div>'
    document.body.appendChild(new_overlay)
}

function resolutionChange(i) {
    let resolutions = document.getElementsByName('resolution');
    let videoClass = document.getElementsByClassName('video');

    let index = resolutions[i].selectedIndex;
    let vodSrc_selected = resolutions[i].options[index].value;
    let playTime = videoClass[i].currentTime;

    videoClass[i].src = vodSrc_selected;
    videoClass[i].load();

    videoClass[i].currentTime = playTime;
    videoClass[i].play();
}

function like(post_id, like_to="article", reply_id){

}
let old_value = -1;
right_element.addEventListener('scroll', () => {
    /**
     * 处理右侧面板的滚动事件（元素滚动到底时向页面添加更多文章卡片）
     **/
    if(Math.round(right_element.scrollTop + right_element.clientHeight - right_element.scrollHeight) >= 0){
        old_value = Math.round(right_element.scrollTop + right_element.clientHeight - right_element.scrollHeight);
    }
})

setInterval(() => {
    if(old_value >= 0){
        addArticle();
        old_value = -1;
    }
}, 300)

window.addEventListener('contextmenu', (e) => {
    e.preventDefault();  //禁用浏览器原生右击事件
    menu.classList.remove('active');  //清除页面中所有存在的右击菜单
    account_menu.classList.remove('active');
    post_menu.classList.remove('active');
    let element = e.target;  //鼠标右击对象区域
    let flag = false;  //是否有特殊区域是否被找到
    let type = 'normal';  //触发区域类型
    do {  //通过向上循环查找来得到鼠标右击区域范围
        if (element.classList.contains('postCard')) {
            flag = true;
            type = 'postCard';
            break;
        } else if (element.classList.contains('user-info')) {
            flag = true;
            type = 'user-info';
            break;
        } else if (element.classList.contains('overlay')) {
            flag = true;
            type = 'overlay';
            break;
        } else {
            element = element.parentElement;
        }
    } while (flag || element !== null)
    if (!flag) {  //默认右击菜单样式
        let x = e.clientX;
        let y = e.clientY;
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let menuWidth = menu.offsetWidth;
        let menuHeight = menu.offsetHeight;
        x = winWidth - menuWidth >= x ? x : winWidth - menuWidth;  //处理菜单溢出
        y = winHeight - menuHeight >= y ? y : winHeight - menuHeight;
        menu.style.top = y + 'px';
        menu.style.left = x + 'px';
        if (x > (winWidth - menuWidth - submenu.offsetWidth)) {  //处理子菜单x轴溢出
            submenu.style.left = `-${submenu.offsetWidth}px`;
        } else {
            submenu.style.left = '';
            submenu.style.right = `-${submenu.offsetWidth}px`;
        }
        if (y > (winHeight - menuHeight - submenu.offsetHeight)) {  //处理子菜单y轴溢出
            submenu.style.top = `-${submenu.offsetHeight - 15}px`;
            // submenu.style.top = `-${-winHeight + submenu.offsetHeight}px`;
        } else {
            submenu.style.top = '-35px';
        }
        menu.classList.add('active');
    } else if (type === 'postCard') {  //文章卡片右击菜单样式
        if ('collected' in element.attributes) {
            document.querySelector('#collect').innerHTML = '<i class="mdui-icon material-icons" id="collect-icon">star_border</i><span id="collect-status">取消收藏</span>'
        } else {
            document.querySelector('#collect').innerHTML = '<i class="mdui-icon material-icons" id="collect-icon">star</i><span id="collect-status">收藏</span>'
        }
        if ('upvoted' in element.attributes) {
            document.querySelector('#upvote').innerHTML = '<i class="mdui-icon material-icons" id="upvote-icon">thumb_down</i><span id="upvote-status">取消点赞</span>'
        } else {
            document.querySelector('#upvote').innerHTML = '<i class="mdui-icon material-icons" id="upvote-icon">thumb_up</i><span id="upvote-status">点赞</span>'
        }
        let post_id = element.getAttribute('articleId');
        $('#copy').click(() => {
            copy(`https://www.miyoushe.com/${game}/article/${post_id}`);
        })
        let x = e.clientX;
        let y = e.clientY;
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let menuWidth = post_menu.offsetWidth;
        let menuHeight = post_menu.offsetHeight;
        x = winWidth - menuWidth >= x ? x : winWidth - menuWidth;  //处理菜单溢出
        y = winHeight - menuHeight >= y ? y : winHeight - menuHeight;
        post_menu.style.top = y + 'px';
        post_menu.style.left = x + 'px';
        post_menu.classList.add('active');
    } else if (type === 'user-info' && 'login' in element.attributes) {
        let x = e.clientX;
        let y = e.clientY;
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let menuWidth = account_menu.offsetWidth;
        let menuHeight = account_menu.offsetHeight;
        x = winWidth - menuWidth >= x ? x : winWidth - menuWidth;  //处理菜单溢出
        y = winHeight - menuHeight >= y ? y : winHeight - menuHeight;
        account_menu.style.top = y + 'px';
        account_menu.style.left = x + 'px';
        account_menu.classList.add('active');
    }
})

window.addEventListener('click', (e) => {
    /**
     * 处理点击事件
     **/
    menu.classList.remove('active');  //清除页面中所有存在的右击菜单
    account_menu.classList.remove('active');
    post_menu.classList.remove('active');
    let element = e.target;  //鼠标右击对象区域
    let flag = false;  //是否有特殊区域是否被找到
    let type = 'normal';  //触发区域类型
    do {  //通过向上循环查找来得到鼠标右击区域范围
        if (element.classList.contains('postCard')) {
            flag = true;
            type = 'postCard';
            break;
        } else if (element.classList.contains('user-info')) {
            flag = true;
            type = 'user-info';
            break;
        }else if (element.classList.contains('ql-fold')) {
            flag = true;
            type = 'ql-fold';
            break;
        } else {
            element = element.parentElement;
        }
    } while (flag || element !== null)
    switch (type) {
        case "normal":
            break;
        case "postCard":
            let post_id = element.getAttribute('articleId');
            showArticle(post_id);
            break;
        case "user-info":
            if(app_config.demo_mode){
                mdui.alert("体验模式下无法使用该功能！", "功能受限", () => {}, {confirmText: "好"});
            }else if(!is_login){
                console.log("not login")
                apiConnect('/api/login').then(() => {})
                setInterval(() => {
                    apiConnect(current_user_api).then((res) => {
                        let user = JSON.parse(res);
                        console.log(user)
                        if (user.isLogin) {
                            load_page('reload')
                        }
                    })
                }, 500)
            }
            break;
        case 'ql-fold':
            $(element).toggleClass('expand');
            break;
        default:
            break;
    }
})

window.addEventListener('load', (e) => {
    apiConnect('/app-api/app_config').then((res) => {
        app_config = JSON.parse(res)
        console.log(`The current app version is ${app_config.version}`)
        switch (app_config.color_mode) {
            case 'auto':
                document.body.classList.add('mdui-theme-layout-auto');
                break;
            case 'dark':
                document.body.classList.add('mdui-theme-layout-dark');
                break;
        }
    })

    apiConnect(current_user_api).then((res) => {
        let user = JSON.parse(res);
        document.getElementsByClassName('user-nickname')[0].innerHTML = user.nickname;
        document.getElementsByClassName('user-uid')[0].innerHTML = 'UID: ' + user.uid;
        document.getElementsByClassName('user-avatar')[0].setAttribute('style', `background-image: url('${user.avatar}');`);
        is_login = user.isLogin;
        if (user.isLogin) {
            document.getElementsByClassName('user-info')[0].setAttribute('login', '')
        }
    }, (rej) => {
        e.preventDefault()
    })
    apiConnect(`/api/forum_list?gid=${game}`).then((res) => {
        let forum = JSON.parse(res);
        let forum_item;
        if (forum.length > 0) {
            for (let i = 0; i < forum.length; i++) {
                if (forum[i].name === '公告' || forum[i].name === '官方') {
                    forum_item = document.querySelector('#official')
                    forum_item.setAttribute('id', `official forum_id-${forum[i].id}`)
                    forum_item.setAttribute('onclick', `load_page('/${game}/forum?forum_id=${forum[i].id}')`);
                    if (getQueryString(page_api, 'type') !== 'feed') {
                        if (forum[i].id.toString() === getQueryString(page_api, 'forum_id')) {
                            forum_item.setAttribute('class', 'forum mdui-ripple selected-forum');
                        } else {
                            forum_item.setAttribute('class', 'forum mdui-ripple');
                        }
                    } else {
                        forum_item.setAttribute('class', 'forum mdui-ripple');
                    }
                } else {
                    forum_item = document.createElement('div');
                    forum_item.setAttribute('onclick', `load_page('/${game}/forum?forum_id=${forum[i].id}')`);
                    forum_item.setAttribute('id', `forum_id-${forum[i].id}`)
                    if (getQueryString(page_api, 'type') !== 'feed') {
                        if (forum[i].id.toString() === getQueryString(page_api, 'forum_id')) {
                            forum_item.setAttribute('class', 'forum mdui-ripple selected-forum');
                        } else {
                            forum_item.setAttribute('class', 'forum mdui-ripple');
                        }
                    } else {
                        forum_item.setAttribute('class', 'forum mdui-ripple');
                    }
                    forum_item.innerHTML = `<span>${forum[i].name}</span>`;
                    forum_element.append(forum_item);
                }
            }
        }
    }, (rej) => {
        e.preventDefault();
    });
    apiConnect(game_api).then((res) => {
        let game = JSON.parse(res);
        if (game.length > 0) {
            for (let i = 0; i < game.length; i++) {
                game_element.innerHTML += `<div class="submenu__item" onclick="load_page('/${game[i][3]}')">${game[i][0]}</div>`
            }
        }
    }, (rej) => {
        e.preventDefault()
    })
    if (getQueryString(page_api, 'type') === 'feed') {
        document.querySelector('#recommend').classList.add('selected-forum');
    }
    document.getElementsByClassName('topbar-progress-bar')[0].setAttribute('style', 'visibility: hidden;')
    addArticle();
    setInterval(function () {
        document.getElementsByClassName('loading_outter')[0].classList.add('disabled')
    }, 1500)
})

document.getElementsByClassName("logout")[0].addEventListener('click', () => {
    if(app_config.demo_mode){
        mdui.alert("体验模式下无法使用该功能！", "功能受限", () => {}, {confirmText: "好"});
    }else{
        mdui.confirm(
            "真的要退出登录吗？",
            "提示",
            () => {
                apiConnect("/api/logout").then(() => {
                    load_page('reload')
                })
            },
            () => {},
            {
                confirmText: "确定",
                cancelText: "取消"
            }
        )
    }


})

setInterval(() => {
    let windows = document.getElementsByClassName('article-overlay')
    let detected_window = windows.length;
    if(current_window !== detected_window && current_window < detected_window) {
        console.log('A window had been created!');
        new_detect = true;
    }else if (current_window !== detected_window && current_window > detected_window){
        console.log('A window had been closed!');
        new_detect = false;
    }
    if(new_detect){
        console.log("Trying to add some features for the new window");
        let ql_images = windows[detected_window - 1].getElementsByClassName('ql-editor')[0].getElementsByClassName("ql-image-box");
        if(windows[detected_window - 1].getElementsByClassName('release-time')[0].innerText.length > 0){
            if(ql_images[0] !== undefined){
                for (let i = 0; i < ql_images.length; i++) {
                    new Viewer(ql_images[i]);
                }
            }
            new_detect = false;
            console.log('Added successfully')
        }else{
            console.log("The window is not ready now, waiting it until the page is ready!");
        }


    }
    current_window = detected_window;
}, 500)

// setInterval(() => {
//     let t = new Date().getTime();
//     apiConnect(`/app-api/heartbeat?t=${t}`, false).then((res) => {
//         // console.log(`Time delay: ${parseInt(JSON.parse(res)['t']) - t}ms`)
//     }, (rej) => {
//         mdui.alert('应用内通讯失败！')
//     })
// },500)