import {
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	validate as validateClass,
	ValidationError
} from 'class-validator'
import path from 'path'
import { Data, Effect } from 'effect'
import * as fileUtil from './file.util'

export class Config {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	api_key?: string

	@IsBoolean()
	useDatabase: boolean

	@IsNumber()
	requestTimeout: number

	@IsNumber()
	requestRetryAmount: number

	constructor(data: Config) {
		Object.assign(this, data)
	}
}

const defaultConfig = new Config({
	useDatabase: true,
	requestTimeout: 5000,
	requestRetryAmount: 3
})

class ConfigError extends Data.TaggedError('Config') {
	public readonly title = 'Config Error'
	public readonly message: string
	constructor(error: unknown) {
		super()
		this.message = 'Unexpected Error has occured during the validation of the configuration file.'

		switch (true) {
			case error instanceof ValidationError:
				if (error.constraints) {
					this.message = `Parameter ${error.constraints[Object.keys(error.constraints)[0]]}.`
				}

				break
			case error instanceof SyntaxError:
				this.message = 'Failed to parse conguration file.'
				break
		}
	}
}

const validate = (config: Config) =>
	Effect.tryPromise({
		try: () => validateClass(config),
		catch: () => new ConfigError('unexpected')
	}).pipe(
		Effect.flatMap((errors) =>
			errors.length > 0 ? Effect.fail(new ConfigError(errors[0])) : Effect.succeed(config)
		)
	)

const configFile = fileUtil.getConfigDir.pipe(
	Effect.flatMap((dir) => Effect.succeed(path.join(dir, 'config.json')))
)

const write = (config: Config) =>
	validate(config).pipe(
		Effect.flatMap((config) =>
			Effect.gen(function* () {
				const file = yield* configFile
				yield* fileUtil.write(file, JSON.stringify(config, null, '\t'))

				return config
			})
		)
	)

export const set = <K extends keyof Config>(key: K, value: Config[K]) =>
	Effect.gen(function* () {
		const config = yield* get
		config[key] = value

		return config
	}).pipe(Effect.flatMap(write))

export const get = configFile.pipe(
	Effect.flatMap((file) =>
		fileUtil.exists(file).pipe(
			// check if file exists
			Effect.flatMap((file) =>
				fileUtil.read(file).pipe(
					// read file
					Effect.flatMap((content) =>
						Effect.try({
							// parse content to json
							try: () => JSON.parse(content),
							catch: (error) => new ConfigError(error)
						})
					),
					Effect.flatMap((json) => Effect.succeed(new Config(json))),
					Effect.flatMap(validate) // check config
				)
			),
			Effect.catchTags({
				Path: () => write(defaultConfig) // if file does not exists write default
			})
		)
	)
)
