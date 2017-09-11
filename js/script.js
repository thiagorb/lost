var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Game;
(function (Game) {
    var GameView = (function () {
        function GameView(canvas) {
            var _this = this;
            this.stepObjects = new Array();
            this.renderObjects = new Array();
            this.countFPS = 0;
            this.fps = 0;
            this.countSPS = 0;
            this.sps = 0;
            this.running = false;
            window.addEventListener("resize", function () { return _this.resizeCanvas(); });
            this.canvas = canvas;
            this.resizeCanvas();
            this.keyboardController = new KeyboardController();
            this.addStepObject(this.keyboardController);
            this.addRenderObject({
                render: function (ctx) {
                    ctx.fillText(_this.fps.toString(), 10, 10);
                    ctx.fillText(_this.sps.toString(), 10, 25);
                }
            });
        }
        GameView.prototype.addStepObject = function (o) {
            this.stepObjects.push(o);
        };
        GameView.prototype.addRenderObject = function (o) {
            this.renderObjects.push(o);
        };
        GameView.prototype.addObject = function (o) {
            this.addStepObject(o);
            this.addRenderObject(o);
        };
        GameView.prototype.step = function () {
            this.stepObjects.forEach(function (o) { return o.preStep(); });
            this.stepObjects.forEach(function (o) { return o.step(); });
            this.countSPS++;
        };
        GameView.prototype.render = function () {
            var _this = this;
            var g = this.canvas.getContext("2d");
            g.setTransform(1, 0, 0, 1, 0, 0);
            g.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.renderObjects.forEach(function (o) { return o.render(g); });
            this.countFPS++;
            if (this.running)
                window.requestAnimationFrame(function () { return _this.render(); });
        };
        GameView.prototype.start = function (sps) {
            var _this = this;
            this.stop();
            this.running = true;
            this.step();
            window.requestAnimationFrame(function () { return _this.render(); });
            this.stepToken = setInterval(function () { return _this.step(); }, 1000 / sps);
            this.countFPSToken = setInterval(function () {
                _this.fps = _this.countFPS;
                _this.countFPS = 0;
                _this.sps = _this.countSPS;
                _this.countSPS = 0;
            }, 1000);
        };
        GameView.prototype.stop = function () {
            if (this.stepToken)
                clearInterval(this.stepToken);
            if (this.countFPSToken)
                clearInterval(this.countFPSToken);
            this.stepToken = null;
            this.countFPSToken = null;
            this.running = false;
        };
        GameView.prototype.addKeyListener = function (keyCode, callback) {
            this.keyboardController.addListener(keyCode, callback);
        };
        GameView.prototype.resizeCanvas = function () {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
        };
        return GameView;
    }());
    Game.GameView = GameView;
    var KeyboardController = (function () {
        function KeyboardController() {
            var _this = this;
            this.pressedKeys = {};
            this.keyListeners = {};
            document.addEventListener("keydown", function (ev) {
                _this.pressedKeys[ev.keyCode] = true;
            });
            document.addEventListener("keyup", function (ev) {
                _this.pressedKeys[ev.keyCode] = false;
            });
        }
        KeyboardController.prototype.preStep = function () {
        };
        KeyboardController.prototype.step = function () {
            for (var keyCode in this.keyListeners) {
                if (this.pressedKeys[keyCode])
                    this.keyListeners[keyCode].forEach(function (callback) { return callback(); });
            }
        };
        KeyboardController.prototype.addListener = function (keyCode, callback) {
            var listeners = this.keyListeners[keyCode];
            if (!listeners) {
                listeners = [];
                this.keyListeners[keyCode] = listeners;
            }
            listeners.push(callback);
        };
        return KeyboardController;
    }());
    var Keys;
    (function (Keys) {
        Keys[Keys["LEFT"] = 37] = "LEFT";
        Keys[Keys["UP"] = 38] = "UP";
        Keys[Keys["RIGHT"] = 39] = "RIGHT";
        Keys[Keys["DOWN"] = 40] = "DOWN";
    })(Keys = Game.Keys || (Game.Keys = {}));
    ;
})(Game || (Game = {}));
var Geometry;
(function (Geometry) {
    var Segment = (function () {
        function Segment(x1, y1, x2, y2) {
            this.x = x1;
            this.y = y1;
            this.a = x2 - x1;
            this.b = y2 - y1;
        }
        // Returns the factor used to multiply this segment coefficients, in order to get
        // the coordinates of the intersection of this segment with the other segment.
        Segment.prototype.intersectionFactor = function (other) {
            return (other.a * (this.y - other.y) - other.b * (this.x - other.x)) / (other.b * this.a - this.b * other.a);
        };
        // Returns the factor used to multiply the other segment coefficients, in order to get
        // the coordinates of the intersection of this segment with the other segment.
        Segment.prototype.intersectionFactorOther = function (other, factor) {
            if (other.a)
                return (this.x + this.a * factor - other.x) / other.a;
            else
                return (this.y + this.b * factor - other.y) / other.b;
        };
        // Returns true if this segment intersects the other segment.
        Segment.prototype.intersectsWith = function (other) {
            var factor = this.intersectionFactor(other);
            if (factor < 0 || factor > 1)
                return false;
            var otherFactor = this.intersectionFactorOther(other, factor);
            return otherFactor >= 0 && otherFactor <= 1;
        };
        Segment.prototype.intersectsWithCircle = function (circle) {
            var tx = this.x - circle.center[0];
            var ty = this.y - circle.center[1];
            var a = this.a * this.a + this.b * this.b;
            var b = 2 * (tx * this.a + ty * this.b);
            var c = tx * tx + ty * ty - circle.squaredRadius;
            var disc = b * b - 4 * a * c;
            if (disc <= 0)
                return false;
            var sqrtdisc = Math.sqrt(disc);
            var t1 = (-b + sqrtdisc) / (2 * a);
            var t2 = (-b - sqrtdisc) / (2 * a);
            return ((0 <= t1 && t1 <= 1) || (0 <= t2 && t2 <= 1));
        };
        return Segment;
    }());
    Geometry.Segment = Segment;
    var Polygon = (function () {
        function Polygon(vertices) {
            this.vertices = [];
            for (var i = 0; i < vertices.length; i++) {
                this.vertices.push([vertices[i][0], vertices[i][1], 1]);
            }
        }
        Polygon.prototype.intersectsWithSegment = function (segment) {
            return this.anySegment(function (s) { return s.intersectsWith(segment); });
        };
        Polygon.prototype.intersectsWithPolygon = function (other) {
            return this.anySegment(function (s) { return other.intersectsWithSegment(s); });
        };
        Polygon.prototype.intersectsWithCircle = function (circle) {
            return this.anySegment(function (s) { return circle.intersectsWithSegment(s); });
        };
        Polygon.prototype.anySegment = function (callback) {
            for (var i = 0; i < this.vertices.length; i++) {
                var i1 = (i + 1) % this.vertices.length;
                var s = new Segment(this.vertices[i][0], this.vertices[i][1], this.vertices[i1][0], this.vertices[i1][1]);
                if (callback(s))
                    return true;
            }
            return false;
        };
        return Polygon;
    }());
    Geometry.Polygon = Polygon;
    Geometry.squaredDistance = function (p1, p2) {
        var dx = p1[0] - p2[0];
        var dy = p1[1] - p2[1];
        return dx * dx + dy * dy;
    };
    var Circle = (function () {
        function Circle(radius, center) {
            this.radius = radius;
            this.squaredRadius = radius * radius;
            this.center = center;
        }
        Circle.prototype.intersectsWithPolygon = function (polygon) {
            return polygon.intersectsWithCircle(this);
        };
        Circle.prototype.intersectsWithCircle = function (circle) {
            var radiusSum = this.radius + circle.radius;
            return Geometry.squaredDistance(this.center, circle.center) <= radiusSum * radiusSum;
        };
        Circle.prototype.intersectsWithSegment = function (segment) {
            return segment.intersectsWithCircle(this);
        };
        return Circle;
    }());
    Geometry.Circle = Circle;
})(Geometry || (Geometry = {}));
var Time;
(function (Time) {
    var SPS = 500;
    var viewSize;
    var viewPosition;
    var roomSize;
    var RenderablePolygon = (function (_super) {
        __extends(RenderablePolygon, _super);
        function RenderablePolygon(vertices, color) {
            var _this = _super.call(this, vertices) || this;
            _this.position = [0, 0];
            _this.direction = 0;
            _this.color = color;
            _this.transformedPolygon = new Geometry.Polygon(Vectorial.Matrix.copy(_this.vertices));
            return _this;
        }
        RenderablePolygon.prototype.prepareContext = function (ctx) {
            ctx.save();
            ctx.translate(this.position[0], this.position[1]);
            ctx.rotate(-this.direction);
        };
        RenderablePolygon.prototype.draw = function (ctx) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.vertices[0][0], this.vertices[0][1]);
            for (var i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.vertices[i][0], this.vertices[i][1]);
            }
            ctx.fill();
        };
        RenderablePolygon.prototype.restoreContext = function (ctx) {
            ctx.restore();
        };
        RenderablePolygon.prototype.render = function (ctx) {
            this.prepareContext(ctx);
            this.draw(ctx);
            this.restoreContext(ctx);
        };
        RenderablePolygon.prototype.preStep = function () {
            var transform = Vectorial.Matrix.multiply(Vectorial.Matrix.rotate(this.direction), Vectorial.Matrix.translate(this.position[0], this.position[1]));
            Vectorial.Matrix.multiply(this.vertices, transform, this.transformedPolygon.vertices);
        };
        RenderablePolygon.prototype.step = function () {
        };
        return RenderablePolygon;
    }(Geometry.Polygon));
    var RenderableCircle = (function (_super) {
        __extends(RenderableCircle, _super);
        function RenderableCircle(center, radius, color) {
            var _this = _super.call(this, radius, center) || this;
            _this.color = color;
            return _this;
        }
        RenderableCircle.prototype.prepareContext = function (ctx) {
            ctx.save();
            ctx.translate(this.center[0], this.center[1]);
        };
        RenderableCircle.prototype.draw = function (ctx) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        };
        RenderableCircle.prototype.restoreContext = function (ctx) {
            ctx.restore();
        };
        RenderableCircle.prototype.render = function (ctx) {
            this.prepareContext(ctx);
            this.draw(ctx);
            this.restoreContext(ctx);
        };
        RenderableCircle.prototype.preStep = function () {
        };
        RenderableCircle.prototype.step = function () {
        };
        return RenderableCircle;
    }(Geometry.Circle));
    var Ship = (function (_super) {
        __extends(Ship, _super);
        function Ship() {
            var _this = _super.call(this, [
                [-20, -20],
                [40, 0],
                [-20, 20]
            ], "#F80") || this;
            _this.speed = [0, 0];
            _this.angularSpeed = 0;
            _this.position = [50, 50];
            return _this;
        }
        Ship.prototype.preStep = function () {
            if (this.colliding)
                return;
            this.position[0] += this.speed[0];
            this.position[1] += this.speed[1];
            _super.prototype.preStep.call(this);
            this.direction += this.angularSpeed;
            this.color = this.colliding ? "#F00" : "#F80";
        };
        Ship.prototype.accelerate = function () {
            this.speed[0] += 5 * Math.cos(this.direction) / SPS;
            this.speed[1] -= 5 * Math.sin(this.direction) / SPS;
        };
        Ship.prototype.steerLeft = function () {
            this.angularSpeed += 0.05 / SPS;
        };
        Ship.prototype.steerRight = function () {
            this.angularSpeed -= 0.05 / SPS;
        };
        return Ship;
    }(RenderablePolygon));
    var Planet = (function (_super) {
        __extends(Planet, _super);
        function Planet() {
            return _super.call(this, [400, 300], 50, "#55D") || this;
        }
        return Planet;
    }(RenderableCircle));
    var GameView = (function (_super) {
        __extends(GameView, _super);
        function GameView(canvas) {
            var _this = _super.call(this, canvas) || this;
            document.body.addEventListener("ontouchend" in document.documentElement ? "touchend" : "mousedown", function (ev) {
                if (ev.target.tagName !== "CANVAS")
                    return;
            });
            return _this;
        }
        GameView.prototype.start = function () {
            viewSize = [1000, 1000];
            _super.prototype.start.call(this, SPS);
            var ship = new Ship();
            this.addObject(ship);
            var planet = new Planet();
            this.addObject(planet);
            this.addKeyListener(Game.Keys.UP, function () {
                ship.accelerate();
            });
            this.addKeyListener(Game.Keys.LEFT, function () {
                ship.steerLeft();
            });
            this.addKeyListener(Game.Keys.RIGHT, function () {
                ship.steerRight();
            });
            this.addStepObject({
                preStep: function () { },
                step: function () {
                    viewPosition = [ship.position[0] - 500, ship.position[1] - 500];
                    if (ship.transformedPolygon.intersectsWithCircle(planet)) {
                        //this.running = false;
                        ship.colliding = true;
                    }
                    else {
                        ship.colliding = false;
                    }
                }
            });
        };
        return GameView;
    }(Game.GameView));
    Time.GameView = GameView;
    function rectangle(width, height, center) {
        var halfWidth = center ? width / 2 : 0;
        var halfHeight = center ? height / 2 : 0;
        return [
            [-halfWidth, -halfHeight, 1],
            [width - halfWidth, -halfHeight, 1],
            [width - halfWidth, height - halfHeight, 1],
            [-halfWidth, height - halfHeight, 1]
        ];
    }
    function gear(tooth, teethWidth1, teethWidth2, teethHeight, scale) {
        var vertices = new Array();
        for (var i = 0; i < tooth; i++) {
            var toothDegree = i * (Math.PI * 2 / tooth);
            var toothDegree90 = i * (Math.PI * 2 / tooth) + Math.PI / 2;
            var cos = Math.cos(toothDegree);
            var cos90 = Math.cos(toothDegree90);
            var sin = Math.sin(toothDegree);
            var sin90 = Math.sin(toothDegree90);
            vertices.push([scale * (cos * teethHeight - cos90 * teethWidth2), scale * (sin * teethHeight - sin90 * teethWidth2)]);
            vertices.push([scale * (cos - cos90 * teethWidth1), scale * (sin - sin90 * teethWidth1)]);
            vertices.push([scale * (cos + cos90 * teethWidth1), scale * (sin + sin90 * teethWidth1)]);
            vertices.push([scale * (cos * teethHeight + cos90 * teethWidth2), scale * (sin * teethHeight + sin90 * teethWidth2)]);
        }
        return vertices;
    }
    function circle(radius, steps) {
        var vertices = [];
        for (var i = 0; i < steps; i++) {
            vertices.push([Math.cos(Math.PI * 2 * i / steps) * radius, Math.sin(Math.PI * 2 * i / steps) * radius, 1]);
        }
        return vertices;
    }
})(Time || (Time = {}));
var Vectorial;
(function (Vectorial) {
    var Matrix = (function () {
        function Matrix(lines, columns) {
            this.length = lines;
            for (var i = 0; i < lines; i++) {
                this[i] = new Array(columns || lines);
            }
        }
        Matrix.copy = function (m) {
            var copy = new Matrix(m.length, m[0].length);
            copy.length = m.length;
            for (var i = 0; i < m.length; i++) {
                copy[i] = new Array(m[i].length);
                for (var j = 0; j < m[i].length; j++) {
                    copy[i][j] = m[i][j];
                }
            }
            return copy;
        };
        Matrix.multiply = function (a, b, result, n, m, p) {
            n = n || a.length;
            m = m || b.length;
            p = p || b[0].length;
            result = result || new Matrix(n, p);
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < p; j++) {
                    result[i][j] = 0;
                    for (var k = 0; k < m; k++) {
                        result[i][j] += a[i][k] * b[k][j];
                    }
                }
            }
            return result;
        };
        Matrix.translate = function (x, y) {
            return [
                [1, 0, 0],
                [0, 1, 0],
                [x, y, 1]
            ];
        };
        Matrix.rotate = function (delta) {
            var sin = Math.sin(delta);
            var cos = Math.cos(delta);
            return [
                [cos, -sin, 0],
                [sin, cos, 0],
                [0, 0, 1]
            ];
        };
        Matrix.identity = function (n) {
            var m = new Matrix(n);
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < n; j++) {
                    m[i][j] = 0;
                }
                m[i][i] = 1;
            }
            return m;
        };
        return Matrix;
    }());
    Vectorial.Matrix = Matrix;
})(Vectorial || (Vectorial = {}));
window.onload = function () {
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame =
            ["webkit", "moz", "o", "ms"].reduce(function (existing, vendor) {
                return existing || window[vendor + "RequestAnimationFrame"];
            }, null)
                || function (callback) { window.setTimeout(callback, 1000 / 60); };
    }
    var $ = function (query) { return document.querySelector(query); };
    var $$ = function (query) { return document.querySelectorAll(query); };
    var gameView = new Time.GameView($("canvas"));
    gameView.start();
};
