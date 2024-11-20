import { Effect } from 'effect'
import * as schemas from '../schemas'
import { AnswerModel } from '../models'
import { DatabaseHandler } from '../handlers'

export const create = (input: schemas.answer.Answer) =>
	Effect.gen(function* () {
		const [answer] = yield* Effect.tryPromise({
			try: () =>
				AnswerModel.findOrCreate({
					where: { id: input.id },
					defaults: input
				}),
			catch: (error) => new DatabaseHandler.QueryError(error)
		})

		return answer
	})
