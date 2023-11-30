import * as THREE from './three/three.module.js';

// const OUTER_RADIUS = 150, INNER_RADIUS = 80; // 大小球体的半径
// const OUTER_SPRITE_WIDTH = 50, INNER_RSPRITE_WIDTH = 20; // 大小球体上的粒子高宽
// const OUTER_SPRITE_COUNT = 100, INNER_RSPRITE_COUNT = 50, MOVE_SPRITE_COUNT = 10; // 大小球体、及连线上的粒子个数
// const MOVE_FRAME_NUM = 100; // 连线动画的粒子移动的帧数，数越小移动速度越快
// const MOVE_FRAME_GAP = 10; // 连线动画的粒子先后移动的帧数间隔，数值越小越密集
// const COLORS = [0, 60 / 360, 120 / 360, 180 / 360, 240 / 360]; // 粒子颜色数组，一个球体对应一个颜色

// v2.1版小粒子效果

const OUTER_RADIUS = 150, INNER_RADIUS = 80; // 大小球体的半径
const OUTER_SPRITE_WIDTH = 10, INNER_RSPRITE_WIDTH = 5; // 大小球体上的粒子高宽
const OUTER_SPRITE_COUNT = 300, INNER_RSPRITE_COUNT = 50, MOVE_SPRITE_COUNT = 200; // 大小球体、及连线上的粒子个数
const MOVE_FRAME_NUM = 100; // 连线动画的粒子移动的帧数
const MOVE_FRAME_GAP = 2; // 连线动画的粒子先后移动的帧数间隔，数值越小越密集
const COLORS = [0, 60 / 360, 120 / 360, 180 / 360, 240 / 360]; // 粒子颜色数组，一个球体对应一个颜色


// 创建粒子材质
const materialTemp = (function () {
    // 创建纹理贴图
    const textureLoader = new THREE.TextureLoader();
    const map = textureLoader.load('images/sprite.png');
    map.colorSpace = THREE.SRGBColorSpace;
    // 精灵材质
    return new THREE.SpriteMaterial({ map: map, color: 0xffffff, fog: true });
})();

// 字体类，一个球体对应一个对象
export default class BALL {

    camera;
    renderer;
    scene;
    key;
    group1;
    group2;
    offset;
    movePList = [];
    moving = false;
    destroyed = false;

    constructor(camera, renderer, scene, offset, key) {
        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;
        this.offset = offset;
        this.key = key;
    }

    // 实例化，渲染两个球体Group（一大一小）和连线粒子list
    init(keys) {
        this.group1 = new THREE.Group();
        this.group2 = new THREE.Group();
        for (let i = 0; i < OUTER_SPRITE_COUNT; i++) {
            const sprite = this.createSprite();
            this.group1.add(sprite);
        }
        for (let i = 0; i < INNER_RSPRITE_COUNT; i++) {
            const sprite = this.createSprite(keys, i);
            this.group2.add(sprite);
            this.group2.visible = keys.length > 0;
        }
        this.scene.add(this.group1);
        this.scene.add(this.group2);

        this.movePList = [];
        // 除了自身，有几个其它球体，就实例化几组粒子，用来链接球体动画
        keys.forEach(k => {
            const groups = [];
            for (let i = 0; i < MOVE_SPRITE_COUNT; i++) {
                const sprite = this.createSprite();
                const group = new THREE.Group();
                group.visible = false;
                group.add(sprite);
                this.scene.add(group);
                groups.push(group);
            }
            this.movePList.push({ key: k, groups, moving: false, frame: 0, index: 0 })
        });
    }

    // 创建粒子对象
    createSprite(keys, i) {
        const x = Math.random() - 0.5;
        const y = Math.random() - 0.5;
        const z = Math.random() - 0.5;
        const inner = !!keys;
        const radius = !inner ? OUTER_RADIUS : INNER_RADIUS;
        const width = !inner ? OUTER_SPRITE_WIDTH : INNER_RSPRITE_WIDTH;
        let key = this.key;
        if (inner && keys.length > 0) {
            key = keys[i % keys.length]; // 如果除了当前球体，还有其它多个球体，需要将内圆球体粒子显示多种颜色
        }

        // clone材质
        const material = materialTemp.clone();
        // 粒子颜色的对比度随机
        material.color.setHSL(COLORS[(key - 1) % 3], 0.75/* Math.random() */, 0.5);
        material.map.offset.set(- 0.5, - 0.5);
        material.map.repeat.set(2, 2);
        // 创建精灵
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.position.normalize();
        sprite.position.multiplyScalar(radius);
        sprite.scale.set(width, width, 1.0);
        return sprite;
    }

