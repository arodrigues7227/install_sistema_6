// src/models/BirthdaySettings.ts
import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  DataType,
  AllowNull,
  Unique
} from "sequelize-typescript";
import Company from "./Company";

@Table({
  tableName: 'BirthdaySettings',
  modelName: 'BirthdaySettings'
})
class BirthdaySettings extends Model<BirthdaySettings> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Unique
  @AllowNull(false)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Default(true)
  @Column
  userBirthdayEnabled: boolean;

  @Default(false) // CORREÇÃO: Mudar para false por padrão
  @Column
  contactBirthdayEnabled: boolean;

  @Default('🎉 Parabéns, {nome}! Hoje é seu dia especial! Desejamos muito sucesso e felicidade! 🎂')
  @Column(DataType.TEXT)
  userBirthdayMessage: string;

  @Default('🎉 Parabéns, {nome}! Hoje você completa {idade} anos! Desejamos muito sucesso, saúde e felicidade! 🎂✨')
  @Column(DataType.TEXT)
  contactBirthdayMessage: string;

  @Default('09:00:00')
  @Column(DataType.TIME)
  sendBirthdayTime: string;

  @Default(false) // CORREÇÃO: Mudar para false por padrão
  @Column
  createAnnouncementForUsers: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  // CORREÇÃO: Método para obter configurações com fallback para valores padrão
  static async getCompanySettings(companyId: number): Promise<BirthdaySettings> {
    console.log("🔍 BirthdaySettings.getCompanySettings - companyId:", companyId);
    
    let settings = await BirthdaySettings.findOne({
      where: { companyId }
    });

    if (!settings) {
      console.log("⚠️ Configurações não encontradas, criando padrão...");
      
      settings = await BirthdaySettings.create({
        companyId,
        userBirthdayEnabled: true,
        contactBirthdayEnabled: false,
        userBirthdayMessage: '🎉 Parabéns, {nome}! Hoje é seu dia especial! Desejamos muito sucesso e felicidade! 🎂',
        contactBirthdayMessage: '🎉 Parabéns, {nome}! Hoje você completa {idade} anos! Desejamos muito sucesso, saúde e felicidade! 🎂✨',
        sendBirthdayTime: '09:00:00',
        createAnnouncementForUsers: false
      });
      
      console.log("✅ Configurações padrão criadas:", settings.id);
    }

    return settings;
  }
}

export default BirthdaySettings;