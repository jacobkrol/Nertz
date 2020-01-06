window.onload = function () {
    document.getElementById('player-html').style.display = 'block';
    setup();
    const fps = 50;
    f = setInterval(main, 1000/fps);
}

function setup() {
    public = {
        lake: [],
        players: Array.from(Array(3), () => new Player()),
        human: new Human(),
        end: false,
        stall: 0,
        delay: new Delay(800)
    };
}



function h_draw() {
    show_lake();
    public.human.show_river();
    public.human.show_nertz();
    public.human.show_nertz_size();
    public.human.show_stream();
}

function h_compute() {

    if(public.end) return;
    if(public.delay.reached()) {
        let sum = 0;
        Array.from(public.players, (a,i) => sum+=a.nertz.length);
        console.log("action", "nertz:", sum/3);
        for(p of public.players) p.action();
        if(public.stall > 40) {
            for(p of public.players) p.action_all();
            console.log("stalled");
        }
        public.delay.reset();
    }

    if(public.stall > 200 && public.human.isStalled) {
        for(p of public.players) p.stream_shuffle();
        public.human.stream_shuffle();
        console.log("super stalled");
    }

}


function main() {
    h_draw();
    h_compute();
}
