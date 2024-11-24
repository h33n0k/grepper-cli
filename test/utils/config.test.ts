import { Effect } from 'effect'
import { ConfigHandler, FileHandler } from '../../src/handlers'
import * as util from '../../src/utils/config.util'
import * as fileUtil from '../../src/utils/file.util'
import * as mockedFileUtil from '../../src/utils/__mocks__/file.util'
import path from 'path'

jest.mock('../../src/utils/file.util')

describe('config.util module', () => {

	beforeAll(() => {
		jest.resetAllMocks()
	})

	describe('configFile Effect', () => {
		for (const platform in mockedFileUtil.configDir) {
			describe(platform, () => {
				it('should return the correct config file path', async () => {
					const result = await Effect.runPromise(util.configFile)
					expect(result).toBe(path.join(mockedFileUtil.configDir[platform].get!(), 'config.json'))
				})
			})
		}
	})

	describe('validate Effect', () => {
		it('should return the config if valid', async () => {
			const config = util.defaultConfig
			const result = await Effect.runPromise(util.validate(config))
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(util.Config)
			expect(JSON.stringify(result)).toBe(JSON.stringify(config))
		})
		it('should return an error if the config is invalid', async () => {
			const config = new util.Config({ type: 'invalid-config' } as any)
			await util.validate(config).pipe(
				Effect.match({
					onFailure: (error) => {
						expect(error).toBeDefined()
						expect(error).toBeInstanceOf(ConfigHandler.ConfigError)
					},
					onSuccess: () => {
						throw new Error('Expected the Effect to fail.')
					}
				}),
				Effect.runPromise
			)
		})
	})

	describe('write Effect', () => {
		it('should save a valid config into the config file', async () => {
			const config = util.defaultConfig
			jest.spyOn(util, 'validate').mockImplementation((config: util.Config) => Effect.succeed(config))
			jest.spyOn(fileUtil, 'write').mockImplementation((p: string) => Effect.succeed(p))
			const result = await Effect.runPromise(util.write(config))
			expect({...result}).toStrictEqual({...config})
			expect(util.validate).toHaveBeenCalledWith(config)
			expect(fileUtil.write).toHaveBeenCalledWith(
				mockedFileUtil.configDir.linux.config!(),
				JSON.stringify(config, null, '\t')
			)
		})
	})

	describe('set Effect', () => {

		it('should set and save config param', async () => {
			const custom_key = 'custom_api_key'
			const expectedConfig = new util.Config({...util.defaultConfig, api_key: custom_key})
			jest.spyOn(fileUtil, 'exists').mockImplementation((f: string) => Effect.succeed(f))
			jest.spyOn(fileUtil, 'read').mockImplementation(() => Effect.succeed(JSON.stringify(util.defaultConfig, null, '\t')))
			jest.spyOn(util, 'write').mockImplementation((config: util.Config) => Effect.succeed(config))
			const result = await Effect.runPromise(util.set('api_key', custom_key))
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(util.Config)
			expect({...result}).toStrictEqual({...expectedConfig})
			expect(util.write).toHaveBeenCalledWith(expectedConfig)
		})
	})

	describe('load Effect', () => {
		it('should read the config file if exists', async () => {
			const config = util.defaultConfig
			const configString = JSON.stringify(config, null, '\t')
			jest.spyOn(fileUtil, 'exists').mockImplementation((p: string) => Effect.succeed(p))
			jest.spyOn(fileUtil, 'read').mockImplementation(() => Effect.succeed(configString))
			const result = await Effect.runPromise(util.load)
			expect(fileUtil.exists).toHaveBeenCalledWith(mockedFileUtil.configDir.linux.config!())
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(util.Config)
			expect({...result}).toStrictEqual({...config})
		})
		it('should write default config if file does not exit', async () => {
			jest.spyOn(fileUtil, 'exists').mockImplementation((p: string) =>
				Effect.fail(new FileHandler.PathError(p))
			)
			jest.spyOn(util, 'write').mockImplementation((config: util.Config) => Effect.succeed(config))
			const result = await Effect.runPromise(util.load)
			expect(fileUtil.exists).toHaveBeenCalledWith(mockedFileUtil.configDir.linux.config!())
			expect(util.write).toHaveBeenCalledWith(util.defaultConfig)
			expect(result).toBeDefined()
			expect(result).toBeInstanceOf(util.Config)
			expect({...result}).toStrictEqual({...util.defaultConfig})
		})
	})

})
