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
let game = location.href.split('/')[3].split('#')[0];
let current_window = 0;
let new_detect = false;
let is_login = false;
let app_config;
let locks = {postcard_render: false, comment_render: false}
let game_list;
let just_reload;
window.geetest_activated = false;

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
                    mdui.alert('请检查网络连接或稍后再试!', '无法连接到服务器', ()=>{location.reload();}, {confirmText: "重试"})
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
                mdui.alert('请检查网络连接或稍后再试!', '无法连接到服务器', ()=>{location.reload();}, {confirmText: "重试"})
            }
            reject(new Error('Request failed'));
        };
        xhr.send();
    });
}

function apiConnect_post(url, data, failed_warning=true) {
    /* 连接api的封装 */
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        if((typeof data) === 'object'){
            xhr.setRequestHeader('Content-Type', 'application/json');
            data = JSON.stringify(data)
        }else{
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
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
                    mdui.alert('请检查网络连接或稍后再试!', '无法连接到服务器', ()=>{location.reload();}, {confirmText: "重试"})
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
                mdui.alert('请检查网络连接或稍后再试!', '无法连接到服务器', ()=>{location.reload();}, {confirmText: "重试"})
            }
            reject(new Error('Request failed'));
        };
        xhr.send(data);
    });
}

function load_page(url) {
    /* 将页面跳转到指定的url或执行指定的操作 */
    article_element.innerHTML = ''
    switch (url) {
        case 'reload':
            just_reload = true;
            location.reload();
            break;
        case 'back':
            just_reload = true;
            history.back();
            break;
        case 'home':
            just_reload = true;
            location.href = `/${game}`
            break;
        default:
            just_reload = true;
            location.href = url
            break;
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
                        let postcard = document.createElement('div')
                        postcard.setAttribute('class', 'postCard fix mdui-ripple mdui-hoverable')
                        postcard.setAttribute('articleId', articles[i].post_id)
                        articles[i]['collect'] ? postcard.setAttribute('collected', '') : '';
                        articles[i]['upvote'] ? postcard.setAttribute('upvoted', '') : '';
                        postcard.style.display = 'none';
                        postcard.innerHTML += `
<div class="user" onclick="" style="cursor: pointer">
<img class="avatar" src="${articles[i].authorAvatar}"/>
<div class="userinfo"><div class="nickname">${articles[i].authorName}</div>
<div class="describe">${articles[i].authorDescribe}</div>
</div>
</div>
<div class="articleInfo" onclick="" style="cursor: pointer">
<div class="image">
<div class="articleCover" style="${articles[i].cover === '' ? `background-color: rgba(var(--personal-color), 0.1)` : `background-image: url('${articles[i].cover}')`}"></div>
</div>
<div class="info">
<h3 class="articleTitle">${articles[i].title}</h3>
<div class="articleDescribe">${articles[i].describe}</div>
</div>
</div>`
                        article_element.appendChild(postcard)
                        $(postcard).fadeIn(200)
                    }
                }
            })
        }
        locks.postcard_render = false
    }


}

function like_to(post_id, is_cancel=false, reply_id=""){
    let flag = false;
    apiConnect(`/api/like?post_id=${post_id}&reply_id=${reply_id}&is_cancel=${is_cancel}`).then((res) => {
        if(JSON.parse(res)[0] === 0){
            flag = true
        }
    })
    return flag;
}

function collect_to(post_id, is_cancel=false){
    let flag = false;
    apiConnect(`/api/collect?post_id=${post_id}&is_cancel=${is_cancel}`).then((res) => {
        if(JSON.parse(res)[0] === 0){
            flag = true
        }
    })
    return flag;
}

