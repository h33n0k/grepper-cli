import { Effect } from 'effect'
import { AnswerModel, PromptModel } from '../../src/models'
import * as schemas from '../../src/schemas'
import * as service from '../../src/services/prompt.service'
import * as AnswerService from '../../src/services/answer.service'
import * as database from '../../src/utils/__mocks__/database.util'
import { faker } from '@faker-js/faker'
import Prompt from 'models/prompt.model'


describe('answer.service module', () => {
	beforeAll(async () => {
		await database.connect()
	})

	afterAll(async () => {
    await database.disconnect()
	})

	describe('create Effect', () => {

		beforeEach(async () => {
			await database.init() // reset mocked database before each tests
		})

		it('should create and return model from payload', async () => {
			let payload: string = faker.lorem.words({ min: 4, max: 10 })
			const result = await Effect.runPromise(service.create(payload))
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(PromptModel)
			expect(result.input).toEqual(payload)
			expect(await PromptModel.count()).toEqual(database.itemsLength.prompts + 1)
		})
		it('should return updated existing model when passing duplicate fields', async () => {
			const original = await PromptModel.findOne()
			if (!original) {
				throw new Error('Expected the model to be defined.')
			}
			let payload = original.input
			await new Promise((resolve) => setTimeout(resolve, 500)) // pause to stimulate lastUse field.
			const result = await Effect.runPromise(service.create(payload))
			expect(result.lastUse.getTime()).toBeGreaterThan(original.lastUse.getTime())
			expect(original.id).toEqual(result.id)
			expect(original.input).toEqual(result.input)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(PromptModel)
			expect(await PromptModel.count()).toEqual(database.itemsLength.prompts)
		})
	})

	describe('saveResults', () => {

		beforeEach(async () => {
			await database.init({ answers: false })
		})

		const answers = Array(5).fill((): schemas.answer.Answer => ({
			id: faker.number.int({ max: 7000 }),
			title: faker.lorem.sentence(),
			author_name: faker.internet.username(),
			content: faker.lorem.lines(),
			upvotes: faker.number.int(100),
			downvotes: faker.number.int(100),
		})).map((answer) => answer())

		it('should save answers as resuls', async () => {
			const model = await PromptModel.findByPk(1, {
				include: {
					model: AnswerModel
				}
			})

			if (!model) {
				throw new Error('Expect the model to be defined.')
			}

			const createSpy = jest.spyOn(AnswerService, 'create')

			expect(model.results.length).toEqual(0)
			const result = await Effect.runPromise(service.saveResults(model, answers))
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(PromptModel)
			expect(createSpy).toHaveBeenCalledTimes(answers.length)
			const newModel = await PromptModel.findByPk(1, {
				include: {
					model: AnswerModel
				}
			})

			if (!newModel) {
				throw new Error('Expect the model to be defined.')
			}

			expect(newModel.results.length).toEqual(answers.length)
		})
	})

})
