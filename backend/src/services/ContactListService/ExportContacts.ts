import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import ContactListItem from "../../models/ContactListItem";
import ContactList from "../../models/ContactList";
import AppError from "../../errors/AppError";

interface ExportContactsOptions {
  contactListId: number;
  companyId: number;
}

interface ContactExportData {
  nome: string;
  numero: string;
  email: string;
}

export async function ExportContacts({ 
  contactListId, 
  companyId 
}: ExportContactsOptions): Promise<string> {
  
  // Verificar se a lista de contatos existe e pertence à empresa
  const contactList = await ContactList.findOne({
    where: {
      id: contactListId,
      companyId
    }
  });

  if (!contactList) {
    throw new AppError("Lista de contatos não encontrada", 404);
  }

  // Buscar todos os contatos da lista
  const contacts = await ContactListItem.findAll({
    where: {
      contactListId,
      companyId
    },
    order: [["name", "ASC"]]
  });

  if (contacts.length === 0) {
    throw new AppError("Nenhum contato encontrado nesta lista", 400);
  }

  // Preparar dados para exportação
  const exportData: ContactExportData[] = contacts.map(contact => ({
    nome: contact.name || "",
    numero: contact.number || "",
    email: contact.email || "",
  }));

  // Criar workbook e worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Configurar largura das colunas
  const columnWidths = [
    { wch: 30 }, // nome
    { wch: 20 }, // numero
    { wch: 35 }, // email
  ];
  worksheet['!cols'] = columnWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Contatos");

  // Criar diretório temporário se não existir
  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Gerar nome do arquivo com timestamp
  const fileName = `contatos_${contactList.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.xlsx`;
  const filePath = path.join(tempDir, fileName);

  // Escrever arquivo
  XLSX.writeFile(workbook, filePath);

  return filePath;
}