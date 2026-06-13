// This file contains the sms service business workflow.

import https from 'https';

// Prepare phone number.
const normalizePhoneNumber = (phoneNumber) => {
    const cleanPhone = String(phoneNumber || '')
        .trim()
        .replace(/[\s()-]/g, '');

    if (!cleanPhone) {
        return '';
    }

    if (cleanPhone.startsWith('+')) {
        return cleanPhone;
    }

    const countryCode = process.env.SMS_DEFAULT_COUNTRY_CODE;

    if (countryCode && cleanPhone.startsWith('0')) {
        return `${countryCode}${cleanPhone.slice(1)}`;
    }

    return cleanPhone;
};

// Handle post form.
const postForm = ({ hostname, path, auth, formData }) => {
    const body = new URLSearchParams(formData).toString();

    return new Promise((resolve, reject) => {
        const request = https.request(
            {
                hostname,
                path,
                method: 'POST',
                auth,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(body),
                },
            },
            (response) => {
                let responseBody = '';

                response.on('data', (chunk) => {
                    responseBody += chunk;
                });

                response.on('end', () => {
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        resolve({
                            success: true,
                            statusCode: response.statusCode,
                            body: responseBody,
                        });
                        return;
                    }

                    reject(
                        new Error(
                            `SMS provider responded with ${response.statusCode}: ${responseBody}`,
                        ),
                    );
                });
            },
        );

        request.on('error', reject);
        request.write(body);
        request.end();
    });
};

// Send twilio sms.
const sendTwilioSms = async ({ to, message }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !from) {
        console.log(`[SMS skipped] Twilio is not configured. To: ${to}. Message: ${message}`);
        return { success: false, skipped: true };
    }

    return postForm({
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        auth: `${accountSid}:${authToken}`,
        formData: {
            To: to,
            From: from,
            Body: message,
        },
    });
};

// Send sms.
const sendSms = async ({ to, message }) => {
    const phoneNumber = normalizePhoneNumber(to);
    const cleanMessage = String(message || '').trim();

    if (!phoneNumber || !cleanMessage) {
        console.log('[SMS skipped] Missing phone number or message.');
        return { success: false, skipped: true };
    }

    const provider = (process.env.SMS_PROVIDER || 'log').toLowerCase();

    try {
        if (provider === 'twilio') {
            return await sendTwilioSms({ to: phoneNumber, message: cleanMessage });
        }

        console.log(`[SMS log] To: ${phoneNumber}. Message: ${cleanMessage}`);
        return { success: true, logged: true };
    } catch (error) {
        console.error(`SMS send failed for ${phoneNumber}:`, error.message);
        return { success: false, error: error.message };
    }
};

export default {
    sendSms,
};
