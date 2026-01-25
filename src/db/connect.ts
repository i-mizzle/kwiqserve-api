import mongoose from 'mongoose';
import config from 'config';
import log from '../logger';

async function connect() {
    const dbUri = config.get('dbUri') as string;

    try {
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        mongoose.set('useFindAndModify', false);
        log.info('database connected');
    } catch (error) {
        log.error('db error', error);
        process.exit(1);
    }
}


export { connect, mongoose };

// export default connect;
