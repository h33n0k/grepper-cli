import { Effect } from 'effect'
import { AnswerModel, PromptModel } from '../../src/models'
import * as service from '../../src/services/suggestion.service'
import * as schemas from '../../src/schemas'
import * as database from '../../src/utils/__mocks__/database.util'
import { faker } from '@faker-js/faker'

describe('suggestion.service module', () => {
	beforeAll(async () => {
		await database.connect()
	})

	beforeEach(async () => {
		await database.init() // reset mocked database before each tests
		jest.clearAllMocks()
	})

	afterAll(async () => {
		await database.disconnect()
	})

	describe('load Effect', () => {
		it('should return array of suggestions', async () => {
			const promptSpy = jest.spyOn(PromptModel, 'findAll')
			const answerSpy = jest.spyOn(AnswerModel, 'findAll')
			const result = await Effect.runPromise(service.load)

			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					include: expect.objectContaining({
						model: expect.any(Function),
						order: expect.arrayContaining([['createdAt', 'DESC']]),
					}),
					order: expect.arrayContaining([['lastUse', 'DESC']]),
				})
			)
			expect(answerSpy).toHaveBeenCalledTimes(1)
			expect(answerSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					order: expect.arrayContaining([['score', 'DESC']]),
				})
			)

			expect(result).toBeInstanceOf(Array)
			expect(result.length).toEqual(database.itemsLength.prompts + database.itemsLength.answers)
			expect(result[0]).toEqual(expect.objectContaining({
				text: expect.any(String)
			}))

		})
	})

})
