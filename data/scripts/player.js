class Player {
    constructor(_pMatrix) {
        //parameters for normal gameplay...
        const deck = get_deck();
        this.river = [ [deck[0]], [deck[1]], [deck[2]], [deck[3]] ];
        this.nertz = deck.slice(4,17);
        this.stream = deck.slice(17,53);
        this.streamIndex = 0;
        this.streamPileSize = 3;
        this.score = 0;
        //for training purposes...
        this.pMatrix = _pMatrix || Array.from(Array(6), () => 5);
        this.actCount = [0,0,0,0,0,0];
    }
}

Player.prototype.nertz_river = function() {
    if(public.end) {
        return false;
    }
    for(pile of this.river) {
        let bottom = pile[pile.length-1],
            top = this.nertz[this.nertz.length-1];
        if(solitaire_stack(bottom, top)) {
            pile.push(this.nertz.pop());
            if(this.nertz.length === 0) {
                public.end = true;
            }
            //PICK RANDOM OPTION
            return true;
        }
    }
    return false;
}

Player.prototype.nertz_lake = function() {
    if(public.end) {
        return false;
    }
    //clear aces
    if(this.nertz[this.nertz.length-1].slice(0,2) === '01') {
        this.score++;
        public.lake.push([this.nertz.pop()]);
        if(this.nertz.length === 0) {
            public.end = true;
        }
        return true;
    }
    //identify other matches
    for(pile of public.lake) {
        let bottom = pile[pile.length-1],
            top = this.nertz[this.nertz.length-1];
        if(lake_stack(bottom, top)) {
            this.score++;
            pile.push(this.nertz.pop());
            if(this.nertz.length === 0) {
                public.end = true;
            }
            //OPTIONS DONT MATTER
            return true;
        }
    }
    return false;
}

Player.prototype.river_river = function() {
    if(public.end) {
        return false;
    }
    let moves = [];
    for(let i=0; i<4; i++) {
        for(let j=0; j<4; j++) {
            if(i===j) { continue; }
            for(let k=0; k<this.river[i].length; k++) {
                if(solitaire_stack(
                    this.river[j][this.river[j].length-1],
                    this.river[i][k])) {
                        moves.push([i,j,k]);
                }
            }
        }
    }
    if(moves.length) {
        let chosen = moves[randint(moves.length)];
        this.river[chosen[1]] = this.river[chosen[1]].concat(
                                this.river[chosen[0]].slice(
                                chosen[2],this.river[chosen[0]].length));
        this.river[chosen[0]] = [];
        this.fill_river();
        return true;
    }
    return false;
}

Player.prototype.river_lake = function() {
    if(public.end) {
        return false;
    }
    for(let i=0; i<4; ++i) {
        //move Aces to lake
        if(this.river[i][this.river[i].length-1].slice(0,2) === '01') {
            this.score++;
            public.lake.push([this.river[i].pop()]);
            this.fill_river();
            return true;
        }

        //move lake stack-ables
        for(pile of public.lake) {
            if(lake_stack(pile[pile.length-1],
                this.river[i][this.river[i].length-1])) {
                this.score++;
                pile.push(this.river[i].pop());
                this.fill_river();
                return true;
            }
        }
    }
    return false;
}

Player.prototype.stream_lake = function() {
    if(public.end) {
        return false;
    }
    if(this.streamPileSize === 0) {
        this.stream_update();
    }
    const top = this.stream[this.streamIndex+this.streamPileSize-1];
    if(top.slice(0,2) === '01') {
        this.score++;
        public.lake.push([top]);
        this.stream.splice(this.streamIndex+this.streamPileSize-1,1);
        this.streamPileSize--;
        return true;
    }
    for(pile of public.lake) {
        if(lake_stack(pile[pile.length-1],top)) {
            this.score++;
            pile.push(this.stream.splice(this.streamIndex+this.streamPileSize-1,1)[0]);
            this.streamPileSize--;
            return true;
        }
    }
    return false;
}


