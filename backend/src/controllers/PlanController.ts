import { verify } from "jsonwebtoken";
import authConfig from "../config/auth";
import * as Yup from "yup";
import { Request, Response } from "express";
// import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";
import Plan from "../models/Plan";

import ListPlansService from "../services/PlanService/ListPlansService";
import CreatePlanService from "../services/PlanService/CreatePlanService";
import UpdatePlanService from "../services/PlanService/UpdatePlanService";
import ShowPlanService from "../services/PlanService/ShowPlanService";
import FindAllPlanService from "../services/PlanService/FindAllPlanService";
import DeletePlanService from "../services/PlanService/DeletePlanService";
import User from "../models/User";
import Company from "../models/Company";

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
  listPublic: string;
};

type StorePlanData = {
  name: string;
  users: number | 0;
  connections: number | 0;
  queues: number | 0;
  amount: string | "0";
  useWhatsapp?: boolean;
  useFacebook?: boolean;
  useInstagram?: boolean;
  useCampaigns?: boolean;
  useSchedules?: boolean;
  useInternalChat?: boolean;
  useExternalApi?: boolean;
  useKanban?: boolean;
  useOpenAi?: boolean;
  useIntegrations?: boolean;
  onlyApiMessage?: boolean;
  isPublic?: boolean;
};

type UpdatePlanData = {
  name: string;
  id?: number | string;
  users?: number;
  connections?: number;
  queues?: number;
  amount?: string;
  useWhatsapp?: boolean;
  useFacebook?: boolean;
  useInstagram?: boolean;
  useCampaigns?: boolean;
  useSchedules?: boolean;
  useInternalChat?: boolean;
  useExternalApi?: boolean;
  useKanban?: boolean;
  useOpenAi?: boolean;
  useIntegrations?: boolean;
  onlyApiMessage?: boolean;
  isPublic?: boolean;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, listPublic } = req.query as IndexQuery;

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError("Cabeçalho de autorização não encontrado", 401);
  }

  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);
  const company = await Company.findByPk(companyId);
  const PlanCompany = company.planId;
  const plans = await Plan.findByPk(PlanCompany);
  const plansName = plans.name;

  if (requestUser.super === true) {
    const { plans, count, hasMore } = await ListPlansService({
      searchParam,
      pageNumber
    });

    return res.json({ plans, count, hasMore });

  } else {
    const { plans, count, hasMore } = await ListPlansService({
      searchParam: plansName,
      pageNumber,
      listPublic
    });
    return res.json({ plans, count, hasMore });

  }

};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const {listPublic} = req.query as IndexQuery;

  const plans: Plan[] = await FindAllPlanService(listPublic);

  return res.status(200).json(plans);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const newPlan: StorePlanData = req.body;
  
  // Verificar se o cabeçalho de autorização existe
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError("Cabeçalho de autorização não encontrado", 401);
  }
  
  // Validar token e verificar permissões
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);
  
  // Verificar se o usuário é super admin
  if (!requestUser.super) {
    throw new AppError("Você não possui permissão para criar planos", 403);
  }

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(newPlan);
  } catch (err) {
    throw new AppError(err.message);
  }

  const plan = await CreatePlanService(newPlan);

  return res.status(200).json(plan);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError("Cabeçalho de autorização não encontrado", 401);
  }
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);
  const company = await Company.findByPk(companyId);
  const PlanCompany = company.planId;

  if (requestUser.super === true) {
    const plan = await ShowPlanService(id);
    return res.status(200).json(plan);
  } else if (id !== PlanCompany.toString()) {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  } else if (id === PlanCompany.toString()) {
    const plan = await ShowPlanService(id);
    return res.status(200).json(plan);
  }

};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const planData: UpdatePlanData = req.body;
  const { id } = req.params; // Adicionar essa linha para obter o ID da URL

  // Assegurar que o ID do parâmetro da URL seja incluído nos dados do plano
  planData.id = id || planData.id;

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(planData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError("Cabeçalho de autorização não encontrado", 401);
  }
  
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);
  const company = await Company.findByPk(companyId);
  const PlanCompany = company.planId;

  if (requestUser.super === true) {
    const plan = await UpdatePlanService(planData);
    return res.status(200).json(plan);
  } else if (PlanCompany.toString() !== planData.id) {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  } else {
    // Adicionar esse bloco para tratar a edição de planos por usuários não-super
    const plan = await UpdatePlanService(planData);
    return res.status(200).json(plan);
  }
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError("Cabeçalho de autorização não encontrado", 401);
  }
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === true) {
    const plan = await DeletePlanService(id);
    return res.status(200).json(plan);
  } else if (companyId.toString() !== id) {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  }

};
