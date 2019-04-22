/*  
    Last msg: 19.04.21
    乱写一时爽，出了八阿哥看泥怎么办
    （（不过代码也没几行泥就肉眼杀虫⑧
*/

enchant();

var FPS = 24;
var DISPLAY_X = 600;
var DISPLAY_Y = 900;
var blockCell = 100;
var row = 4;
var col = 6;
var mineNum = 4;

var Game = null;
var Scenes = {};

var pickedChara = null;
var blkList = null;
var map = null;
var operatableMap = null;

var undoColor = '#66CCFF';
var blankColor = '#DFDFDF';
var okPlaceColor = 'FFF9CB';

var Block = enchant.Class.create(enchant.Sprite, {
    initialize: function(){
        enchant.Sprite.call(this, blockCell, blockCell);
        this.backgroundColor = undoColor;
        this.num = null;   
        this.addEventListener(Event.TOUCH_END, function (e) {
            this.change();
        });     
    },
    place: function (x, y){
        this.posX = x;
        this.posY = y;
        this.x = 70+x*(blockCell+20);
        this.y = 70+y*(blockCell+20);
    },
    change: function(){
       if(operatableMap[this.posX][this.posY]){
            if (this.num===0){
                this.backgroundColor = blankColor;


                var checkOK = function (x,y){
                    if (x < row && y < col && x >= 0 && y >= 0)
                        if(blkList[x][y].num===0 && blkList[x][y].backgroundColor !== blankColor)
                            return true;

                    return false;
                }

                //广搜一下把白的都点了
                let queue = [];
                queue.push([this.posX, this.posY]);
                while(queue.length>0){

                    let head = queue.shift();
                    blkList[head[0]][head[1]].backgroundColor = blankColor;

                    if(checkOK(head[0]-1,head[1]))
                        queue.push([head[0]-1,head[1]]);
                    if(checkOK(head[0]-1,head[1]-1))
                        queue.push([head[0]-1,head[1]-1]);
                    if(checkOK(head[0]-1,head[1]+1))
                        queue.push([head[0]-1,head[1]+1]);

                    if(checkOK(head[0]+1,head[1]))
                        queue.push([head[0]+1,head[1]]);
                    if(checkOK(head[0]+1,head[1]-1))
                        queue.push([head[0]+1,head[1]-1]);
                    if(checkOK(head[0]+1,head[1]+1))
                        queue.push([head[0]+1,head[1]+1]);

                    if(checkOK(head[0],head[1]-1))
                        queue.push([head[0],head[1]-1]);
                    if(checkOK(head[0],head[1]+1))
                        queue.push([head[0],head[1]+1]);
                }

            }
            else if (this.num===9){
                // this.image = Game.assets['img/mine.png'];
            }else{
                if (this.num===1)
                    this.backgroundColor = '#FFCEC9';
                else if (this.num===2)
                    this.backgroundColor = '#FFAAA2';
                else
                    this.backgroundColor = '#FF9085';
            }
            
            //移动角色
            pickedChara.place(this.posX,this.posY);
            pickedChara.operatablePlace();
            //判断win or lose
            pickedChara.judge();
       }
    },

});

var mineSweepingMap = function (r, c, num) {
    var map = []

    var blankMap = function (r, col) {
        for (var i = 0; i < r; i++) {
            map[i] = new Array();
        }
        for (var i = 0; i < map.length; i++) {
            for (var j = 0; j < col; j++) {
                map[i][j] = 0
            }
        }
    }

    var writeInMine = function (num) {
        // 随机位置
        var randomLocation = function () {
            var x = Math.floor(Math.random() * r);
            var y = Math.floor(Math.random() * c);
            

            if (map[x][y] !== 9
                 && !((x===0 && y===0) || (x===r-1 && y===c-1))
                 ) {
                map[x][y] = 9;
            } else {
                
                randomLocation();
            }
        }
        for (var i = 0; i < num; i++) {
            randomLocation();
        }
    }

    var plus = function (array, x, y) {
        if (x >= 0 && x < r && y >= 0 && y < c) {
            if (array[x][y] !== 9) {
                array[x][y] ++;
            }
        }
    }
    var writeInHint = function () {
        for (var x = 0; x < map.length; x++) {
            for (var y = 0; y < map[0].length; y++) {
                if (map[x][y] === 9) {
                    for (var i = -1; i < 2; i++) {
                        plus(map, x - 1, y + i)
                        plus(map, x + 1, y + i)
                    }
                    plus(map, x, y + 1)
                    plus(map, x, y - 1)
                }
            }
        }
    }

    blankMap(r, c);
    writeInMine(num);
    writeInHint();
    return map;
}

