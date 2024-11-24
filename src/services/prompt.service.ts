import { Effect } from 'effect'
import { AnswerModel, PromptModel } from '../models'
import * as AnswerService from './answer.service'
import * as schemas from '../schemas'
import { DatabaseHandler } from '../handlers'

export const create = (payload: string) =>
	Effect.gen(function* () {
		let [prompt, created] = yield* Effect.tryPromise({
			try: () =>
				PromptModel.findOrCreate({
					where: {
						input: payload
					},
					include: {
						model: AnswerModel,
						required: true
					},
					defaults: { input: payload }
				}),
			catch: (error) => new DatabaseHandler.QueryError(error)
		})

		if (!created) {
			prompt = yield* Effect.tryPromise({
				try: () => {
					const date = new Date()
					prompt.set('lastUse', date)

					return prompt.save()
				},
				catch: (error) => new DatabaseHandler.QueryError(error)
			})
		}

		return prompt
	})

export const saveResults = (prompt: PromptModel, answers: schemas.answer.Answer[]) =>
	Effect.gen(function* () {
		const models = yield* Effect.all(answers.map((answer) => AnswerService.create(answer)))

		yield* Effect.tryPromise({
			try: () => prompt.$set('results', models),
			catch: (error) => new DatabaseHandler.QueryError(error)
		})

		return prompt
	})
