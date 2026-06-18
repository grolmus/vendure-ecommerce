import { VendureConfig } from '@vendure/core';

// Direct JSON import in the config file itself.
import appData from './data.json';
import { MyPlugin } from './my-plugin';

export const config: VendureConfig = {
    apiOptions: {
        port: appData.port,
    },
    authOptions: {
        tokenMethod: 'bearer',
    },
    dbConnectionOptions: {
        type: 'postgres',
    },
    paymentOptions: {
        paymentMethodHandlers: [],
    },
    plugins: [MyPlugin],
};
