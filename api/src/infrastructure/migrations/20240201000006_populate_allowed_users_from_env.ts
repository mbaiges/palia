import type { Knex } from 'knex';
import { configService } from '@/infrastructure/config/config';

/**
 * Populate allowed users from environment variables
 * This migration reads ALLOWED_EMAILS from .env file and adds them to app_settings_allowed_users
 * 
 * This migration is idempotent and can be run multiple times safely.
 * It will only add emails that don't already exist in the database.
 */
export async function up(knex: Knex): Promise<void> {
  // Get allowed emails from config (reads from .env ALLOWED_EMAILS or config.yml)
  const allowedEmails = configService.getAllowedEmails();

  if (allowedEmails.length === 0) {
    console.log('ℹ️  No ALLOWED_EMAILS found in environment or config, skipping population');
    return;
  }

  // Get existing emails from database
  const existingEmails = await knex('app_settings_allowed_users').select('email');
  const existingEmailSet = new Set(existingEmails.map((e) => e.email.toLowerCase()));

  // Filter out emails that already exist (case-insensitive)
  const emailsToInsert = allowedEmails
    .map((email) => email.trim())
    .filter((email) => {
      if (!email) return false; // Skip empty strings
      return !existingEmailSet.has(email.toLowerCase());
    });

  if (emailsToInsert.length === 0) {
    console.log('ℹ️  All emails from ALLOWED_EMAILS already exist in database');
    return;
  }

  // Insert new emails
  const now = new Date().toISOString();
  const emailsToInsertData = emailsToInsert.map((email) => ({
    email: email,
    created_at: now,
  }));

  await knex('app_settings_allowed_users').insert(emailsToInsertData);
  console.log(`✅ Populated ${emailsToInsert.length} allowed user(s) from ALLOWED_EMAILS environment variable`);
}

export async function down(knex: Knex): Promise<void> {
  // Get allowed emails from config
  const allowedEmails = configService.getAllowedEmails();

  if (allowedEmails.length === 0) {
    return;
  }

  // Remove emails that match the environment variable (case-insensitive)
  const emailsToRemove = allowedEmails.map((email) => email.trim().toLowerCase());
  
  // Get all existing emails
  const existingEmails = await knex('app_settings_allowed_users').select('email');
  
  // Find emails to remove (case-insensitive match)
  const emailsToDelete = existingEmails
    .filter((e) => emailsToRemove.includes(e.email.toLowerCase()))
    .map((e) => e.email);

  if (emailsToDelete.length > 0) {
    await knex('app_settings_allowed_users').whereIn('email', emailsToDelete).delete();
    console.log(`✅ Removed ${emailsToDelete.length} allowed user(s) that were in ALLOWED_EMAILS`);
  }
}