Player.prototype.stream_river = function() {
    if(public.end) {
        return false;
    }
    if(this.streamPileSize === 0) {
        this.stream_update();
    }
    const top = this.stream[this.streamIndex+this.streamPileSize-1];
    for(pile of this.river) {
        if(solitaire_stack(pile[pile.length-1],top)) {
            pile.push(top);
            this.stream.splice(this.streamIndex+this.streamPileSize-1,1);
            this.streamPileSize--;
            return true;
        }
    }
    return false;
}

Player.prototype.stream_update = function() {
    //update stream index
    this.streamIndex += this.streamPileSize;
    if(this.streamIndex >= this.stream.length) {
        this.streamIndex = 0;
    }

    //update stream pile size
    this.streamPileSize = 3;
    if(this.streamIndex+this.streamPileSize > this.stream.length) {
        this.streamPileSize = this.stream.length - this.streamIndex;
    }
}

Player.prototype.stream_shuffle = function() {
    //Fisher-Yates shuffle
    for (let i = this.stream.length-1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [this.stream[i], this.stream[j]] = [this.stream[j], this.stream[i]];
    }
}

Player.prototype.fill_river = function() {
    for(let i=0; i<4; ++i) {
        if(this.river[i].length === 0) {
            this.river[i] = [this.nertz.pop()];
            if(this.nertz.length === 0) {
                public.end = true;
            }

        }
    }
}

Player.prototype.action = function() {

    const total = this.pMatrix.reduce((a,b) => a+b,0); //find total number of action indicators
    let choice = randint(total), //choose random 'ball'
        index = 0; //initialize index to zero
    do { //shift type to type to determine selected action
        choice -= this.pMatrix[index++];
    } while(choice > 0);

    let action = false; //initialize action taken flag to false
    switch(index-1) { //determine action from chosen indicator
        case 0:
            action = this.river_river();
            break;
        case 1:
            action = this.river_lake();
            break;
        case 2:
            action = this.nertz_river();
            break;
        case 3:
            action = this.nertz_lake();
            break;
        case 4:
            action = this.stream_river();
            if(!action || this.streamPileSize === 0) {
                this.stream_update();
            }
            break;
        case 5:
            action = this.stream_lake();
            if(!action || this.streamPileSize === 0) {
                this.stream_update();
            }
            break;
        default:
            Error("invalid action selected");
            break;
    }
    public.stall = action ? 0 : public.stall+1; //adjust stall count
    this.actCount[index-1]++; //add action to counter
}

Player.prototype.action_all = function() {

    //perform all actions
    let action = false;
    action = this.river_river() ? true : action;
    action = this.river_lake() ? true : action;
    action = this.nertz_lake() ? true : action;
    action = this.nertz_river() ? true : action;
    action = this.stream_lake() ? true : action;
    action = this.stream_river() ? true : action;

    //adjust stall and act count
    public.stall = action ? 0 : public.stall+1;
    this.actCount = this.actCount.map((i) => i+1);
    if(!action || this.streamPileSize === 0) {
        this.stream_update();
    }
}

Player.prototype.show_river = function() {
    for(let i=0; i<4; ++i) {
        const tag = "river"+String(i);
        document.getElementById(tag).innerHTML = "";
        for(let j=0; j<this.river[i].length; ++j) {
            let card = get_card(this.river[i][j]);
            document.getElementById(tag).innerHTML += card;
        }
    }
}

Player.prototype.show_nertz = function() {
    document.getElementById("nertz-pile").innerHTML = get_card(this.nertz[this.nertz.length-1]);
}

Player.prototype.show_nertz_size = function() {
    document.getElementById("nertz-size").innerHTML = this.nertz.length;
}

Player.prototype.show_stream = function() {
    document.getElementById("stream-container").innerHTML = "";
    let text = "";
    for(let i=0; i<this.streamPileSize; ++i) {
        let card = get_card(this.stream[this.streamIndex+i]);
        document.getElementById("stream-container").innerHTML += card;
    }
}
