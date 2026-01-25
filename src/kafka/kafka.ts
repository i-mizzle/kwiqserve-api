// import { Kafka } from 'kafkajs';
// import { sendEmailConfirmation, sendPasswordResetEmail } from '../service/mailer.service';

// // const mailerActions = {
// //   emailConfirmation: (data: any)=>sendEmailConfirmation(data)
// // }

// // Set up Kafka client
// const kafka = new Kafka({
//   brokers: ['localhost:9092'],
//   clientId: 'my-app',
// });

// // Set up Kafka producer
// const producer = kafka.producer();

// export const sendToKafka = async (message: string) => {
//   await producer.connect();
//   await producer.send({
//     topic: 'my-topic',
//     messages: [{ value: message }],
//   });
//   await producer.disconnect();
// };

// // Set up Kafka consumer
// const consumer = kafka.consumer({ groupId: 'my-group' });

// const consumeFromKafka = async () => {
//   await consumer.connect();
//   await consumer.subscribe({ topic: 'my-topic' });

//   await consumer.run({
//     eachMessage: async ({ topic, partition, message }) => {
//       const messageData: any = message.value?.toString()
//       const parsedMessageData = JSON.parse(messageData)
//       console.log('kafka message -> ', parsedMessageData)
//       console.log({
//         key: message.key?.toString(),
//         value: message.value?.toString(),
//         headers: message.headers,
//         topic,
//         partition,
//         offset: message.offset,
//       });

//       switch (parsedMessageData.action) {
//         case 'email-confirmation':
//           await sendEmailConfirmation(parsedMessageData.message)
//           break;
      
//         case 'password-reset-request':
//           await sendPasswordResetEmail(parsedMessageData.message)
//           break;
      
//         default:
//           break;
//       }
//     },
//   });
// };

// // Call the functions to send and consume messages
// // sendToKafka('Hello, Kafka!');
// consumeFromKafka();
