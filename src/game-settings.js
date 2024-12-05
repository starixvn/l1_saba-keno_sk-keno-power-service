import { choices, choicesMapper } from "./constants";
import { getSettlementResult, generateResult } from "./helpers/result-helper";
import getBetLogsRepository from "./models/bet-logs";
import getBetRepository from "./models/bets";
import getRoundRepository from "./models/rounds";

export const hedgeBetGroups = [
    ["blue", "red"],
    ["big", "small"],
    ["even", "odd"],
    ["blueBig", "blueSmall"],
    ["redBig", "redSmall"],
];

export default [
    {
        id: 1509,
        name: "SkKenoPower",
        durations: {
            wholeRound: 50,
            placingBets: 42,
            lockingBet: 5,
        },
        choices,
        choicesMapper,
        defaultBetTracks: {},
        hedgeBetGroups,
        repositories: {
            roundsRepository: getRoundRepository("kenopower_rounds"),
            betsRepository: getBetRepository("kenopower_bets"),
            betLogsRepository: getBetLogsRepository("kenopower_betlogs"),
        },
        generateResult,
        settle: getSettlementResult,
    },
    {
        id: 1510,
        name: "SkKenoPower2",
        durations: {
            wholeRound: 54,
            placingBets: 42,
            lockingBet: 5,
        },
        choices,
        choicesMapper,
        defaultBetTracks: {},
        hedgeBetGroups,
        repositories: {
            roundsRepository: getRoundRepository("kenopower2_rounds"),
            betsRepository: getBetRepository("kenopower2_bets"),
            betLogsRepository: getBetLogsRepository("kenopower2_betlogs"),
        },
        generateResult,
        settle: getSettlementResult,
    },
];
