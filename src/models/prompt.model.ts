import {
	AllowNull,
	AutoIncrement,
	BelongsToMany,
	Column,
	CreatedAt,
	DataType,
	Model,
	PrimaryKey,
	Table,
	Unique,
	UpdatedAt
} from 'sequelize-typescript'
import AnswerModel from './answer.model'
import MatchModel from './match.model'

@Table({
	tableName: 'prompts',
	modelName: 'prompt',
	timestamps: true
})
export default class Prompt extends Model<Prompt, { input: string }> {
	@PrimaryKey
	@AutoIncrement
	@Column
	declare id: number

	@Unique
	@AllowNull(false)
	@Column({
		type: DataType.TEXT,
		allowNull: false
	})
	declare input: string

	@BelongsToMany(() => AnswerModel, () => MatchModel)
	declare results: AnswerModel[]

	@Column({
		type: DataType.DATE,
		defaultValue: DataType.NOW
	})
	declare lastUse: Date

	@UpdatedAt
	@Column
	declare updatedAt: Date

	@CreatedAt
	@Column
	declare createdAt: Date
}
