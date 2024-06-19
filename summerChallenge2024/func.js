// GENETIC ALGO
// GENETIC ALGO CONSTS
export const POP = 45; // nombre de solutions par générations (multiple de 3 et 5)
export const ADN = 10; // nombre de genes (tours de jeu) contenus dans une solution
export const GENES = ["RIGHT", "UP", "DOWN", "LEFT"] // valeurs de gene possible (output de tour possible)
const GENERATIONS = 200; // nombre de générations
const MUTATIONS_NUMBER = 40; // nombre de mutations par génération

const NB_TURNS = 4; // nombre de manche en tournoi


// generate of first population of solution
export const initPopulation = () => {
    return Array(POP).fill(0).map(() => Array(ADN).fill(0).map(() => GENES[Math.floor(Math.random() * GENES.length)]))
}

// play a few turns of the game and return the scores of each solution
// we play the game 6 times with each solution playing each player
// but we rank the solution by the score they get as playerIdx ? (not sure about this)
export const playMatch = (gameState, solutions) => {

}

// create an opposition between all the solutions of a generations
export const tournament = (initialGameState, unrankedPopulation) => {
    let rankedPopulation = [...unrankedPopulation];
    for (let i = 0; i < NB_TURNS; i++) {
        for (let g = 0; g < rankedPopulation.length / 3; g++) {
            let pop = unrankedPopulation.slice(g * 3, (g + 1) * 3).reduce((acc, sol, index) => ({ ...acc, [index]: sol }), {});
            let scores = playMatch(initialGameState, pop);
            let rankedPop = Object.keys(scores).map((key) => ({ score: scores[key].score, solution: pop[key] }));
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
