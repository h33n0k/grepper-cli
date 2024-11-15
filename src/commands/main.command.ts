import yargs from 'yargs'
import colors from '@colors/colors'
import { Effect } from 'effect'
import * as utils from '../utils'
import * as schemas from '../schemas'
import * as services from '../services'
import { AnswerModel, PromptModel } from '../models'

export type CommandArgs = {
	query: string
	limit: number
}

export const command = ['$0', 'query [query]']
export const description = 'Query Grepper API'

const FetchHandler = (error: object & { message: string }, results: { cached: AnswerModel[] }) => {
	if (results.cached.length > 0) {
		utils.logger.warn(`${error.message} Could not update database.`)

		return Effect.succeed(results.cached)
	}

	return Effect.fail(error)
}

export const builder = (yargs: yargs.Argv) =>
	(yargs as yargs.Argv<CommandArgs>)
		.option('query', {
			alias: 'q',
			describe: 'Your search',
			type: 'string',
			demandOption: false
		})
		.option('limit', {
			alias: 'l',
			describe: 'Define answers limit.',
			type: 'number',
			default: 5
		})

export const handler = (argv: yargs.ArgumentsCamelCase<CommandArgs>) =>
	utils.config.get.pipe(
		Effect.andThen((config) =>
			Effect.gen(function* () {
				if (config.useDatabase) {
					yield* utils.database.connect()
				}

				return yield* Effect.succeed(config)
			})
		),
		Effect.flatMap((config) =>
			Effect.gen(function* () {
				let input = argv.query

				if (!input) {
					let suggestions: services.suggestion.Suggestion[] = []

					if (config.useDatabase) {
						suggestions = yield* services.suggestion.loadAnswers
					}

					input = yield* utils.input.ask({
						label: {
							text: 'Query',
							style: colors.cyan
						},
						suggestions
					})
				}

				return input
			}).pipe(
				Effect.flatMap((input) =>
					Effect.gen(function* () {
						let prompt: PromptModel
						const results: {
							cached: AnswerModel[]
							fetched: AnswerModel[]
						} = { cached: [], fetched: [] }

						if (config.useDatabase) {
							prompt = yield* services.prompt.create(input)
							results.cached = yield* services.prompt.getResults(prompt)
						} else {
							prompt = new PromptModel({ input })
						}

						return { prompt, results }
					})
				),
				Effect.flatMap(({ prompt, results }) =>
					Effect.gen(function* () {
						let answers: AnswerModel[] = []
						const fetched = yield* utils.api.search(prompt.input)

						if (config.useDatabase) {
							yield* services.prompt.saveResults(prompt, fetched as schemas.answer.Answer[])
							answers = yield* services.prompt.getResults(prompt)
						} else {
							answers = fetched.map((answer) => new AnswerModel(answer))
						}

						return answers
					}).pipe(
						Effect.catchTags({
							Request: (error) => FetchHandler(error, results),
							Response: (error) => FetchHandler(error, results)
						})
					)
				)
			)
		),
		Effect.catchAll(utils.logger.fatal),
		Effect.andThen((answers) => console.log(answers)),
		Effect.runPromise
	)
