import Redis from "ioredis";

let redis;
let groupInitialized = false;

// Initialize Redis connection with better error handling
const getRedis = () => {
    if (!redis) {
        console.log("Initializing Redis connection...");
        redis = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                console.log(`Redis connection retry in ${delay}ms...`);
                return delay;
            }
        });

        redis.on("error", (err) => {
            console.error("Redis connection error:", err);
        });

        redis.on("connect", () => {
            console.log("Redis connected successfully");
        });
    }
    return redis;
};

const consumerGroup = process.env.REDIS_CONSUMER_GROUP;
const consumerName = process.env.REDIS_CONSUMER_NAME;
const resultStreamKey = process.env.REDIS_RESULT_STREAM_KEY;

// Create consumer group if it doesn't exist (only once)
export const initConsumerGroup = async () => {
    if (groupInitialized) {
        return;
    }

    try {
        const redisClient = getRedis();
        
        // Verify connection is active
        if (!redisClient.status || redisClient.status !== 'ready') {
            console.log("Redis connection not ready, waiting...");
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`Initializing consumer group '${consumerGroup}' for stream '${resultStreamKey}'`);
        
        // First check if the stream exists
        const streamExists = await redisClient.exists(resultStreamKey);
        console.log(`Stream '${resultStreamKey}' exists: ${streamExists === 1}`);
        
        // Debug: Get stream info if it exists
        if (streamExists === 1) {
            try {
                console.log("Getting stream info:");
                const streamInfo = await redisClient.xinfo('STREAM', resultStreamKey);
                console.log("Stream info:", streamInfo);
                
                // Check if consumer group exists
                const groupsInfo = await redisClient.xinfo('GROUPS', resultStreamKey);
                console.log("Groups info:", groupsInfo);
                
                // If group exists but with a different name, we need to destroy and recreate it
                const groupExists = groupsInfo.some(group => 
                    group[1] === consumerGroup && group[1].toString() === consumerGroup.toString()
                );
                
                if (groupExists) {
                    console.log(`Group '${consumerGroup}' exists on stream '${resultStreamKey}'`);
                    groupInitialized = true;
                    return;
                } else {
                    console.log(`Group '${consumerGroup}' not found in existing groups, will create it`);
                }
            } catch (infoErr) {
                console.error("Error getting stream info:", infoErr.message);
            }
        }
        
        // If stream doesn't exist, create it with a dummy message
        if (streamExists !== 1) {
            console.log(`Creating stream '${resultStreamKey}'...`);
            await redisClient.xadd(resultStreamKey, '*', 'init', 'true');
            console.log(`Stream '${resultStreamKey}' created successfully`);
        }
        
        // Forcefully delete the consumer group if it exists to recreate it properly
        try {
            console.log(`Attempting to destroy existing group '${consumerGroup}'...`);
            await redisClient.xgroup('DESTROY', resultStreamKey, consumerGroup);
            console.log(`Successfully destroyed group '${consumerGroup}'`);
        } catch (destroyErr) {
            console.log(`Group destroy result: ${destroyErr.message}`);
        }
        
        // Create the consumer group with '0' to read from beginning
        try {
            console.log(`Creating consumer group '${consumerGroup}' from beginning ('0')...`);
            await redisClient.xgroup('CREATE', resultStreamKey, consumerGroup, '0', 'MKSTREAM');
            console.log(`Consumer group '${consumerGroup}' created successfully`);
            groupInitialized = true;
        } catch (groupError) {
            if (groupError.message.includes('BUSYGROUP')) {
                console.log(`Consumer group '${consumerGroup}' already exists`);
                groupInitialized = true;
            } else {
                console.error(`Failed to create group: ${groupError.message}`);
                throw groupError;
            }
        }
    } catch (error) {
        console.error('Failed to initialize consumer group:', error.message);
        groupInitialized = false;
    }
}

