import { Effect, Schedule } from 'effect'
import { ApiHandler } from '../handlers'
import colors from '@colors/colors'
import * as configUtil from './config.util'
import { input } from '../interface'
import { Schema } from '@effect/schema'
import * as schemas from '../schemas'
import logger from './logger.util'

interface endpointsProxy {
	base: string
	search: string
	answer: string
}

export const endpoints = new Proxy<endpointsProxy>(
	{
		base: 'https://api.grepper.com/v1/',
		search: 'answers/search',
		answer: 'answer/'
	},
	{
		get(target, prop) {
			if (typeof prop === 'string') {
				if (prop !== 'base') {
					if (prop in target) {
						return `${target.base}${target[prop as keyof endpointsProxy]}`
					}
				}
			}

			return target.base
		}
	}
)

export const query = (url: string) =>
	configUtil.load.pipe(
		Effect.flatMap((config) => {
			if (!config.api_key) {
				return input
					.ask({
						label: {
							text: 'Your Grepper API',
							style: colors.blue
						},
						suggestions: []
					})
					.pipe(Effect.flatMap((response) => configUtil.set('api_key', response)))
			}

			return Effect.succeed(config)
		}),
		Effect.flatMap((config) =>
			Effect.gen(function* () {
				const headers = new Headers()
				headers.set('Authorization', 'Basic ' + btoa(`${config.api_key}:`))

				let i = 0
				const response = yield* Effect.retry(
					Effect.tryPromise({
						try: () => {
							i++
							const controller = new AbortController()
							const timeout = setTimeout(() => controller.abort(), config.requestTimeout)

							return new Promise<Response>(async (resolve, reject) => {
								fetch(url, { headers, signal: controller.signal }).then(resolve).catch(reject)
							}).finally(() => clearTimeout(timeout))
						},
						catch: (error) => {
							const err = new ApiHandler.RequestError(error)

							if (i !== config.requestRetryAmount) {
								logger.warn(`${err.message} Retrying.`)
							}

							return err
						}
					}),
					Schedule.addDelay(Schedule.recurs(config.requestRetryAmount - 1), () => '1 seconds')
				)

				if (!response.ok) {
					return yield* Effect.fail(new ApiHandler.ResponseError(response))
				}

				const json = yield* Effect.tryPromise({
					try: () => response.json(),
					catch: (error) => new ApiHandler.RequestError(error)
				})

				return json
			})
		)
	)

export const search = (input: string) =>
	query(`${endpoints.search}?${new URLSearchParams({ query: input })}`).pipe(
		Effect.flatMap((response) =>
			Schema.decodeUnknown(schemas.answer.response, {
				onExcessProperty: 'ignore'
			})(response).pipe(Effect.flatMap(({ data }) => Effect.succeed(data)))
		)
	)
