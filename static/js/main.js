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
let post = null;
let temp = '';
let page = 1;
let last_scroll_size = 0;
let bottomNotice = true;
let game = location.href.split('/').slice(3)[0];
let gid;
let game_current
// let network_failed = false;

document.querySelector('#forum-logo').setAttribute('style', `background-image: url('https://upload-bbs.mihoyo.com/game/${game}/app_icon.png');`)

document.querySelector('#recommend').setAttribute('onclick', `load_page('/${game}')`)

if (location.href.split('/').length <= 4){
    page_api = `/api/homepage?type=feed&gid=${game}`
}else{
    page_api = `/api/homepage?type=forum&forum_id=${getQueryString(current_url, 'forum_id')}&gid=${game}`
}

// try {
//     page_api = `/api/homepage?type=forum&forum_id=${getQueryString(current_url, 'forum_id')}&gid=${game_current[1]}`
// } catch (e) {
//     page_api = '/api/homepage?type=feed'
// }
forum_api = `/api/forum_list?gid=${game}`

let xhr_game_current = new XMLHttpRequest();
xhr_game_current.open('get', `${game_api}?game=${game}`);
xhr_game_current.onreadystatechange = function () {
    if (xhr_game_current.readyState === 4 && xhr_game_current.status === 200) {
        network_failed = false
        game_current = JSON.parse(xhr_game_current.responseText);
        gid = game_current[1]
    } else if (xhr_game_current.status === 503 && !network_failed) {
        network_failed = true
    }
}
xhr_game_current.send()

function load_page(url) {
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
    let vars = url_string.split('?')[1].split("&");
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split("=");
        if (pair[0] === name) {
            return pair[1];
        }
    }
    return '';
}

// function setActiveForum() {
//     let page_type = getQueryString(page_api, 'type');
//     if (page_type === 'feed') {
//         document.querySelector('#recommend').classList.add('selected-forum');
//     }else{
//         getQueryString(current_url, 'forum_id')
//         document.querySelector(`#forum_id-${getQueryString(current_url, 'forum_id')}`).classList.add('selected-forum');
//     }
//     // console.log(getQueryString(c, 'forum_id'))
// }


function addArticle() {
    let xhr_articles = new XMLHttpRequest();
    xhr_articles.open('get', page_api + `&page=${page}`)
    xhr_articles.onreadystatechange = function () {
        if (xhr_articles.readyState === 4 && xhr_articles.status === 200) {
            network_failed = false
            let articles = JSON.parse(xhr_articles.responseText);
            if (articles.length > 0 && bottomNotice) {
                page++;
                for (let i = 0; i < articles.length; i++) {
                    article_element.innerHTML += `<div class="postCard fix mdui-ripple mdui-hoverable" articleId="${articles[i].post_id}" ${articles[i]['collect'] ? 'collected' : ''} ${articles[i]['upvote'] ? 'upvoted' : ''}><div class="user" onclick="" style="cursor: pointer"><img class="avatar" src="${articles[i].authorAvatar}"/><div class="userinfo"><div class="nickname">${articles[i].authorName}</div><div class="describe">${articles[i].authorDescribe}</div></div></div><div class="articleInfo" onclick="" style="cursor: pointer"><div class="image"><div class="articleCover" style="${articles[i].cover === '' ? `background-color: rgba(var(--personal-color), 0.1)` : `background-image: url('${articles[i].cover}')`}"></div></div><div class="info"><h3 class="articleTitle">${articles[i].title}</h3><div class="articleDescribe">${articles[i].describe}</div></div></div></div>`
                }
            }
        } else if (xhr_articles.status === 503 && !network_failed) {
            network_failed = true
            mdui.snackbar({
                message: '<span style="color: red;font-weight: bold;font-size: 20px">网络连接失败！</span>',
                position: 'right-top',
                timeout: 0
            });
        }
    }
    xhr_articles.send();
}

