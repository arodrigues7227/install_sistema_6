import { verify } from "jsonwebtoken";
import fs from "fs"; // Importa o módulo fs para operações sincrônicas
import fsPromises from "fs/promises"; // Importa o módulo fs/promises para operações assíncronas
import authConfig from "../config/auth";
import * as Yup from "yup";
import { Request, Response } from "express";
import moment from "moment";
import path from "path";
// import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";
import Company from "../models/Company";

import ListCompaniesService from "../services/CompanyService/ListCompaniesService";
import CreateCompanyService from "../services/CompanyService/CreateCompanyService";
import UpdateCompanyService from "../services/CompanyService/UpdateCompanyService";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import UpdateSchedulesService from "../services/CompanyService/UpdateSchedulesService";
import DeleteCompanyService from "../services/CompanyService/DeleteCompanyService";
import FindAllCompaniesService from "../services/CompanyService/FindAllCompaniesService";
import ShowPlanCompanyService from "../services/CompanyService/ShowPlanCompanyService";
import User from "../models/User";
import ListCompaniesPlanService from "../services/CompanyService/ListCompaniesPlanService";

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  companyId: number;
  iat: number;
  exp: number;
}

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type CompanyData = {
  name: string;
  id?: number;
  phone?: string;
  email?: string;
  password?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: string;
  recurrence?: string;
  document?: string;
  paymentMethod?: string;
};

interface CompanyAttributes {
  id: number;
  name: string;
  email?: string;
  status: boolean;
  dueDate?: Date;
  createdAt: Date;
  phone?: string;
  document?: string;
  lastLogin?: Date;
  plan?: {
    name: string;
    amount: number;
  };
}

type SchedulesData = {
  schedules: [];
};

const publicFolder = path.resolve(__dirname, "..", "..", "public");

const calculateDirectoryMetrics = async (companyId: number) => {
  const folderPath = path.join(publicFolder, `company${companyId}`);

  try {
    if (!fs.existsSync(folderPath)) {
      console.warn(`Directory does not exist: ${folderPath}`);
      return {
        folderSize: 0,
        numberOfFiles: 0,
        lastUpdate: null, // Mudando de lastUpdated para lastUpdate
      };
    }

    const files = await fsPromises.readdir(folderPath);
    let totalSize = 0;
    let numberOfFiles = files.length;
    let lastUpdate = new Date(0); // Mudando de lastUpdated para lastUpdate

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fsPromises.stat(filePath);
      totalSize += stats.size;
      if (stats.mtime > lastUpdate) {
        lastUpdate = stats.mtime;
      }
    }

    return {
      folderSize: totalSize,
      numberOfFiles,
      lastUpdate, // Mudando de lastUpdated para lastUpdate
    };
  } catch (error) {
    console.error(`Error calculating directory metrics for company ${companyId}:`, error);
    return {
      folderSize: 0,
      numberOfFiles: 0,
      lastUpdate: null, // Mudando de lastUpdated para lastUpdate
    };
  }
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id, profile, companyId } = decoded as TokenPayload;
  const company = await Company.findByPk(companyId);
  const requestUser = await User.findByPk(id);

  if (requestUser.super === true) {
    const { companies, count, hasMore } = await ListCompaniesService({
      searchParam,
      pageNumber
    });

    return res.json({ companies, count, hasMore });

  } else {
    const { companies, count, hasMore } = await ListCompaniesService({
      searchParam: company.name,
      pageNumber
    });
    return res.json({ companies, count, hasMore });

  }

};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const newCompany: CompanyData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    password: Yup.string().required().min(5)
  });

  try {
    await schema.validate(newCompany);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const company = await CreateCompanyService(newCompany);

  return res.status(200).json(company);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === true) {
    const company = await ShowCompanyService(id);
    return res.status(200).json(company);
  } else if (id !== companyId.toString()) {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  } else if (id === companyId.toString()) {
    const company = await ShowCompanyService(id);
    return res.status(200).json(company);
  }
};

export const list = async (req: Request, res: Response): Promise<Response> => {

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(id);

  if (requestUser.super === true) {
    const companies: Company[] = await FindAllCompaniesService();
    return res.status(200).json(companies);
  } else {
    const companies: Company[] = await FindAllCompaniesService();
    let company = [];

    for (let i = 0; i < companies.length; i++) {
      const id = companies[i].id;

      if (id === companyId) {
        company.push(companies[i])
        return res.status(200).json(company);
      }
    }
  }

};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {

  const companyData: CompanyData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(companyData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === true) {
    const company = await UpdateCompanyService({ id, ...companyData });
    return res.status(200).json(company);
  } else if (String(companyData?.id) !== id || String(companyId) !== id) {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  } else {
    const company = await UpdateCompanyService({ id, ...companyData });
    return res.status(200).json(company);
  }

};

export const updateSchedules = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { schedules }: SchedulesData = req.body;
  const { id } = req.params;

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === true) {
    const company = await UpdateSchedulesService({ id, schedules });
    return res.status(200).json(company);
  } else if (companyId.toString() !== id) {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  } else {
    const company = await UpdateSchedulesService({ id, schedules });
    return res.status(200).json(company);
  }

};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === true) {
    const company = await DeleteCompanyService(id);
    return res.status(200).json(company);
  } else {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  }

};

export const listPlan = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === true) {
    const company = await ShowPlanCompanyService(id);
    return res.status(200).json(company);
  } else if (companyId.toString() !== id) {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  } else {
    const company = await ShowPlanCompanyService(id);
    return res.status(200).json(company);
  }

};

export const indexPlan = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(id);

  if (requestUser.super === true) {
    try {
      const companies = await ListCompaniesPlanService();
      
      // Transformar os dados das empresas com tipagem correta
      const companiesData = companies.map(company => {
        const plainCompany = company.get({ plain: true }) as CompanyAttributes;
        return {
          ...plainCompany,
          status: !!plainCompany.status
        };
      });

      const companiesWithMetrics = await Promise.all(companiesData.map(async (company) => {
        const metrics = await calculateDirectoryMetrics(company.id);
        return {
          ...company,
          metrics: {
            folderSize: metrics.folderSize,
            numberOfFiles: metrics.numberOfFiles,
            lastUpdate: metrics.lastUpdate ? moment(metrics.lastUpdate).format('DD/MM/YYYY HH:mm:ss') : null
          }
        };
      }));

      return res.status(200).json({ companies: companiesWithMetrics });
    } catch (error) {
      console.error("Error fetching companies:", error);
      return res.status(500).json({ error: "Erro ao buscar dados das empresas" });
    }
  } else {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  }
};