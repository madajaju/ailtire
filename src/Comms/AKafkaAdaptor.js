const {Kafka, logLevel} = require("kafkajs");
const ABaseCommsAdaptor = require("./ABaseCommsAdaptor");
const AClass = require("ailtire/src/Server/AClass");
const Action = require("ailtire/src/Server/Action");
const funcHandler = require("ailtire/src/Proxy/MethodProxy");
const AEvent = require("ailtire/src/Server/AEvent");
const {execSync} = require("child_process");

class AKafkaAdaptor extends ABaseCommsAdaptor {

    constructor(config) {
        super(config);
        this.topic = config.topic || global.ailtire.config.prefix || "ailtire";
        config.brokers = config.brokers || ["localhost:9092"];
        this.id = "Kafka-" + this.topic;
        this.kafka = new Kafka({
            clientId: config.clientId || `${global.ailtire.config.prefix}-client` || "ailtire", brokers: config.brokers,
            logLevel: config.logLevel || logLevel.NOTHING,
        });
        this.producer = {state: "init", service: this.kafka.producer()};
        this.consumer = {
            state: "init",
            service: this.kafka.consumer({groupId: config.groupId || `${global.ailtire.config.prefix}-group`})
        };
        this.connect();
    }

    async connect(server) {
        if (await this.isKafkaRunning()) {
            await this.setupTopic();
            try {
                await this.producer.service.connect();
                this.producer.state = "connected";
            }
            catch(e) {
                console.error("Error connecting producer to Kafka:", e);
            }
            try {
                await this.consumer.service.connect();
                this.consumer.state = "connected";
            }
            catch(e) {
                console.error("Error connecting consumer to Kafka:", e);
            }
            await AEvent.addHandlers(this);
        } else {
            // Launch the default Kakfa docker container.
            console.log("Kafka is not running, launching default Kafka Docker container...");
            const cmd = `docker run -d --rm -p 9092:9092 --name kafka madajaju/ailtire_kafka`;
            try {
                let results = await execSync(cmd);
                console.log("Kafka Launched in container.", results.toString());
                this.connect(server);
            } catch (e) {
                console.error("Error launching Kafka Docker container:", e);
            }
        }
    }

    async publish(event, data) {
        let topic = this.topic;
        let message = JSON.stringify({event: event, data: data});
        await this.producer.service.send({
            topic, messages: [{value: message}]
        });
    }

    async subscribe(event) {
        let topic = this.topic;
        if(this.consumer.state === "running" || this.consumer.state === "subscribed") {
            return;
        }
        await this.consumer.service.subscribe({topic, fromBeginning: true});
        this.consumer.state = "subscribed";

        await this.consumer.service.run({
            eachMessage: async ({message}) => {
                const myMessage = "";
                try {
                    const myMessage = JSON.parse(message.value.toString());


                    const event = myMessage.event;
                    const data = myMessage.data;
                    data.obj = data.obj || data;
                    if (data.obj.hasOwnProperty('definition') && data.obj.hasOwnProperty('_attributes')) {
                        let cls = AClass.getClass(data.obj.definition.name);
                        data.obj = await cls.findDeep(data.obj._attributes.id);
                    }
                    // Ok now call the handlers.
                    if (global.handlers.hasOwnProperty(event)) {
                        for (let i in global.handlers[event].handlers) {
                            let handler = global.handlers[event].handlers[i];
                            if (handler.hasOwnProperty('action')) {
                                let action = Action.find(handler.action);
                                if (action) {
                                    let convertedData = data;
                                    if (handler.hasOwnProperty('fn')) {
                                        convertedData = handler.fn(data);
                                    }
                                    funcHandler.run(action, convertedData, event);
                                } else {
                                    console.error("Action not found, for event!", handler)
                                }
                            } else {
                                handler.fn(data, event);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Kafka Error parsing message:", e);
                    return;
                }
            },
        });
        this.consumer.state = "running";
    }

    async close() {
        await this.producer.service.disconnect();
        await this.consumer.service.disconnect();
        console.log("KafkaAdaptor connection closed");
    }

    async isKafkaRunning() {
        const kafka = new Kafka({
            clientId: "health-check", brokers: [this.config.brokers[0]], // e.g., "localhost:9092"
        });

        const admin = kafka.admin(); // Fetch admin client
        try {
            await admin.connect(); // Attempt to connect
            const topics = await admin.listTopics(); // List Kafka topics as a test
            console.log("Kafka is running. Topics:", topics);
            await admin.disconnect();
            return true;
        } catch (error) {
            console.error("Kafka is not running or unreachable:", error.message);
            return false;
        }
    }

    async setupTopic() {
        const kafka = new Kafka({
            clientId: "health-check", brokers: [this.config.brokers[0]], // e.g., "localhost:9092"
        });

        const admin = kafka.admin(); // Fetch admin client
        try {
            await admin.connect(); // Attempt to connect
            let topics = await admin.listTopics(); // List Kafka topics as a test
            if (!topics.includes(this.topic)) {
                const results = await admin.createTopics({
                    topics: [{topic: this.topic, numPartitions: 1, replicationFactor: 1}],
                });
                topics = await admin.listTopics(); // List Kafka topics as a test
            }
            console.log("Kafka is running. Topics:", topics);
            await admin.disconnect();
            return true;
        } catch (error) {
            console.error("Kafka Topic creation failed:", error.message || error);
            return false;
        }
    }
}
module.exports = AKafkaAdaptor;
