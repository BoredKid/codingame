
const playerIdx = parseInt(readline());
const nbGames = parseInt(readline());

// game loop
while (true) {
    let scores = [];
    for (let i = 0; i < 3; i++) {
        scores[i] = readline();
    }
    let games = [];
    for (let i = 0; i < nbGames; i++) {
        var inputs = readline().split(' ');
        const gpu = inputs[0];
        const reg0 = parseInt(inputs[1]);
        const reg1 = parseInt(inputs[2]);
        const reg2 = parseInt(inputs[3]);
        const reg3 = parseInt(inputs[4]);
        const reg4 = parseInt(inputs[5]);
        const reg5 = parseInt(inputs[6]);
        const reg6 = parseInt(inputs[7]);
        games[i] = {
            gpu,
            reg0,
            reg1,
            reg2,
            reg3,
            reg4,
            reg5,
            reg6
        }
    }

    const nextMove = geneticAlgorithm(playerIdx, nbGames, scores, games);

    console.log(nextMove);
}