export const consume = async () => {
    // Make sure consumer group is initialized
    if (!groupInitialized) {
        await initConsumerGroup();
        if (!groupInitialized) {
            console.log("Consumer group not initialized yet, skipping consume");
            return [];
        }
    }
    
    try {
        const redisClient = getRedis();
        
        // Check if stream exists first
        const streamExists = await redisClient.exists(resultStreamKey);
        if (!streamExists) {
            console.log(`Stream '${resultStreamKey}' does not exist yet. Waiting for Python server to publish results.`);
            return [];
        }

        // Attempt to read using xreadgroup with explicit array format for all parameters
        console.log(`Reading from stream '${resultStreamKey}' with group '${consumerGroup}'...`);
        const messages = await redisClient.call(
            'XREADGROUP',
            'GROUP', consumerGroup, consumerName,
            'COUNT', '10',
            'BLOCK', '1000',
            'STREAMS', resultStreamKey, '>'
        );

        if (!messages || messages.length === 0) {
            console.log("No new messages to process");
            return [];
        }

        const events = messages.flatMap(([stream, entries]) =>
            entries.map(([id, fields]) => {
                const obj = {};
                for (let i = 0; i < fields.length; i += 2) {
                    obj[fields[i]] = fields[i + 1];
                }
                return { id, ...obj };
            })
        );
        
        console.log("Consumed messages:", events);
        
        // Acknowledge the messages after processing
        for (const event of events) {
            await redisClient.xack(resultStreamKey, consumerGroup, event.id);
        }
        
        return events;
    } catch (error) {
        console.error("Error consuming messages from Python server results:", error);
        
        // If error is NOGROUP, completely reset the initialization
        if (error.message && error.message.includes('NOGROUP')) {
            console.log("Consumer group not found, forcing complete reinitialization...");
            groupInitialized = false;
            
            // Alternative approach: try reading directly from the stream as fallback
            try {
                console.log("Trying direct stream read as fallback...");
                const redisClient = getRedis();
                const directMessages = await redisClient.call(
                    'XREAD',
                    'COUNT', '10',
                    'STREAMS', resultStreamKey, '$'  // Use $ to read only new messages from now on
                );
                
                if (directMessages && directMessages.length > 0) {
                    console.log("Direct stream read successful, got messages");
                    const events = directMessages.flatMap(([stream, entries]) =>
                        entries.map(([id, fields]) => {
                            const obj = {};
                            for (let i = 0; i < fields.length; i += 2) {
                                obj[fields[i]] = fields[i + 1];
                            }
                            return { id, ...obj, _direct_read: true };
                        })
                    );
                    
                    console.log("Direct read messages:", events);
                    return events;
                } else {
                    console.log("No messages found in direct stream read");
                }
            } catch (directReadError) {
                console.error("Error in direct stream read:", directReadError);
                
                // Try one more approach - read all messages from beginning
                try {
                    console.log("Trying to read all messages from beginning...");
                    const allMessages = await redisClient.call(
                        'XREAD',
                        'COUNT', '10',
                        'STREAMS', resultStreamKey, '0'  // Start from the beginning
                    );
                    
                    if (allMessages && allMessages.length > 0) {
                        console.log("Read from beginning successful");
                        const events = allMessages.flatMap(([stream, entries]) =>
                            entries.map(([id, fields]) => {
                                const obj = {};
                                for (let i = 0; i < fields.length; i += 2) {
                                    obj[fields[i]] = fields[i + 1];
                                }
                                return { id, ...obj, _direct_read: true };
                            })
                        );
                        
                        console.log("Messages from beginning:", events);
                        return events;
                    }
                } catch (beginningReadError) {
                    console.error("Error reading from beginning:", beginningReadError);
                }
            }
            
            await initConsumerGroup();
        }
        
        return [];
    }
}

export async function POST(request) {
    try {
       
        if (!groupInitialized) {
            await initConsumerGroup();
        }
        
        const events = await consume();
        
        return Response.json({ 
            success: true, 
            message: "Video processing results consumed successfully",
            events
        });  
    } catch (error) {
        console.error('Handler error:', error);
        return Response.json(
            { error: "Failed to consume Redis stream", details: error.message }, 
            { status: 500 }
        );
    }
}
