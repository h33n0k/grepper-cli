import { faker } from '@faker-js/faker'
import { Sequelize } from 'sequelize-typescript'
import { AnswerModel, PromptModel, MatchModel } from '../../models'

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: ':memory:',
	logging: false
})

sequelize.addModels([PromptModel, AnswerModel, MatchModel])

const itemsLength = {
	prompts: 4,
	answers: 15
}

const mockedItem = {
	prompts: Array(itemsLength.prompts)
		.fill(null)
		.map(
			() => () =>
				new PromptModel({
					input: faker.lorem.words({ min: 4, max: 10 })
				})
		),
	answers: Array(itemsLength.answers)
		.fill(null)
		.map(
			() => () =>
				new AnswerModel({
					id: faker.number.int({ max: 7000 }),
					title: faker.lorem.sentence(),
					author_name: faker.internet.username(),
					content: faker.lorem.lines(),
					upvotes: faker.number.int(100),
					downvotes: faker.number.int(100)
				})
		)
}

interface InitOptions {
	assignResults: boolean
	answers: boolean
	prompts: boolean
}

const defaultInitOptions: InitOptions = {
	assignResults: true,
	answers: true,
	prompts: true
}

const init = async (options?: Partial<InitOptions>) => {
	options = {
		...defaultInitOptions,
		...options
	}

	await sequelize.sync({ force: true })
	for (const key in mockedItem) {
		for (const call of mockedItem[key as keyof typeof mockedItem]) {
			const item = call()

			const status = (() => {
				switch (true) {
					case item instanceof PromptModel:
						return options.prompts
					case item instanceof AnswerModel:
						return options.answers
				}
			})()

			if (status) {
				await item.save()
			}
		}
	}

	if (options.answers && options.assignResults) {
		const answers = await AnswerModel.findAll()
		const prompts = await PromptModel.findAll()
		const results = new Map<number, number[]>()
		for (const answer of answers) {
			const id = prompts[Math.floor(Math.random() * prompts.length)].id

			if (results.has(id)) {
				results.get(id)?.push(answer.id)
			} else {
				results.set(id, [answer.id])
			}
		}

		for (const [id, values] of results) {
			const prompt = await PromptModel.findByPk(id)

			if (prompt) {
				await prompt.$set('results', values)
			}
		}
	}
}

const connect = () => sequelize.authenticate()
const disconnect = () => sequelize.close()

export { itemsLength, mockedItem, init, connect, disconnect }
