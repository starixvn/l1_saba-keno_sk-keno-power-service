import { stub, stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { Core } from "sc-game-base";

import { choices, choicesMapper } from "../../../src/constants";
import { InGameConsumer } from "../../../src/consumers/in-game-consumer";
import { GameData } from "../../../src/game-data";
import { RoundQuery } from "../../../src/query-apis/round-query";

describe("in game consumer instance", () => {
    const definition = {
        id: 1510,
        name: "SkKenoPower2",
        durations: {
            wholeRound: 54,
            placingBets: 37,
            lockingBet: 5,
        },
        choices,
        choicesMapper,
        defaultBetTracks: {},
    };
    const gameData = new GameData(0);

    /** @type {mongoose.Model}*/
    const userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
    const roundQuery = stub(RoundQuery);
    const publisher = stub(Core.BaseEventPublishers.BaseEventPublisher);
    const getBalance = jest.fn();
    const realPlayer = {
        socketClient: {
            emit: jest.fn(),
        },
        profile: {
            name: "player01",
        },
    };

    const consumer = new InGameConsumer(definition, gameData, roundQuery, publisher, getBalance, userInfosRepository);

    it("should be instance of Core.BaseEventConsumers.InGameConsumer", () => {
        expect(consumer instanceof Core.BaseEventConsumers.InGameConsumer).toBeTruthy();
    });

    describe("buildPayload tests", () => {
        const basePayload = { roundId: 1, gameConfigs: {}, roundHistory: [], ownBets: {}, totalBets: {}, user: {} };
        beforeEach(() => {
            spyOn(Core.BaseEventConsumers.InGameConsumer.prototype, "buildPayload").and.callFake(() => basePayload);
        });

        it("should call super.buildPayload", async () => {
            // act
            await consumer.buildPayload(realPlayer);

            // assert
            expect(Core.BaseEventConsumers.InGameConsumer.prototype.buildPayload).toHaveBeenCalled();
        });

        it("should return correct result when remaining time greater than finish first half", async () => {
            // arrange
            gameData.remainingTime = definition.durations.lockingBet;
            gameData.currentMD5 = "md5hash";
            const expectedResult = {
                ...basePayload,
                md5: "md5hash",
            };

            // act
            const actualResult = await consumer.buildPayload(realPlayer);

            // assert
            expect(actualResult).toStrictEqual(expectedResult);
        });
    });
});
