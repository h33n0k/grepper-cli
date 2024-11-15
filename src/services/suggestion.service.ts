import { Effect } from 'effect'
import { AnswerModel, PromptModel } from '../models'
import * as utils from '../utils'

export interface Suggestion {
	text: string
}

export const loadAnswers = Effect.gen(function* () {
	const prompts = yield* Effect.tryPromise({
		try: () =>
			PromptModel.findAll({
				include: {
					model: AnswerModel,
					order: [['upvotes', 'DESC']]
				},
				order: [['updatedAt', 'DESC']],
				limit: 30
			}),
		catch: (error) => new utils.database.QueryError(error)
	})

	const answers = yield* Effect.tryPromise({
		try: () =>
			AnswerModel.findAll({
				limit: 30,
				order: [['score', 'DESC']]
			}),
		catch: (error) => new utils.database.QueryError(error)
	})

	return [...prompts, ...answers]
		.map((item): Suggestion | null => {
			switch (true) {
				case item instanceof PromptModel:
					return { text: item.input }
				case item instanceof AnswerModel:
					return { text: item.title }
				default:
					return null
			}
		})
		.filter((suggestion) => !!suggestion)
})
