/**
 * Email Service
 * 
 * Handles sending verification and other emails.
 * Uses nodemailer for email delivery.
 */

import nodemailer from 'nodemailer';
import { SERVER_CONFIG } from '../../config/env.js';

// Create transporter - configure with your SMTP provider
const createTransporter = () => {
  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('[EMAIL] SMTP not configured - emails will be logged only');
    return {
      sendMail: async (options) => {
        console.log('=== EMAIL (Development Mode - Not Sent) ===');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body:', options.text);
        console.log('================================');
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }

  // Use real SMTP
  console.log('[EMAIL] SMTP configured, emails will be sent');
  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const transporter = createTransporter();

const APP_NAME = 'AI Course Architect';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 * @param {string} name - User's name
 */
export const sendVerificationEmail = async (email, token, name) => {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER || 'noreply@coursearchitect.ai'}>`,
    to: email,
    subject: `Verify your ${APP_NAME} account`,
    text: `
Hi ${name},

Welcome to ${APP_NAME}!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The ${APP_NAME} Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px; text-align: center;">
    <h1 style="color: white; margin: 0;">${APP_NAME}</h1>
  </div>
  
  <div style="padding: 30px; background: #f9fafb; border-radius: 12px; margin-top: 20px;">
    <h2 style="color: #111827; margin-top: 0;">Hi ${name},</h2>
    
    <p style="color: #6b7280;">Welcome to ${APP_NAME}! Please verify your email address to get started.</p>
    
    <a href="${verificationUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">Verify Email Address</a>
    
    <p style="color: #9ca3af; font-size: 14px;">This link will expire in 24 hours.</p>
    
    <p style="color: #9ca3af; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color: #6366f1; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
  </div>
  
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
    If you didn't create an account, please ignore this email.
  </p>
</body>
</html>
    `.trim(),
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Verification email sent successfully to', email, 'MessageId:', result.messageId);
    return result;
  } catch (error) {
    console.error('[EMAIL] Failed to send verification email to', email, error);
    throw error;
  }
};

/**
 * Send welcome email (after verification)
 * @param {string} email - User's email address
 * @param {string} name - User's name
 */
export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER || 'noreply@coursearchitect.ai'}>`,
    to: email,
    subject: `Welcome to ${APP_NAME}!`,
    text: `
Hi ${name},

Your email has been verified. You're all set to start learning with AI-powered courses!

Get started by:
1. Creating your first course
2. Exploring AI-generated lessons
3. Tracking your progress

Happy learning!

Best regards,
The ${APP_NAME} Team
    `.trim(),
  };

  return transporter.sendMail(mailOptions);
};

export default {
  sendVerificationEmail,
  sendWelcomeEmail,
};
