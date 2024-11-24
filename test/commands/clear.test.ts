import yargs from 'yargs'
import { ConfigHandler } from '../../src/handlers'
import * as databaseUtil from '../../src/utils/database.util'
import * as command from '../../src/commands/clear.command'
import { Effect } from 'effect'

describe('clear.command module', () => {

	beforeAll(() => {
		jest.resetAllMocks()
	})

	it('should force database synchronisation', async () => {
		jest.spyOn(databaseUtil, 'connect').mockImplementation(() =>
			Effect.gen(function* () {})
		)

		await Effect.runPromise(command.handler())
		expect(databaseUtil.connect).toHaveBeenCalledWith(true)
	})

})