function showArticle(postId) {
    /**
     * 在原有页面的基础上添加一层遮罩以显示文章内容
     **/
    if(new_detect){
        console.log('Cannot append the new article window because the previous window is not ready or interrupted!')
        return undefined;
    }
    if(window.geetest_activated){
        return undefined;
    }
    let new_overlay = document.createElement('div');
    new_overlay.classList.add('overlay');
    new_overlay.style.display = 'none';
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
                like.setAttribute('post_id', postId);
                let like_btn = document.createElement('button');
                like_btn.classList.add('mdui-btn');
                like_btn.classList.add('mdui-btn-icon');
                like_btn.classList.add('mdui-ripple');
                like_btn.innerHTML = '<i class="mdui-icon material-icons">thumb_up</i>';
                like_btn.addEventListener('click', (e) => {
                    let btn = e.currentTarget;
                    let post_id = btn.parentElement.getAttribute('post_id');
                    let liked = btn.parentElement.hasAttribute('liked')
                    let num = btn.parentElement.getElementsByClassName('num')[0];
                    like_to(post_id, liked);
                    if(liked){
                        btn.style.color = 'unset';
                        btn.parentElement.removeAttribute('liked');
                        num.innerText = parseInt(num.innerText) - 1
                    }else{
                        btn.style.color = 'yellow';
                        btn.parentElement.setAttribute('liked', '');
                        num.innerText = parseInt(num.innerText) + 1
                    }

                })
                if(parseInt(post_raw['data']['post']['self_operation']['attitude']) !== 0){
                    like_btn.style.color = 'yellow';
                    like.setAttribute('liked','')
                }
                like.appendChild(like_btn);
                let like_num = document.createElement('span');
                like_num.classList.add('num')
                like_num.textContent = post_raw['data']['post']['stat']['like_num'];
                like.appendChild(like_num);
                article_actions.appendChild(like)

                let collect = document.createElement('div');
                collect.classList.add('article-collect');
                collect.setAttribute('post_id', postId);
                let collect_btn = document.createElement('button');
                collect_btn.classList.add('mdui-btn');
                collect_btn.classList.add('mdui-btn-icon');
                collect_btn.classList.add('mdui-ripple');
                collect_btn.innerHTML = '<i class="mdui-icon material-icons">star</i>';
                collect_btn.addEventListener('click', (e) => {
                    let btn = e.currentTarget;
                    let post_id = btn.parentElement.getAttribute('post_id');
                    let collected = btn.parentElement.hasAttribute('collected')
                    let num = btn.parentElement.getElementsByClassName('num')[0];
                    collect_to(post_id, collected);
                    if(collected){
                        btn.style.color = 'unset';
                        btn.parentElement.removeAttribute('collected');
                        num.innerText = parseInt(num.innerText) - 1
                    }else{
                        btn.style.color = 'yellow';
                        btn.parentElement.setAttribute('collected', '');
                        num.innerText = parseInt(num.innerText) + 1
                    }
                })
                if(post_raw['data']['post']['self_operation']['is_collected']){
                    collect_btn.style.color = 'yellow';
                    collect.setAttribute('collected', '');
                }
                collect.appendChild(collect_btn);
                let collect_num = document.createElement('span');
                collect_num.textContent = post_raw['data']['post']['stat']['bookmark_num'];
                collect.appendChild(collect_num);
                article_actions.appendChild(collect);

                let reply = document.createElement('div');
                reply.setAttribute('post_id', postId);
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
                                apiConnect_post('/api/validate?method=verify', {
                                    geetest_challenge: result.geetest_challenge,
                                    geetest_validate: result.geetest_validate,
                                    geetest_seccode: result.geetest_seccode,
                                }).then(() => {
                                    renderPage(postId);
                                })
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
            $(e.target).fadeOut(200, () => {
                e.target.remove();
            });
        }
    })
    new_overlay.getElementsByClassName('overlay-window-close-btn')[0].addEventListener('click', function (e) {
        if(window.geetest_activated){
            load_page('reload');
        }else{
           let target_element = e.target;
            do{
                if(target_element.classList.contains('overlay')){
                    $(target_element).fadeOut(200, () => {
                        target_element.remove();
                    });
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
                    $(current_overlay).fadeOut(200, () => {
                        current_overlay.remove();
                    });
                }
            }
        }
    })
    document.body.appendChild(new_overlay)
    $(new_overlay).fadeIn(200);
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
                if((result.is_last || result.comments.length === 0) && article_comment.getElementsByClassName('no-more').length === 0) {
                    let piece_reply = document.createElement('div');
                    piece_reply.classList.add('piece-reply');
                    piece_reply.classList.add('no-more');
                    piece_reply.innerHTML = "<p style='text-align: center;line-height: 2.5;'>没有更多了</p>";
                    piece_reply.style.height = '40px'
                    article_comment.setAttribute("is_last", 'true')
                    article_comment.appendChild(piece_reply);
                }
            })
        }
        locks.comment_render = false;
    }

}

