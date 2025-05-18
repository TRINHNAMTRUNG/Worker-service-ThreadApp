
import connection from "./configs/database";
import { producerConnectToKafka, consumerConnectToKafka, runConsumer } from "./configs/kafka";
import app from "./server";
const HOST_NAME = process.env.HOST_NAME;
const PORT = process.env.PORT || 8087;

(async () => {
    try {
        await connection();
        await consumerConnectToKafka();
        await runConsumer();

        app.listen(PORT as number, () => {
            console.log(`Worker service is listening on port 123 ${PORT}`);
        })
    } catch (error) {
        console.log("BACKEND WORKER SERVICE ERROR: ", error);
        process.exit(1);
    }
})();