    // 移除当前球体所有相关对象，并置为销毁状态
    remove() {
        this.scene.remove(this.group1);
        this.scene.remove(this.group2);
        this.movePList.forEach(({ groups }) => {
            groups.forEach(group => {
                this.scene.remove(group);
            });
        });
        this.destroyed = true;
    }

    // 渲染动画
    render(offset, movePs) {
        if (this.destroyed) return;
        // 渲染粒子绕球体3d旋转动画
        this.renderRotation();

        // 如果球体不在窗口中心，需要按offset位移坐标
        if (offset) {
            this.offset = offset;
            this.group1.position.x = this.group2.position.x = this.offset.x;
            this.group1.position.y = this.group2.position.y = this.offset.y;
        }

        // 渲染球体之间连线动画
        this.renderMove(movePs);

        this.renderer.render(this.scene, this.camera);
    }

    // 渲染粒子绕球体3d旋转动画
    renderRotation() {
        const time = Date.now() / 1000;
        this.group1.children.forEach(sprite => {
            sprite.material.rotation -= 0.1;
        });
        this.group1.rotation.x = this.group2.rotation.x = time * 0.5;
        this.group1.rotation.y = this.group2.rotation.y = time * 0.75;
        this.group1.rotation.z = this.group2.rotation.z = time * 1.0;

        // this.movePList.forEach(({ groups }) => {
        //     groups.forEach(group => {
        //         group.rotation.x = time * 0.5;
        //         group.rotation.y = time * 0.75;
        //         group.rotation.z = time * 1.0;
        //     });
        // });
    }

    // 渲染球体之间连线动画
    renderMove(movePs) {
        const { group1, movePList } = this;
        // 如果除了当前球体还有别的多个球体，需要遍历其它球体数据，渲染连线动画
        movePs.forEach(({ key, moveP }) => {
            const move = movePList.find(item => item.key == key);

            // 如果两个球体重合了，停止连线动画，隐藏所有粒子
            if (!moveP || (Math.abs(moveP.x) <= OUTER_RADIUS * 2 && Math.abs(moveP.y) <= OUTER_RADIUS * 2)) {
                if (move.moving == true) {
                    move.moving = false;
                    move.frame = 0;
                    move.index = 0;
                    move.groups.forEach(group => {
                        group.visible = false;
                        this.clearGroupPosition(group);
                    });
                }
                return;
            }

            if ((move.p && (moveP.x != move.p.x || moveP.y != move.p.y)) || move.moving == false) {
                move.p = moveP;
                move.groups.forEach(group => {
                    this.clearGroupPosition(group);
                })
                move.moving = true;
                move.frame = 0;
                move.index = 0;
            }

            const moveX = moveP.x + group1.position.x;
            const moveY = moveP.y + group1.position.y;

            move.frame++;
            if (move.frame % MOVE_FRAME_GAP === 0) { // 每10帧开始移动一个粒子，达到粒子先后依次移动射线效果
                move.index++;
            }
            move.groups.forEach((group, i) => {
                group.index ||= 0;
                if (i > move.index) {
                    return;
                }
                const gapX = Math.abs(moveX - group.position.x);
                const gapY = Math.abs(moveY - group.position.y);

                if (group.index == MOVE_FRAME_NUM) { // 粒子移动具体帧数后，重置位置，重新移动
                    group.visible = false;
                    group.index = 0;
                    this.clearGroupPosition(group);
                }
                else if (gapX < 0.5 || gapY < 0.5) { // 粒子移动临近目的位置时，隐藏，等待帧数结束重新移动
                    group.index++;
                    group.visible = false;
                }
                else {
                    group.index++;
                    group.visible = true;
                    group.position.x += moveP.x / MOVE_FRAME_NUM; // 改变粒子坐标，从球1到球2位置
                    group.position.y += moveP.y / MOVE_FRAME_NUM;
                    const radius = OUTER_RADIUS - group.index * (OUTER_RADIUS - INNER_RADIUS / 2) / MOVE_FRAME_NUM;
                    const width = OUTER_SPRITE_WIDTH - group.index * (OUTER_SPRITE_WIDTH - INNER_RSPRITE_WIDTH) / MOVE_FRAME_NUM;
                    group.children[0].position.normalize();
                    group.children[0].position.multiplyScalar(radius); // 改变粒子环绕半径，从大到小
                    group.children[0].scale.set(width, width, 1.0); // 改变粒子高宽，从大到小
                }
            });
        })
    }

    // 重置所有连线粒子状态
    clearGroupPosition(group) {
        const { group1 } = this;
        group.index = 0;
        group.position.x = group1.position.x;
        group.position.y = group1.position.y;
        group.children[0].position.normalize();
        group.children[0].position.multiplyScalar(OUTER_RADIUS);
        group.children[0].scale.set(OUTER_SPRITE_WIDTH, OUTER_SPRITE_WIDTH, 1.0);
    }
}