function showCommentDetail(post_id, reply_id, floor_id) {
    // 楼中楼-未完工
    let new_overlay = document.createElement('div');
    new_overlay.style.display = 'none';
    new_overlay.classList.add('overlay');
    new_overlay.addEventListener('click', (e) => {
        if(e.target.classList.contains('overlay')){
            $(e.target).fadeOut(200, () => {
                e.target.remove();
            });
        }
    })
    new_overlay.innerHTML = '<div class="reply-detail-window-outer"><div class="reply-detail-window"><div class="comments-main" style="width: 60%;margin: auto;"></div></div></div>';

    let aim_window = new_overlay.getElementsByClassName("comments-main")[0];
    apiConnect(`/api/root_comment?post_id=${post_id}&reply_id=${reply_id}`).then((res) => {
        let root_comment_obj = JSON.parse(res);
        aim_window.innerHTML = `
<div class="piece-reply root-reply mdui-ripple mdui-hoverable" reply_id="${reply_id}" floor_id="${floor_id}" post_id="${post_id}">
    <div class="reply-user">
        <img class="reply-user-avatar" src="${root_comment_obj.avatar}">
        <div class="reply-user-nickname">${root_comment_obj.username}</div>
    </div>
    <div class="comment-main ql-editor">
        ${root_comment_obj.content}
    </div>
</div>` + aim_window.innerHTML
    })
    apiConnect(`/api/sub_comment?post_id=${post_id}&floor_id=${floor_id}&last_id=0`).then((res) => {
        let sub_comments = document.createElement('div');
        sub_comments.classList.add('sub-comments')
        sub_comments.style.marginTop = '20px'
        let comment_obj = JSON.parse(res);
        sub_comments.innerHTML = '<h3 style="margin: 10px">更多评论</h3>'
        for (const comment of comment_obj.comments) {
            sub_comments.innerHTML += `
<div class="piece-reply sub-reply mdui-ripple mdui-hoverable" reply_id="${comment.reply_id}" post_id="${comment.post_id}">
    <div class="reply-user">
        <img class="reply-user-avatar" src="${comment.avatar}">
        <div class="reply-user-nickname">${comment.username}</div>
    </div>
    <div class="comment-main ql-editor">
        ${comment.content}
    </div>
</div>`
        }

        aim_window.appendChild(sub_comments)
    })

    document.body.appendChild(new_overlay)
    $(new_overlay).fadeIn(200)
}

