// src/jobs/BirthdayJob.ts
import BirthdayService from "../services/BirthdayService/BirthdayService";
import logger from "../utils/logger";

const CronJob = require("cron").CronJob;

/**
 * Job para processar aniversários diariamente
 * Executa todos os dias às 09:00
 */
export const startBirthdayJob = () => {
  const birthdayJob = new CronJob(
    "0 0 9 * * *", // Todos os dias às 09:00
    async () => {
      logger.info("🎂 Starting daily birthday processing job...");
      
      try {
        await BirthdayService.processTodayBirthdays();
        logger.info("🎉 Daily birthday processing job completed successfully");
      } catch (error) {
        logger.error("❌ Error in daily birthday processing job:", error);
      }
    },
    null, // onComplete
    true, // start immediately
    "America/Sao_Paulo" // timezone
  );

  logger.info("🎂 Birthday cron job initialized - will run daily at 09:00");
  
  return birthdayJob;
};

/**
 * Job para limpar informativos expirados
 * Executa todo dia à meia-noite
 */
export const startCleanupJob = () => {
  const cleanupJob = new CronJob(
    "0 0 0 * * *", // Todo dia à meia-noite
    async () => {
      logger.info("🧹 Starting expired announcements cleanup job...");
      
      try {
        const { default: Announcement } = await import("../models/Announcement");
        const cleanedCount = await Announcement.cleanExpiredAnnouncements();
        
        if (cleanedCount > 0) {
          logger.info(`🗑️ Cleaned ${cleanedCount} expired announcements`);
        } else {
          logger.info("✨ No expired announcements to clean");
        }
      } catch (error) {
        logger.error("❌ Error in cleanup job:", error);
      }
    },
    null, // onComplete
    true, // start immediately
    "America/Sao_Paulo" // timezone
  );

  logger.info("🧹 Cleanup cron job initialized - will run daily at midnight");
  
  return cleanupJob;
};

/**
 * Inicializa todos os jobs relacionados a aniversários
 */
export const initializeBirthdayJobs = () => {
  const birthdayJob = startBirthdayJob();
  const cleanupJob = startCleanupJob();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('🛑 Stopping birthday jobs...');
    birthdayJob.stop();
    cleanupJob.stop();
  });

  process.on('SIGINT', () => {
    logger.info('🛑 Stopping birthday jobs...');
    birthdayJob.stop();
    cleanupJob.stop();
  });

  return { birthdayJob, cleanupJob };
};