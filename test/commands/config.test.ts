import yargs from 'yargs'
import { ConfigHandler } from '../../src/handlers'
import * as configUtil from '../../src/utils/config.util'
import * as command from '../../src/commands/config.command'
import { Effect } from 'effect'

jest.mock('../../src/utils/file.util', () => {
	const { Effect } = require('effect')
	return {
		...jest.requireActual('../../src/utils/file.util'),
		write: (path: string, _: string) => Effect.gen(function* () {
			return path
		})
	}
})

jest.mock('../../src/utils/config.util', () => {
	const { Effect } = require('effect')
	return {
		...jest.requireActual('../../src/utils/config.util'),
		set: jest.fn(() => Effect.gen(function* () {
			return configUtil.defaultConfig
		})),
		load: Effect.gen(function* () {
			return configUtil.defaultConfig
		})
	}
})

let mockedArgs: yargs.ArgumentsCamelCase<command.CommandArgs>

describe('config.command module', () => {

	beforeAll(() => {
		jest.resetAllMocks()
		mockedArgs = {
			'_': ['config'],
			value: '',
			'$0': 'grepper',
			param: ''
		}
	})

	it('should output config when no argument passed', async () => {
		const mockedConsole = jest.spyOn(console, 'log').mockImplementation(jest.fn())
		const result = await Effect.runPromise(command.handler(mockedArgs))
		expect(console.log).toHaveBeenCalled()
		const output = mockedConsole.mock.lastCall![0].replace(/\x1B\[\d{1,2}(;\d{1,2})*m/g, '')
		expect({...configUtil.defaultConfig}).toStrictEqual({...JSON.parse(output)})
		expect(result).not.toBeDefined()
	})

	it('should output config param when param is passed', async () => {
		mockedArgs.param = 'useDatabase'
		const mockedConsole = jest.spyOn(console, 'log').mockImplementation(jest.fn())
		const result = await Effect.runPromise(command.handler(mockedArgs))
		expect(console.log).toHaveBeenCalled()
		expect(configUtil.defaultConfig.useDatabase).toEqual(mockedConsole.mock.lastCall![0])
		expect(result).not.toBeDefined()
	})

	it('should return error if param is invalid', async () => {
		mockedArgs.param = 'invalid_param'
		await command.handler(mockedArgs).pipe(
			Effect.match({
				onFailure: (error) => {
					expect(error).toBeInstanceOf(ConfigHandler.ConfigError)
				},
				onSuccess: () => {
					throw new Error('Expected the Effect to fail.')
				}
			}),
			Effect.runPromise
		)
	})

	it('should return set config param when value is passed', async () => {
		mockedArgs.param = 'api_key'
		mockedArgs.value = 'key'
		const setSpy = jest.spyOn(configUtil, 'set').mockImplementation(() => Effect.succeed(configUtil.defaultConfig))
		const result = await Effect.runPromise(command.handler(mockedArgs))
		expect(setSpy).toHaveBeenCalledWith(mockedArgs.param, mockedArgs.value)
		expect(result).not.toBeDefined()
	})

	it('should return error if param is invalid', async () => {
		mockedArgs.param = 'invalid_param'
		mockedArgs.value = 'key'
		const setSpy = jest.spyOn(configUtil, 'set').mockImplementation(() => Effect.succeed(configUtil.defaultConfig))
		await command.handler(mockedArgs).pipe(
			Effect.match({
				onFailure: (error) => {
					expect(error).toBeInstanceOf(ConfigHandler.ConfigError)
				},
				onSuccess: () => {
					throw new Error('Expected the Effect to fail.')
				}
			}),
			Effect.runPromise
		)
		expect(setSpy).not.toHaveBeenCalledWith(mockedArgs.param, mockedArgs.value)
	})

})