var Chara = enchant.Class.create(enchant.Sprite, {
    initialize: function(name, img, img1, winImg, loseImg){
        enchant.Sprite.call(this, 100, 100);
        this.image = Game.assets[img]; // set image  
        
        this.name = name;
        this.img = img;
        this.img1 = img1;   
        this.winImg = winImg;
        this.loseImg = loseImg;   
        this.pick = false;
        
        
        this.addEventListener(Event.TOUCH_END, function (e) {
            this.changeChara();
        });
    },
    addPair: function(pair){
        this.pair = pair;
    },
    place: function (x, y){
        this.posX = x;
        this.posY = y;
        this.x = 70+x*(blockCell+20);
        this.y = 70+y*(blockCell+20);
    },
    operatablePlace: function(){ // 正在这里，换角色重置 operatableMap
        //重置map
        for(let i = 0; i<row ; i++){
            operatableMap[i] = new Array();
            for(let j = 0; j<col; j++){
                operatableMap[i][j] = false;
                blkList[i][j].image = Game.assets['img/blank.png']; 
            }
        }

        operatableMap[this.posX][this.posY] = true;
        operatableMap[this.pair.posX][this.pair.posY]= true;

        var check = function (x,y,isLastUndo){
            if (x < row && y < col && x >= 0 && y >= 0){
                if(operatableMap[x][y]==false){
                    if(!isLastUndo)
                        return true;
                }
            }

            return false;
        }

        //可行走区域
        let queue = [];
        queue.push([this.posX, this.posY]);
        while(queue.length>0){

            let head = queue.shift();
            blkList[head[0]][head[1]].image = Game.assets['img/mark.png']; 

            operatableMap[head[0]][head[1]] = true;

            isLastUndo = blkList[head[0]][head[1]].backgroundColor===undoColor;

            if(check(head[0]-1,head[1],isLastUndo))
                queue.push([head[0]-1,head[1]]);
            if(check(head[0]-1,head[1]-1,isLastUndo))
                queue.push([head[0]-1,head[1]-1]);
            if(check(head[0]-1,head[1]+1,isLastUndo))
                queue.push([head[0]-1,head[1]+1]);

            if(check(head[0]+1,head[1],isLastUndo))
                queue.push([head[0]+1,head[1]]);
            if(check(head[0]+1,head[1]-1,isLastUndo))
                queue.push([head[0]+1,head[1]-1]);
            if(check(head[0]+1,head[1]+1,isLastUndo))
                queue.push([head[0]+1,head[1]+1]);

            if(check(head[0],head[1]-1,isLastUndo))
                queue.push([head[0],head[1]-1]);
            if(check(head[0],head[1]+1,isLastUndo))
                queue.push([head[0],head[1]+1]);
        }
    },
    changeChara: function(){
        if(!this.pick){
            this.pick = !this.pick;
            this.image = Game.assets[this.img1];
            pickedChara = this;

        
            if (blkList[this.posX][this.posY].backgroundColor=== undoColor){
                blkList[this.posX][this.posY].change();
                
            }
            this.operatablePlace();   
        }
        
        if (this.pair.pick){
            this.pair.pick = !this.pair.pick;
            this.pair.image = Game.assets[this.pair.img];
        }
        
    },
    judge: function(){
        //lose
        if(blkList[this.posX][this.posY].num===9){

            this.image = Game.assets[this.loseImg];
            this.tl.rotateBy(15,4);this.tl.rotateBy(-15,4);this.tl.rotateBy(-15,4);this.tl.rotateBy(15,4);
            this.tl.rotateBy(15,4);this.tl.rotateBy(-15,4);this.tl.rotateBy(-15,4);this.tl.rotateBy(15,4)
            .then(function(){
                if (this.name==='uzuki')
                    Game.replaceScene(Scenes.loseScene(1));
                else if(this.name==='rin')
                    Game.replaceScene(Scenes.loseScene(2));
            });

        
        }
        //win
        else if(this.posY===this.pair.posY){
            let chara1;
            let chara2;
            let winFlag = false;
            if(this.name=='uzuki'){
                if(this.pair.posX-1 === this.posX){
                    chara1 = this;
                    chara2 = this.pair;
                    winFlag = true;
                    
                }
            }else if(this.name==='rin'){
                if(this.pair.posX+1 === this.posX){
                    chara1 = this.pair;
                    chara2 = this;
                    winFlag = true;
                    
                }
            }

            if(winFlag){
                let t = 6;

                chara1.tl
                .moveBy(0, 0, 10).then(function(){
                    chara2.image = Game.assets[chara2.winImg];
                    chara2.tl.moveBy(0, -25, t);
                    chara2.tl.moveBy(0, 25, t);
                    chara2.tl.moveBy(0, -25, t);
                    chara2.tl.moveBy(0, 25, t)
                    .then(function(){
                        chara1.tl
                        .moveBy(0, 0, 10).then(function(){
                            chara1.image = Game.assets[chara1.winImg];
                            chara1.tl.moveBy(0, -25, t);
                            chara1.tl.moveBy(0, 25, t);
                            chara1.tl.moveBy(0, -25, t);
                            chara1.tl.moveBy(0, 25, t);
                            chara1.tl.moveBy(0, 0, t)
                            .then(function(){
                                Game.replaceScene(Scenes.winScene());
                            });
                        });
   
                    });
                });

            }

        }
    }

});

