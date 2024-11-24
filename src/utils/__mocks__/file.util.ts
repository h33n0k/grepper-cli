import { Effect } from 'effect'
import path from 'path'

const configDir: {
	[key: string]: {
		home: string
		dir: string
		get?: () => string
		config?: () => string
	}
} = {
	linux: {
		home: '/home/testuser',
		dir: '.config/grepper-cli'
	}
}

for (const platform in configDir) {
	configDir[platform].get = () => path.join(configDir[platform].home, configDir[platform].dir)
	configDir[platform].config = () => path.join(configDir[platform].get!(), 'config.json')
}

export { configDir }

export const exists = (p: string) => Effect.succeed(p)
export const getConfigDir = Effect.succeed(configDir.linux.get!())
export const read = () => Effect.succeed('content')
export const write = (p: string) => Effect.succeed(p)