function showLogin() {
    if(app_config.local_config.demo_mode){
        mdui.alert("体验模式下无法使用该功能！", "功能受限", () => {}, {confirmText: "好"});
    }else{
        let new_overlay = document.createElement('div');
        new_overlay.classList.add('overlay');
        new_overlay.style.display = 'none';
        new_overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('overlay')) {
                $(e.target).fadeOut(200, () => {
                    e.target.remove();
                });
            }
        })
        new_overlay.innerHTML = '<div class="setting-window-outer" style="width: 650px;height: 450px;margin-top: 10%"><div class="setting-window"></div></div>'
        new_overlay.getElementsByClassName("setting-window")[0].innerHTML = `<div class="mdui-tab mdui-tab-centered" mdui-tab><a id="sms-login" class="mdui-ripple">短信登录</a><a id="pwd-login" class="mdui-ripple">密码登录</a>${!app_config.local_config.using_flask?'<a id="native-login" class="mdui-ripple">通过米哈游通行证登录</a>':''}</div><div class="login-panel"></div>`
        document.body.appendChild(new_overlay);
        $('#pwd-login').on('show.mdui.tab', () => {
            $('.login-panel')[0].innerHTML = `
<div class="mdui-textfield mdui-textfield-floating-label">
    <label class="mdui-textfield-label">手机号/邮箱</label>
    <input class="mdui-textfield-input" id="account" type="text"/>
    <div class="mdui-textfield-error">账号或密码错误</div>
</div>
<div class="mdui-textfield mdui-textfield-floating-label">
    <label class="mdui-textfield-label">密码</label>
    <input class="mdui-textfield-input" id="password" type="password"/>
    <div class="mdui-textfield-error">账号或密码错误</div>
</div>
<button class="mdui-btn mdui-btn-block mdui-color-theme-accent mdui-ripple" id="login-btn" style="margin: auto;">登录</button>`
            $('#login-btn').on('click', () => {
                if($('#account')[0].value.length === 0 || $('#password')[0].value.length === 0){
                    $('#account')[0].parentElement.classList.add('mdui-textfield-invalid')
                    $('#password')[0].parentElement.classList.add('mdui-textfield-invalid')
                    mdui.mutation();
                }else{
                    $('#account')[0].parentElement.classList.remove('mdui-textfield-invalid')
                    $('#password')[0].parentElement.classList.remove('mdui-textfield-invalid')
                    mdui.mutation();
                    apiConnect('/api/login?method=mmt').then((res) => {
                        let mmt_info = JSON.parse(res);
                        let mmt = mmt_info.mmt_key;
                        let account = $('#account')[0].value;
                        let password = $('#password')[0].value;
                        function login_pwd(account, password, mmt_key, gt_info = null) {
                            apiConnect_post('/api/login?method=pwd',{
                                account: account,
                                password: password,
                                mmt: mmt_key,
                                geetest: gt_info===null?{
                                    version: 'none'
                                }:gt_info
                            }).then((res) => {
                                if(!JSON.parse(res)['resp']){
                                    $('#password')[0].parentElement.classList.add('mdui-textfield-invalid')
                                    mdui.mutation();
                                }else{
                                    $($('.setting-window-outer')[0].parentElement).fadeOut(200, () => {
                                        $('.setting-window-outer')[0].parentElement.remove();
                                        load_page('reload');
                                    })
                                }
                            })
                        }
                        if(mmt_info.gt !== undefined && mmt_info.challenge !== undefined){
                            initGeetest({
                                gt: mmt_info.gt,
                                challenge: mmt_info.challenge,
                                new_captcha: true,
                                product: 'bind'
                            }, (captchaObj) => {
                                captchaObj.onReady(() => {
                                    captchaObj.verify();
                                }).onSuccess(() => {
                                    let result = captchaObj.getValidate();
                                    let result_send = {
                                        geetest_challenge: result.geetest_challenge,
                                        geetest_validate: result.geetest_validate,
                                        geetest_seccode: result.geetest_seccode,
                                        version: 'gt3',
                                    }
                                    login_pwd(account, password, mmt, result_send)
                                })
                            })
                        }else{
                            login_pwd(account, password, mmt)
                        }
                    })
                }
            })
            mdui.mutation();
        })
        $('#sms-login').on('show.mdui.tab', () => {
            $('.login-panel')[0].innerHTML = `
<div class="mdui-textfield mdui-textfield-floating-label">
    <label class="mdui-textfield-label">手机号</label>
    <input class="mdui-textfield-input" id="account" type="text" style="width: 70%;float: left;"/>
    <div class="mdui-textfield-error">请输入正确的手机号!</div>
    <button class="mdui-btn mdui-color-theme-accent mdui-ripple" id="sms-btn" style="float: right;" wait-time="60">获取验证码</button>
</div>
<div class="mdui-textfield mdui-textfield-floating-label">
    <label class="mdui-textfield-label">验证码</label>
    <input class="mdui-textfield-input" id="code" type="text"/>
    <div class="mdui-textfield-error">验证码错误！</div>
</div>
<button class="mdui-btn mdui-btn-block mdui-color-theme-accent mdui-ripple" id="login-btn" style="margin: auto;">登录</button>`
            $('#sms-btn').on('click', () => {
                if($('#account')[0].value.length !== 11){
                    $('#account')[0].parentElement.classList.add('mdui-textfield-invalid')
                    mdui.mutation();
                }else{
                    $('#account')[0].parentElement.classList.remove('mdui-textfield-invalid')
                    mdui.mutation();
                    apiConnect('/api/login?method=mmt').then((res) => {
                        let mmt_info = JSON.parse(res);
                        let mmt = mmt_info.mmt_key
                        let account = $('#account')[0].value
                        function sendSms(account, mmt_key, gt_info = null) {
                            apiConnect_post('/api/login?method=sms&type=create',{
                                account: account,
                                mmt: mmt_key,
                                geetest: gt_info===null?{
                                    version: 'none'
                                }:gt_info
                            }).then((res) => {
                                if(!JSON.parse(res)['resp']){
                                    $('#password')[0].parentElement.classList.add('mdui-textfield-invalid')
                                    mdui.mutation();
                                }else{
                                    $('#sms-btn')[0].setAttribute('disabled','')
                                    let code_wait = setInterval(() => {
                                        let btn = $('#sms-btn')[0];
                                        if(btn !== undefined){
                                            let wait_time = parseInt(btn.getAttribute('wait-time'))-1;
                                            btn.setAttribute('wait-time', wait_time)
                                            btn.innerText = `${wait_time}s`
                                        }
                                    }, 1000)
                                    setTimeout((id) => {
                                        clearInterval(id)
                                        let btn = $('#sms-btn')[0];
                                        btn.setAttribute('wait-time', '60')
                                        btn.innerText = '获取验证码'
                                        btn.removeAttribute('disabled')
                                    }, 60000, code_wait)
                                }
                            })
                        }
                        if(mmt_info.gt !== undefined && mmt_info.challenge !== undefined){
                            initGeetest({
                                gt: mmt_info.gt,
                                challenge: mmt_info.challenge,
                                new_captcha: true,
                                product: 'bind'
                            }, (captchaObj) => {
                                captchaObj.onReady(() => {
                                    captchaObj.verify();
                                }).onSuccess(() => {
                                    let result = captchaObj.getValidate();
                                    let result_send = {
                                        geetest_challenge: result.geetest_challenge,
                                        geetest_validate: result.geetest_validate,
                                        geetest_seccode: result.geetest_seccode,
                                        version: 'gt3',
                                    }
                                    sendSms(account, mmt, result_send)
                                })
                            })
                        }else{
                            sendSms(account, mmt)
                        }
                    })
                }
            });
            $('#login-btn').on('click', () => {
                if($('#code')[0].value === ''){
                    $('#code')[0].parentElement.classList.add('mdui-textfield-invalid')
                    mdui.mutation();
                }else {
                    let account = $('#account')[0].value;
                    let code = $('#code')[0].value;
                    apiConnect_post('/api/login?method=sms&type=verify', {
                        account: account,
                        code: code
                    }).then((res) => {
                        if(!JSON.parse(res)['resp']){
                            $('#code')[0].parentElement.classList.add('mdui-textfield-invalid')
                            mdui.mutation();
                        }else{
                            $($('.setting-window-outer')[0].parentElement).fadeOut(200, () => {
                                $('.setting-window-outer')[0].parentElement.remove();
                                load_page('reload');
                            })
                        }
                    })
                }
            })
            mdui.mutation();
        })
        $('#native-login').on('show.mdui.tab', () => {
            if(app_config.local_config.using_flask){
                $('.login-panel')[0].innerHTML = `<p>当前无法通过该方式登录</p>`
            }else{
                $('.login-panel')[0].innerHTML = `<p>点击下方按钮进行登录</p><button class="mdui-btn mdui-btn-block mdui-color-theme-accent mdui-ripple" id="login-btn" style="margin: 20px;">登录</button>`
                $('#login-btn').on('click', () => {
                    apiConnect('/api/login').then(() => {
                        $($('.setting-window-outer')[0].parentElement).fadeOut(200, () => {
                            $('.setting-window-outer')[0].parentElement.remove();
                        })
                    })
                })
            }
        })
        mdui.mutation();
        $(new_overlay).fadeIn(200);
    }
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

