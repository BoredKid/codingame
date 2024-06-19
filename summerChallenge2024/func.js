
const geneticAlgorithm = (playerIdx, nbGames, scores, games) => {


    let myMedals = []; // my number of medals each turn by game
    let minScore = 99999999999;
    let minScoreGame = -1;
    for (let i = 0; i < 3; i++) {
        const scoreInfo = scores[i];
        if (i === playerIdx) {
            const allMyMedals = scoreInfo.split(" ").slice(1);
            for (let j = 0; j < 4; j++) {
                myMedals[j] = allMyMedals.slice(3 * j, 3 * j + 3);
                const gameScore = (myMedals[j][0] * 3 + myMedals[j][1])
                if (minScore > gameScore) {
                    minScore = gameScore;
                    minScoreGame = j;
                }
            }
        }

    }

    let movesAreValid = {
        RIGHT: 0,
        UP: 0,
        DOWN: 0,
        LEFT: 0,
    }

    for (let game = 0; game < nbGames; game++) {
        const { gpu,
            reg0,
            reg1,
            reg2,
            reg3,
            reg4,
            reg5,
            reg6 } = games[game];
        let baseScore = 1;
        // 224 before adding condition on game 3 below
        if (game === minScoreGame || (myMedals[game][0]) < 1) baseScore = 2;

        if (game === 0) { // haies
            const pos = [reg0, reg1, reg2];
            const currentPos = pos[playerIdx]
            const stun = [reg3, reg4, reg5];
            const stunTurns = stun[playerIdx];



            let nextWall = gpu.split("").reduce((acc, nature, cell) => nature === "#" ? [...acc, cell] : acc, [])
                .filter(cell => cell > currentPos)[0];


            if (gpu !== "GAME_OVER" && stunTurns === 0) {
                if (nextWall) {
                    // on peut essayer d'ajouter un modificateur pour prioriser RIGHT
                    if (nextWall > currentPos + 3) movesAreValid.RIGHT += baseScore;
                    if (nextWall > currentPos + 2) movesAreValid.DOWN += baseScore;
                    if (nextWall > currentPos + 1) movesAreValid.LEFT += baseScore;
                    if (nextWall !== currentPos + 2) movesAreValid.UP += baseScore;
                }
            }
        } else if (game === 1) {// tir à l'arc{}
            const coord = [{ x: reg0, y: reg1 }, { x: reg2, y: reg3 }, { x: reg4, y: reg5 }];
            const myCoord = coord[playerIdx];



            if (gpu !== "GAME_OVER") {
                let wind = parseInt(gpu.split("")[0]);
                if (wind) {
                    if (Math.abs(myCoord.x + wind) < Math.abs(myCoord.x)) movesAreValid.RIGHT += baseScore;
                    if (Math.abs(myCoord.y + wind) < Math.abs(myCoord.y)) movesAreValid.DOWN += baseScore;
                    if (Math.abs(myCoord.x - wind) < Math.abs(myCoord.x)) movesAreValid.LEFT += baseScore;
                    if (Math.abs(myCoord.y - wind) < Math.abs(myCoord.y)) movesAreValid.UP += baseScore;
                }
            }

        } else if (game === 2) {// roller
            const pos = [reg0, reg1, reg2];
            const currentPos = pos[playerIdx]
            const risks = [reg3, reg4, reg5];
            const myRisk = risks[playerIdx];
            const turnsLeft = parseInt(inputs[7]);

            if (gpu !== "GAME_OVER") {
                let riskOrder = gpu.split("").reduce((acc, action, index) => ({ ...acc, [action]: index }), {})
                if (myRisk + riskOrder.R < 4) movesAreValid.RIGHT += baseScore;
                if (myRisk + riskOrder.D < 4) movesAreValid.DOWN += baseScore;
                if (myRisk + riskOrder.L < 4) movesAreValid.LEFT += baseScore;
                if (myRisk + riskOrder.U < 4) movesAreValid.UP += baseScore;
            }

        } else if (game === 3) {// plongée

            const scores = [reg0, reg1, reg2];
            const currentScore = scores[playerIdx]

            const combos = [reg3, reg4, reg5];
            const myCombo = combos[playerIdx];

            if (gpu !== "GAME_OVER") {
                let nextMove = gpu.split("")[0]
                if (nextMove === "R") movesAreValid.RIGHT += baseScore;
                if (nextMove === "D") movesAreValid.DOWN += baseScore;
                if (nextMove === "L") movesAreValid.LEFT += baseScore;
                if (nextMove === "U") movesAreValid.UP += baseScore;
            }
        }




    }
    console.error(movesAreValid)
    let sortedValidMoves = Object.keys(movesAreValid).sort((key1, key2) => movesAreValid[key2] - movesAreValid[key1])
    console.error(sortedValidMoves)
    return sortedValidMoves[0]

}
