import colors from '@colors/colors'
import { getColumns, Size } from '../utils/size.util'
import borders, { Border } from '../utils/borders.util'
import { removeANSI } from '../utils/colors.util'
import { Effect, pipe } from 'effect'
import { InterfaceError } from '..//utils/handlers.util'

export interface BoxOptions {
	title: string | undefined
	contentStyle: (content: string) => string
	subtexts: string[]
	numbers: boolean
	border: keyof typeof borders
	size: Size
	padding: number
}

export const defaultOptions: BoxOptions = {
	title: undefined,
	contentStyle: (content) => content,
	subtexts: [],
	numbers: false,
	border: 'solid',
	size: {
		min: 50,
		auto: 0.3,
		max: 130
	},
	padding: 1
}

export default (content: string, custom: Partial<BoxOptions>) =>
	pipe(
		Effect.try(() => ({ ...defaultOptions, ...custom })),
		Effect.flatMap((options) =>
			pipe(
				getColumns(options.size),
				Effect.flatMap((columns) =>
					Effect.try({
						try: () => {
							const contentLines = options.contentStyle(content).trim().replace('\n\n', '\n').split('\n')
							const border: Border = borders[options.border]

							const spaces = (n: number, c: string = ' ') =>
								Array(n >= 0 ? n : 0)
									.fill(c)
									.join('')

							function writeLine(
								text: string,
								number: string | null = null,
								vIndex: 'top' | 'bottom' | null = null
							) {
								const [left, right] = [vertical('left', number, vIndex), vertical('right')]
								const remaining =
									columns - [left, right, text].reduce((c, a) => removeANSI(a).length + c, 0)
								let line = left
								line += text
								line += spaces(remaining)
								line += right

								return line
							}

							function vertical(
								index: 'left' | 'right',
								number: string | null = null,
								vIndex: 'top' | 'bottom' | null = null
							) {
								const line = colors.gray(border.lines.vertical)
								const padding = spaces(options.padding)

								if (index === 'left') {
									return `${line}${options.numbers ? `${number || spaces(contentLines.length.toString().length - 0)}${vIndex ? colors.gray(vIndex === 'top' ? '┬' : '┴') : line}` : ''}${padding}`
								}

								return `${padding}${line}`
							}

							function horizontal(index: 'top' | 'bottom') {
								const padding = Array(options.padding)
									.fill(writeLine('', null, index))
									.join('\n')
								const [start, end] = Array(2)
									.fill('')
									.map((_, i) => {
										const corner = border.corners[index][i == 1 ? 'right' : 'left']

										return colors.gray(
											i == 1
												? `${border.lines.horizontal}${corner}`
												: `${corner}${border.lines.horizontal}`
										)
									})

								let line = `${start}`
								let remaining = columns - [start, end].reduce((c, a) => removeANSI(a).length + c, 0)

								if (index === 'top') {
									if (options.title) {
										line += ` ${colors.bold(options.title)} `
										remaining -= removeANSI(options.title).length + 2
									}
								} else {
									for (let i = 0; i < options.subtexts.length; i++) {
										const gap = i !== 0 ? 1 : 0
										line += `${spaces(gap, colors.gray(border.lines.horizontal))}${options.subtexts[i]}`
										remaining -= removeANSI(options.subtexts[i]).length + gap
									}
								}

								line += `${Array(remaining).fill(colors.gray(border.lines.horizontal)).join('')}${end}`

								return index === 'top' ? `${line}\n${padding}` : `${padding}\n${line}`
							}

							const operations: (() => string)[] = [
								() => horizontal('top'),
								...contentLines.map((line, i) => {
									if (options.numbers) {
										const number = (i + 1)
											.toString()
											.padStart(contentLines.length.toString().length, '0')

										return () => writeLine(line, number)
									}

									return () => writeLine(line)
								}),
								() => horizontal('bottom')
							]

							return operations.reduce(
								(c, a, i) => (c += `${a()}${i !== operations.length - 1 ? '\n' : ''}`),
								''
							)
						},
						catch: () => new InterfaceError()
					})
				)
			)
		)
	)