let old_value = -1;
right_element.addEventListener('scroll', () => {
    /**
     * 处理右侧面板的滚动事件（元素滚动到底时向页面添加更多文章卡片）
     **/
    if(Math.round(right_element.scrollTop + right_element.clientHeight - right_element.scrollHeight) >= 0){
        old_value = Math.round(right_element.scrollTop + right_element.clientHeight - right_element.scrollHeight);
    }
})

$('.setting-btn')[0].addEventListener('click', () => {
    if(app_config.local_config.demo_mode){
        mdui.alert("体验模式下无法使用该功能！", "功能受限", () => {}, {confirmText: "好"});
    }else {
        let new_overlay = document.createElement('div');
        new_overlay.classList.add('overlay');
        new_overlay.style.display = 'none';
        new_overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('overlay')) {
                $(e.target).fadeOut(200, () => {
                    e.target.remove();
                });
            }
        })
        new_overlay.innerHTML = '<div class="setting-window-outer"><div class="setting-window"></div></div>'
        apiConnect('/app-api/get_settings').then((res) => {
            let settings = JSON.parse(res);
            let setting_items = document.createElement('div');
            let aim_window = new_overlay.getElementsByClassName('setting-window')[0];
            setting_items.classList.add('setting-items');
            for (const key in settings.pairs) {
                let value_types = settings.pairs[key];
                let setting_state = settings.config[key];
                if (!value_types.is_disabled || settings.config.enable_debug) {
                    let setting_item = document.createElement('div');
                    setting_item.classList.add('setting-item');
                    // setting_item.classList.add('mdui-list-item');
                    setting_item.id = `setting-item-${key}`
                    setting_item.innerHTML += `<div class="setting-display-string"><span style="${value_types.is_disabled ? 'color: red;' : ''}">${value_types.display_string}</span></div>`;
                    let setting_choice = document.createElement('div')
                    setting_choice.classList.add('setting-choice')
                    switch (value_types.type) {
                        case 'boolean':
                            setting_choice.innerHTML += `<label class="mdui-switch"><input class="user-choose-${key}" type="checkbox" ${setting_state ? 'checked' : ''}/><i class="mdui-switch-icon"></i></label>`
                            break;
                        case 'list':
                            let select_item = document.createElement('select');
                            select_item.classList.add('mdui-select')
                            select_item.classList.add(`user-choose-${key}`)
                            select_item.setAttribute('mdui-select', '')
                            switch (value_types.values_form) {
                                case '#!from_remote*game_api!#':
                                    if (game_list.length > 0) {
                                        for (let i = 0; i < game_list.length; i++) {
                                            select_item.innerHTML += `<option value="${game_list[i][3]}" ${setting_state === game_list[i][3] ? 'selected' : ''}>${game_list[i][0]}</option>`
                                        }
                                    }
                                    break;
                                case '#!from_default_set!#':
                                    for (const value in value_types.default_set) {
                                        let name = value_types.default_set[value];
                                        select_item.innerHTML += `<option value="${value}" ${setting_state === value ? 'selected' : ''}>${name}</option>`
                                    }
                                    break;
                            }
                            setting_choice.appendChild(select_item)
                            break;
                        case 'number':
                            setting_choice.innerHTML += `<div class="mdui-textfield"><input class="mdui-textfield-input user-choose-${key}" type="number" value="${setting_state}"/></div>`
                            break;
                        default:
                            setting_choice.innerHTML += `<div class="mdui-textfield"><input class="mdui-textfield-input user-choose-${key}" type="text" value="${setting_state}"/></div>`
                            break;

                    }
                    setting_item.appendChild(setting_choice)
                    setting_items.appendChild(setting_item)
                }
            }
            aim_window.appendChild(setting_items)

            let submit_btn = document.createElement('button')
            submit_btn.classList.add("mdui-btn")
            submit_btn.classList.add('mdui-ripple')
            submit_btn.classList.add('submit-btn')
            submit_btn.innerText = '保存设置'
            submit_btn.addEventListener('click', () => {
                apiConnect('/app-api/get_settings').then((res) => {
                    let changed = false;
                    let settings = JSON.parse(res);
                    for (const key in settings.pairs) {
                        let value_types = settings.pairs[key];
                        let setting_state = settings.config[key];
                        if (!value_types.is_disabled || settings.config.enable_debug) {
                            let set = $(`.user-choose-${key}`)[0]
                            let value = set.value
                            if (set.getAttribute('type') === 'checkbox') {
                                value = set.checked
                            }
                            if (value != setting_state) {
                                if (settings.config.enable_debug && value_types.is_disabled) {
                                    mdui.confirm(`修改 ${value_types.display_string} 可能会导致程序出现异常，要继续吗？`, '警告', () => {
                                            changed = true
                                            apiConnect(`/app-api/setting?key=${key}&value=${value}`);
                                            load_page('reload');
                                        }, () => {
                                        },
                                        {
                                            confirmText: "<span style='color: red'>继续</span>",
                                            cancelText: "关闭"
                                        })
                                } else {
                                    changed = true
                                    apiConnect(`/app-api/setting?key=${key}&value=${value}`)
                                }

                            }
                        }
                    }
                    if (changed) {
                        mdui.snackbar({
                            message: '部分设置可能需要重启应用后生效',
                            position: 'right-top',
                            timeout: 5000
                        });
                        setTimeout(() => {
                            load_page('reload');
                        }, 5000)
                    }
                })
            })
            aim_window.appendChild(submit_btn)

            if(app_config.local_config.using_flask){
                let close_btn = document.createElement('button')
                close_btn.classList.add("mdui-btn")
                close_btn.classList.add('mdui-ripple')
                close_btn.classList.add('submit-btn')
                close_btn.innerText = '停止后端服务'
                close_btn.addEventListener('click', () => {
                    mdui.confirm('是否停止后端服务?', '提示', () => {
                        apiConnect('/app-api/quit').then(() => {});
                        window.close();
                    }, () => {}, {
                        cancelText: '否',
                        confirmText: '是'
                    })
                })
                aim_window.appendChild(close_btn)
            }


            let about_btn = document.createElement('button')
            about_btn.classList.add("mdui-btn")
            about_btn.classList.add('mdui-ripple')
            about_btn.classList.add('submit-btn')
            about_btn.innerText = '关于'
            about_btn.addEventListener('click', () => {
                mdui.alert(`<p style="font-size: 12px; ">版本：${app_config.version}</p><p style="font-size: 12px; ">提交：${app_config.git_commit}</p><p style="font-size: 12px; ">Python版本：${app_config.python_version}</p><br/><p>本软件使用GNU General Public License v3.0协议进行开源，其源代码可在 https://github.com/Error063/ReHomoLab 查阅，使用时请遵守该协议。</p>`, '关于 Re: HoMoLab', () => {
                }, {confirmText: "好"})
            })
            aim_window.appendChild(about_btn)
            mdui.mutation();
        })

        document.body.appendChild(new_overlay);
        $(new_overlay).fadeIn(200);
    }
})

