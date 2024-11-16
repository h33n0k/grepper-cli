import yargs from 'yargs'
import colors from '@colors/colors'
import { Effect } from 'effect'
import { input, components } from '../interface'
import * as utils from '../utils'
import * as schemas from '../schemas'
import * as services from '../services'
import { AnswerModel, PromptModel } from '../models'
import highlight from 'cli-highlight'

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
			default: 3
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
				let query = argv.query

				if (!query) {
					let suggestions: services.suggestion.Suggestion[] = []

					if (config.useDatabase) {
						suggestions = yield* services.suggestion.loadAnswers
					}

					query = yield* input.ask({
						label: {
							text: 'Query',
							style: colors.cyan
						},
						suggestions
					})
				}

				return query
			}).pipe(
				Effect.flatMap((query) =>
					Effect.gen(function* () {
						let prompt: PromptModel | undefined
						const results: {
							cached: AnswerModel[]
							fetched: AnswerModel[]
						} = { cached: [], fetched: [] }

						if (config.useDatabase) {
							prompt = yield* services.prompt.create(query)
							results.cached = yield* services.prompt.getResults(prompt)
						}

						return { prompt, results, query }
					})
				),
				Effect.flatMap(({ prompt, results, query }) =>
					Effect.gen(function* () {
						const fetched = yield* utils.api.search(prompt ? prompt.input : query)
						let answers: schemas.answer.Answer[] = [...fetched]

						if (prompt && config.useDatabase) {
							yield* services.prompt.saveResults(prompt, fetched as schemas.answer.Answer[])
							answers = [...yield* services.prompt.getResults(prompt)].map((answer): schemas.answer.Answer => ({
								id: answer.id,
								title: answer.title,
								author_name: answer.author_name,
								content: answer.content,
								upvotes: answer.upvotes,
								downvotes: answer.downvotes
							}))

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
		Effect.map((answers) => answers.sort((a, b) => {
			return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
		})),
		Effect.flatMap((answers) =>
			Effect.gen(function* () {
				for (let i = 0; i < answers.length; i++) {
					const answer = answers[i]
					const box = yield* components.Box(answer.content, {
						title: colors.blue(answer.title),
						contentStyle: highlight,
						numbers: true,
						subtexts: [
							answer.author_name,
							colors.green(`[+${answer.upvotes}]`),
							colors.red(`[+${answer.downvotes}]`)
						]
					})
					console.log(`${box}${i !== answers.length - 1 ? '\n' : ''}`)
				}
			})
		),
		Effect.catchAll((error) => {
			return utils.logger.fatal(error)
		}),
		Effect.runPromise
	)
