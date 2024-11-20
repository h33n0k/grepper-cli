import { Effect } from 'effect'
import { AnswerModel, PromptModel } from '../models'
import * as AnswerService from './answer.service'
import * as schemas from '../schemas'
import { DatabaseHandler } from '../handlers'

export const create = (input: string) =>
	Effect.gen(function* () {
		const [prompt, created] = yield* Effect.tryPromise({
			try: () =>
				PromptModel.findOrCreate({
					where: { input },
					include: {
						model: AnswerModel,
						required: true
					},
					defaults: { input }
				}),
			catch: (error) => new DatabaseHandler.QueryError(error)
		})

		if (!created) {
			yield* Effect.tryPromise({
				try: () => prompt.update('updatedAt', new Date()),
				catch: (error) => new DatabaseHandler.QueryError(error)
			})
		}

		return prompt
	})

export const getResults = (prompt: PromptModel) =>
	Effect.tryPromise({
		try: () => prompt.$get('results'),
		catch: (error) => new DatabaseHandler.QueryError(error)
	})

export const saveResults = (prompt: PromptModel, answers: schemas.answer.Answer[]) =>
	Effect.gen(function* () {
		const models: AnswerModel[] = []
		for (const answer of answers) {
			models.push(yield* AnswerService.create(answer))
		}

		yield* Effect.tryPromise({
			try: () => prompt.$set('results', models),
			catch: (error) => new DatabaseHandler.QueryError(error)
		})

		return prompt
	})
