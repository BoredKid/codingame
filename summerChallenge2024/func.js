// Game state interface
// {
//     playerIdx: int;
//     nbGames: int;
//     scores: string[][]; // tableau de 12 nombres chaque nombre représentant les médailles pour chaques jeu
//     games: {
//         gpu: string;
//         reg0: int;
//         reg1: int;
//         reg2: int;
//         reg3: int;
//         reg4: int;
//         reg5: int;
//         reg6: int;
//     }[];
// }

// jeux 0:  haies
// jeux 1:  tir à l'arc
// jeux 2:  roller
// jeux 3:  plongée

// GENETIC ALGO
// GENETIC ALGO CONSTS
export const POP = 45; // nombre de solutions par générations (multiple de 3 et 5)
export const ADN = 10; // nombre de genes (tours de jeu) contenus dans une solution
export const GENES = ["RIGHT", "UP", "DOWN", "LEFT"] // valeurs de gene possible (output de tour possible)
const GENERATIONS = 200; // nombre de générations
const MUTATIONS_NUMBER = 40; // nombre de mutations par génération

const NB_TURNS_TOURNAMENT = 4; // nombre de manche en tournoi



// generate of first population of solution
export const initPopulation = () => {
    return Array(POP).fill(0).map(() => Array(ADN).fill(0).map(() => GENES[Math.floor(Math.random() * GENES.length)]))
}

// TODO: work in progress
export const playTurn = (gameState, nextMoves) => {
    let newGameState = { ...gameState };
    for (let game = 0; game < gameState.nbGames; game++) {
        let newMedals = playGame[game](nextMoves, gameState.games[game]);
    }

    return newGameState;
}

// play a few turns of the game and return the scores of each solution
// we play the game 6 times with each solution playing each player
// but we rank the solution by the score they get as playerIdx ? (not sure about this)
export const playMatch = (initGameState, solutions) => {
    let results = [0, 0, 0];
    let orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (let i = 0; i < 6; i++) {
        let gameState = { ...initGameState };
        for (let t = 0; t < ADN; t++) {
            let nextMoves = ["", "", ""];
            nextMoves[gameState.playerIdx] = solutions[orders[i][0]][t];
            nextMoves[(gameState.playerIdx + 1) % 3] = solutions[orders[i][1]][t];
            nextMoves[(gameState.playerIdx + 2) % 3] = solutions[orders[i][2]][t];
            gameState = playTurn(gameState, nextMoves);
        }
        const initScore = initGameState.scores[initGameState.playerIdx];
        const finalScore = gameState.scores[initGameState.playerIdx];
        results[orders[i][0]] += finalScore - initScore;
    }
    return results;
}

// create an opposition between all the solutions of a generations
export const tournament = (initialGameState, unrankedPopulation) => {
    let rankedPopulation = [...unrankedPopulation];
    for (let i = 0; i < NB_TURNS_TOURNAMENT; i++) {
        for (let g = 0; g < rankedPopulation.length / 3; g++) {
            let pop = unrankedPopulation.slice(g * 3, (g + 1) * 3).reduce((acc, sol, index) => ({ ...acc, [index]: sol }), {});
            let scores = playMatch(initialGameState, pop);
            let rankedPop = Object.keys(scores).map((key) => ({ score: scores[key], solution: pop[key] }));
            if (g === 0) {
                rankedPopulation[g] = rankedPop[0].solution;
                rankedPopulation[g * 3 + 1] = rankedPop[1].solution;
                rankedPopulation[(g + 1) * 3] = rankedPop[2].solution;
            } else if (g === ((unrankedPopulation.length / 3) - 1)) {
                rankedPopulation[(g - 1) * 3 + 2] = rankedPop[0].solution;
                rankedPopulation[g * 3 + 1] = rankedPop[1].solution;
                rankedPopulation[g * 3 + 2] = rankedPop[2].solution;
            } else {
                rankedPopulation[(g - 1) * 3 + 2] = rankedPop[0].solution;
                rankedPopulation[g * 3 + 1] = rankedPop[1].solution;
                rankedPopulation[(g + 1) * 3] = rankedPop[2].solution;
            }
        }
    }

    return rankedPopulation;
}

// generate a new population based on the ranking of the population of the previous generation
export const getNewPopulation = (rankedPopulation) => {
    let fifthPop = POP / 5;
    let newPop = rankedPopulation.slice(0, fifthPop);
    for (let a = 0; a < fifthPop; a++) {
        let newIndividual1 = [];
        let newIndividual2 = [];
        for (let m = 0; m < ADN; m++) {
            if (m % 2 === 0) {
                newIndividual1[m] = rankedPopulation[a][m];
                newIndividual2[m] = rankedPopulation[a + 1][m];
            } else {
                newIndividual2[m] = rankedPopulation[a][m];
                newIndividual1[m] = rankedPopulation[a + 1][m];
            }
        }
        newPop = newPop.concat([newIndividual1, newIndividual2])
    }
    for (let b = 0; b < fifthPop; b++) {
        let newIndividual = [];
        for (let m = 0; m < ADN; m++) {
            if (m <= ADN / 2) {
                newIndividual[m] = rankedPopulation[b][m];
            } else {
                newIndividual[m] = rankedPopulation[b + 1][m];
            }
        }
        newPop = newPop.concat([newIndividual])
    }
    for (let c = 0; c < fifthPop; c++) {
        newPop = newPop.concat([Array(ADN).fill(0).map(() => GENES[Math.floor(Math.random() * GENES.length)])])
    }

    for (let m = 0; m < MUTATIONS_NUMBER; m++) {
        let i = 1 + Math.floor(Math.random() * (POP - 1)); // on ne veut pas muter le premier
        let g = Math.floor(Math.random() * ADN);
        newPop[i][g] = GENES[Math.floor(Math.random() * GENES.length)];
    }

    return newPop;
}

const geneticAlgorithm = (playerIdx, nbGames, scores, games) => {
    const gameState = { playerIdx, nbGames, scores, games }

    let population = initPopulation();
    for (let g = 0; g < GENERATIONS; g++) {
        const rankedPopulation = tournament(gameState, population)
        population = getNewPopulation(rankedPopulation);
    }

    return population[0][0]; // the best solution

}
