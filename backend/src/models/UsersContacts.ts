import { BelongsTo, Column, ForeignKey, Model, Table } from "sequelize-typescript";
import User from "./User";
import Contact from "./Contact";

@Table({
  tableName: 'UsersContacts'
})
class UsersContacts extends Model<UsersContacts> {

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;
}

export default UsersContacts;