$('#forum-info')[0].addEventListener('click', () => {
    if(app_config.local_config.demo_mode){
        mdui.alert("体验模式下无法使用该功能！", "功能受限", () => {}, {confirmText: "好"});
    }else {
        let new_overlay = document.createElement('div');
        new_overlay.classList.add('overlay');
        new_overlay.style.display = 'none'
        new_overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('overlay')) {
                $('.forum-select-outer').animate({
                    left: '-=300px'
                }, 200, 'swing', () => {
                    $(e.target).fadeOut(100, () => {
                        e.target.remove();
                    });
                })

            }
        })
        let forum_select_outer = document.createElement('div')
        forum_select_outer.classList.add('forum-select-outer')
        let forum_select = document.createElement('div')
        forum_select.classList.add('forum-select')
        forum_select_outer.appendChild(forum_select)
        new_overlay.appendChild(forum_select_outer)

        for(let item of game_list){
            forum_select.innerHTML += `<div id="forum-info" onclick="load_page('/${item[3]}')" style="margin: 10px;">
                <div id="forum-logo" style="background-image: url('https://upload-bbs.mihoyo.com/game/${item[3]}/app_icon.png');"></div>
                <div id="forum-name">${item[0]}</div>
            </div>`
        }

        document.body.appendChild(new_overlay);
        $(new_overlay).fadeIn(100, () => {
            $('.forum-select-outer').animate({
                left: '+=300px'
            }, 200, 'swing')
        });
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
        // if (x > (winWidth - menuWidth - submenu.offsetWidth)) {  //处理子菜单x轴溢出
        //     submenu.style.left = `-${submenu.offsetWidth}px`;
        // } else {
        //     submenu.style.left = '';
        //     submenu.style.right = `-${submenu.offsetWidth}px`;
        // }
        // if (y > (winHeight - menuHeight - submenu.offsetHeight)) {  //处理子菜单y轴溢出
        //     submenu.style.top = `-${submenu.offsetHeight - 15}px`;
        //     // submenu.style.top = `-${-winHeight + submenu.offsetHeight}px`;
        // } else {
        //     submenu.style.top = '-35px';
        // }
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
            if(!element.hasAttribute('login')) {
                showLogin();
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
        switch (app_config.local_config.color_mode) {
            case 'auto':
                document.body.classList.add('mdui-theme-layout-auto');
                break;
            case 'dark':
                document.body.classList.add('mdui-theme-layout-dark');
                break;
        }
        if(app_config.first_open && app_config.local_config.using_flask){
            // mdui.alert('The app are running at Flask mode, some of the features are not able in this mode. Before you exit app, you should close it in setting frame or stop the backbone service.', 'Warning', () => {}, {confirmText: 'OK'})
            mdui.alert('应用当前使用浏览器呈现，在该模式下一些功能无法正常使用。当你想要完全地关闭应用时，请在设置界面中关闭该应用或杀死本程序的后台服务。', '提示', () => {}, {confirmText: '好'})
        }
    })

    apiConnect('/app-api/connection_test', false).then((res) =>{
        if(res === 'false'){
            mdui.alert('请检查网络连接或稍后再试!', '无法连接到服务器', ()=>{location.reload();}, {confirmText: "重试"})
            e.preventDefault();
        }
    }, (rej) => {
        mdui.alert('请检查网络连接或稍后再试!', '无法连接到服务器', ()=>{location.reload();}, {confirmText: "重试"})
        e.preventDefault();
    })

    apiConnect(current_user_api).then((res) => {
        let user = JSON.parse(res);
        document.getElementsByClassName('user-nickname')[0].innerHTML = user.nickname.length > 10?user.nickname.substring(0, 10) + '...':user.nickname;
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
        game_list = JSON.parse(res);
        // game_list = game_raw;
        if (game_list.length > 0) {
            for (let i = 0; i < game_list.length; i++) {
                if(game_list[i][3] === game){
                    $('#forum-logo')[0].setAttribute('style', `background-image: url('https://upload-bbs.mihoyo.com/game/${game}/app_icon.png');`)
                    $('#forum-name')[0].innerText = game_list[i][0]
                    break;
                }
                // game_element.innerHTML += `<div class="submenu__item" onclick="load_page('/${game_list[i][3]}')">${game_list[i][0]}</div>`
            }
        }
    }, (rej) => {
        e.preventDefault()
    })
    if (getQueryString(page_api, 'type') === 'feed') {
        document.querySelector('#recommend').classList.add('selected-forum');
    }
    addArticle();
    setInterval(function () {
        document.getElementsByClassName('loading_outter')[0].classList.add('disabled')
    }, 1500)
})

