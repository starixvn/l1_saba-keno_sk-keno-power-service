import { generateResult, getSettlementResult } from "../../../src/helpers/result-helper";
import { choices, choicesMapper } from "../../../src/constants";
import { hedgeBetGroups } from "../../../src/game-settings";
import getRoundRepository from "../../../src/models/rounds";
import getBetRepository from "../../../src/models/bets";
import getBetLogsRepository from "../../../src/models/bet-logs";

export default [
    {
        id: 1509,
        name: "KenoPower",
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
];
