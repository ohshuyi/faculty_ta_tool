export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const appInsights = require("applicationinsights");
        appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
            .setAutoCollectConsole(true, true)
            .setSendLiveMetrics(true) // This fixes "Not Connected"
            .start();
    }
}
