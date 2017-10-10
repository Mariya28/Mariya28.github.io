window.onload = function () {

    // Цвета
    var WHITE_COLOR = "#ffffff",
        BLACK_COLOR = "#000",
        CURRENT_NODE_COLOR = "#acff66",
        NODE_COLOR = "#9ec6ff",
        ARC_COLOR = "#0004ff",
        DEPTH_COLOR = "#cb28ff",
        BALANCE_COLOR = "#ffbb3c";

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    // Прорисовка и визуализация
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');


    var needBalanceStack = [],  // Очередь на балансировку
        stepTime = 1, // Время между шагами алгоритма
        isPauseOrStop,
        isSkipped = false,
        isStopped = false,
        isPaused = false,
        currentStep = addNodes,
        currentArg,
        nextTimer, // Таймер перед шагом
        nodeRadius = 25,
        startNodePosition = new Point(canvas.width / 2, nodeRadius + 10);

    // Дерево
    var nodeList = [], // Очередь на добавление
        avlTree;


    // Кнопки
    var buttonWork,
        buttonPause,
        buttonStop,
        buttonNextStep,
        buttonAdd;

    // Новые значения на добавление
    var inputNodeValue, // Вводимое значение
        tableRowNodeList;

    inputNodeValue = document.getElementById("node_value");
    tableRowNodeList = document.getElementById("node_list");

    buttonWork = document.getElementById("button_work");
    buttonWork.addEventListener("click", function (event) {
        if (isPaused) {
            isPaused = false;
        } else { // Если это не пауза, то запуск алгоритма сначала
            isStopped = false;
            isPaused = false;
            currentStep = addNodes;
        }
        nextStep(currentStep, stepTime, currentArg);
    });

    buttonPause = document.getElementById("button_pause");
    buttonPause.addEventListener("click", function (event) {
        isPaused = true;
        clearTimeout(nextTimer);
    });

    buttonStop = document.getElementById("button_stop");
    buttonStop.addEventListener("click", function (event) {
        for (var i = 0; i < nodeList.length; i++) {
            tableRowNodeList.deleteCell(0);
        }
        nodeList = [];
        avlTree = undefined;

        clearTimeout(nextTimer);
        isStopped = true;
        render();
    });

    buttonNextStep = document.getElementById("button_next_step");
    buttonNextStep.addEventListener("click", function (event) {
        isSkipped = true;
        currentStep(currentArg); // Вызываем текущий шаг без задержки
    });

    buttonAdd.addEventListener("click", function (event) {
        if (isFinite(inputNodeValue.value)){
            var nodeValue = inputNodeValue.value
            nodeList.push(nodeValue); // Добавление в очередь
            // Добавление в таблицу
            var cell = tableRowNodeList.insertCell(nodeList.length - 1);
            cell.innerHTML = nodeValue.toString();
            inputNodeValue.value = "";
        }
    });

    function getSpeed() {
        return Number(document.getElementById("speed").value) / 2;
    }

    function render() {
        // Отчистка canvas
        ctx.fillStyle = WHITE_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if(avlTree === undefined) return;
        // Задаем стартовую позицию
        avlTree.position = startNodePosition;
        avlTree.childrenDistance = avlTree.position.x / 2;
        drawTree(avlTree);
    }

    function drawTree(tree) {
        var isRight = false;
        // Рисуем детей
        [tree.left, tree.right].forEach(function (children) {
            if(children !== null){
                children.position = new Point(tree.position.x + (isRight ? 1 : (-1)) * tree.childrenDistance,
                    tree.position.y + nodeRadius * 2 + 10);
                children.childrenDistance = tree.childrenDistance / 2;
                drawLine(tree.position, children.position);
                drawTree(children);
            }
            isRight = true;
        });

        // Рисуем узел нашего дерева
        drawNode(tree);
    }

    function drawNode(tree) {
        drawCircleWithValue(tree);

        // Рисуем глубину поддерева
        ctx.fillStyle = DEPTH_COLOR;
        ctx.font = "15px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tree.depth, tree.position.x + nodeRadius + 5, tree.position.y - nodeRadius + 5);
    }

    function drawCircleWithValue(tree) {
        // Рисуем круг
        ctx.beginPath();
        ctx.fillStyle = tree.color;
        ctx.strokeStyle = BLACK_COLOR;
        ctx.arc(tree.position.x, tree.position.y, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Рисуем значение
        ctx.fillStyle = BLACK_COLOR;
        ctx.font = "25px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tree.node, tree.position.x, tree.position.y);
    }

    function drawLine(from, to) {
        ctx.strokeStyle = ARC_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    }

    function AVLTree(value, position, color) {
        this.init(value, position, color);
    }

    AVLTree.prototype.init = function(value, position, color) {
        this.left = null;
        this.right = null;
        this.node = value !== undefined && value !== null ? Number(value) : Number(0);
        this.color = color !== undefined && color !== null ? color : NODE_COLOR;
        this.position = position !== undefined && position !== null ? position : new Point(canvas.width, canvas.height);
        this.depth = 1;
    };

    AVLTree.prototype.balance = function() {
        var ldepth = this.left  == null ? 0 : this.left.depth;
        var rdepth = this.right == null ? 0 : this.right.depth;

        if (ldepth > rdepth + 1) {
            // LR или LL поворот
            var lldepth = this.left.left  == null ? 0 : this.left.left.depth;
            var lrdepth = this.left.right == null ? 0 : this.left.right.depth;

            if (lldepth < lrdepth) {
                // LR вращение состоит из RR вращения левого ребенка
                this.left.rotateRR();
               } 
            // плюс LL вращение этого узла
            this.rotateLL();
        } else if (ldepth + 1 < rdepth) {
            // RR или RL вращения
            var rrdepth = this.right.right == null ? 0 : this.right.right.depth;
            var rldepth = this.right.left  == null ? 0 : this.right.left.depth;

            if (rldepth > rrdepth) {
                // RR вращения состоит из LL вращения права ребенка
                this.right.rotateLL();
                // плюс RR вращение этого узла
            }
            this.rotateRR();
        }
    };

    AVLTree.prototype.rotateLL = function() {
        // LL вращение
        var nodeBefore = this.node;
        var rightBefore = this.right;
        this.node = this.left.node;
        this.right = this.left;
        this.left = this.left.left;
        this.right.left = this.right.right;
        this.right.right = rightBefore;
        this.right.node = nodeBefore;
        this.right.updateInNewLocation();
        this.updateInNewLocation();
    };

    AVLTree.prototype.rotateRR = function() {
        // RR вращение
        var nodeBefore = this.node;
        var leftBefore = this.left;
        this.node = this.right.node;
        this.left = this.right;
        this.right = this.right.right;
        this.left.right = this.left.left;
        this.left.left = leftBefore;
        this.left.node = nodeBefore;
        this.left.updateInNewLocation();
        this.updateInNewLocation();
    };

    AVLTree.prototype.updateInNewLocation = function() {
        this.getDepthFromChildren();
    };

    // Установка дереву стандартный цвет узлов
    AVLTree.prototype.setDefaultNodeColor = function() {
        this.color = NODE_COLOR;
        if(this.left !== undefined && this.left !== null)
            this.left.setDefaultNodeColor();
        if(this.right !== undefined && this.right !== null)
            this.right.setDefaultNodeColor();
    };

    AVLTree.prototype.getDepthFromChildren = function() {
        this.depth = this.node == null ? 0 : 1;
        if (this.left != null) {
            this.depth = this.left.depth + 1;
        }
        if (this.right != null && this.depth <= this.right.depth) {
            this.depth = this.right.depth + 1;
        }
        render();
    };

    AVLTree.prototype.compare = function(n1, n2) {
        if (n1 == n2) {
            return 0;
        }
        if (n1 < n2) {
            return -1;
        }
        return 1;
    };

    AVLTree.prototype.add = function(n)  {
        var o = this.compare(n, this.node);
        needBalanceStack.push(this); // Добавляем поддерево в очередь на балансировку

        if (o <= 0) {
            if (this.left === null) {
                addNewTreeStep({
                    tree: this,
                    isRight: false,
                    n: n
                });
            } else {
                this.left.add(n);
            }
        } else if (o === 1) {
            if (this.right === null) {
                addNewTreeStep({
                    tree: this,
                    isRight: true,
                    n: n
                });
            } else {
                this.right.add(n);
            }
        }
    };

    /*
       Начальный шаг алгоритма добавления всех вершин
       Запускается каждый раз, когда нужно добавить новуб вершину
    */
    function addNodes() {
        // Возвращение к стандартным цветам
        if(avlTree !== undefined && avlTree !== null) {
            avlTree.setDefaultNodeColor();
            render();
        }

        // Достаем из очереди новое значение
        var node = nodeList.shift();
        if (node === undefined)
            return;
        tableRowNodeList.deleteCell(0); // Удаляем его из таблицы

        // Рисуем в углу экрана
        drawCircleWithValue(new AVLTree(
            node, new Point(canvas.width - nodeRadius, canvas.height - nodeRadius), CURRENT_NODE_COLOR));

        nextStep(addNodeToTree, stepTime, node);
    }

    /*
       Шаг добавления узла в дерево
        - Создает дерево, если еще не было созданно
        - Иначе добавляет узел в дерево
    */
    var addNodeToTree = function(node){
        if(avlTree === undefined){
            avlTree = new AVLTree(node);
            render();
            nextStep(addNodes, stepTime);
        } else {
            avlTree.add(node);
        }
    };

    /*
       Шаг добавления узла в нужное поддерево
    */
    var addNewTreeStep = function(arg){
        if(arg.isRight){
            arg.tree.right = new AVLTree(arg.n, null, CURRENT_NODE_COLOR);
        } else {
            arg.tree.left = new AVLTree(arg.n, null, CURRENT_NODE_COLOR);
        }
        render();

        nextStep(balanceAllTreeStep, stepTime);
    };

    /*
       Шаг балансировки всех деревьев из очереди
    */
    var balanceAllTreeStep = function (arg) {
        // Возвращаем обратно цвет для дерева, которое балансировалось раньше, если балансировка была
        if(arg !== undefined) arg.tree.color = NODE_COLOR;

        // Если все деревья сбалансированны заканчиваем добавление узла в дерево
        if(needBalanceStack.length === 0){
            nextStep(addNodes, stepTime);
            return;
        }

        // Достаем дерево из очереди
        var tree = needBalanceStack.pop();
        tree.color = BALANCE_COLOR;
        render();
        nextStep(balanceTreeStep, stepTime, {
            tree: tree
        });
    };

    /*
       Шаг балансировки дерева
    */
    var balanceTreeStep = function (arg) {
        arg.tree.updateInNewLocation();
        arg.tree.balance();
        render();
        nextStep(balanceAllTreeStep, stepTime, {
            tree: arg.tree
        });
    };

    /*
       Запускает указанную функцию через некоторое время
       Проверяет на наличие пауз, пропусков и остановок
    */
    var nextStep = function (func, timeInSec, arg){
        // Сохраняем текущий шаг
        currentStep = func;
        currentArg = arg;
        // Проверяем на наличие пауз, пропусков и остановок
        if(isSkipped){
            isSkipped = false;
            isPaused = true;
            return;
        } else if(isStopped || isPaused) return;

        nextTimer = setTimeout(func, timeInSec*1000/getSpeed(), arg);
    };
};
