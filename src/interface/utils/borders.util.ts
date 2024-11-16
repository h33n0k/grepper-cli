export interface Corner {
	left: string
	right: string
}

export interface Border {
	corners: {
		top: Corner
		bottom: Corner
	}
	lines: {
		horizontal: string
		vertical: string
	}
}

const borders: {
	round: Border
	solid: Border
} = {
	solid: {
		corners: {
			top: {
				left: '┌',
				right: '┐'
			},
			bottom: {
				right: '┘',
				left: '└'
			}
		},
		lines: {
			horizontal: '─',
			vertical: '│'
		}
	},
	round: {
		corners: {
			top: {
				left: '╭',
				right: '╮'
			},
			bottom: {
				right: '╯',
				left: '╰'
			}
		},
		lines: {
			horizontal: '─',
			vertical: '│'
		}
	}
}

export default borders
