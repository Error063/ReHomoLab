console.log('===================================================\nRe: HoMoLab   ----   By Error063\n===================================================');

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
let overlay_window = document.getElementsByClassName('overlay-window-main')[0];
let page = 1;
let last_scroll_size = 0;
let bottomNotice = true;
let game = location.href.split('/').slice(3)[0];

document.querySelector('#forum-logo').setAttribute('style', `background-image: url('https://upload-bbs.mihoyo.com/game/${game}/app_icon.png');`)
document.querySelector('#recommend').setAttribute('onclick', `load_page('/${game}')`)

if (location.href.split('/').length <= 4){
    page_api = `/api/homepage?type=feed&gid=${game}`
}else{
    page_api = `/api/homepage?type=forum&forum_id=${getQueryString(current_url, 'forum_id')}&gid=${game}`
}

forum_api = `/api/forum_list?gid=${game}`

function apiConnect(url) {
    /* 连接api的封装 */
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                mdui.snackbar({
                    message: '<span style="color: red;font-weight: bold;font-size: 20px">网络连接失败！</span>',
                    position: 'right-top',
                    timeout: 0
                });
                reject(new Error(`Request failed with status ${xhr.status}`));
            }
        };
        xhr.onerror = () => {
            mdui.snackbar({
                message: '<span style="color: red;font-weight: bold;font-size: 20px">网络连接失败！</span>',
                position: 'right-top',
                timeout: 0
            });
            reject(new Error('Request failed'));
        };
        xhr.send();
    });
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
    apiConnect(page_api + `&page=${page}`).then((res) => {
        let articles = JSON.parse(res);
        if (articles.length > 0 && bottomNotice) {
            page++;
            for (let i = 0; i < articles.length; i++) {
                article_element.innerHTML += `<div class="postCard fix mdui-ripple mdui-hoverable" articleId="${articles[i].post_id}" ${articles[i]['collect'] ? 'collected' : ''} ${articles[i]['upvote'] ? 'upvoted' : ''}><div class="user" onclick="" style="cursor: pointer"><img class="avatar" src="${articles[i].authorAvatar}"/><div class="userinfo"><div class="nickname">${articles[i].authorName}</div><div class="describe">${articles[i].authorDescribe}</div></div></div><div class="articleInfo" onclick="" style="cursor: pointer"><div class="image"><div class="articleCover" style="${articles[i].cover === '' ? `background-color: rgba(var(--personal-color), 0.1)` : `background-image: url('${articles[i].cover}')`}"></div></div><div class="info"><h3 class="articleTitle">${articles[i].title}</h3><div class="articleDescribe">${articles[i].describe}</div></div></div></div>`
            }
        }
    })

}

function handleScroll() {
    /**
     * 处理右侧面板的滚动事件（元素滚动到底时向页面添加更多文章卡片）
     **/
    if (right_element.scrollTop + right_element.clientHeight >= right_element.scrollHeight - 1 && right_element.scrollTop + right_element.clientHeight > last_scroll_size) {
        last_scroll_size = right_element.scrollTop + right_element.clientHeight;
        console.log('active, ' + last_scroll_size)
        document.getElementsByClassName('topbar-progress-bar')[0].setAttribute('style', 'visibility: visible;')
        console.log('adding')
        addArticle();
        document.getElementsByClassName('topbar-progress-bar')[0].setAttribute('style', 'visibility: hidden;')
    }
}

right_element.onscroll = handleScroll;

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

window.oncontextmenu = function (e) {
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
            submenu.style.left = `-${submenu.offsetWidth + 10}px`;
        } else {
            submenu.style.left = '';
            submenu.style.right = `-${submenu.offsetWidth}px`;
        }
        if (y > (winHeight - menuHeight - submenu.offsetHeight)) {  //处理子菜单y轴溢出
            submenu.style.top = `-${submenu.offsetHeight - 5}px`;
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
}

function showArticle(postId) {
    /**
     * 在原有页面的基础上添加一层遮罩以显示文章内容
     **/
    overlay_window.innerHTML = ''
    let article_main = document.createElement('div')
    article_main.classList.add('article-main')
    let title = document.createElement('h1')
    apiConnect(`/api/article?post_id=${postId}&action=raw`).then((res) => {
        let post_raw = JSON.parse(res)
        title.innerText = post_raw['data']['post']['post']['subject']
    })
    article_main.appendChild(title)
    let quill_post = document.createElement('div')
    quill_post.classList.add('ql-editor')
    apiConnect(`/api/article?post_id=${postId}&action=content`).then((res) => {
        try{
            let res_json = JSON.parse(res)
            console.log(res_json)
            let ql_image, ql_image_box, img, para
            for (let i = 0; i < res_json['imgs'].length; i++) {
                ql_image = document.createElement('div')
                ql_image_box = document.createElement('div')
                img = document.createElement('img')
                ql_image.classList.add('ql-image')
                ql_image_box.classList.add('ql-image-box')
                img.src = res_json['imgs'][i]
                ql_image_box.appendChild(img)
                ql_image.appendChild(ql_image_box)
                quill_post.appendChild(ql_image)
                console.log(quill_post)
            }
            para = document.createElement('p')
            para.innerText = res_json.describe
            quill_post.appendChild(para)
        }catch (e) {
            console.log(e)
            quill_post.innerHTML = res
        }finally {
            // quill_post.innerHTML = res
        }
    })
    article_main.appendChild(quill_post)
    overlay_window.appendChild(article_main)
    let article_right = document.createElement('div')
    article_right.classList.add('article-right')
    overlay_window.appendChild(article_right)
    document.getElementsByClassName('overlay')[0].classList.remove('disabled')
}

window.addEventListener('click', function (e) {
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
        } else {
            element = element.parentElement;
        }
    } while (flag || element !== null)
    switch (type) {
        case "postCard":
            let post_id = element.getAttribute('articleId');
            showArticle(post_id);
            break;
        case "user-info":
            break;
        default:
            break;
    }
})
document.getElementsByClassName('overlay-window-close-btn')[0].addEventListener('click', function () {
    document.getElementsByClassName('overlay')[0].classList.add('disabled')
})

window.onload = function (e) {
    apiConnect(current_user_api).then((res) => {
        let user = JSON.parse(res);
        document.getElementsByClassName('user-nickname')[0].innerHTML = user.nickname;
        document.getElementsByClassName('user-uid')[0].innerHTML = 'UID: ' + user.uid;
        document.getElementsByClassName('user-avatar')[0].setAttribute('style', `background-image: url('${user.avatar}');`);
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
        e.preventDefault()
    })
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
}



