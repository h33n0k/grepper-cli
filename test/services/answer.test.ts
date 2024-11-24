import { Effect } from 'effect'
import { AnswerModel } from '../../src/models'
import * as service from '../../src/services/answer.service'
import * as schemas from '../../src/schemas'
import * as database from '../../src/utils/__mocks__/database.util'
import { faker } from '@faker-js/faker'

describe('answer.service module', () => {
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

	describe('create Effect', () => {
		let payload: schemas.answer.Answer = {
			id: faker.number.int({ max: 7000 }),
			title: faker.lorem.sentence(),
			author_name: faker.internet.username(),
			content: faker.lorem.paragraph(),
			upvotes: faker.number.int(100),
			downvotes: faker.number.int(100),
		}
		it('should create and return model from payload', async () => {
			const result = await Effect.runPromise(service.create(payload))
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(AnswerModel)
			expect(result.id).toEqual(payload.id)
			expect(await AnswerModel.count()).toEqual(database.itemsLength.answers + 1)
		})
		it('should return existing model when passing duplicate fields', async () => {
			const original = await AnswerModel.findOne()
			if (!original) {
				throw new Error('Expected the model to be defined.')
			}
			payload = {...payload, id: original.id}
			const result = await Effect.runPromise(service.create(payload))
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(AnswerModel)
			expect({...result}).toEqual({...original})
			expect(await AnswerModel.count()).toEqual(database.itemsLength.answers)
		})
	})

})
