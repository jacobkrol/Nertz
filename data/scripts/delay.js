class Delay {
    constructor(_end) {
        this.start = performance.now();
        this.end = _end || 1000;
    }
}

Delay.prototype.reached = function() {
    return performance.now()-this.start >= this.end;
}

Delay.prototype.reset = function() {
    this.start = performance.now();
}
