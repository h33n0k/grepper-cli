import { Effect } from 'effect'
import { AnswerModel, PromptModel } from '../models'
import { DatabaseHandler } from '../handlers'

export interface Suggestion {
	text: string
}

export const load = Effect.gen(function* () {
	const prompts = yield* Effect.tryPromise({
		try: () =>
			PromptModel.findAll({
				include: {
					model: AnswerModel,
					order: [['createdAt', 'DESC']]
				},
				order: [['lastUse', 'DESC']],
				limit: 15
			}),
		catch: (error) => new DatabaseHandler.QueryError(error)
	})

	const answers = yield* Effect.tryPromise({
		try: () =>
			AnswerModel.findAll({
				limit: 15,
				order: [['score', 'DESC']]
			}),
		catch: (error) => new DatabaseHandler.QueryError(error)
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
