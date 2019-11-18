window.onload = function() {
    setup();
    const fps = 50;
    f = setInterval(main, 1000/fps);
}

function setup() {
    private = {
        goal: 500,
        iteration: 0,
        pMatrices: Array.from(Array(4), () => [8,8,8,8,8,8]),
        winCount: Array.from(Array(4), () => 0)
    };
    public = {
        lake: [],
        players: Array.from(Array(4), (a,i) => new Player(private.pMatrices[i])),
        end: false,
        stall: 0
    };
}

function rankActionFreq(m) {
    //expected input [n1, n2, ..., n6]
    let ranked = Array.from(Array(m.length), () => 0);
    for(let i=0; i<m.length; ++i) {
        for(let j=0; j<m.length; ++j) {
            if(j!==i && m[j] < m[i]) {
                ranked[i]++;
            }
        }
    }
    return ranked;

}

function adjustPMatrix() {
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
            adjustmentMatrix = [-1,0,0,1,2,3];
            //record player win
            private.winCount[i]++;
        } else {
            //disincentivize behavior
            adjustmentMatrix = [1,1,0,0,-2,-2];
        }
        //adjust pMatrix accordingly
        const actFreq = rankActionFreq(public.players[i].actCount);
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

function resetGame() {
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

function findResults() {
    let avMatrix = Array.from(Array(6), () => 0);
    for(let i=0; i<public.players.length; ++i) {
        console.log({pMatrix:private.pMatrices[i],wins:private.winCount[i]});
        for(let j=0; j<avMatrix.length; ++j) {
            avMatrix[j] += private.winCount[i]*private.pMatrices[i][j];
        }
    }
    return avMatrix.map((i) => 100*i/avMatrix.reduce((a,b) => a+b));
}

function drawResults(all) {
    // for(let i=0; i<private.pMatrices.length; ++i) {
    //     let tag = 'chart-p'+i;
    //     new Chart(document.getElementById(tag).getContext('2d'),{
    //         'type': 'doughnut',
    //         'data': {
    //             'labels': [
    //                 'river_river','river_lake',
    //                 'nertz_river','nertz_lake',
    //                 'stream_river','stream_lake'
    //             ],
    //             'datasets': [{
    //                 'data': private.pMatrices[i],
    //                 'backgroundColor': [
    //                     'rgb(200,50,50)','rgb(200,200,50)',
    //                     'rgb(50,200,50)','rgb(50,200,200)',
    //                     'rgb(50,50,200)','rgb(200,50,200)'
    //                 ]}]}}
    //     );
    //     document.getElementById(tag).height = "150";
    //     document.getElementById(tag).style.height = "150px";
    //     document.getElementById(tag).width = "140";
    //     document.getElementById(tag).style.width = "140px";
    // }
    new Chart(document.getElementById('chart').getContext('2d'),{
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

function main() {
    //draw();
    compute();
    if(public.end) {
        if(private.iteration < private.goal-1) {
            private.iteration++;
            console.log("Iteration",private.iteration,"complete");

            adjustPMatrix();
            resetGame();
        } else {
            console.log("Training complete");

            adjustPMatrix();
            clearInterval(f);
            const res = findResults();
            console.log({
                "river_river":res[0],
                "river_lake":res[1],
                "nertz_river":res[2],
                "nertz_lake":res[3],
                "stream_river":res[4],
                "stream_lake":res[5]
            });
            drawResults(res);
        }

    }
}