window.onload = function () {

    Game = new Core(DISPLAY_X, DISPLAY_Y);
    Game.fps = FPS;

    // Game.loadingScene.backgroundColor = '#FFCEC9';

    Game.preload(
        'img/next.png',
        'img/last.png',
        'img/start.png',
        'img/back.png',

        'img/help1.png',
        'img/help2.png',
        'img/help3.png',
        'img/help4.png',

        'img/win.png',
        'img/lose2.png',
        'img/lose1.png',

        'img/restart.png',
        'img/blank.png',
        'img/mark.png',

        'img/rin1.png', 
        'img/rin2.png',
        'img/rinWin.png',
        'img/rinLose.png',

        'img/uzu1.png', 
        'img/uzu2.png',
        'img/uzuLose.png',
        'img/uzuWin.png'
    );

    Game.onload = function () {
    
        Scenes.startScene = function () {
            var scene = new Scene();
            scene.backgroundColor = '#FFFFFF';

            let page = 1;
            let tot = 4;

            bg = new  Sprite(DISPLAY_X,DISPLAY_Y);
            bg.image = Game.assets['img/help1.png'];
            scene.addChild(bg);

            var label = new Label();
            label.text = page+"/"+tot;
            label.textAlign = 'center';
            label.color = '#000';
            label.x = 0; 
            label.y =  DISPLAY_Y/2+60;
            label.width = DISPLAY_X;
            label.font = '25px sans-serif';
            scene.addChild(label);


            last = new Sprite(100,50);
            last.image = Game.assets['img/last.png'];
            last.x = DISPLAY_X/2-250;
            last.y = DISPLAY_Y/2+50;
            scene.addChild(last);

            next = new Sprite(100,50);
            next.image = Game.assets['img/next.png'];
            next.x = DISPLAY_X/2+150;
            next.y = DISPLAY_Y/2+50;
            scene.addChild(next);

            start = new  Sprite(200,100);
            start.image = Game.assets['img/start.png'];
            start.x = DISPLAY_X/2-100;
            start.y = DISPLAY_Y/2+300;
            scene.addChild(start);

            start.addEventListener(Event.TOUCH_END, function (e) {
                Game.replaceScene(Scenes.mainScene());
            });

            last.addEventListener(Event.TOUCH_END, function (e) {
                if(page>1){
                    page--;
                    bg.image = Game.assets['img/help'+page+'.png'];
                    label.text = page+"/"+tot;
                }
            });

            next.addEventListener(Event.TOUCH_END, function (e) {
                if(page<tot){
                    page++;
                    bg.image = Game.assets['img/help'+page+'.png'];
                    label.text = page+"/"+tot;
                }
            });

            return scene;
        };

        Scenes.mainScene = function () {
            
            pickedChara = null;
            blkList = [];
            map = mineSweepingMap(row,col,mineNum);
            operatableMap = [];

            var scene = new Scene();
            scene.backgroundColor = '#FFFFFF';
            
            
            for(let i = 0; i<4 ; i++){
                blkList[i] = new Array();
                operatableMap[i] = new Array();

                for(let j = 0; j<6; j++){
                    var blk = new Block();
                    blk.place(i,j);
                    blkList[i][j] = blk;
                    operatableMap[i][j] = false;

                    blk.num = map[i][j];
                    
                    
                    scene.addChild(blk);
                }
            }
            operatableMap[0][0] = true;
            operatableMap[row-1][col-1]= true;
            

            var uzk = new Chara('uzuki','img/uzu1.png','img/uzu2.png',
                                'img/uzuWin.png',
                                'img/uzuLose.png');
            uzk.place(0,0);
            var rin = new Chara('rin','img/rin1.png','img/rin2.png',
                                'img/rinWin.png',
                                'img/rinLose.png');
            rin.place(3,5);

            uzk.addPair(rin);
            rin.addPair(uzk);

            scene.addChild(uzk);
            scene.addChild(rin);

            home = new  Sprite(200,100);
            home.image = Game.assets['img/back.png'];
            home.x = DISPLAY_X/2-100;
            home.y = DISPLAY_Y-100;
            scene.addChild(home);

            home.addEventListener(Event.TOUCH_END, function (e) {
                Game.replaceScene(Scenes.startScene());
            });

            return scene;
        };

        Scenes.loseScene = function (num) {

            var scene = new Scene();
            scene.backgroundColor = '#FFFFFF';
            
            bg = new  Sprite(DISPLAY_X,DISPLAY_Y);
            bg.image = Game.assets['img/lose'+num+'.png'];
            scene.addChild(bg);

            restart = new  Sprite(200,100);
            restart.image = Game.assets['img/restart.png'];
            restart.x = DISPLAY_X/2-100;
            restart.y = DISPLAY_Y/2+280;
            scene.addChild(restart);

            restart.addEventListener(Event.TOUCH_END, function (e) {
                Game.replaceScene(Scenes.mainScene());
            });

            return scene;
        };

        Scenes.winScene = function () {
            var scene = new Scene();
            scene.backgroundColor = '#FFFFFF';
            
            bg = new  Sprite(DISPLAY_X,DISPLAY_Y);
            bg.image = Game.assets['img/win.png'];
            scene.addChild(bg);

            restart = new  Sprite(200,100);
            restart.image = Game.assets['img/restart.png'];
            restart.x = DISPLAY_X/2-100;
            restart.y = DISPLAY_Y/2+280;
            scene.addChild(restart);

            restart.addEventListener(Event.TOUCH_END, function (e) {
                Game.replaceScene(Scenes.mainScene());
            });

            return scene;
        }

        Game.replaceScene(Scenes.startScene());
    };
    Game.start(); 
};
