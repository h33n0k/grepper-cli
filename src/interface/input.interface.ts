import readline from 'readline'
import colors from '@colors/colors'
import { stdin, stdout } from 'process'
import { Data, Effect } from 'effect'
import { suggestion as SuggestionService } from '../services'

class InterfaceError extends Data.TaggedError('Interface') {
	public readonly message: string
	public readonly error: unknown
	constructor(error: unknown) {
		super()
		this.error = error
		this.message = 'Output error.'
	}
}

class InputError extends Data.TaggedError('Input') {
	public readonly message: string
	public readonly error: unknown
	constructor(error: unknown) {
		super()
		this.error = error
		this.message = 'Invalid Input.'
	}
}

export const ask = (options: {
	label: { text: string; style?: (s: string) => string }
	suggestions: SuggestionService.Suggestion[]
}) =>
	Effect.gen(function* () {
		// check if stdin is beeing piped
		if (!stdin.isTTY) {
			return yield* Effect.tryPromise({
				try: () =>
					new Promise<string>((resolve) => {
						let data = ''
						stdin.on('data', (chunk) => {
							data += chunk
						})
						stdin.on('end', () => {
							resolve(data.trim())
						})
					}),
				catch: (error: any) => new InputError(error)
			})
		}

		const sep = ': '
		const promptLength = options.label.text.length + sep.length
		const promptLabel = `${options.label.style ? options.label.style(options.label.text) : options.label.text}${sep}`
		const rl = yield* Effect.try({
			try: () =>
				readline.createInterface({
					input: stdin,
					output: stdout,
					prompt: promptLabel
				}) as readline.Interface & { input: NodeJS.ReadableStream },
			catch: (error) => new InterfaceError(error)
		})

		rl.prompt()

		rl.input.on('keypress', (_, { name: keyName }: { name: string }) => {
			let input = rl.line
			let cursorPosition: number = promptLength + input.length - 1

			const suggestion = ((i: string) => {
				if (i !== '') {
					const match = options.suggestions.find((choice) => choice.text.startsWith(i))

					if (match) {
						return match
					}
				}

				return null
			})(input.trim())

			switch (keyName) {
				case 'tab':
					if (suggestion) {
						input = suggestion.text
						readline.clearLine(stdout, 0)
						readline.cursorTo(stdout, 0)
						stdout.write(promptLabel)
						readline.cursorTo(stdout, promptLength)
						stdout.write(input)
						readline.cursorTo(stdout, input.length + promptLength)
						rl.write(null, { ctrl: true, name: 'u' })
						rl.write(input)
					}

					break
				case 'left':
				case 'right':
					if (keyName === 'left') {
						if (cursorPosition > 0) {
							cursorPosition--
						}
					} else {
						if (cursorPosition < input.length) {
							cursorPosition++
						}
					}

					break
				case 'backspace':
					if (input.length > 0) {
						cursorPosition--
					}

					break
				case 'return':
					break
				default:
					cursorPosition++
					setTimeout(() => {
						readline.clearLine(stdout, 0)
						readline.cursorTo(stdout, 0)
						stdout.write(promptLabel)
						readline.cursorTo(stdout, promptLength)
						stdout.write(input.trim())

						if (suggestion) {
							stdout.write(colors.gray(suggestion.text.slice(input.trim().length)))
						}

						readline.cursorTo(stdout, cursorPosition)
					}, 0)

					break
			}
		})

		return yield* Effect.tryPromise({
			try: () =>
				new Promise<string>((resolve) => {
					rl.on('line', (line) => {
						rl.close()
						resolve(line)
					})
				}),
			catch: (error) => new InputError(error)
		})
	})
