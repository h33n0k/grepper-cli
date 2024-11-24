import fs from 'fs'
import path from 'path'
import os from 'os'
import stream from 'stream'
import { Effect } from 'effect'
import * as util from '../../src/utils/file.util'
import * as mockedFileUtil from '../../src/utils/__mocks__/file.util'
import { FileHandler } from '../../src/handlers'

jest.mock('fs')
jest.mock('os')
jest.mock('path')

describe('file.util module', () => {

	beforeAll(() => {
		jest.resetAllMocks()
	})

	describe('exists Effect', () => {
		const file = 'test-file.txt'
		it('should return an error if element does not exist', async () => {
			;(fs.existsSync as jest.Mock).mockReturnValue(false)
			const result = await util.exists(file).pipe(
				Effect.match({
					onFailure: (error) => {
						expect(error).toBeDefined()
						expect(error).toBeInstanceOf(FileHandler.PathError)
						expect(error.path).toBe(file)
					},
					onSuccess: () => {
						throw new Error('Expected the Effect to fail.')
					}
				}),
				Effect.runPromise
			)
		})
		it('should return path if element exists', async () => {
			;(fs.existsSync as jest.Mock).mockReturnValue(true)
			const result = await Effect.runPromise(util.exists(file))
			expect(result).toBeDefined()
			expect(result).toBe(file)
			expect(fs.existsSync).toHaveBeenCalledWith(file)
		})
	})

	describe('getConfigDir Effect', () => {

		it('should return an error if the platform is not supported', async () => {
			;(os.platform as jest.Mock).mockReturnValue('invalid-platform-name')
			;(fs.mkdir as unknown as jest.Mock).mockImplementation((_, __, cb) => cb(null))

			await util.getConfigDir.pipe(
				Effect.match({
					onFailure: (error) => {
						expect(error).toBeDefined()
						expect(error).toBeInstanceOf(FileHandler.ConfigDirError)
					},
					onSuccess: () => {
						throw new Error('Expected the Effect ti fail.')
					}
				}),
				Effect.runPromise
			)

			expect(os.platform).toHaveBeenCalled()
			expect(fs.mkdir).not.toHaveBeenCalled()
		})

		for (const platform in mockedFileUtil.configDir) {
			describe(`${platform}`, () => {
				const configDir = mockedFileUtil.configDir[platform]
				it('should return the correct config path', async () => {
					;(os.platform as jest.Mock).mockReturnValue(platform)
					;(os.homedir as jest.Mock).mockReturnValue(configDir.home)
					jest.spyOn(util, 'exists').mockImplementation((path: string) => Effect.succeed(path))
					;(fs.mkdir as unknown as jest.Mock).mockImplementation((_, __, cb) => cb(null))
					const result = await Effect.runPromise(util.getConfigDir)
					expect(result).toBe(configDir.get!())
					expect(os.platform).toHaveBeenCalled()
					expect(os.homedir).toHaveBeenCalled()
				})
				it('should create dir if does not already exist', async () => {
					;(os.platform as jest.Mock).mockReturnValue(platform)
					;(os.homedir as jest.Mock).mockReturnValue(configDir.home)
					;(fs.existsSync as jest.Mock).mockReturnValue(false)
					;(fs.mkdir as unknown as jest.Mock).mockImplementation((_, __, cb) => cb(null))
					const result = await Effect.runPromise(util.getConfigDir)
					expect(result).toBe(configDir.get!())
					expect(os.platform).toHaveBeenCalled()
					expect(os.homedir).toHaveBeenCalled()
					expect(fs.mkdir).toHaveBeenCalledWith(configDir.get!(), expect.objectContaining({
						recursive: true
					}), expect.any(Function))
				})
			})
		}
	})

	describe('write Effect', () => {
		it('should properly write file', async () => {
			const file = 'test-file.txt'
			const content = 'content'
			const mockedWriteStream = new (require('stream').Writable)()
			mockedWriteStream._write = jest.fn((_, __, cb) => cb())
			;(fs.createWriteStream as jest.Mock).mockReturnValue(mockedWriteStream)
			;(fs.existsSync as jest.Mock).mockReturnValue(true)
			const result = await Effect.runPromise(util.write(file, content))
			expect(result).toBe(file)
			expect(fs.createWriteStream).toHaveBeenCalledWith(file)
		})
	})

	describe('read Effect', () => {
		it('should properly read file', async () => {
			const file = 'test-file.txt'
			const content = 'content'
			const mockedReadStream = new (require('stream').Readable)()
			mockedReadStream._read = () => {}
			jest.spyOn(util, 'exists').mockImplementation((p: string) => Effect.succeed(p))
			;(fs.createReadStream as jest.Mock).mockReturnValue(mockedReadStream)
			setTimeout(() => {
				mockedReadStream.emit('data', content)
				mockedReadStream.emit('end')
			}, 0)
			const result = await Effect.runPromise(util.read(file))
			expect(util.exists).toHaveBeenCalledWith(file)
			expect(result).toBe(content)
			expect(fs.createReadStream).toHaveBeenCalledWith(file)
		})
	})

})
