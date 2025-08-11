import {
    Table,
    Column,
    CreatedAt,
    UpdatedAt,
    Model,
    PrimaryKey,
    AutoIncrement,
    DataType,
    ForeignKey,
    BelongsTo,
} from "sequelize-typescript";
import User from "./User";

@Table
class Notifications extends Model<Notifications> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id!: number;

    @ForeignKey(() => User)
    @Column
    userId!: number;

    @BelongsTo(() => User)
    user!: User;

    @Column(DataType.STRING)
    browserId: string;

    @Column(DataType.JSON)
    browserData!: JSON;

    @CreatedAt
    createdAt: Date;

    @UpdatedAt
    updatedAt: Date;

}

export default Notifications;
  