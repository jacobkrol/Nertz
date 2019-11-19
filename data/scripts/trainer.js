function start_trainer(goal) {

    //verify trainer state
    // (kept as separate statements to avoid error encounters)
    if(typeof private !== "undefined") {
        if(private.iteration < private.goal || !public.end) {
            return;
        }
    }
    goal = Number(goal);
    if(isNaN(goal) || goal<=0 || Math.floor(goal) !== goal) return;

    //set views
    document.getElementById('charts-html').style.display = 'none';
    if(!document.getElementById('toggle-player-view').checked) {
        document.getElementById('player-html').style.display = 'block';
    }
    t0 = performance.now();
    //begin trainer
    setup(goal);
    const fps = 50;
    f = setInterval(main, 1000/fps);
}

function setup(_goal) {
    private = {
        goal: _goal,
        iteration: 0,
        pMatrices: Array.from(Array(4), () => [8,8,8,8,8,8]),
        winCount: Array.from(Array(4), () => 0),
        charts: new Array(5)
    };
    public = {
        lake: [],
        players: Array.from(Array(4), (a,i) => new Player(private.pMatrices[i])),
        end: false,
        stall: 0
    };
}

function rank_action_freq(m) {
    //expected input [n1, n2, ..., n6]
    let ranked = Array.from(Array(m.length), () => 0);
    for(let i=0; i<m.length; ++i) {
        for(let j=0; j<m.length; ++j) {
            if(j!==i && m[j] < m[i]) {
                ranked[i]++;
            }
        }
    }
    // return array of integers representing number
    // of elements each element is less than
    // ex. [1,5,2,3,3,6] or [1,5,2,3,4,6]
    return ranked;

}

function adjust_pMatrix() {
    //adjust scores for remaining nertz cards
    let maxScore = -100;
    for(let p of public.players) {
        p.score -= 2*p.nertz.length;
    }
    for(let p of public.players) {
        maxScore = p.score > maxScore ? p.score : maxScore;
    }

    //for each player...
    for(let i=0; i<public.players.length; ++i) {
        let adjustmentMatrix = [0,0,0,0,0,0];
        //if they won...
        if(public.players[i].score === maxScore) {
            //reward behavior
            adjustmentMatrix = [0,0,0,0,0,0];
            //record player win
            private.winCount[i]++;
        } else {
            //disincentivize behavior
            adjustmentMatrix = [2,1,0,0,-1,-2];
        }
        //adjust pMatrix accordingly
        const actFreq = rank_action_freq(public.players[i].actCount);
        for(let j=0; j<public.players[i].pMatrix.length; ++j) {
            //calculate and apply adjustment to indicators
            let change = adjustmentMatrix[actFreq[j]];
            public.players[i].pMatrix[j] += change;
            //do not allow negative pMatrix values
            if(public.players[i].pMatrix[j] < 0) {
                public.players[i].pMatrix[j] = 0;
            }
        }
    }
}

function reset_game() {
    //save pMatrices to private storage
    for(let i=0; i<public.players.length; ++i) {
        private.pMatrices[i] = public.players[i].pMatrix;
    }
    //update public variables to new game setup
    public = {
        lake: [],
        players: Array.from(Array(4), (a,i) => new Player(private.pMatrices[i])),
        end: false
    };
}

function find_results() {
    //intialize empty array
    let avMatrix = Array.from(Array(6), () => 0);
    //weight each player's pMatrix values by their number of wins
    for(let i=0; i<public.players.length; ++i) {
        console.log({pMatrix:private.pMatrices[i],wins:private.winCount[i]});
        for(let j=0; j<avMatrix.length; ++j) {
            avMatrix[j] += private.winCount[i]*private.pMatrices[i][j];
        }
    }
    // return array of percentage values for each average weighted move
    // ex. [12.5, 8.2, 37.1, 22.0, 5.7, 14.5]
    return avMatrix.map((i) => 100*i/avMatrix.reduce((a,b) => a+b));
}

function draw_results(all) {
    document.getElementById('charts-html').style.display = 'block';
    for(let i=0; i<private.pMatrices.length; ++i) {
        let tag = 'chart-p'+i;
        private.charts[i] = new Chart(document.getElementById(tag).getContext('2d'),{
            'type': 'doughnut',
            'data': {
                // 'labels': [
                //     'river_river','river_lake',
                //     'nertz_river','nertz_lake',
                //     'stream_river','stream_lake'
                // ],
                'datasets': [{
                    'data': private.pMatrices[i],
                    'backgroundColor': [
                        'rgb(200,50,50)','rgb(200,200,50)',
                        'rgb(50,200,50)','rgb(50,200,200)',
                        'rgb(50,50,200)','rgb(200,50,200)'
                    ]
                }],
                'options': {
                    'responsive':false,
                    'maintainAspectRatio':true
                }
            }
        });
    }
    private.charts[private.charts.length-1] = new Chart(document.getElementById('chart-all').getContext('2d'),{
        'type': 'doughnut',
        'data': {
            'labels': [
                'river_river','river_lake',
                'nertz_river','nertz_lake',
                'stream_river','stream_lake'
            ],
            'datasets': [{
                'data': all,
                'backgroundColor': [
                    'rgb(200,50,50)','rgb(200,200,50)',
                    'rgb(50,200,50)','rgb(50,200,200)',
                    'rgb(50,50,200)','rgb(200,50,200)'
            ]}],
            'options':{'responsive':false,'maintainAspectRatio':true}}}
    );
}

function handle_game_end() {
    private.iteration++;
    if(private.iteration < private.goal) {
        console.log("Iteration",private.iteration,"complete");

        adjust_pMatrix();
        reset_game();
    } else {
        console.log("Training complete");

        console.log("Time:",performance.now()-t0);

        document.getElementById('progress-bar').style.width = '100%';
        document.getElementById('player-html').style.display = 'none';
        adjust_pMatrix();
        clearInterval(f);
        const res = find_results();
        console.log({
            "river_river":res[0],
            "river_lake":res[1],
            "nertz_river":res[2],
            "nertz_lake":res[3],
            "stream_river":res[4],
            "stream_lake":res[5]
        });
        draw_results(res.map((i) => Math.round(i*100)/100));
        private.end = true;
    }
}

function main() {
    draw();
    compute();
    if(public.end) {
        handle_game_end();
    }
}
