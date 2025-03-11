import logger from "./logger";
import { exec } from "child_process";
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import util from 'util';

const execPromise = util.promisify(exec);

export const runBackupDatabase = async (): Promise<string> => {
  function timestamp() {
    const dataAtual = new Date();
    const dia = dataAtual.getDate().toString().padStart(2, "0");
    const mes = (dataAtual.getMonth() + 1).toString().padStart(2, "0");
    const ano = dataAtual.getFullYear();
    const horas = dataAtual.getHours().toString().padStart(2, "0");
    const minutos = dataAtual.getMinutes().toString().padStart(2, "0");
    return `${ano}-${mes}-${dia}-${horas}-${minutos}`;
  }

  const nameDB = `${process.env.DB_NAME}-${timestamp()}`;
  const backendDir = path.resolve(__dirname, "..", "..", "public");
  const backupDir = path.join(backendDir, 'backups');
  const backupPath = path.join(backupDir, nameDB);
  const zipPath = `${backupPath}.zip`;

  try {
    logger.info("Iniciando processo de backup do banco de dados...");

    // Garantir que o diretório de backup existe
    if (!fs.existsSync(backupDir)) {
      logger.info(`Criando diretório de backup: ${backupDir}`);
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Criar backup do banco de dados
    const stringBackup = `PGPASSWORD="${process.env.DB_PASS}" pg_dump -Fc -U ${process.env.DB_USER} -h localhost ${process.env.DB_NAME} > "${backupPath}.sql"`;
    logger.info("Executando comando de backup do banco de dados...");
    await execPromise(stringBackup);
    logger.info("Backup do banco de dados gerado com sucesso!");

    // Criar arquivo zip
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        logger.info(`Arquivo zip criado com sucesso: ${zipPath} (${archive.pointer()} bytes)`);
        
        // Remover arquivo SQL original
        logger.info("Removendo arquivo SQL original...");
        fs.unlinkSync(`${backupPath}.sql`);
        logger.info("Arquivo SQL original removido.");

        // Remover backups antigos (mais de 6 horas)
        logger.info("Removendo backups antigos (mais de 6 horas)...");
        exec(`find ${backupDir} -type f -mmin +360 -delete`);
        logger.info("Backups antigos removidos.");

        logger.info("Backup do banco de dados PostgreSQL concluído e comprimido com sucesso!");
        resolve(zipPath);
      });

      archive.on('error', (err) => {
        logger.error('Erro durante a criação do arquivo zip', err);
        reject(err);
      });

      archive.pipe(output);
      archive.file(`${backupPath}.sql`, { name: `${nameDB}.sql` });
      archive.finalize();
    });

  } catch (error) {
    logger.error("Não foi possível efetuar o backup e compressão do banco de dados!", error);
    throw error;
  }
};