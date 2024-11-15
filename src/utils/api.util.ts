import { Data, Effect, Schedule } from 'effect'
import colors from '@colors/colors'
import * as configUtil from './config.util'
import * as inputUtil from './input.util'
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

class RequestError extends Data.TaggedError('Request') {
	public readonly title = 'Request Error'
	public readonly error: unknown
	public readonly message: string
	constructor(error: unknown) {
		super()
		this.error = error
		this.message = this.getMessage()
	}

	private getMessage() {
		let message = 'Unexpected Error.'

		if (this.error && typeof this.error === 'object') {
			switch (true) {
				case this.error instanceof TypeError:
					if (
						'cause' in this.error &&
						this.error.cause &&
						typeof this.error.cause === 'object' &&
						'code' in this.error.cause &&
						this.error.cause.code &&
						typeof this.error.cause.code === 'string'
					) {
						switch (this.error.cause.code) {
							case 'ECONNREFUSED':
								message = 'Connection refused.'
								break
							case 'ENOTFOUND':
								message = 'Server not found.'
								break
							case 'ETIMEDOUT':
								message = 'Request timed out.'
								break
						}
					}

					break
				case 'name' in this.error:
					switch (this.error.name) {
						case 'AbortError':
							message = 'Request timed out.'
							break
					}
					break
			}
		}

		return message
	}
}

class ResponseError extends Data.TaggedError('Response') {
	public declare readonly title = 'Response Error'
	public readonly message: string
	public readonly status: number
	constructor(response: Response) {
		super()
		this.status = response.status
		this.message = this.getMessage()
	}

	private getMessage() {
		switch (this.status) {
			case 401:
				return 'Invalid API KEY.'
			case 429:
				return 'Too many requests.'
			case 500:
				return 'Internal Grepper error.'
			case 503:
				return 'Temporarily offline, try again later.'
			default:
				return 'An unknown error occurred. Please try again.'
		}
	}
}

const query = (url: string) =>
	configUtil.get.pipe(
		Effect.flatMap((config) => {
			if (!config.api_key) {
				return inputUtil
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
							const err = new RequestError(error)

							if (i !== config.requestRetryAmount) {
								logger.warn(`${err.message} Retrying.`)
							}

							return err
						}
					}),
					Schedule.addDelay(Schedule.recurs(config.requestRetryAmount - 1), () => '1 seconds')
				)

				if (!response.ok) {
					return yield* Effect.fail(new ResponseError(response))
				}

				const json = yield* Effect.tryPromise({
					try: () => response.json(),
					catch: (error) => new RequestError(error)
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
