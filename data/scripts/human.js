class Human {
    constructor() {
        const deck = get_deck();
        this.river = [ [deck[0]], [deck[1]], [deck[2]], [deck[3]] ];
        this.nertz = deck.slice(4,17);
        this.stream = deck.slice(17,53);
        this.streamIndex = 0;
        this.streamPileSize = 3;
        this.score = 0;
        this.isStalled = false;
    }
}

Human.prototype.stream_shuffle = function() {
    //Fisher-Yates shuffle
    for (let i = this.stream.length-1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [this.stream[i], this.stream[j]] = [this.stream[j], this.stream[i]];
    }
}

Human.prototype.show_river = function() {
    for(let i=0; i<4; ++i) {
        const tag = "river"+String(i);
        document.getElementById(tag).innerHTML = "";
        for(let j=0; j<this.river[i].length; ++j) {
            let card = get_card(this.river[i][j]);
            document.getElementById(tag).innerHTML += card;
        }
    }
}

Human.prototype.show_nertz = function() {
    document.getElementById("nertz-pile").innerHTML = get_card(this.nertz[this.nertz.length-1]);
}

Human.prototype.show_nertz_size = function() {
    document.getElementById("nertz-size").innerHTML = this.nertz.length;
}

Human.prototype.show_stream = function() {
    document.getElementById("stream-container").innerHTML = "";
    let text = "";
    for(let i=0; i<this.streamPileSize; ++i) {
        let card = get_card(this.stream[this.streamIndex+i]);
        document.getElementById("stream-container").innerHTML += card;
    }
}
