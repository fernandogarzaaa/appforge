import { MongoMemoryServer } from 'mongodb-memory-server';

const start = async () => {
    try {
        const mongod = await MongoMemoryServer.create({
            instance: {
                port: 27017,
                dbName: 'appforge',
                ip: '127.0.0.1' // Bind to localhost
            }
        });
        const uri = mongod.getUri();
        console.log(`MongoDB Memory Server started at ${uri}`);

        // Keep process alive
        process.on('SIGINT', async () => {
            await mongod.stop();
            process.exit(0);
        });
    } catch (err) {
        console.error('Failed to start MongoDB Memory Server:', err);
        process.exit(1);
    }
};

start();
