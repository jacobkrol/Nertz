function randint(n) {
    return Math.floor(Math.random()*n);
}

function get_deck() {
    let deck = [],
        cards = ['01HR','02HR','03HR','04HR','05HR','06HR','07HR',
                 '08HR','09HR','10HR','11HR','12HR','13HR',
                 '01SB','02SB','03SB','04SB','05SB','06SB','07SB',
                 '08SB','09SB','10SB','11SB','12SB','13SB',
                 '01DR','02DR','03DR','04DR','05DR','06DR','07DR',
                 '08DR','09DR','10DR','11DR','12DR','13DR',
                 '01CB','02CB','03CB','04CB','05CB','06CB','07CB',
                 '08CB','09CB','10CB','11CB','12CB','13CB'];
    while(cards.length) {
        let index = randint(cards.length),
            chosen = cards[index];
        deck.push(chosen);
        cards.splice(index,1);
    }
    if(deck.length === 52) {
        return deck;
    } else {
        return false;
    }
}

function get_card(card) {
    if(card === undefined) {
        return '<div class="buttonbox"><button></button></div>';
    }

    let value = Number(card.slice(0,2)),
        suit = card.slice(2,3),
        color = card.slice(3,4);

    //convert Ace, Jack, Queen, King to letters
    switch(value) {
        case 1:
            value = 'A';
            break;
        case 11:
            value = 'J';
            break;
        case 12:
            value = 'Q';
            break;
        case 13:
            value = 'K';
            break;
        default:
            value = String(value);
            break;
    }

    let style;

    if(color === 'R') {
        style = "red";
    } else if(color === 'B') {
        style = "black";
    } else {
        style = "lime";
    }

    return '<div class="buttonbox" data-card="'+
            card+'"><button style="color:'+
            style+'"><p>'+value+'</p><img src="./data/images/'+
            suit+'-suit.png" height="20" /></button></div>';
}

function solitaire_stack(bottom, top) {
    if(Number(top.slice(0,2))+1 != Number(bottom.slice(0,2))) {
        //number alignment
        return false;
    } else if(top.slice(3,4) === bottom.slice(3,4)) {
        //alternating suit color
        return false;
    } else {
        //nothing failed tests
        return true;
    }
}

function lake_stack(bottom, top) {
    if(Number(top.slice(0,2))-1 != Number(bottom.slice(0,2))) {
        //number alignment
        return false;
    } else if(top.slice(2,3) !== bottom.slice(2,3)) {
        //same suit
        return false;
    } else {
        //nothing failed tests
        return true;
    }
}

function show_lake() {
    document.getElementById("lake-container").innerHTML = "";
    let text = "";
    for(pile of public.lake) {
        text += get_card(pile[pile.length-1]);
    }
    document.getElementById("lake-container").innerHTML = text;
}

function update_progress() {
    let percent = private.iteration / private.goal;
    percent += ((13-public.players[0].nertz.length)/13)*(1/private.goal);
    percent = Math.floor(percent*100);
    document.getElementById('progress-bar').style.width = percent+'%';
}

function draw() {
    show_lake(); // always

    if(typeof public.human === "undefined") {
        // if training, draw first computer and update bar
        update_progress();
        public.players[0].show_river();
        public.players[0].show_nertz();
        public.players[0].show_nertz_size();
        public.players[0].show_stream();
    } else {
        // if playing, draw human
        public.human.show_river();
        public.human.show_nertz();
        public.human.show_nertz_size();
        public.human.show_stream();
    }

}

function compute() {

    if(public.end) return;
    if(typeof public.human === "undefined") {
        // if training, go ahead with computer actions
        for(p of public.players) p.action();
        if(public.stall > 40) {
            for(p of public.players) p.action_all();
            console.log("stalled");
        }
    }


    if(typeof public.human === "undefined") {
        // if training, handle super stall
        if(public.stall > 400) {
            for(p of public.players) p.stream_shuffle();
            console.log("super stalled");
        }
    } else {
        // if playing, wait for super stall
        if(public.stall > 200 && public.human.isStalled) {
            for(p of public.players) p.stream_shuffle();
            public.human.stream_shuffle();
            console.log("super stalled");
        }
    }

}