function handleScroll() {
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
    e.preventDefault();
    menu.classList.remove('active');
    account_menu.classList.remove('active');
    post_menu.classList.remove('active');
    let element = e.target;
    let flag = false;
    let type = 'normal';
    do {
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
    if (!flag) {
        let x = e.clientX;
        let y = e.clientY;
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let menuWidth = menu.offsetWidth;
        let menuHeight = menu.offsetHeight;
        x = winWidth - menuWidth >= x ? x : winWidth - menuWidth;
        y = winHeight - menuHeight >= y ? y : winHeight - menuHeight;
        menu.style.top = y + 'px';
        menu.style.left = x + 'px';
        if (x > (winWidth - menuWidth - submenu.offsetWidth)) {
            submenu.style.left = `-${submenu.offsetWidth + 20}px`;
        } else {
            submenu.style.left = '';
            submenu.style.right = `-${submenu.offsetWidth + 10}px`;
        }
        if (y > (winHeight - menuHeight - submenu.offsetHeight)) {
            submenu.style.top = `-${submenu.offsetHeight - 15}px`;
        } else {
            submenu.style.top = '-35px';
        }
        menu.classList.add('active');
    } else if (type === 'postCard') {
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
        document.querySelector('#copy').addEventListener('click', function () {
            copy(`https://www.miyoushe.com/${game}/article/${post_id}`);
        })
        let x = e.clientX;
        let y = e.clientY;
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let menuWidth = post_menu.offsetWidth;
        let menuHeight = post_menu.offsetHeight;
        x = winWidth - menuWidth >= x ? x : winWidth - menuWidth;
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
        x = winWidth - menuWidth >= x ? x : winWidth - menuWidth;
        y = winHeight - menuHeight >= y ? y : winHeight - menuHeight;
        account_menu.style.top = y + 'px';
        account_menu.style.left = x + 'px';
        account_menu.classList.add('active');
    }
}

function showArticle(postId) {
    overlay_window.innerHTML = ''
    overlay_window.innerHTML = `<div class="test-height">${postId}</div>`
    document.getElementsByClassName('overlay')[0].classList.remove('disabled')
}

window.addEventListener('click', function (e) {
    menu.classList.remove('active');
    account_menu.classList.remove('active');
    post_menu.classList.remove('active');
    let element = e.target;
    let flag = false;
    let type = 'normal';
    do {
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
        default:
            break;
    }
})
document.getElementsByClassName('overlay-window-close-btn')[0].addEventListener('click', function () {
    document.getElementsByClassName('overlay')[0].classList.add('disabled')
})

window.onload = function (e) {
    let xhr_user = new XMLHttpRequest();
    xhr_user.open("get", current_user_api);
    xhr_user.onreadystatechange = function () {
        if (xhr_user.readyState === 4 && xhr_user.status === 200) {
            network_failed = false
            let user = JSON.parse(xhr_user.responseText);
            document.getElementsByClassName('user-nickname')[0].innerHTML = user.nickname;
            document.getElementsByClassName('user-uid')[0].innerHTML = 'UID: ' + user.uid;
            document.getElementsByClassName('user-avatar')[0].setAttribute('style', `background-image: url('${user.avatar}');`);
            if (user.isLogin) {
                document.getElementsByClassName('user-info')[0].setAttribute('login', '')
            }
        } else if (xhr_user.status === 503 && !network_failed) {
            network_failed = true
            e.preventDefault()
        }
    }
    xhr_user.send()
    let xhr_forum = new XMLHttpRequest();
    let forum_item;
    // console.log(document.game_current[1])
    xhr_forum.open("get", `/api/forum_list?gid=${game}`);
    xhr_forum.onreadystatechange = function () {
        if (xhr_forum.readyState === 4 && xhr_forum.status === 200) {
            network_failed = false
            console.log(xhr_forum.responseText)
            let forum = JSON.parse(xhr_forum.responseText);
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
        } else if (xhr_forum.status === 503 && !network_failed) {
            network_failed = true
            e.preventDefault()
        }
    }
    xhr_forum.send();
    let xhr_game = new XMLHttpRequest();
    xhr_game.open('get', game_api);
    xhr_game.onreadystatechange = function () {
        if (xhr_game.readyState === 4 && xhr_game.status === 200) {
            network_failed = false
            let game = JSON.parse(xhr_game.responseText);
            if (game.length > 0) {
                for (let i = 0; i < game.length; i++) {
                    game_element.innerHTML += `<div class="submenu__item" onclick="load_page('/${game[i][3]}')">${game[i][0]}</div>`
                }
            }
        } else if (xhr_game.status === 503 && !network_failed) {
            network_failed = true
            e.preventDefault();
        }
    }
    xhr_game.send()
    if (getQueryString(page_api, 'type') === 'feed') {
        document.querySelector('#recommend').classList.add('selected-forum');
    }
    document.getElementsByClassName('topbar-progress-bar')[0].setAttribute('style', 'visibility: hidden;')
    // setActiveForum()
    addArticle();
    setInterval(function () {
        document.getElementsByClassName('loading_outter')[0].classList.add('disabled')
    }, 1000)
}