import BALL from './ball.js';
import * as win from './win.js';
import * as storage from './storage.js';

const alert1 = document.getElementById('alert1');
const clear1 = document.getElementById('clear1');
const btn1 = document.getElementById('btn1');
btn1.onclick = function () { };
clear1.onclick = function () { storage.clear() };

let camera, renderer, scene;
let key, balls = [];

// 进入页面后延迟200ms，延迟初始化
setTimeout(() => init(), 500);

// 初始化
function init() {
    ({ camera, renderer, scene } = win.init()); // 创建three摄像机、场景、渲染器
    key = storage.init(); // 生成当前窗口key值，并且存入storage

    initBalls(); // 初始化渲染球体
    animate(); // 开始动画渲染

    // 监听其它窗口storage变化事件
    // 如果窗口数量变化，则需要重新实例化球体数据
    // 如果数量没有变化，则需要更新所有球体对应窗口坐标
    window.addEventListener("storage", function (event) {
        if (event.key == "demo") {
            let wins = JSON.parse(event.newValue);
            if (JSON.parse(event.oldValue).length != JSON.parse(event.newValue).length) {

                balls.forEach(({ ball, key }) => {
                    ball.remove();
                })
                initBalls();
            }
            else {
                balls.forEach(item => {
                    item.win = wins.find(w => w.key == item.key);
                });
            }
        }
    });
    // 监听页面unload事件，从storage删除对应数据
    window.addEventListener("unload", function () {
        storage.remove(key);
    });
    // 监听页面resize事件，更新摄像机比例和渲染器size
    window.addEventListener('resize', function () {
        win.resize(camera, renderer);
    });
}

// 初始化渲染球体，并且把多球体数据存入全局变量balls中
function initBalls() {
    balls = [];
    const wins = storage.getAll();
    wins.forEach(win => {
        const ball = new BALL(camera, renderer, scene, { x: 0, y: 0 }, win.key);
        const keys = wins.filter(item => item.key != win.key).map(item => item.key);
        ball.init(keys);
        /* 
        ball 球体three对象
        key 球体唯一key
        win 球体窗口坐标
        */
        balls.push({ ball, key: win.key, win });
    })
}

// 开始动画渲染
function animate() {
    requestAnimationFrame(animate);

    const { screenX, screenY } = window;
    const currentWin = storage.get(key);
    // 判断当前窗口坐标是否有变化（即窗口是否移动），若有变化，则更新storage及ball数据
    if (currentWin.screenX != screenX || currentWin.screenY != screenY) {
        const value = { key, screenX, screenY };
        storage.set(key, value);
        balls.find(item => item.key == key).win = value;
    }

    // 循环所有球体数据，并在当前窗口渲染出来所有球体动画
    balls.forEach(({ ball, key: k, win }) => {
        const offset = {
            x: (win.screenX - screenX),
            y: -(win.screenY - screenY),
        };
        const movePs = [];
        // 过滤并遍历其它球体数据，用于渲染球体之间的连线动画
        balls.filter(item => item.key != k).forEach(({ ball: ball2, key: k2, win: win2 }) => {
            const moveP = {
                x: (win2.screenX - win.screenX),
                y: -(win2.screenY - win.screenY),
            };
            movePs.push({ key: k2, moveP });
        });

        // 渲染球体及其连线
        ball.render(offset, movePs);
    })

    // log();
}

// 打log，把数据json序列化显示在dom中
function log() {
    const { screenX, screenY, innerWidth, innerHeight } = window;
    alert1.textContent = JSON.stringify({
        key,
        screenX, screenY, innerWidth, innerHeight,
        storage: storage.getAll(),
    }, null, 2);
}