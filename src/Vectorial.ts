module Vectorial {
    export type Vector2D = {0: number, 1: number};

    export const squaredLength = (vector: Vector2D) => 
        vector[0] * vector[0] + vector[1] * vector[1];
    
    export class Matrix {
        public length: number;

        constructor(lines: number, columns?: number) {
            this.length = lines;
            for (var i = 0; i < lines; i++) {
                this[i] = new Array(columns || lines);
            }
        }

        static copy(m: Matrix): Matrix {
            var copy = new Matrix(m.length, m[0].length);
            copy.length = m.length;
            for (var i = 0; i < m.length; i++) {
                copy[i] = new Array(m[i].length);
                for (var j = 0; j < m[i].length; j++) {
                    copy[i][j] = m[i][j];
                }
            }
            return copy;
        }

        static multiply(a: Matrix, b: Matrix, result?: Matrix, n?: number, m?: number, p?: number): Matrix {
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
        }

        static translate(x: number, y: number): Matrix {
            return [
                [1, 0, 0],
                [0, 1, 0],
                [x, y, 1]
            ];
        }

        static rotate(delta: number): Matrix {
            var sin = Math.sin(delta);
            var cos = Math.cos(delta);
            return [
                [cos, -sin, 0],
                [sin, cos, 0],
                [0, 0, 1]
            ];
        }

        static identity(n: number): Matrix {
            var m = new Matrix(n);
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < n; j++) {
                    m[i][j] = 0;
                }
                m[i][i] = 1;
            }
            return m;
        }
    }
}