window.addEventListener("beforeunload", (event) => {
    if((!just_reload) && app_config.local_config.using_flask){
        event.preventDefault();
        event.returnValue = "";
        mdui.confirm('是否停止后端服务?', '提示', () => {
            apiConnect('/app-api/quit').then((res)=>{
                window.close()
            },(rej)=>{
                window.close()
            });
        }, () => {
            window.close()
        })
    }else{
        just_reload = false;
    }
});


$(".logout")[0].addEventListener('click', () => {
    if(app_config.local_config.demo_mode){
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

$('.account-manage')[0].addEventListener('click', () => {
    apiConnect('/api/account?method=exist_list').then((res) => {
        let existAccount = JSON.parse(res);
        let selection = document.createElement('select');
        selection.classList.add('mdui-select');
        selection.id = 'account-select';
        selection.setAttribute('mdui-select', "{position: 'bottom'}");
        for (const uid in existAccount) {
            selection.innerHTML += `<option value="${uid}" ${existAccount[uid].is_current?'selected':''}>${existAccount[uid].nickname} (${uid})</option>`
        }
        mdui.dialog({
            title: '账号管理',
            content: `<div style="height: 300px;"><p>选择一个账号以进行操作</p><p>${selection.outerHTML}</p></div>`,
            buttons: [
                {
                    text: '添加',
                    onClick: () => {
                        showLogin();
                    }
                },
                {
                    text: '移除',
                    onClick: () => {
                        let uid = $('#account-select')[0].value;
                        mdui.confirm(`确认移除 ${uid} 吗？`, '提示', () => {
                            apiConnect(`/api/account?method=remove&uid=${uid}`).then(() => {
                                load_page('reload')
                            })
                        }, () => {}, {
                            confirmText: "确认",
                            cancelText: "取消",
                        })
                    }
                },
                {
                    text: '切换',
                    onClick: () => {
                        let uid = $('#account-select')[0].value;
                        apiConnect(`/api/account?method=set&uid=${uid}`).then(() => {
                            load_page('reload')
                        })
                    }
                },
            ],
            onOpen: () => {
                mdui.mutation();
                $('.mdui-dialog-actions .mdui-btn')[0].style.float = 'left';
            }
        })
    })
})

setInterval(() => {
    let windows = $('.article-overlay')
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

setInterval(() => {
    apiConnect('/app-api/connection_test', false).then((res) =>{
        if(res === 'false'){
            mdui.alert('请检查网络连接或稍后再试!', '无法连接到服务器', ()=>{location.reload();}, {confirmText: "重试"})
        }
    }, (rej) => {
        mdui.alert('请检查网络连接或稍后再试!', '无法连接到服务器', ()=>{location.reload();}, {confirmText: "重试"})
    })
}, 30000)