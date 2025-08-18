import Redis from "ioredis";

// Use the same Redis connection across the application
let redisClient;

const getRedisClient = () => {
  if (!redisClient) {
    console.log("Initializing Redis connection for OTP store...");
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis connection retry in ${delay}ms...`);
        return delay;
      }
    });

    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Redis connected successfully for OTP store");
    });
  }
  return redisClient;
};

// Helper function to create OTP key
const getOtpKey = (email) => `otp:${email}`;

// Store OTP in Redis
export const storeOTP = async (email, data) => {
  try {
    const redis = getRedisClient();
    const key = getOtpKey(email);
    
    console.log(`Storing OTP for ${email}`);
    
    // Store OTP data as JSON with expiration
    const expiryMs = data.expires - Date.now();
    const expirySeconds = Math.ceil(expiryMs / 1000);
    
    await redis.set(
      key, 
      JSON.stringify({
        ...data,
        createdAt: new Date().toISOString()
      }),
      'EX', // Expire after seconds
      expirySeconds > 0 ? expirySeconds : 600 // Default 10 minutes if calculation error
    );
    
    console.log(`OTP stored successfully for ${email} with expiry of ${expirySeconds} seconds`);
    return true;
  } catch (error) {
    console.error(`Error storing OTP for ${email}:`, error);
    return false;
  }
};

// Get OTP from Redis
export const getOTP = async (email) => {
  try {
    const redis = getRedisClient();
    const key = getOtpKey(email);
    
    const data = await redis.get(key);
    
    if (!data) {
      console.log(`No OTP found for ${email}`);
      return null;
    }
    
    const parsedData = JSON.parse(data);
    console.log(`Retrieved OTP data for ${email}`);
    
    return parsedData;
  } catch (error) {
    console.error(`Error getting OTP for ${email}:`, error);
    return null;
  }
};

// Delete OTP from Redis
export const deleteOTP = async (email) => {
  try {
    const redis = getRedisClient();
    const key = getOtpKey(email);
    
    console.log(`Deleting OTP for ${email}`);
    await redis.del(key);
    
    return true;
  } catch (error) {
    console.error(`Error deleting OTP for ${email}:`, error);
    return false;
  }
};

// Get all OTP emails (for debugging)
export const getAllOTPEmails = async () => {
  try {
    const redis = getRedisClient();
    
    const keys = await redis.keys('otp:*');
    const emails = keys.map(key => key.replace('otp:', ''));
    
    console.log(`Found ${emails.length} stored OTPs`);
    return emails;
  } catch (error) {
    console.error('Error getting all OTP emails:', error);
    return [];
  }
};
