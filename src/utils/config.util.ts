import {
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	validate as validateClass
} from 'class-validator'
import path from 'path'
import { Effect } from 'effect'
import * as fileUtil from './file.util'
import { ConfigHandler } from '../handlers'

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

export const defaultConfig = new Config({
	useDatabase: true,
	requestTimeout: 5000,
	requestRetryAmount: 3
})

export const validate = (config: Config) =>
	Effect.tryPromise({
		try: () => validateClass(config),
		catch: () => new ConfigHandler.ConfigError('unexpected')
	}).pipe(
		Effect.flatMap((errors) =>
			errors.length > 0
				? Effect.fail(new ConfigHandler.ConfigError(errors[0]))
				: Effect.succeed(config)
		)
	)

export const configFile = fileUtil.getConfigDir.pipe(
	Effect.flatMap((dir) => Effect.succeed(path.join(dir, 'config.json')))
)

export const write = (config: Config) =>
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
		const config = yield* load
		config[key] = value

		return config
	}).pipe(Effect.flatMap(write))

export const load = configFile.pipe(
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
							catch: (error) => new ConfigHandler.ConfigError(error)
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
