import { stub, stubMongooseModelStupidly } from "jest-micro-auto-stub";
import { when } from "jest-when";
import mongoose from "mongoose";
import { Core } from "sc-game-base";
import { choices, choicesMapper } from "../../../src/constants";
import { RoundResultConsumer, RoundResultPublisher } from "../../../src/consumers";
import { createHashMD5, randomString, encrypt } from "../../../src/helpers/crypto-helper";
import { sumArrayNumber } from "../../../src/helpers/array-helper";

jest.mock("../../../src/helpers/array-helper");
jest.mock("../../../src/helpers/crypto-helper");

describe("Round result consumer instance", () => {
    const mockDate = new Date(123456);
    let spy;
    // arrange
    const definition = {
        id: 1509,
        name: "KenoPower",
        durations: {
            wholeRound: 50,
            placingBets: 37,
            lockingBet: 5,
        },
        choices,
        choicesMapper,
        defaultBetTracks: {},
    };
    const gameData = new Core.GameData(0);

    /** @type {mongoose.Model}*/
    const roundsRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {RoundResultPublisher}*/
    const roundResultPublisher = stub(RoundResultPublisher);

    const roundResultConsumer = new RoundResultConsumer(gameData, definition, roundsRepository, roundResultPublisher);

    beforeEach(() => {
        gameData.roundId = 1;
        gameData.gameConfigs = { enabled: true };
        gameData.settlementResultFromAdmin = {};
        gameData.exchangeRates = { exId: 456 };
        definition.generateResult = jest.fn(() => ({
            blue: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            red: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        }));
        definition.settle = jest.fn();
    });

    beforeAll(() => {
        jest.useFakeTimers();
        spy = jest.spyOn(global, "Date").mockImplementation(() => mockDate);
    });
    afterAll(() => {
        jest.clearAllMocks();
        spy.mockRestore();
    });

    describe("generateResult tests", () => {
        it("should not call generateResult when set result from admin", async () => {
            // arrange
            gameData.roundId = 2;
            gameData.settlementResultFromAdmin = {
                roundId: 2,
                result: {
                    blue: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                    red: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                },
            };

            // act
            await roundResultConsumer.generateResult();

            // assert
            expect(definition.generateResult).not.toHaveBeenCalled();
        });

        it("should call generateResult when not set result from admin", async () => {
            // arrange
            gameData.roundId = 2;

            // act
            await roundResultConsumer.generateResult();

            // assert
            expect(definition.generateResult).toHaveBeenCalled();
        });

        it("should call createHashMD5 with expected format", async () => {
            // arrange
            gameData.roundId = 2;
            sumArrayNumber.mockReturnValueOnce(50).mockReturnValueOnce(60);
            randomString.mockReturnValue("asd");
            const resultKey = `{50;60}_{#2asd}`;

            // act
            await roundResultConsumer.generateResult();

            // assert
            expect(createHashMD5).toHaveBeenCalledWith(resultKey);
        });

        it("should store md5", async () => {
            // arrange
            gameData.roundId = 2;
            sumArrayNumber.mockReturnValueOnce(50).mockReturnValueOnce(60);
            randomString.mockReturnValue("asd");
            createHashMD5.mockReturnValue("md5string");

            // act
            await roundResultConsumer.generateResult();

            // assert
            expect(gameData.currentMD5).toEqual("md5string");
        });

        it("should create new round with encrypt result and md5string", async () => {
            // arrange
            gameData.roundId = 2;
            gameData.settlementResultFromAdmin = {
                roundId: 2,
                result: {
                    blue: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                    red: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                },
            };
            sumArrayNumber.mockReturnValueOnce(50).mockReturnValueOnce(60);
            randomString.mockReturnValue("asd");
            const resultKey = `{50;60}_{#2asd}`;
            createHashMD5.mockReturnValue("md5string");
            when(encrypt)
                .calledWith(resultKey)
                .mockReturnValue({ iv: 123, content: "encryptedResultString" })
                .calledWith(JSON.stringify(gameData.settlementResultFromAdmin.result))
                .mockReturnValue({ iv: 321, content: "encryptedResult" });

            // act
            await roundResultConsumer.generateResult();

            // assert
            expect(roundsRepository.create).toHaveBeenCalledWith({
                id: 2,
                md5: "md5string",
                resultKey: { iv: 123, content: "encryptedResultString" },
                encryptedResult: { iv: 321, content: "encryptedResult" },
                time: new Date(123456),
                exchangeRateId: gameData.exchangeRates.exId,
            });
        });
    });
});
